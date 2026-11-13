import { EventEmitter } from 'events';
import { Router } from 'express';
import prisma from '../prisma.js';
import {
  orders as memoryOrders,
  generateOrderCode,
  findOrderByCode,
  findOrderById,
  findMenuById,
  pruneOrders,
} from '../db.js';

// Global Event Emitter for Realtime SSE Broadcasts
export const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(100);

const router = Router();

/**
 * POST /api/orders
 * Create a new customer self-order using Prisma transaction (with memory fallback)
 */
router.post('/', async (req, res) => {
  const { customer_name, table_number, notes, items } = req.body;

  if (!customer_name || !customer_name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama pemesan wajib diisi' });
  }
  if (!table_number) {
    return res.status(400).json({ success: false, message: 'Nomor meja wajib diisi' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Pesanan harus memiliki minimal 1 item' });
  }

  // Memory store path
  if (!process.env.DATABASE_URL) {
    try {
      let totalPrice = 0;
      const orderItemsData = [];

      for (const item of items) {
        const menu = findMenuById(item.menu_id);
        if (!menu) {
          return res.status(400).json({ success: false, message: `Menu dengan ID ${item.menu_id} tidak ditemukan` });
        }
        if (!menu.is_available || menu.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stok "${menu.name}" tidak mencukupi (sisa: ${menu.stock}, dipesan: ${item.quantity})`,
          });
        }
        const subtotal = menu.price * item.quantity;
        totalPrice += subtotal;
        orderItemsData.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          menu_id: menu.id,
          name: menu.name,
          price: menu.price,
          quantity: item.quantity,
          subtotal,
        });
      }

      const orderCode = generateOrderCode();
      const newOrder = {
        id: memoryOrders.length + 1,
        order_code: orderCode,
        customer_name: customer_name.trim(),
        table_number: String(table_number).trim(),
        notes: notes?.trim() || null,
        total_price: totalPrice,
        payment_method: null,
        status: 'waiting_payment',
        created_at: new Date().toISOString(),
        items: orderItemsData,
      };

      memoryOrders.unshift(newOrder);

      // Auto-prune old completed/cancelled orders to prevent unbounded memory growth
      pruneOrders();

      orderEvents.emit('order_changed', {
        type: 'NEW_ORDER',
        order_code: newOrder.order_code,
        status: newOrder.status,
      });

      return res.status(201).json({
        success: true,
        message: 'Pesanan berhasil dibuat',
        data: newOrder,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message || 'Gagal membuat pesanan' });
    }
  }

  try {
    const createdOrder = await prisma.$transaction(async (tx) => {
      let totalPrice = 0;
      const orderItemsData = [];

      for (const item of items) {
        const menu = await tx.menu.findUnique({ where: { id: item.menu_id } });
        if (!menu) {
          throw new Error(`Menu dengan ID ${item.menu_id} tidak ditemukan`);
        }
        if (!menu.is_available || menu.stock < item.quantity) {
          throw new Error(`Stok "${menu.name}" tidak mencukupi (sisa: ${menu.stock}, dipesan: ${item.quantity})`);
        }

        const subtotal = menu.price * item.quantity;
        totalPrice += subtotal;

        orderItemsData.push({
          menu_id: menu.id,
          name: menu.name,
          price: menu.price,
          quantity: item.quantity,
          subtotal,
        });
      }

      const orderCount = await tx.order.count();
      const orderCode = `#BC-${String(100 + orderCount + 1).padStart(3, '0')}`;

      return await tx.order.create({
        data: {
          order_code: orderCode,
          customer_name: customer_name.trim(),
          table_number: String(table_number).trim(),
          notes: notes?.trim() || null,
          total_price: totalPrice,
          status: 'waiting_payment',
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });
    });

    orderEvents.emit('order_changed', {
      type: 'NEW_ORDER',
      order_code: createdOrder.order_code,
      status: createdOrder.status,
    });

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: createdOrder,
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(400).json({ success: false, message: err.message || 'Gagal membuat pesanan' });
  }
});

/**
 * GET /api/orders
 * List all orders with optional status filter, sorted newest first
 */
router.get('/', async (req, res) => {
  const { status } = req.query;

  if (!process.env.DATABASE_URL) {
    let list = memoryOrders;
    if (status && status !== 'all') {
      list = memoryOrders.filter((o) => o.status === status);
    }
    return res.json({ success: true, data: list });
  }

  try {
    const where = status && status !== 'all' ? { status } : {};
    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch {
    let list = memoryOrders;
    if (status && status !== 'all') {
      list = memoryOrders.filter((o) => o.status === status);
    }
    res.json({ success: true, data: list });
  }
});

/**
 * GET /api/orders/stream
 * Server-Sent Events (SSE) Stream for Cashier & Customer realtime sync
 */
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  // Initial connection handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  const onOrderUpdate = (payload) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      console.error('Error writing to SSE stream:', err);
    }
  };

  orderEvents.on('order_changed', onOrderUpdate);

  // Heartbeat comment every 15s to keep long-lived connections alive through proxies / Vercel
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  // Robust multi-event listener cleanup to guarantee zero memory leaks
  let isCleanedUp = false;
  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    clearInterval(heartbeat);
    orderEvents.off('order_changed', onOrderUpdate);
  };

  req.on('close', cleanup);
  req.on('error', cleanup);
  res.on('finish', cleanup);
  res.on('close', cleanup);
});

/**
 * GET /api/orders/summary/daily
 * Daily Sales Summary for Cashier
 */
router.get('/summary/daily', async (req, res) => {
  try {
    let startOfDay;
    let endOfDay;

    if (req.query.date) {
      const dateParts = req.query.date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        startOfDay = new Date(year, month, day, 0, 0, 0, 0);
        endOfDay = new Date(year, month, day, 23, 59, 59, 999);
      }
    }

    if (!startOfDay) {
      const now = new Date();
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    let validOrders = [];

    if (process.env.DATABASE_URL) {
      validOrders = await prisma.order.findMany({
        where: {
          created_at: { gte: startOfDay, lte: endOfDay },
          status: { in: ['paid_processing', 'completed'] },
        },
        include: { items: true },
      });
    } else {
      validOrders = memoryOrders.filter((o) => {
        const orderDate = new Date(o.created_at);
        return (
          orderDate >= startOfDay &&
          orderDate <= endOfDay &&
          ['paid_processing', 'completed'].includes(o.status)
        );
      });
    }

    let totalRevenue = 0;
    const paymentBreakdown = { Cash: 0, QRIS: 0, Debit: 0 };
    const itemSalesMap = {};

    for (const order of validOrders) {
      const price = Number(order.total_price) || 0;
      totalRevenue += price;

      const rawMethod = (order.payment_method || 'Cash').toLowerCase();
      let normalizedMethod = 'Cash';
      if (rawMethod === 'qris') normalizedMethod = 'QRIS';
      else if (rawMethod === 'debit') normalizedMethod = 'Debit';

      paymentBreakdown[normalizedMethod] = (paymentBreakdown[normalizedMethod] || 0) + price;

      for (const item of order.items || []) {
        const name = item.menu_name || item.name || 'Menu';
        const qty = Number(item.quantity) || 1;
        const itemPrice = Number(item.price) || 0;
        const subtotal = Number(item.subtotal) || itemPrice * qty;

        if (!itemSalesMap[name]) {
          itemSalesMap[name] = { name, qty: 0, revenue: 0 };
        }
        itemSalesMap[name].qty += qty;
        itemSalesMap[name].revenue += subtotal;
      }
    }

    const topItems = Object.values(itemSalesMap)
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 5);

    const averageOrderValue = validOrders.length > 0
      ? Math.round(totalRevenue / validOrders.length)
      : 0;

    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${startOfDay.getFullYear()}-${pad(startOfDay.getMonth() + 1)}-${pad(startOfDay.getDate())}`;

    res.json({
      success: true,
      date: dateStr,
      total_orders: validOrders.length,
      total_revenue: totalRevenue,
      average_order_value: averageOrderValue,
      payment_breakdown: paymentBreakdown,
      top_items: topItems,
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat ringkasan penjualan harian' });
  }
});

/**
 * GET /api/orders/:id
 * Fetch single order by numeric ID
 */
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!process.env.DATABASE_URL) {
    const order = findOrderById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    return res.json({ success: true, data: order });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({ success: true, data: order });
  } catch {
    const order = findOrderById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    res.json({ success: true, data: order });
  }
});

/**
 * GET /api/orders/code/:order_code
 * Fetch single order by order code
 */
router.get('/code/:order_code', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    const order = findOrderByCode(req.params.order_code);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    return res.json({ success: true, data: order });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { order_code: req.params.order_code },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({ success: true, data: order });
  } catch {
    const order = findOrderByCode(req.params.order_code);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    res.json({ success: true, data: order });
  }
});

/**
 * GET /api/orders/:order_code/status
 * Polling endpoint for frontend status check
 */
router.get('/:order_code/status', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    const order = findOrderByCode(req.params.order_code);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    return res.json({
      success: true,
      data: {
        order_code: order.order_code,
        status: order.status,
        customer_name: order.customer_name,
        table_number: order.table_number,
      },
    });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { order_code: req.params.order_code },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({
      success: true,
      data: {
        order_code: order.order_code,
        status: order.status,
        customer_name: order.customer_name,
        table_number: order.table_number,
      },
    });
  } catch {
    const order = findOrderByCode(req.params.order_code);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    res.json({
      success: true,
      data: {
        order_code: order.order_code,
        status: order.status,
        customer_name: order.customer_name,
        table_number: order.table_number,
      },
    });
  }
});

/**
 * PUT /api/orders/:id/items
 * Cashier edits order items before approval (transactional with memory fallback)
 */
router.put('/:id/items', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Pesanan harus memiliki minimal 1 item' });
  }

  if (!process.env.DATABASE_URL) {
    const order = findOrderById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    if (order.status !== 'waiting_payment') {
      return res.status(400).json({ success: false, message: `Pesanan berstatus "${order.status}" tidak dapat diubah` });
    }

    let totalPrice = 0;
    const newItemsData = [];
    for (const item of items) {
      const menu = findMenuById(item.menu_id);
      if (!menu) return res.status(400).json({ success: false, message: `Menu dengan ID ${item.menu_id} tidak ditemukan` });
      if (!menu.is_available || menu.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stok "${menu.name}" tidak mencukupi (sisa: ${menu.stock}, diminta: ${item.quantity})`,
        });
      }
      const subtotal = menu.price * item.quantity;
      totalPrice += subtotal;
      newItemsData.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        menu_id: menu.id,
        name: menu.name,
        price: menu.price,
        quantity: item.quantity,
        subtotal,
      });
    }

    order.items = newItemsData;
    order.total_price = totalPrice;

    orderEvents.emit('order_changed', {
      type: 'STATUS_UPDATED',
      order_code: order.order_code,
      status: order.status,
    });

    return res.json({
      success: true,
      message: `Menu pesanan ${order.order_code} berhasil diperbarui`,
      data: order,
    });
  }

  try {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error('Pesanan tidak ditemukan');
      if (order.status !== 'waiting_payment') {
        throw new Error(`Pesanan berstatus "${order.status}" tidak dapat diubah`);
      }

      await tx.orderItem.deleteMany({ where: { order_id: id } });

      let totalPrice = 0;
      const newItemsData = [];

      for (const item of items) {
        const menu = await tx.menu.findUnique({ where: { id: item.menu_id } });
        if (!menu) throw new Error(`Menu dengan ID ${item.menu_id} tidak ditemukan`);
        if (!menu.is_available || menu.stock < item.quantity) {
          throw new Error(`Stok "${menu.name}" tidak mencukupi (sisa: ${menu.stock}, diminta: ${item.quantity})`);
        }

        const subtotal = menu.price * item.quantity;
        totalPrice += subtotal;

        newItemsData.push({
          order_id: id,
          menu_id: menu.id,
          name: menu.name,
          price: menu.price,
          quantity: item.quantity,
          subtotal,
        });
      }

      await tx.orderItem.createMany({ data: newItemsData });

      return await tx.order.update({
        where: { id },
        data: { total_price: totalPrice },
        include: { items: true },
      });
    });

    orderEvents.emit('order_changed', {
      type: 'STATUS_UPDATED',
      order_code: updatedOrder.order_code,
      status: updatedOrder.status,
    });

    res.json({
      success: true,
      message: `Menu pesanan ${updatedOrder.order_code} berhasil diperbarui`,
      data: updatedOrder,
    });
  } catch (err) {
    console.error('Error updating order items:', err);
    res.status(400).json({ success: false, message: err.message || 'Gagal mengubah item pesanan' });
  }
});

/**
 * PATCH /api/orders/:id/approve
 * Cashier confirms payment & deducts stock atomically
 */
router.patch('/:id/approve', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const paymentMethod = req.body?.payment_method || 'cash';

  if (!process.env.DATABASE_URL) {
    const order = findOrderById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    if (order.status !== 'waiting_payment') {
      return res.status(400).json({
        success: false,
        message: `Pesanan sudah dalam status "${order.status}", tidak dapat disetujui kembali`,
      });
    }

    for (const item of order.items) {
      const menu = findMenuById(item.menu_id);
      if (!menu || menu.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stok "${item.name}" tidak mencukupi (sisa: ${menu?.stock ?? 0}, diminta: ${item.quantity})`,
        });
      }
      menu.stock -= item.quantity;
      if (menu.stock === 0) {
        menu.is_available = false;
      }
    }

    order.status = 'paid_processing';
    order.payment_method = paymentMethod;
    order.paid_at = new Date().toISOString();

    orderEvents.emit('order_changed', {
      type: 'STATUS_UPDATED',
      order_code: order.order_code,
      status: order.status,
    });

    return res.json({
      success: true,
      message: `Pesanan ${order.order_code} telah dikonfirmasi & stok dipotong`,
      data: order,
    });
  }

  try {
    const approvedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });

      if (!order) throw new Error('Pesanan tidak ditemukan');
      if (order.status !== 'waiting_payment') {
        throw new Error(`Pesanan sudah dalam status "${order.status}", tidak dapat disetujui kembali`);
      }

      for (const item of order.items) {
        const menu = await tx.menu.findUnique({ where: { id: item.menu_id } });
        if (!menu || menu.stock < item.quantity) {
          throw new Error(`Stok "${item.name}" tidak mencukupi (sisa: ${menu?.stock ?? 0}, diminta: ${item.quantity})`);
        }

        const remainingStock = menu.stock - item.quantity;
        await tx.menu.update({
          where: { id: item.menu_id },
          data: {
            stock: remainingStock,
            is_available: remainingStock > 0 ? menu.is_available : false,
          },
        });
      }

      return await tx.order.update({
        where: { id },
        data: {
          status: 'paid_processing',
          payment_method: paymentMethod,
          paid_at: new Date(),
        },
        include: { items: true },
      });
    });

    orderEvents.emit('order_changed', {
      type: 'STATUS_UPDATED',
      order_code: approvedOrder.order_code,
      status: approvedOrder.status,
    });

    res.json({
      success: true,
      message: `Pesanan ${approvedOrder.order_code} telah dikonfirmasi & stok dipotong`,
      data: approvedOrder,
    });
  } catch (err) {
    console.error('Error approving order:', err);
    res.status(409).json({ success: false, message: err.message || 'Gagal menyetujui pesanan' });
  }
});

/**
 * PATCH /api/orders/:id/complete
 * Mark a processing order as completed
 */
router.patch('/:id/complete', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!process.env.DATABASE_URL) {
    const order = findOrderById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    order.status = 'completed';

    orderEvents.emit('order_changed', {
      type: 'STATUS_UPDATED',
      order_code: order.order_code,
      status: order.status,
    });

    return res.json({
      success: true,
      message: `Pesanan ${order.order_code} telah diselesaikan`,
      data: order,
    });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    if (order.status === 'completed') {
      return res.json({
        success: true,
        message: `Pesanan ${order.order_code} sudah dalam status selesai`,
        data: order,
      });
    }

    const completed = await prisma.order.update({
      where: { id },
      data: { status: 'completed' },
      include: { items: true },
    });

    orderEvents.emit('order_changed', {
      type: 'STATUS_UPDATED',
      order_code: completed.order_code,
      status: completed.status,
    });

    res.json({
      success: true,
      message: `Pesanan ${completed.order_code} telah diselesaikan`,
      data: completed,
    });
  } catch (err) {
    console.error('Error completing order:', err);
    res.status(500).json({ success: false, message: 'Gagal menyelesaikan pesanan' });
  }
});

/**
 * PATCH /api/orders/:id/cancel
 * Cancel an order
 */
router.patch('/:id/cancel', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!process.env.DATABASE_URL) {
    const order = findOrderById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Pesanan berstatus "${order.status}" tidak dapat dibatalkan`,
      });
    }
    order.status = 'cancelled';

    orderEvents.emit('order_changed', {
      type: 'STATUS_UPDATED',
      order_code: order.order_code,
      status: order.status,
    });

    return res.json({
      success: true,
      message: `Pesanan ${order.order_code} telah dibatalkan`,
      data: order,
    });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Pesanan berstatus "${order.status}" tidak dapat dibatalkan`,
      });
    }

    const cancelled = await prisma.order.update({
      where: { id },
      data: { status: 'cancelled' },
      include: { items: true },
    });

    orderEvents.emit('order_changed', {
      type: 'STATUS_UPDATED',
      order_code: cancelled.order_code,
      status: cancelled.status,
    });

    res.json({
      success: true,
      message: `Pesanan ${cancelled.order_code} telah dibatalkan`,
      data: cancelled,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal membatalkan pesanan' });
  }
});

export default router;


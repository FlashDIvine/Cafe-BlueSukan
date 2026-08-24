import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

/**
 * POST /api/orders
 * Create a new customer self-order using Prisma transaction
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
  try {
    const { status } = req.query;
    const where = status && status !== 'all' ? { status } : {};

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan' });
  }
});

/**
 * GET /api/orders/:id
 * Fetch single order by numeric ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil detail pesanan' });
  }
});

/**
 * GET /api/orders/code/:order_code
 * Fetch single order by order code
 */
router.get('/code/:order_code', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { order_code: req.params.order_code },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil detail pesanan' });
  }
});

/**
 * GET /api/orders/:order_code/status
 * Polling endpoint for frontend status check
 */
router.get('/:order_code/status', async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengecek status pesanan' });
  }
});

/**
 * PUT /api/orders/:id/items
 * Cashier edits order items before approval (transactional)
 */
router.put('/:id/items', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Pesanan harus memiliki minimal 1 item' });
  }

  try {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error('Pesanan tidak ditemukan');
      if (order.status !== 'waiting_payment') {
        throw new Error(`Pesanan berstatus "${order.status}" tidak dapat diubah`);
      }

      // Delete existing order items
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
 * Cashier confirms payment & deducts stock atomically via transaction
 */
router.patch('/:id/approve', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const approvedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });

      if (!order) throw new Error('Pesanan tidak ditemukan');
      if (order.status !== 'waiting_payment') {
        throw new Error(`Pesanan sudah dalam status "${order.status}", tidak dapat disetujui kembali`);
      }

      // Verify and deduct stock atomically
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

      const paymentMethod = req.body?.payment_method || 'cash';
      return await tx.order.update({
        where: { id },
        data: {
          status: 'paid_processing',
          payment_method: paymentMethod,
        },
        include: { items: true },
      });
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
 * PATCH /api/orders/:id/cancel
 * Cancel an order
 */
router.patch('/:id/cancel', async (req, res) => {
  const id = parseInt(req.params.id, 10);

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

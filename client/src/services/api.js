/**
 * API Service for Bantu Cafe Self-Order & Cashier POS Module
 * Connects to Express backend via Vite proxy (/api -> localhost:3001)
 */

const API_BASE = '/api';

/* ==========================================================================
   MENU & INVENTORY APIS
   ========================================================================== */

/**
 * Fetch all menus from backend
 * @param {string} [category] - Optional category filter
 * @returns {Promise<{ success: boolean, data: Array, categories: Array }>}
 */
export async function fetchMenusApi(category) {
  const params = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`${API_BASE}/menus${params}`);
  if (!res.ok) throw new Error('Failed to fetch menus');
  return res.json();
}

/**
 * Create a new menu item (POST /api/menus)
 * @param {Object} menuData - { name, category_id, price, stock, image_url, description, is_available, is_popular }
 * @returns {Promise<Object>}
 */
export async function createMenuApi(menuData) {
  const res = await fetch(`${API_BASE}/menus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menuData),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gagal menambahkan menu');
  return json.data;
}

/**
 * Update an existing menu item (PUT /api/menus/:id)
 * @param {number} id
 * @param {Object} menuData
 * @returns {Promise<Object>}
 */
export async function updateMenuApi(id, menuData) {
  const res = await fetch(`${API_BASE}/menus/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menuData),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gagal memperbarui menu');
  return json.data;
}

/**
 * Quick update stock (PATCH /api/menus/:id/stock)
 * @param {number} id
 * @param {{ delta?: number, stock?: number }} payload
 * @returns {Promise<Object>}
 */
export async function updateMenuStockApi(id, payload) {
  const res = await fetch(`${API_BASE}/menus/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gagal mengubah stok');
  return json.data;
}

/**
 * Toggle menu availability (PATCH /api/menus/:id/toggle)
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function toggleMenuAvailabilityApi(id) {
  const res = await fetch(`${API_BASE}/menus/${id}/toggle`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gagal mengubah ketersediaan');
  return json.data;
}

/**
 * Delete a menu item (DELETE /api/menus/:id)
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function deleteMenuApi(id) {
  const res = await fetch(`${API_BASE}/menus/${id}`, {
    method: 'DELETE',
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gagal menghapus menu');
  return json.data;
}

/* ==========================================================================
   ORDER & CHECKOUT APIS
   ========================================================================== */

/**
 * Submit customer order to backend (POST /api/orders)
 * @param {Object} orderPayload - { customer_name, table_number, notes, items }
 * @returns {Promise<Object>}
 */
export async function submitOrderApi(orderPayload) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: orderPayload.customer_name,
      table_number: orderPayload.table_number,
      notes: orderPayload.notes || null,
      items: orderPayload.items.map((item) => ({
        menu_id: item.menu_id,
        quantity: item.quantity,
      })),
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create order');
  return json.data;
}

/**
 * Fetch order status by order code (GET /api/orders/:order_code/status)
 * @param {string} orderCode
 * @returns {Promise<{ status: string, order_code: string }>}
 */
export async function fetchOrderStatusApi(orderCode) {
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderCode)}/status`);
  if (!res.ok) return { order_code: orderCode, status: 'waiting_payment' };
  const json = await res.json();
  return json.data;
}

/**
 * Fetch all orders for Cashier POS Dashboard (GET /api/orders?status=...)
 * @param {string} [status] - Optional filter ('waiting_payment', 'paid_processing', 'completed', 'cancelled', or 'all')
 * @returns {Promise<Array>}
 */
export async function fetchOrdersApi(status) {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${API_BASE}/orders${query}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  const json = await res.json();
  return json.data;
}

/**
 * Fetch single order by numeric ID (GET /api/orders/:id)
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function fetchOrderByIdApi(id) {
  const res = await fetch(`${API_BASE}/orders/${id}`);
  if (!res.ok) throw new Error('Order not found');
  const json = await res.json();
  return json.data;
}

/**
 * Fetch single order by order code (GET /api/orders/code/:order_code)
 * @param {string} orderCode
 * @returns {Promise<Object>}
 */
export async function fetchOrderByCodeApi(orderCode) {
  const res = await fetch(`${API_BASE}/orders/code/${encodeURIComponent(orderCode)}`);
  if (!res.ok) throw new Error('Order not found');
  const json = await res.json();
  return json.data;
}

/**
 * Cashier updates items in an order (PUT /api/orders/:id/items)
 * @param {number} orderId
 * @param {Array<{ menu_id: number, quantity: number }>} items
 * @returns {Promise<Object>}
 */
export async function updateOrderItemsApi(orderId, items) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/items`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update order items');
  return json.data;
}

/**
 * Cancel an order (PATCH /api/orders/:id/cancel)
 * @param {number} orderId
 * @returns {Promise<Object>}
 */
export async function cancelOrderApi(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to cancel order');
  return json.data;
}

/**
 * Cashier approves payment & deducts stock (PATCH /api/orders/:id/approve)
 * @param {number} orderId
 * @param {string} [paymentMethod='cash'] - 'cash' | 'qris' | 'debit'
 * @returns {Promise<Object>}
 */
export async function approveOrderApi(orderId, paymentMethod = 'cash') {
  const res = await fetch(`${API_BASE}/orders/${orderId}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_method: paymentMethod }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to approve order');
  return json.data;
}

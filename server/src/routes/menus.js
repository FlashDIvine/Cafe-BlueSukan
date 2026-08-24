import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

const CATEGORIES = [
  { id: 'coffee', name: 'Kopi & Espresso' },
  { id: 'non-coffee', name: 'Non-Coffee' },
  { id: 'snacks', name: 'Makanan Ringan' },
  { id: 'food', name: 'Makanan Utama' },
];

const CATEGORIES_MAP = {
  coffee: 'Kopi & Espresso',
  'non-coffee': 'Non-Coffee',
  snacks: 'Makanan Ringan',
  food: 'Makanan Utama',
};

/**
 * GET /api/menus
 * Returns all menus with realtime stock and category name.
 * Optionally filter by ?category=coffee
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const where = category && category !== 'all' ? { category_id: category } : {};

    const rawMenus = await prisma.menu.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    const result = rawMenus.map((m) => ({
      ...m,
      category_name: CATEGORIES_MAP[m.category_id] || m.category_id,
    }));

    res.json({
      success: true,
      data: result,
      categories: [{ id: 'all', name: 'Semua' }, ...CATEGORIES],
    });
  } catch (err) {
    console.error('Error fetching menus:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data menu' });
  }
});

/**
 * GET /api/menus/:id
 * Returns a single menu item by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const menu = await prisma.menu.findUnique({ where: { id } });

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }

    res.json({
      success: true,
      data: { ...menu, category_name: CATEGORIES_MAP[menu.category_id] || menu.category_id },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data menu' });
  }
});

/**
 * POST /api/menus
 * Create a new menu item
 */
router.post('/', async (req, res) => {
  try {
    const { name, category_id, price, stock, image_url, description, is_available, is_popular } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama menu wajib diisi' });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Kategori menu wajib dipilih' });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Harga menu harus berupa angka positif' });
    }

    const initialStock = stock !== undefined ? Math.max(0, parseInt(stock, 10) || 0) : 10;
    const available = is_available !== undefined ? Boolean(is_available) : initialStock > 0;
    const defaultImage = 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80';

    const newMenu = await prisma.menu.create({
      data: {
        category_id: category_id.trim(),
        name: name.trim(),
        price: parseInt(price, 10),
        stock: initialStock,
        is_available: initialStock > 0 ? available : false,
        image_url: image_url?.trim() || defaultImage,
        description: description?.trim() || '',
        is_popular: Boolean(is_popular),
      },
    });

    res.status(201).json({
      success: true,
      message: `Menu "${newMenu.name}" berhasil ditambahkan`,
      data: { ...newMenu, category_name: CATEGORIES_MAP[newMenu.category_id] || newMenu.category_id },
    });
  } catch (err) {
    console.error('Error creating menu:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan menu baru' });
  }
});

/**
 * PUT /api/menus/:id
 * Update an existing menu item
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.menu.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }

    const { name, category_id, price, stock, image_url, description, is_available, is_popular } = req.body;

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (category_id !== undefined) dataToUpdate.category_id = category_id.trim();
    if (price !== undefined && !isNaN(Number(price))) dataToUpdate.price = Math.max(0, parseInt(price, 10));
    if (description !== undefined) dataToUpdate.description = description.trim();
    if (image_url !== undefined) dataToUpdate.image_url = image_url.trim();
    if (is_popular !== undefined) dataToUpdate.is_popular = Boolean(is_popular);

    if (stock !== undefined && !isNaN(Number(stock))) {
      const parsedStock = Math.max(0, parseInt(stock, 10));
      dataToUpdate.stock = parsedStock;
      if (parsedStock === 0) {
        dataToUpdate.is_available = false;
      }
    }

    if (is_available !== undefined) {
      dataToUpdate.is_available = Boolean(is_available);
    }

    const updated = await prisma.menu.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      success: true,
      message: `Menu "${updated.name}" berhasil diperbarui`,
      data: { ...updated, category_name: CATEGORIES_MAP[updated.category_id] || updated.category_id },
    });
  } catch (err) {
    console.error('Error updating menu:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui menu' });
  }
});

/**
 * PATCH /api/menus/:id/stock
 * Quick stock update (add delta or set absolute stock)
 */
router.patch('/:id/stock', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const menu = await prisma.menu.findUnique({ where: { id } });

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }

    const { delta, stock } = req.body;
    let newStock = menu.stock;

    if (stock !== undefined && !isNaN(Number(stock))) {
      newStock = Math.max(0, parseInt(stock, 10));
    } else if (delta !== undefined && !isNaN(Number(delta))) {
      newStock = Math.max(0, menu.stock + parseInt(delta, 10));
    } else {
      return res.status(400).json({ success: false, message: 'Harap sediakan parameter delta atau stock' });
    }

    let isAvailable = menu.is_available;
    if (newStock === 0) {
      isAvailable = false;
    } else if (newStock > 0 && !menu.is_available) {
      isAvailable = true;
    }

    const updated = await prisma.menu.update({
      where: { id },
      data: {
        stock: newStock,
        is_available: isAvailable,
      },
    });

    res.json({
      success: true,
      message: `Stok "${updated.name}" sekarang ${updated.stock}`,
      data: { ...updated, category_name: CATEGORIES_MAP[updated.category_id] || updated.category_id },
    });
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah stok' });
  }
});

/**
 * PATCH /api/menus/:id/toggle
 * Toggle availability (Aktif / Nonaktif)
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const menu = await prisma.menu.findUnique({ where: { id } });

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
    }

    const updated = await prisma.menu.update({
      where: { id },
      data: {
        is_available: !menu.is_available,
      },
    });

    res.json({
      success: true,
      message: `Menu "${updated.name}" sekarang ${updated.is_available ? 'Tersedia' : 'Nonaktif/Habis'}`,
      data: { ...updated, category_name: CATEGORIES_MAP[updated.category_id] || updated.category_id },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengubah status ketersediaan' });
  }
});

/**
 * DELETE /api/menus/:id
 * Delete a menu item
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await prisma.menu.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: `Menu "${deleted.name}" berhasil dihapus`,
      data: deleted,
    });
  } catch (err) {
    console.error('Error deleting menu:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus menu' });
  }
});

export default router;

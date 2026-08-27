import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

import { DEFAULT_CATEGORIES } from './categories.js';

let cachedCatResult = null;
let lastCatFetchTime = 0;
const CAT_CACHE_TTL = 30000; // 30 seconds cache

export function invalidateCategoriesCache() {
  cachedCatResult = null;
  lastCatFetchTime = 0;
}

async function getCategoriesMap() {
  const now = Date.now();
  if (cachedCatResult && now - lastCatFetchTime < CAT_CACHE_TTL) {
    return cachedCatResult;
  }

  try {
    const cats = await prisma.category.findMany();
    if (!cats || cats.length === 0) {
      const map = {};
      DEFAULT_CATEGORIES.forEach((c) => {
        map[c.id] = c.name;
      });
      cachedCatResult = { map, list: DEFAULT_CATEGORIES };
      lastCatFetchTime = now;
      return cachedCatResult;
    }
    const map = {};
    cats.forEach((c) => {
      map[c.id] = c.name;
    });
    cachedCatResult = { map, list: cats };
    lastCatFetchTime = now;
    return cachedCatResult;
  } catch {
    const map = {};
    DEFAULT_CATEGORIES.forEach((c) => {
      map[c.id] = c.name;
    });
    return { map, list: DEFAULT_CATEGORIES };
  }
}

import { menus as memoryMenus, categories as memoryCategories, findMenuById } from '../db.js';

/**
 * GET /api/menus
 * Returns all menus with realtime stock and category name.
 * Optionally filter by ?category=coffee
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    if (!process.env.DATABASE_URL) {
      let filtered = memoryMenus;
      if (category && category !== 'all') {
        filtered = memoryMenus.filter((m) => m.category_id === category);
      }
      return res.json({
        success: true,
        data: filtered,
        categories: [{ id: 'all', name: 'Semua' }, ...memoryCategories],
      });
    }

    const where = category && category !== 'all' ? { category_id: category } : {};

    const [rawMenus, { map: catMap, list: catList }] = await Promise.all([
      prisma.menu.findMany({
        where,
        orderBy: { id: 'asc' },
      }),
      getCategoriesMap(),
    ]);

    const result = rawMenus.map((m) => ({
      ...m,
      category_name: catMap[m.category_id] || m.category_id,
    }));

    res.json({
      success: true,
      data: result,
      categories: [{ id: 'all', name: 'Semua' }, ...catList],
    });
  } catch (err) {
    console.error('Database unreachable, using memory store for menus:', err.message);
    const { category } = req.query;
    let filtered = memoryMenus;
    if (category && category !== 'all') {
      filtered = memoryMenus.filter((m) => m.category_id === category);
    }
    res.json({
      success: true,
      data: filtered,
      categories: [{ id: 'all', name: 'Semua' }, ...memoryCategories],
    });
  }
});

async function getCategoryName(categoryId) {
  const { map } = await getCategoriesMap();
  return map[categoryId] || categoryId;
}

/**
 * Validate WebP image (both URL and base64 data URL)
 * Max size: 2MB (2 * 1024 * 1024 bytes)
 */
function validateWebpImage(image) {
  if (!image || typeof image !== 'string') return { valid: true, sanitized: null };
  const trimmed = image.trim();
  if (!trimmed) return { valid: true, sanitized: null };

  if (trimmed.startsWith('data:')) {
    if (!trimmed.startsWith('data:image/webp;base64,')) {
      return { valid: false, message: 'Format gambar harus WebP (.webp)' };
    }
    const base64Data = trimmed.replace(/^data:image\/webp;base64,/, '');
    const byteLength = Buffer.from(base64Data, 'base64').length;
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (byteLength > MAX_SIZE) {
      return { valid: false, message: 'Ukuran gambar maksimal 2 MB' };
    }
    return { valid: true, sanitized: trimmed };
  }

  // If it's a regular URL
  return { valid: true, sanitized: trimmed };
}

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

    const category_name = await getCategoryName(menu.category_id);

    res.json({
      success: true,
      data: { ...menu, category_name },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data menu' });
  }
});

/**
 * Sync PostgreSQL auto-increment sequence with max(id)
 */
async function syncMenuSequence() {
  try {
    await prisma.$executeRawUnsafe(
      "SELECT setval(pg_get_serial_sequence('menus', 'id'), COALESCE((SELECT MAX(id) FROM menus), 0) + 1, false);"
    );
  } catch (e) {
    // SQLite or other non-postgres DB fallback
  }
}

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

    const defaultImage = 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80&fm=webp';
    let finalImageUrl = defaultImage;

    if (image_url) {
      const imgValidation = validateWebpImage(image_url);
      if (!imgValidation.valid) {
        return res.status(400).json({ success: false, message: imgValidation.message });
      }
      if (imgValidation.sanitized) {
        finalImageUrl = imgValidation.sanitized;
      }
    }

    const initialStock = stock !== undefined ? Math.max(0, parseInt(stock, 10) || 0) : 10;
    const available = is_available !== undefined ? Boolean(is_available) : initialStock > 0;

    let newMenu;
    const menuData = {
      category_id: category_id.trim(),
      name: name.trim(),
      price: parseInt(price, 10),
      stock: initialStock,
      is_available: initialStock > 0 ? available : false,
      image_url: finalImageUrl,
      description: description?.trim() || '',
      is_popular: Boolean(is_popular),
    };

    try {
      newMenu = await prisma.menu.create({ data: menuData });
    } catch (createErr) {
      if (createErr?.code === 'P2002') {
        // Sequence was behind max(id); synchronize sequence and retry
        await syncMenuSequence();
        newMenu = await prisma.menu.create({ data: menuData });
      } else {
        throw createErr;
      }
    }

    const category_name = await getCategoryName(newMenu.category_id);

    res.status(201).json({
      success: true,
      message: `Menu "${newMenu.name}" berhasil ditambahkan`,
      data: { ...newMenu, category_name },
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
    if (is_popular !== undefined) dataToUpdate.is_popular = Boolean(is_popular);

    if (image_url !== undefined) {
      if (image_url) {
        const imgValidation = validateWebpImage(image_url);
        if (!imgValidation.valid) {
          return res.status(400).json({ success: false, message: imgValidation.message });
        }
        dataToUpdate.image_url = imgValidation.sanitized || existing.image_url;
      }
    }

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

    const category_name = await getCategoryName(updated.category_id);

    res.json({
      success: true,
      message: `Menu "${updated.name}" berhasil diperbarui`,
      data: { ...updated, category_name },
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

    const category_name = await getCategoryName(updated.category_id);

    res.json({
      success: true,
      message: `Stok "${updated.name}" sekarang ${updated.stock}`,
      data: { ...updated, category_name },
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

    const category_name = await getCategoryName(updated.category_id);

    res.json({
      success: true,
      message: `Menu "${updated.name}" sekarang ${updated.is_available ? 'Tersedia' : 'Nonaktif/Habis'}`,
      data: { ...updated, category_name },
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

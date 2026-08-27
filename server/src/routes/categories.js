import { Router } from 'express';
import prisma from '../prisma.js';
import { invalidateCategoriesCache } from './menus.js';

const router = Router();

export const DEFAULT_CATEGORIES = [
  {
    id: 'coffee',
    name: 'Kopi & Espresso',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80&fm=webp',
  },
  {
    id: 'non-coffee',
    name: 'Non-Coffee',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=200&q=80&fm=webp',
  },
  {
    id: 'snacks',
    name: 'Makanan Ringan',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=200&q=80&fm=webp',
  },
  {
    id: 'food',
    name: 'Makanan Utama',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=200&q=80&fm=webp',
  },
];

/**
 * Ensure default categories exist in DB with default images
 */
async function ensureDefaultCategories() {
  const count = await prisma.category.count();
  if (count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {},
        create: { id: cat.id, name: cat.name, image: cat.image },
      });
    }
  }
}

/**
 * Helper to slugify category name to a clean id
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * GET /api/categories
 * List all categories
 */
router.get('/', async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await prisma.category.findMany({
      orderBy: { created_at: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kategori' });
  }
});

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

  return { valid: true, sanitized: trimmed };
}

/**
 * POST /api/categories
 * Add a new category with optional WebP image
 */
router.post('/', async (req, res) => {
  try {
    const { name, id, image } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }

    let finalImage = null;
    if (image) {
      const imgValidation = validateWebpImage(image);
      if (!imgValidation.valid) {
        return res.status(400).json({ success: false, message: imgValidation.message });
      }
      finalImage = imgValidation.sanitized;
    }

    const trimmedName = name.trim();
    let targetId = id ? slugify(id) : slugify(trimmedName);
    if (!targetId) {
      targetId = `cat-${Date.now()}`;
    }

    // Check if ID already exists
    const existingById = await prisma.category.findUnique({ where: { id: targetId } });
    if (existingById) {
      targetId = `${targetId}-${Math.floor(Math.random() * 1000)}`;
    }

    const created = await prisma.category.create({
      data: {
        id: targetId,
        name: trimmedName,
        image: finalImage,
      },
    });

    invalidateCategoriesCache();

    res.status(201).json({
      success: true,
      message: `Kategori "${created.name}" berhasil ditambahkan`,
      data: created,
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan kategori baru' });
  }
});

/**
 * PATCH /api/categories/:id
 * Update category name and/or image
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const updateData = {};
    if (name !== undefined && name.trim()) {
      updateData.name = name.trim();
    }
    if (image !== undefined) {
      if (image) {
        const imgValidation = validateWebpImage(image);
        if (!imgValidation.valid) {
          return res.status(400).json({ success: false, message: imgValidation.message });
        }
        updateData.image = imgValidation.sanitized;
      } else {
        updateData.image = null;
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    invalidateCategoriesCache();

    res.json({
      success: true,
      message: `Kategori "${updated.name}" berhasil diperbarui`,
      data: updated,
    });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui kategori' });
  }
});

/**
 * DELETE /api/categories/:id
 * Delete a category (checks if any menus are using it)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    // Check if any menu uses this category
    const menuCount = await prisma.menu.count({ where: { category_id: id } });
    if (menuCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Kategori "${category.name}" tidak dapat dihapus karena sedang digunakan oleh ${menuCount} menu. Pindahkan menu ke kategori lain terlebih dahulu.`,
      });
    }

    await prisma.category.delete({ where: { id } });

    invalidateCategoriesCache();

    res.json({
      success: true,
      message: `Kategori "${category.name}" berhasil dihapus`,
      data: category,
    });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus kategori' });
  }
});

export default router;

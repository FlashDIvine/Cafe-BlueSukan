import { Router } from 'express';
import prisma from '../prisma.js';
import { getSettings, updateSettings } from '../db.js';

const router = Router();

// Max allowed base64 string length for QRIS (~300KB binary = ~410,000 chars)
const MAX_QRIS_STRING_LENGTH = 420000;

/**
 * GET /api/settings/qris
 * Retrieve current merchant QRIS image & merchant name
 */
router.get('/qris', async (_req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({
        success: true,
        data: getSettings(),
      });
    }

    const settingsRows = await prisma.setting.findMany({
      where: {
        key: { in: ['qris_image', 'qris_merchant_name'] },
      },
    });

    const settingsMap = {};
    settingsRows.forEach((row) => {
      settingsMap[row.key] = row.value;
    });

    const qris_image = settingsMap.qris_image || null;
    const qris_merchant_name = settingsMap.qris_merchant_name || "Angkringan Blue'sukan Kopi";

    // Keep memory fallback in sync
    updateSettings({ qris_image, qris_merchant_name });

    res.json({
      success: true,
      data: {
        qris_image,
        qris_merchant_name,
      },
    });
  } catch (err) {
    console.error('Error fetching QRIS settings:', err);
    // Fallback to in-memory store
    res.json({
      success: true,
      data: getSettings(),
    });
  }
});

/**
 * POST /api/settings/qris
 * Save or update merchant QRIS image & merchant name
 * Payload size restricted to <= 300KB to protect RAM
 */
router.post('/qris', async (req, res) => {
  try {
    const { qris_image, qris_merchant_name } = req.body || {};

    if (qris_image && typeof qris_image === 'string') {
      if (qris_image.length > MAX_QRIS_STRING_LENGTH) {
        return res.status(400).json({
          success: false,
          message: 'Ukuran file gambar QRIS melebihi batas maksimal 300KB. Harap gunakan gambar yang lebih ringkas.',
        });
      }
    }

    const sanitizedMerchantName = typeof qris_merchant_name === 'string' && qris_merchant_name.trim()
      ? qris_merchant_name.trim()
      : "Angkringan Blue'sukan Kopi";

    // Update in-memory fallback
    const updated = updateSettings({
      qris_image: qris_image || null,
      qris_merchant_name: sanitizedMerchantName,
    });

    if (process.env.DATABASE_URL) {
      await Promise.all([
        prisma.setting.upsert({
          where: { key: 'qris_image' },
          update: { value: qris_image || null },
          create: { key: 'qris_image', value: qris_image || null },
        }),
        prisma.setting.upsert({
          where: { key: 'qris_merchant_name' },
          update: { value: sanitizedMerchantName },
          create: { key: 'qris_merchant_name', value: sanitizedMerchantName },
        }),
      ]);
    }

    res.json({
      success: true,
      message: 'Pengaturan QRIS dagang berhasil disimpan',
      data: updated,
    });
  } catch (err) {
    console.error('Error saving QRIS settings:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan pengaturan QRIS',
    });
  }
});

/**
 * DELETE /api/settings/qris
 * Reset/remove merchant QRIS image
 */
router.delete('/qris', async (_req, res) => {
  try {
    const updated = updateSettings({ qris_image: null });

    if (process.env.DATABASE_URL) {
      await prisma.setting.upsert({
        where: { key: 'qris_image' },
        update: { value: null },
        create: { key: 'qris_image', value: null },
      });
    }

    res.json({
      success: true,
      message: 'Gambar QRIS dagang berhasil dihapus',
      data: updated,
    });
  } catch (err) {
    console.error('Error deleting QRIS image:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus gambar QRIS',
    });
  }
});

export default router;

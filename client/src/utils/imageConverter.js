/**
 * Image conversion and compression utility for Bantu Cafe
 * Converts JPG, JPEG, PNG, and WebP images to optimized WebP format (<= 2MB)
 * preserves aspect ratio and maintains high visual fidelity.
 */

const MAX_BYTE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Format bytes to readable size string (e.g. "450 KB", "1.2 MB")
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculate approximate byte size of a base64 data URL
 * @param {string} dataUrl
 * @returns {number}
 */
export function getBase64ByteSize(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
}

/**
 * Check if a file is an accepted image format (JPG, PNG, WebP)
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'Tidak ada file yang dipilih.' };
  }

  const fileName = (file.name || '').toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const hasValidMime = file.type ? ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) : false;

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Harap pilih gambar format JPG, JPEG, PNG, atau WebP.',
    };
  }

  return { valid: true };
}

/**
 * Load a File into an HTMLImageElement
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memproses dan membaca file gambar.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Convert and compress an image file (JPG, PNG, WebP) to WebP format <= 2MB
 * @param {File} file
 * @param {Object} [options]
 * @param {number} [options.initialQuality=0.82]
 * @param {number} [options.maxDimension=2048]
 * @returns {Promise<{ dataUrl: string, byteLength: number, sizeText: string, width: number, height: number }>}
 */
export async function convertImageToWebP(file, options = {}) {
  // 1. Validate file format
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Decode image
  const img = await loadImageElement(file);
  let srcWidth = img.naturalWidth || img.width;
  let srcHeight = img.naturalHeight || img.height;

  if (!srcWidth || !srcHeight) {
    throw new Error('Dimensi gambar tidak valid.');
  }

  // 3. Setup canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  if (!ctx) {
    throw new Error('Browser tidak mendukung manipulasi grafis Canvas.');
  }

  // Initial dimension capping if image is excessively large (maintaining aspect ratio)
  const maxInitialDim = options.maxDimension || 2048;
  if (srcWidth > maxInitialDim || srcHeight > maxInitialDim) {
    const scale = Math.min(maxInitialDim / srcWidth, maxInitialDim / srcHeight);
    srcWidth = Math.round(srcWidth * scale);
    srcHeight = Math.round(srcHeight * scale);
  }

  let currentWidth = srcWidth;
  let currentHeight = srcHeight;

  // Progressive compression & resizing strategy
  const qualitySteps = [0.82, 0.75, 0.68, 0.60, 0.52, 0.45];
  const dimensionScales = [1.0, 0.85, 0.70, 0.55, 0.40];

  let bestResult = null;

  for (const dimScale of dimensionScales) {
    const targetW = Math.max(300, Math.round(srcWidth * dimScale));
    const targetH = Math.max(300, Math.round(srcHeight * dimScale));

    canvas.width = targetW;
    canvas.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    for (const q of qualitySteps) {
      const dataUrl = canvas.toDataURL('image/webp', q);
      const byteLength = getBase64ByteSize(dataUrl);

      // Verify that browser supports WebP canvas export
      if (!dataUrl.startsWith('data:image/webp')) {
        throw new Error('Browser tidak mendukung konversi ke format WebP.');
      }

      if (byteLength <= MAX_BYTE_SIZE) {
        return {
          dataUrl,
          byteLength,
          sizeText: formatFileSize(byteLength),
          width: targetW,
          height: targetH,
        };
      }

      if (!bestResult || byteLength < bestResult.byteLength) {
        bestResult = {
          dataUrl,
          byteLength,
          sizeText: formatFileSize(byteLength),
          width: targetW,
          height: targetH,
        };
      }
    }
  }

  // If even after all scale and quality reductions it exceeds 2MB
  if (bestResult && bestResult.byteLength <= MAX_BYTE_SIZE) {
    return bestResult;
  }

  throw new Error(
    `Ukuran file gambar hasil konversi (${bestResult?.sizeText || '> 2 MB'}) melebihi batas maksimal 2 MB. Harap pilih gambar dengan resolusi lebih kecil.`
  );
}

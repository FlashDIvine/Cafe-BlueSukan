/**
 * Image Optimization Utilities for Bantu Cafe
 * Optimizes remote images (Unsplash CDN) and provides lightweight fallbacks
 */

export const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%20fill%3D%22%23F1F5F9%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23E2E8F0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%2394A3B8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2218%22%20font-weight%3D%22bold%22%3EBantu%20Cafe%3C%2Ftext%3E%3C%2Fsvg%3E';

/**
 * Optimizes an image URL for performance and mobile bandwidth saving.
 * Automatically transforms Unsplash URLs to use WebP format, target width, and compression.
 *
 * @param {string} url - Original image URL
 * @param {Object} [options]
 * @param {number} [options.width=300] - Target width in pixels
 * @param {number} [options.quality=75] - Compression quality (1-100)
 * @param {string} [options.format='webp'] - Target image format
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return FALLBACK_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  // If it's a data URL, return as-is
  if (trimmed.startsWith('data:')) return trimmed;

  // Unsplash image optimization
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(trimmed);
      const width = options.width || 300;
      const quality = options.quality || 75;
      const format = options.format || 'webp';

      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(quality));
      parsed.searchParams.set('fm', format);

      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

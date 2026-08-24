/**
 * Helper utilities for formatting data and parsing URL params
 */

/**
 * Format a number to Indonesian Rupiah currency string
 * @param {number} amount
 * @returns {string} e.g. "Rp 25.000"
 */
export function formatRupiah(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}

/**
 * Extract table number from current URL query parameters (e.g. ?table=04)
 * @param {string} fallback
 * @returns {string}
 */
export function getTableFromUrl(fallback = '04') {
  if (typeof window === 'undefined') return fallback;
  const params = new URLSearchParams(window.location.search);
  const tableParam = params.get('table') || params.get('meja');
  if (tableParam && tableParam.trim() !== '') {
    return tableParam.trim();
  }
  return fallback;
}

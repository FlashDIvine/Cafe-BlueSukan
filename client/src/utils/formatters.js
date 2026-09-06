/**
 * Helper utilities for formatting data, seating locations, and parsing URL params
 */

/**
 * Standard 3 Seating Areas for BlueSukan Cafe (Model A)
 */
export const SEATING_AREAS = [
  { id: 'indoor', name: 'Indoor', label: 'Indoor', desc: 'Teras Beratap' },
  { id: 'outdoor', name: 'Outdoor', label: 'Outdoor', desc: 'Area Terbuka' },
  { id: 'lt2', name: 'Lt 2', label: 'Lt 2', desc: 'Lantai Atas' },
];

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
 * Extract seating location from current URL query parameters (e.g. ?table=outdoor or ?area=indoor)
 * @param {string} fallback
 * @returns {string}
 */
export function getTableFromUrl(fallback = 'Indoor') {
  if (typeof window === 'undefined') return fallback;
  const params = new URLSearchParams(window.location.search);
  const rawParam = params.get('table') || params.get('meja') || params.get('area') || params.get('lokasi');

  if (rawParam && rawParam.trim() !== '') {
    const clean = rawParam.trim().toLowerCase();
    if (clean === 'indoor') return 'Indoor';
    if (clean === 'outdoor') return 'Outdoor';
    if (clean === 'lt2' || clean === 'lt-2' || clean === 'lantai2' || clean === 'lantai-2') return 'Lt 2';
    return rawParam.trim();
  }
  return fallback;
}

/**
 * Format location display label (smart handling for 'Indoor', 'Outdoor', 'Lt 2', or numeric table)
 * @param {string} val
 * @returns {string}
 */
export function formatLocationDisplay(val) {
  if (!val) return 'Indoor';
  if (/^\d+$/.test(val)) return `Meja ${val}`;
  return val;
}

/**
 * Format timestamp to payment time string (e.g. "Dibayar pukul 14:35 WIB")
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatPaidTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `Dibayar pukul ${hours}:${minutes} WIB`;
}



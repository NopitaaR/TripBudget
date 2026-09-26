/**
 * Format an integer Rupiah value to display string.
 * Example: 95000 → "Rp95.000"
 */
export function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp0';
  const abs = Math.abs(amount);
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${amount < 0 ? '-' : ''}Rp${formatted}`;
}

/**
 * Parse a Rupiah display string back to integer.
 * "Rp160.000" → 160000
 * "160000" → 160000
 */
export function parseRupiah(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Split an amount equally among count members.
 * Returns an array of integers that sum to exactly the original amount.
 * Remainder is distributed to first members (1 rupiah each).
 */
export function splitEqual(amount, count) {
  if (count <= 0) return [];
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

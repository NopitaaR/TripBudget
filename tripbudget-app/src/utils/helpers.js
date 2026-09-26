/**
 * Determine trip status from dates.
 */
export function getTripStatus(startDate, endDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'active';
}

/**
 * Format a date string for display.
 * "2026-10-12" → "12 Oct 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format date range for display.
 * "12–13 October 2026"
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const start = new Date(startDate);
  const end = new Date(endDate);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
  }
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

/**
 * Get relative date label for expenses.
 */
export function getRelativeDateLabel(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return formatDate(dateStr);
}

/**
 * Get a trip icon emoji from the trip's name or destination.
 * Returns a neutral default so every trip in the collection is treated
 * the same — sample data is not special-cased.
 */
export function getTripEmoji(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('beach') || lower.includes('pantai')) return '🏖️';
  if (lower.includes('mountain') || lower.includes('gunung')) return '🏔️';
  if (lower.includes('camp')) return '🏕️';
  if (lower.includes('city') || lower.includes('kota')) return '🏙️';
  return '🧳';
}

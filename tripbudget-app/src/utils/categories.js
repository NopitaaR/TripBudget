export const CATEGORIES = [
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'transport', label: 'Transport', emoji: '⛽' },
  { id: 'ticket', label: 'Ticket', emoji: '🎟️' },
  { id: 'accommodation', label: 'Stay', emoji: '🏕️' },
  { id: 'shopping', label: 'Shopping', emoji: '🛒' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  ...CATEGORIES.map(c => ({ id: c.id, label: c.id === 'ticket' ? 'Tickets' : c.label })),
];

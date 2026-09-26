import { formatRupiah } from './money.js';

export const SPLIT_EQUAL = 'equal';
export const SPLIT_ITEMIZED = 'itemized';

export function isItemizedExpense(expense) {
  return expense?.splitMethod === SPLIT_ITEMIZED;
}

/**
 * Participants (the people the item is bought for) of one item.
 * Legacy single-owner items ({ memberId }) are normalized to a one-element
 * participant list so old saved data keeps working.
 */
export function getItemParticipants(item) {
  if (!item) return [];
  if (Array.isArray(item.participantIds)) return item.participantIds.filter(Boolean);
  if (item.memberId) return [item.memberId];
  return [];
}

/**
 * Who actually paid for one item. Item-level payer takes precedence; legacy
 * items that only recorded an owner fall back to the expense-level payer.
 */
export function getItemPayer(item, expense) {
  return item?.paidBy || expense?.paidBy || null;
}

/** All payers of an expense (item-level for itemized expenses). */
export function getExpensePayerIds(expense) {
  if (!isItemizedExpense(expense)) {
    return expense?.paidBy ? [expense.paidBy] : [];
  }
  const ids = [];
  const seen = new Set();
  (expense.items || []).forEach(it => {
    const payer = getItemPayer(it, expense);
    if (payer && !seen.has(payer)) {
      seen.add(payer);
      ids.push(payer);
    }
  });
  return ids;
}

export function itemsTotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
}

/**
 * Each member's total share across all items.
 * Every item's amount is split equally among that item's own participants.
 * Remainder rupiah go to the earlier participants (same rule as splitEqual)
 * so shares always sum to exactly the item amount. Members who are not
 * participants of an item get nothing from it. Payer and participants are
 * independent — being the payer never creates a share on its own.
 */
export function itemMemberShares(items) {
  const totals = new Map();
  (items || []).forEach(item => {
    const participants = getItemParticipants(item);
    if (participants.length === 0) return;
    const amount = Number(item.amount) || 0;
    const base = Math.floor(amount / participants.length);
    const remainder = amount - base * participants.length;
    participants.forEach((memberId, i) => {
      const share = base + (i < remainder ? 1 : 0);
      totals.set(memberId, (totals.get(memberId) || 0) + share);
    });
  });
  return totals;
}

/** Total each member actually paid, from the per-item payers. */
export function itemPayerTotals(items, expense) {
  const totals = new Map();
  (items || []).forEach(item => {
    const payer = getItemPayer(item, expense);
    if (!payer) return;
    totals.set(payer, (totals.get(payer) || 0) + (Number(item.amount) || 0));
  });
  return totals;
}

export function itemsMismatch(items, total) {
  return itemsTotal(items) - (Number(total) || 0);
}

/** Union of every item's participants (keeps splitBetween meaningful). */
export function participantsFromItems(items) {
  const ids = [];
  const seen = new Set();
  (items || []).forEach(item => {
    getItemParticipants(item).forEach(memberId => {
      if (!seen.has(memberId)) {
        seen.add(memberId);
        ids.push(memberId);
      }
    });
  });
  return ids;
}

export function validateItems(items, total) {
  if (!Array.isArray(items) || items.length === 0) return 'Add at least one item';
  for (let i = 0; i < items.length; i++) {
    const item = items[i] || {};
    const label = `Item ${i + 1}`;
    if (!String(item.name ?? '').trim()) return `${label}: name cannot be empty`;
    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount <= 0) return `${label}: amount must be greater than 0`;
    if (getItemParticipants(item).length === 0) return `${label}: select at least one participant`;
    if (!item.paidBy) return `${label}: select who paid`;
  }
  const sum = itemsTotal(items);
  const totalNum = Number(total) || 0;
  if (sum !== totalNum) {
    const diff = sum - totalNum;
    const absDiff = formatRupiah(Math.abs(diff));
    return diff > 0
      ? `Items total ${formatRupiah(sum)} exceeds expense total ${formatRupiah(totalNum)} by ${absDiff}`
      : `Items total ${formatRupiah(sum)} is ${absDiff} short of expense total ${formatRupiah(totalNum)}`;
  }
  return null;
}
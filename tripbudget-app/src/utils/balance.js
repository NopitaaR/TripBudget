import { isItemizedExpense, getItemParticipants, getItemPayer, itemMemberShares, itemPayerTotals } from './items.js';

/**
 * Calculate each member's balance for a trip.
 * Returns a Map: memberId → { totalShouldPay, totalPaid, netBalance }
 * netBalance > 0 → member is owed money (will receive)
 * netBalance < 0 → member owes money
 *
 * Equal-split expenses (default): expense amount ÷ selected participants,
 * remainder split to first members so shares always sum to the amount.
 *
 * Itemized expenses (splitMethod 'itemized'): each item is split equally
 * among THAT item's own participants; the share is attributed to those
 * participants only. Each item's payer is credited for the amount they
 * actually paid. Payer and participants are independent — paying for an
 * item never creates a share, and participating never creates a credit.
 */
export function calculateBalances(members, expenses) {
  const balances = new Map();

  members.forEach(m => {
    balances.set(m.id, { totalShouldPay: 0, totalPaid: 0, netBalance: 0 });
  });

  expenses.forEach(expense => {
    if (isItemizedExpense(expense)) {
      const shares = itemMemberShares(expense.items);
      shares.forEach((amt, memberId) => {
        const bal = balances.get(memberId);
        if (bal) bal.totalShouldPay += amt;
      });
      const paid = itemPayerTotals(expense.items, expense);
      paid.forEach((amt, memberId) => {
        const bal = balances.get(memberId);
        if (bal) bal.totalPaid += amt;
      });
    } else {
      const splitCount = expense.splitBetween.length;
      if (splitCount === 0) return;

      const base = Math.floor(expense.amount / splitCount);
      const remainder = expense.amount - base * splitCount;

      expense.splitBetween.forEach((memberId, i) => {
        const share = base + (i < remainder ? 1 : 0);
        const bal = balances.get(memberId);
        if (bal) {
          bal.totalShouldPay += share;
        }
      });

      const payerBal = balances.get(expense.paidBy);
      if (payerBal) {
        payerBal.totalPaid += expense.amount;
      }
    }
  });

  balances.forEach((bal) => {
    bal.netBalance = bal.totalPaid - bal.totalShouldPay;
  });

  return balances;
}

/**
 * Generate simplified settlement obligations from balances.
 * Returns an array of { from, to, amount } objects — minimum payments.
 */
export function calculateSettlements(members, expenses) {
  const balances = calculateBalances(members, expenses);

  const debtors = []; // negative balance (owe money)
  const creditors = []; // positive balance (owed money)

  balances.forEach((bal, memberId) => {
    if (bal.netBalance < 0) {
      debtors.push({ id: memberId, amount: Math.abs(bal.netBalance) });
    } else if (bal.netBalance > 0) {
      creditors.push({ id: memberId, amount: bal.netBalance });
    }
  });

  // Sort descending by amount for greedy settlement
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di];
    const creditor = creditors[ci];
    const payment = Math.min(debtor.amount, creditor.amount);

    if (payment > 0) {
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount: payment,
      });
    }

    debtor.amount -= payment;
    creditor.amount -= payment;

    if (debtor.amount === 0) di++;
    if (creditor.amount === 0) ci++;
  }

  return settlements;
}

/**
 * Build the stable key identifying a settlement obligation within a trip.
 */
export function settlementKey(tripId, from, to) {
  return `${tripId}-${from}-${to}`;
}

/**
 * Check if all settlements for a trip are marked as paid.
 * `settlements` is the full collection of settlement records;
 * only records whose tripId matches the given trip are considered.
 */
export function isAllSettled(settlements, obligations, tripId) {
  if (!Array.isArray(settlements)) return false;
  if (obligations.length === 0) return false;
  const tripRecords = settlements.filter(s => s.tripId === tripId);
  return obligations.every(o => {
    const record = tripRecords.find(s => s.id === settlementKey(tripId, o.from, o.to));
    return record && record.status === 'paid';
  });
}

/**
 * Check whether a single settlement obligation is already paid.
 */
export function isSettlementPaid(settlements, tripId, from, to) {
  if (!Array.isArray(settlements) || !tripId) return false;
  const key = settlementKey(tripId, from, to);
  const record = settlements.find(s => s.id === key);
  return Boolean(record && record.status === 'paid');
}

/**
 * Get settlement status descriptor for one trip.
 * Uses only members/expenses/settlements belonging to that trip.
 * Returns { status: 'none' | 'settled' | 'pending', label: string }
 */
export function getTripSettlementStatus(tripId, allMembers, allExpenses, allSettlements) {
  const tripMembers = allMembers.filter(m => m.tripId === tripId);
  const tripExpenses = allExpenses.filter(e => e.tripId === tripId);

  if (tripExpenses.length === 0) {
    return { status: 'none', label: 'No expenses' };
  }

  const settlements = calculateSettlements(tripMembers, tripExpenses);
  if (settlements.length === 0) {
    return { status: 'settled', label: 'All settled' };
  }

  if (isAllSettled(allSettlements, settlements, tripId)) {
    return { status: 'settled', label: 'All settled' };
  }

  const unpaidCount = settlements.filter(
    s => !isSettlementPaid(allSettlements, tripId, s.from, s.to)
  ).length;
  return { status: 'pending', label: `${unpaidCount} to settle` };
}

/**
 * Explain which expenses/items fund one settlement payment (from → to).
 *
 * Each expense is decomposed into units (equal expense = one unit; itemized
 * expense = one unit per item) and every unit is run through the SAME
 * calculateBalances() used everywhere, so the shares shown here are exactly
 * the numbers that produced the settlement. A unit contributes to the
 * payment only when the receiver actually paid for it AND the payer of the
 * settlement actually owes a share of it.
 *
 * Returns an array of:
 * { id, title, parentName, total, participants, participantIds, share, payerName }
 * sorted by share descending.
 */
export function getPaymentDetails(fromMemberId, toMemberId, members, expenses) {
  const nameOf = (id) => members.find(m => m.id === id)?.name || 'Unknown';

  const units = [];
  (expenses || []).forEach(expense => {
    if (isItemizedExpense(expense)) {
      (expense.items || []).forEach(item => {
        units.push({
          id: `${expense.id}-${item.id}`,
          title: item.name,
          parentName: expense.name,
          total: Number(item.amount) || 0,
          single: { ...expense, items: [item] },
          source: expense,
          item,
        });
      });
    } else {
      units.push({
        id: expense.id,
        title: expense.name,
        parentName: null,
        total: Number(expense.amount) || 0,
        single: expense,
        source: expense,
        item: null,
      });
    }
  });

  return units
    .map(unit => {
      const bal = calculateBalances(members, [unit.single]);
      const fromBal = bal.get(fromMemberId);
      const toBal = bal.get(toMemberId);
      if (!fromBal || !toBal) return null;
      // The receiver must have paid for this unit, and the settlement payer
      // must owe a share of it — otherwise this unit plays no part in this
      // payment.
      if (toBal.totalPaid <= 0 || fromBal.totalShouldPay <= 0) return null;

      const participants = unit.item
        ? getItemParticipants(unit.item)
        : (unit.source.splitBetween || []);
      const payerId = unit.item
        ? getItemPayer(unit.item, unit.source)
        : unit.source.paidBy;
      if (payerId !== toMemberId) return null;
      if (!participants.includes(fromMemberId)) return null;

      return {
        id: unit.id,
        title: unit.title,
        parentName: unit.parentName && unit.parentName !== unit.title ? unit.parentName : null,
        total: unit.total,
        participants: participants.map(nameOf),
        participantIds: participants,
        share: fromBal.totalShouldPay,
        payerName: nameOf(payerId),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.share - a.share);
}

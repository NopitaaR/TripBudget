import { formatRupiah, parseRupiah, splitEqual } from '../src/utils/money.js';
import { calculateBalances, calculateSettlements, isAllSettled, isSettlementPaid, getTripSettlementStatus, getPaymentDetails } from '../src/utils/balance.js';
import { initialSampleData } from '../src/data/sampleData.js';
import { reducer, createInitialState } from '../src/utils/reducer.js';
import {
  validateItems,
  itemsTotal,
  itemsMismatch,
  itemMemberShares,
  participantsFromItems,
  getItemParticipants,
  getItemPayer,
  getExpensePayerIds,
  isItemizedExpense,
} from '../src/utils/items.js';

let failures = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ FAILED: ${label}${detail !== undefined ? ` — got: ${JSON.stringify(detail)}` : ''}`);
  }
}

console.log('--- TEST SUITE: TripBudget Business Logic ---');

// 1. Money tests
console.log('1. Money formatting & parsing:');
check('95000 → Rp95.000', formatRupiah(95000) === 'Rp95.000');
check('380000 → Rp380.000', formatRupiah(380000) === 'Rp380.000');
check('0 → Rp0', formatRupiah(0) === 'Rp0');
check('parse "Rp95.000" → 95000', parseRupiah('Rp95.000') === 95000);
check('parse "160000" → 160000', parseRupiah('160000') === 160000);
console.log('✓ Money tests passed\n');

// 2. Equal splitting without rounding loss
console.log('2. Equal splitting without rounding loss:');
const shares1 = splitEqual(380000, 4);
check('380k / 4 = 95k each', shares1.length === 4 && shares1.every(s => s === 95000), shares1);
const shares2 = splitEqual(100, 3);
check('sum of shares equals total', shares2.reduce((a, b) => a + b, 0) === 100, shares2);
check('remainder to first members', shares2[0] === 34 && shares2[1] === 33 && shares2[2] === 33, shares2);
console.log('✓ Splitting tests passed\n');

// 3. Sibayak sample balances
console.log('3. Sibayak sample balance calculations:');
const byTrip = (arr, tripId) => arr.filter(x => x.tripId === tripId);
const sibMembers = byTrip(initialSampleData.members, 'trip-sibayak');
const sibExpenses = byTrip(initialSampleData.expenses, 'trip-sibayak');

const sibTotal = sibExpenses.reduce((s, e) => s + e.amount, 0);
check('Sibayak total = 380000', sibTotal === 380000, sibTotal);

const sibBal = calculateBalances(sibMembers, sibExpenses);
const getBal = (id) => sibBal.get(id);
check('Nopi: paid 120k, owes 95k, net +25k',
  getBal('mem-nopi').totalPaid === 120000 && getBal('mem-nopi').totalShouldPay === 95000 && getBal('mem-nopi').netBalance === 25000,
  getBal('mem-nopi'));
check('Karina: paid 160k, owes 95k, net +65k',
  getBal('mem-karina').totalPaid === 160000 && getBal('mem-karina').totalShouldPay === 95000 && getBal('mem-karina').netBalance === 65000,
  getBal('mem-karina'));
check('Novita: paid 80k, owes 95k, net -15k',
  getBal('mem-novita').netBalance === -15000, getBal('mem-novita'));
check('Putra: paid 20k, owes 95k, net -75k',
  getBal('mem-putra').netBalance === -75000, getBal('mem-putra'));
console.log('✓ Balance calculations passed\n');

// 4. Settlement generation
console.log('4. Settlement generation (debt simplification):');
const sibSettlements = calculateSettlements(sibMembers, sibExpenses);
console.log('  Generated:', sibSettlements);
check('total debt resolved = 90000', sibSettlements.reduce((s, x) => s + x.amount, 0) === 90000, sibSettlements);
// Novita -15k, Putra -75k must be fully consumed by payments out
const paidOut = {};
sibSettlements.forEach(s => { paidOut[s.from] = (paidOut[s.from] || 0) + s.amount; });
check('Putra pays out exactly 75000', paidOut['mem-putra'] === 75000, paidOut);
check('Novita pays out exactly 15000', paidOut['mem-novita'] === 15000, paidOut);
const paidIn = {};
sibSettlements.forEach(s => { paidIn[s.to] = (paidIn[s.to] || 0) + s.amount; });
check('Nopi receives exactly 25000', paidIn['mem-nopi'] === 25000, paidIn);
check('Karina receives exactly 65000', paidIn['mem-karina'] === 65000, paidIn);
console.log('✓ Settlement generation passed\n');

// 5. Settlement records — mark paid / all settled
console.log('5. Settlement records (paid flags per generated payment):');
const tripId = 'trip-sibayak';
let records = [];
const markPaid = (from, to) => {
  const id = `${tripId}-${from}-${to}`;
  const existing = records.find(r => r.id === id);
  if (existing) existing.status = 'paid';
  else records.push({ id, tripId, fromMemberId: from, toMemberId: to, amount: 0, status: 'paid' });
};

check('nothing paid initially', isAllSettled(records, sibSettlements, tripId) === false);
markPaid(sibSettlements[0].from, sibSettlements[0].to);
check('one payment paid → not all settled', isAllSettled(records, sibSettlements, tripId) === false);
sibSettlements.forEach(s => markPaid(s.from, s.to));
check('all payments paid → all settled', isAllSettled(records, sibSettlements, tripId) === true);
check('isSettlementPaid reads scoped record', isSettlementPaid(records, tripId, sibSettlements[0].from, sibSettlements[0].to) === true);
check('isSettlementPaid rejects other trip', isSettlementPaid(records, 'trip-other', sibSettlements[0].from, sibSettlements[0].to) === false);
console.log('✓ Settlement record tests passed\n');

// 6. Multi-trip isolation
console.log('6. Multi-trip isolation:');
// Simulate a second, user-created trip exactly like the app's flow:
// Berastagi Weekend, 3 members (Nopi/Novita/Karina), Transport 90k (Novita paid),
// Food 60k (Nopi paid) → total 150k, 50k each.
const tripB = 'trip-berastagi';
const membersB = [
  { id: 'mb1', name: 'Nopi', tripId: tripB },
  { id: 'mb2', name: 'Novita', tripId: tripB },
  { id: 'mb3', name: 'Karina', tripId: tripB },
];
const expensesB = [
  { id: 'eb1', tripId: tripB, name: 'Transport', amount: 90000, category: 'transport', paidBy: 'mb2', splitBetween: ['mb1', 'mb2', 'mb3'], date: '2026-10-20' },
  { id: 'eb2', tripId: tripB, name: 'Food', amount: 60000, category: 'food', paidBy: 'mb1', splitBetween: ['mb1', 'mb2', 'mb3'], date: '2026-10-20' },
];

const allMembers = [...initialSampleData.members, ...membersB];
const allExpenses = [...initialSampleData.expenses, ...expensesB];

// Trip A balances must be identical to section 3, even with trip B present:
const sibBal2 = calculateBalances(byTrip(allMembers, 'trip-sibayak'), byTrip(allExpenses, 'trip-sibayak'));
check('Sibayak Nopi net still +25k with trip B present', sibBal2.get('mem-nopi').netBalance === 25000, sibBal2.get('mem-nopi'));
check('Sibayak Putra net still -75k with trip B present', sibBal2.get('mem-putra').netBalance === -75000);

// Trip B balances:
const balB = calculateBalances(membersB, expensesB);
check('TripB Nopi: paid 60k, owes 50k, net +10k', balB.get('mb1').totalPaid === 60000 && balB.get('mb1').netBalance === 10000, balB.get('mb1'));
check('TripB Novita: paid 90k, owes 50k, net +40k', balB.get('mb2').netBalance === 40000, balB.get('mb2'));
check('TripB Karina: owes 50k, net -50k', balB.get('mb3').netBalance === -50000, balB.get('mb3'));

// Trip B settlement plan, independent:
const setB = calculateSettlements(membersB, expensesB);
check('TripB total payments = 50000', setB.reduce((s, x) => s + x.amount, 0) === 50000, setB);
check('TripB only one debtor: Karina', setB.every(s => s.from === 'mb3'), setB);

// Same-named members in different trips never collide (ids are unique):
check('member ids unique across trips', new Set(allMembers.map(m => m.id)).size === allMembers.length);

// Trip settlement status is per-trip:
let recordsAll = [
  // trip A fully paid:
  ...sibSettlements.map(s => ({ id: `trip-sibayak-${s.from}-${s.to}`, tripId: 'trip-sibayak', fromMemberId: s.from, toMemberId: s.to, amount: s.amount, status: 'paid' })),
];
const statusA = getTripSettlementStatus('trip-sibayak', allMembers, allExpenses, recordsAll);
check('TripA status = settled (all records paid)', statusA.status === 'settled', statusA);
const statusB = getTripSettlementStatus(tripB, allMembers, allExpenses, recordsAll);
check('TripB status = pending (its own records unpaid)', statusB.status === 'pending', statusB);
check('TripB unpaid count = 2', statusB.label === '2 to settle', statusB);

// Marking TripA paid must not leak into TripB statuses:
const statusBAfter = getTripSettlementStatus(tripB, allMembers, allExpenses, recordsAll);
check('TripB unchanged after TripA payments', statusBAfter.status === 'pending');

// 7. Reset semantics: expense change wipes only that trip's records
console.log('7. Reset-on-expense-change (per trip):');
const resetTripRecords = (recs, tid) => recs.filter(r => r.tripId !== tid);
recordsAll = [
  ...sibSettlements.map(s => ({ id: `trip-sibayak-${s.from}-${s.to}`, tripId: 'trip-sibayak', fromMemberId: s.from, toMemberId: s.to, amount: s.amount, status: 'paid' })),
  { id: `${tripB}-mb3-mb2`, tripId: tripB, fromMemberId: 'mb3', toMemberId: 'mb2', amount: 40000, status: 'paid' },
];
recordsAll = resetTripRecords(recordsAll, 'trip-sibayak');
check('reset removes only tripA records', recordsAll.length === 1 && recordsAll[0].tripId === tripB, recordsAll);
const statusA2 = getTripSettlementStatus('trip-sibayak', allMembers, allExpenses, recordsAll);
check('TripA back to pending after reset', statusA2.status === 'pending', statusA2);
check('TripB record survives tripA reset', isSettlementPaid(recordsAll, tripB, 'mb3', 'mb2') === true);

// 8. Delete trip cleanup semantics (as reducer does)
console.log('8. Delete-trip cleanup:');
const deleted = {
  trips: initialSampleData.trips.filter(t => t.id !== 'trip-sibayak'),
  members: allMembers.filter(m => m.tripId !== 'trip-sibayak'),
  expenses: allExpenses.filter(e => e.tripId !== 'trip-sibayak'),
  settlements: recordsAll.filter(s => s.tripId !== 'trip-sibayak'),
};
check('no sibayak members remain', deleted.members.every(m => m.tripId !== 'trip-sibayak'));
check('no sibayak expenses remain', deleted.expenses.every(e => e.tripId !== 'trip-sibayak'));
check('no sibayak settlements remain', deleted.settlements.every(s => s.tripId !== 'trip-sibayak'));
check('other trips survive delete', deleted.trips.length === initialSampleData.trips.length - 1);

// 9. Edge cases
console.log('9. Edge cases:');
const emptySet = calculateSettlements([], []);
check('no members/expenses → no settlements', emptySet.length === 0);
const zeroNet = calculateSettlements(
  [{ id: 'x', name: 'X', tripId: 't' }],
  [{ tripId: 't', amount: 0, paidBy: 'x', splitBetween: ['x'], date: '2026-01-01' }]
);
check('zero-amount expense → no settlements', zeroNet.length === 0);
const statusNone = getTripSettlementStatus('trip-berastagi', membersB, expensesB.filter(() => false), []);
check('no expenses → status none', statusNone.status === 'none');

// 10. localStorage persistence (end-to-end round-trip through storage.js)
console.log('10. localStorage persistence:');
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
const { loadData, saveData } = await import('./utils/storage.js');
const persistSeed = {
  userName: 'Nopi',
  activeTripId: 'trip-sibayak',
  trips: initialSampleData.trips,
  members: initialSampleData.members,
  expenses: initialSampleData.expenses,
  settlements: [{ id: 'trip-sibayak-mem-putra-mem-karina', tripId: 'trip-sibayak', fromMemberId: 'mem-putra', toMemberId: 'mem-karina', amount: 65000, status: 'paid' }],
};
saveData(persistSeed);
check('saveData writes a JSON string', typeof globalThis.localStorage.getItem('tripbudget_data') === 'string');
const loaded = loadData();
check('round-trip keeps trip count', loaded && loaded.trips.length === persistSeed.trips.length, loaded && loaded.trips.length);
check('round-trip keeps activeTripId', loaded && loaded.activeTripId === 'trip-sibayak');
check('round-trip keeps settlements array', Array.isArray(loaded.settlements) && loaded.settlements.length === 1, loaded && loaded.settlements);
check('round-trip keeps settlement record fields', loaded && loaded.settlements[0] && loaded.settlements[0].fromMemberId === 'mem-putra' && loaded.settlements[0].status === 'paid', loaded && loaded.settlements[0]);
check('round-trip isolates settlement by tripId', loaded && loaded.settlements.every(s => s.tripId === 'trip-sibayak'));
console.log('✓ localStorage persistence tests passed\n');

// 11. Partial-participation scenario (5 members, 1 expense, only 4 participants)
console.log('11. Partial participation (trip avg vs. expense share):');
const tripC = 'trip-partial';
const mNopi = { id: 'c-nopi', name: 'Nopi', tripId: tripC };
const mNovita = { id: 'c-novita', name: 'Novita', tripId: tripC };
const mKarina = { id: 'c-karina', name: 'Karina', tripId: tripC };
const mPutra = { id: 'c-putra', name: 'Putra', tripId: tripC };
const mRian = { id: 'c-rian', name: 'Rian', tripId: tripC };
const membersC = [mNopi, mNovita, mKarina, mPutra, mRian];

// The only expense: Rp50.000 paid by Nopi, split among 4 of the 5 members
// (Rian is deliberately not a participant).
const participantsC = [mNopi.id, mNovita.id, mKarina.id, mPutra.id];
const expensesC = [
  { id: 'ec-1', tripId: tripC, name: 'Groceries', amount: 50000, category: 'food', paidBy: mNopi.id, splitBetween: participantsC, date: '2026-09-26' },
];

const totalC = expensesC.reduce((s, e) => s + e.amount, 0);
check('trip total = 50000', totalC === 50000, totalC);

// --- Trip Detail summary: average is over ALL trip members ---
const tripAvgC = membersC.length > 0 ? Math.floor(totalC / membersC.length) : 0;
check('trip avg per member = 50000 / 5 members = 10000', tripAvgC === 10000, tripAvgC);

// --- Expense share: over the SELECTED participants only ---
const shareC = splitEqual(50000, participantsC.length);
check('expense share = 50000 / 4 participants = 12500 each', shareC.length === 4 && shareC.every(s => s === 12500), shareC);
check('participant shares sum to full amount', shareC.reduce((a, b) => a + b, 0) === 50000, shareC);
check('expense share differs from trip average (12500 vs 10000)', shareC[0] !== tripAvgC, { share: shareC[0], avg: tripAvgC });

// --- Balances use the selected participants ---
const balC = calculateBalances(membersC, expensesC);
check('payer Nopi credited the full 50000 they paid', balC.get(mNopi.id).totalPaid === 50000, balC.get(mNopi.id));
check('payer Nopi also absorbs their own 12500 share', balC.get(mNopi.id).totalShouldPay === 12500, balC.get(mNopi.id));
check('payer Nopi net = +37500', balC.get(mNopi.id).netBalance === 37500, balC.get(mNopi.id));
check('participant Novita net = -12500', balC.get(mNovita.id).netBalance === -12500, balC.get(mNovita.id));
check('participant Karina net = -12500', balC.get(mKarina.id).netBalance === -12500, balC.get(mKarina.id));
check('participant Putra net = -12500', balC.get(mPutra.id).netBalance === -12500, balC.get(mPutra.id));
check('participant owes 12500, not the 10000 trip average', balC.get(mPutra.id).totalShouldPay === 12500, balC.get(mPutra.id));

// --- Non-participant must receive no share and no debt ---
check('non-participant Rian shouldPay = 0', balC.get(mRian.id).totalShouldPay === 0, balC.get(mRian.id));
check('non-participant Rian totalPaid = 0', balC.get(mRian.id).totalPaid === 0, balC.get(mRian.id));
check('non-participant Rian net = 0', balC.get(mRian.id).netBalance === 0, balC.get(mRian.id));

// --- Settlement plan ---
const setC = calculateSettlements(membersC, expensesC);
check('total settled = 37500', setC.reduce((s, x) => s + x.amount, 0) === 37500, setC);
check('non-participant Rian absent from every payment', setC.every(s => s.from !== mRian.id && s.to !== mRian.id), setC);
const paidOutC = {};
setC.forEach(s => { paidOutC[s.from] = (paidOutC[s.from] || 0) + s.amount; });
check('Novita pays out 12500', paidOutC[mNovita.id] === 12500, paidOutC);
check('Karina pays out 12500', paidOutC[mKarina.id] === 12500, paidOutC);
check('Putra pays out 12500', paidOutC[mPutra.id] === 12500, paidOutC);
const paidInC = {};
setC.forEach(s => { paidInC[s.to] = (paidInC[s.to] || 0) + s.amount; });
check('Nopi receives exactly 37500', paidInC[mNopi.id] === 37500, paidInC);
console.log('  Generated:', setC);
console.log('✓ Partial participation tests passed\n');

// 12. END-TO-END through the actual reducer: participant selection persistence
// Drives the real reducer exactly as AddExpense.jsx / ExpenseDetail.jsx do,
// including the form's default (all members checked) and its toggleMember().
console.log('12. E2E reducer flow — participant persistence (Nopi/Nayla/Sipa/Nadip/Gre):');
const tripIdE2E = 'trip-e2e';
let appState = { userName: 'Nopi', activeTripId: null, trips: [], members: [], expenses: [], settlements: [] };

// --- Create trip + add the 5 members, exactly like CreateTrip → AddMembers ---
appState = reducer(appState, { type: 'ADD_TRIP', payload: { id: tripIdE2E, name: 'Weekend', destination: 'Berastagi', startDate: '2026-09-26', endDate: '2026-09-27' } });
const e2eNames = ['Nopi', 'Nayla', 'Sipa', 'Nadip', 'Gre'];
const e2eIds = { Nopi: 'e-nopi', Nayla: 'e-nayla', Sipa: 'e-sipa', Nadip: 'e-nadip', Gre: 'e-gre' };
e2eNames.forEach(n => {
  appState = reducer(appState, { type: 'ADD_MEMBER', payload: { id: e2eIds[n], name: n, tripId: tripIdE2E } });
});
check('reducer stored all 5 members', appState.members.filter(m => m.tripId === tripIdE2E).length === 5);
check('member ids are unique', new Set(appState.members.map(m => m.id)).size === 5);

// Faithful re-implementation of AddExpense's toggleMember state transition
const toggleMember = (split, id) =>
  split.includes(id) ? split.filter(x => x !== id) : [...split, id];

const e2eMembers = () => appState.members.filter(m => m.tripId === tripIdE2E);
const e2eExpenses = () => appState.expenses.filter(e => e.tripId === tripIdE2E);
const netOf = (name) => calculateBalances(e2eMembers(), e2eExpenses()).get(e2eIds[name]).netBalance;
const paidOf = (name) => calculateBalances(e2eMembers(), e2eExpenses()).get(e2eIds[name]).totalPaid;
const shouldPayOf = (name) => calculateBalances(e2eMembers(), e2eExpenses()).get(e2eIds[name]).totalShouldPay;
const netsOf = () => Object.fromEntries(e2eNames.map(n => [n, netOf(n)]));

// --- ADD flow: default = all 5 checked, user unchecks Gre, submits ---
let formSplit = e2eMembers().map(m => m.id);            // AddExpense default (all selected)
formSplit = toggleMember(formSplit, e2eIds.Gre);        // user unchecks Gre
check('form split after unchecking Gre = [Nopi, Nayla, Sipa, Nadip]',
  formSplit.length === 4 && formSplit.includes(e2eIds.Nopi) && formSplit.includes(e2eIds.Nayla) &&
  formSplit.includes(e2eIds.Sipa) && formSplit.includes(e2eIds.Nadip) && !formSplit.includes(e2eIds.Gre),
  formSplit);

appState = reducer(appState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'e-exp1', tripId: tripIdE2E, name: 'Dinner', amount: 50000, category: 'food', paidBy: e2eIds.Nopi, splitBetween: formSplit, date: '2026-09-26' },
});
const persistedExp = appState.expenses.find(e => e.id === 'e-exp1');
check('ADD_EXPENSE persists splitBetween exactly as submitted',
  persistedExp.splitBetween.length === 4 &&
  persistedExp.splitBetween.includes(e2eIds.Nopi) && persistedExp.splitBetween.includes(e2eIds.Nayla) &&
  persistedExp.splitBetween.includes(e2eIds.Sipa) && persistedExp.splitBetween.includes(e2eIds.Nadip) &&
  !persistedExp.splitBetween.includes(e2eIds.Gre),
  persistedExp.splitBetween);
check('ADD_EXPENSE persists payer', persistedExp.paidBy === e2eIds.Nopi);
check('ADD_EXPENSE persists amount', persistedExp.amount === 50000);

// Expected net balances from ALL expenses of the trip:
check('Nopi net = +37500', netOf('Nopi') === 37500, netsOf());
check('Nayla net = -12500', netOf('Nayla') === -12500, netsOf());
check('Sipa net = -12500', netOf('Sipa') === -12500, netsOf());
check('Nadip net = -12500', netOf('Nadip') === -12500, netsOf());
check('Gre net = 0', netOf('Gre') === 0, netsOf());
check('Gre paid 0 and owes 0', paidOf('Gre') === 0 && shouldPayOf('Gre') === 0);
check('Nopi credited full 50000 paid, owes own 12500 share', paidOf('Nopi') === 50000 && shouldPayOf('Nopi') === 12500);
check('sum of all nets = 0 (books balance)',
  e2eNames.reduce((s, n) => s + netOf(n), 0) === 0, netsOf());

// Settlement from these net balances: 3 x 12500 → Nopi, Gre absent
let setE2E = calculateSettlements(e2eMembers(), e2eExpenses());
check('settlement total = 37500', setE2E.reduce((s, x) => s + x.amount, 0) === 37500, setE2E);
check('exactly 3 payment instructions', setE2E.length === 3, setE2E);
check('Nayla → Nopi 12500', setE2E.some(s => s.from === e2eIds.Nayla && s.to === e2eIds.Nopi && s.amount === 12500), setE2E);
check('Sipa → Nopi 12500', setE2E.some(s => s.from === e2eIds.Sipa && s.to === e2eIds.Nopi && s.amount === 12500), setE2E);
check('Nadip → Nopi 12500', setE2E.some(s => s.from === e2eIds.Nadip && s.to === e2eIds.Nopi && s.amount === 12500), setE2E);
check('Gre absent from settlement (zero balance)', setE2E.every(s => s.from !== e2eIds.Gre && s.to !== e2eIds.Gre), setE2E);

// --- EDIT flow: change participants (load existing split, toggle Sipa off, Gre on) ---
let editSplit = [...persistedExp.splitBetween];         // AddExpense edit-mode init
editSplit = toggleMember(editSplit, e2eIds.Sipa);       // user unchecks Sipa
editSplit = toggleMember(editSplit, e2eIds.Gre);        // user checks Gre
appState = reducer(appState, {
  type: 'UPDATE_EXPENSE',
  payload: { ...persistedExp, splitBetween: editSplit },
});
let editedExp = appState.expenses.find(e => e.id === 'e-exp1');
check('UPDATE_EXPENSE persists new participant set',
  editedExp.splitBetween.includes(e2eIds.Gre) && !editedExp.splitBetween.includes(e2eIds.Sipa) && editedExp.splitBetween.length === 4,
  editedExp.splitBetween);
// Balances must follow the edited participants (this is the exact symptom shape):
check('after edit: Sipa net = 0 (removed as participant)', netOf('Sipa') === 0, netsOf());
check('after edit: Gre net = -12500 (added as participant)', netOf('Gre') === -12500, netsOf());
check('after edit: Nopi still +37500', netOf('Nopi') === 37500, netsOf());

// --- EDIT back to the correct participants: balances must revert ---
let revertSplit = toggleMember(toggleMember([...editedExp.splitBetween], e2eIds.Gre), e2eIds.Sipa);
appState = reducer(appState, {
  type: 'UPDATE_EXPENSE',
  payload: { ...editedExp, splitBetween: revertSplit },
});
check('after revert: Sipa net = -12500 again', netOf('Sipa') === -12500, netsOf());
check('after revert: Gre net = 0 again', netOf('Gre') === 0, netsOf());

// --- EDIT flow: change payer to Nayla (participants unchanged) ---
appState = reducer(appState, {
  type: 'UPDATE_EXPENSE',
  payload: { ...appState.expenses.find(e => e.id === 'e-exp1'), paidBy: e2eIds.Nayla },
});
check('after payer change: Nayla net = +37500', netOf('Nayla') === 37500, netsOf());
check('after payer change: Nopi net = -12500', netOf('Nopi') === -12500, netsOf());
check('after payer change: Gre net = 0', netOf('Gre') === 0, netsOf());

// --- Payer NOT a participant: payer credit and shares stay independent ---
appState = reducer(appState, {
  type: 'UPDATE_EXPENSE',
  payload: { ...appState.expenses.find(e => e.id === 'e-exp1'), paidBy: e2eIds.Gre },
});
check('Gre pays but does not participate: net = +50000', netOf('Gre') === 50000, netsOf());
check('participants unaffected by payer change (Nayla -12500)', netOf('Nayla') === -12500, netsOf());

// --- DELETE flow: balances reset ---
appState = reducer(appState, { type: 'DELETE_EXPENSE', payload: 'e-exp1' });
check('delete removes the expense', appState.expenses.filter(e => e.tripId === tripIdE2E).length === 0);
check('after delete: every member net = 0', e2eNames.every(n => netOf(n) === 0), netsOf());
check('after delete: no settlement instructions', calculateSettlements(e2eMembers(), e2eExpenses()).length === 0);

// --- localStorage round-trip: participant set survives save/load ---
appState = reducer(appState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'e-exp2', tripId: tripIdE2E, name: 'Dinner', amount: 50000, category: 'food', paidBy: e2eIds.Nopi, splitBetween: [e2eIds.Nopi, e2eIds.Nayla, e2eIds.Sipa, e2eIds.Nadip], date: '2026-09-26' },
});
globalThis.localStorage.clear();
saveData(appState);
const reloaded = createInitialState(loadData());
const reloadedExp = reloaded.expenses.find(e => e.id === 'e-exp2');
check('splitBetween survives localStorage round-trip',
  reloadedExp.splitBetween.length === 4 &&
  reloadedExp.splitBetween.includes(e2eIds.Nopi) && reloadedExp.splitBetween.includes(e2eIds.Nayla) &&
  reloadedExp.splitBetween.includes(e2eIds.Sipa) && reloadedExp.splitBetween.includes(e2eIds.Nadip) &&
  !reloadedExp.splitBetween.includes(e2eIds.Gre),
  reloadedExp.splitBetween);
const reloadMembers = reloaded.members.filter(m => m.tripId === tripIdE2E);
const reloadExpenses = reloaded.expenses.filter(e => e.tripId === tripIdE2E);
const reloadedBal = calculateBalances(reloadMembers, reloadExpenses);
check('reloaded: Nopi +37500, Nayla -12500, Sipa -12500, Nadip -12500, Gre 0',
  reloadedBal.get(e2eIds.Nopi).netBalance === 37500 &&
  reloadedBal.get(e2eIds.Nayla).netBalance === -12500 &&
  reloadedBal.get(e2eIds.Sipa).netBalance === -12500 &&
  reloadedBal.get(e2eIds.Nadip).netBalance === -12500 &&
  reloadedBal.get(e2eIds.Gre).netBalance === 0,
  Object.fromEntries(e2eNames.map(n => [n, reloadedBal.get(e2eIds[n]).netBalance])));
console.log('✓ E2E reducer flow passed\n');

// 13. Itemized split (splitMethod: 'equal' | 'itemized')
// Covers: equal still works, itemized balances, item price changes,
// add/remove items, mismatch validation, delete, settlement, persistence.
console.log('13. Itemized split (Lipstick/Powder example):');
const tripIt = 'trip-itemized';
const itIds = { Nopi: 'it-nopi', Sipa: 'it-sipa', Nayla: 'it-nayla' };
let itState = { userName: 'Nopi', activeTripId: null, trips: [], members: [], expenses: [], settlements: [] };
itState = reducer(itState, { type: 'ADD_TRIP', payload: { id: tripIt, name: 'Shopping', destination: 'Medan', startDate: '2026-09-26', endDate: '2026-09-27' } });
['Nopi', 'Sipa', 'Nayla'].forEach(n => {
  itState = reducer(itState, { type: 'ADD_MEMBER', payload: { id: itIds[n], name: n, tripId: tripIt } });
});
const itMembers = () => itState.members.filter(m => m.tripId === tripIt);
const itExpenses = () => itState.expenses.filter(e => e.tripId === tripIt);
const itNet = (n) => calculateBalances(itMembers(), itExpenses()).get(itIds[n]);
const itNets = () => ['Nopi', 'Sipa', 'Nayla'].map(n => itNet(n).netBalance);

// 13a. Equal split still works (regression)
itState = reducer(itState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'it-eq', tripId: tripIt, name: 'Taxi', amount: 100000, category: 'transport', paidBy: itIds.Nayla, splitMethod: 'equal', splitBetween: [itIds.Nopi, itIds.Sipa], date: '2026-09-26' },
});
check('EQUAL: Nopi -50000, Sipa -50000, Nayla +100000',
  itNet('Nopi').netBalance === -50000 && itNet('Sipa').netBalance === -50000 && itNet('Nayla').netBalance === 100000, itNets());
let itSet = calculateSettlements(itMembers(), itExpenses());
check('EQUAL settlement: Nopi→Nayla 50000 and Sipa→Nayla 50000',
  itSet.some(s => s.from === itIds.Nopi && s.to === itIds.Nayla && s.amount === 50000) &&
  itSet.some(s => s.from === itIds.Sipa && s.to === itIds.Nayla && s.amount === 50000), itSet);
itState = reducer(itState, { type: 'DELETE_EXPENSE', payload: 'it-eq' });
check('EQUAL deleted → all nets 0', itNets().every(v => v === 0), itNets());

// 13b. Itemized example: Nopi paid 190000; items Lipstick 70k Nopi,
// Powder 50k Nopi, Lipstick 70k Sipa → Nopi +70000, Sipa -70000.
const shoppingItems = [
  { id: 'itm-1', name: 'Lipstick', amount: 70000, memberId: itIds.Nopi, paidBy: itIds.Nopi, participantIds: [itIds.Nopi] },
  { id: 'itm-2', name: 'Powder', amount: 50000, memberId: itIds.Nopi, paidBy: itIds.Nopi, participantIds: [itIds.Nopi] },
  { id: 'itm-3', name: 'Lipstick', amount: 70000, memberId: itIds.Sipa, paidBy: itIds.Nopi, participantIds: [itIds.Sipa] },
];
check('validateItems accepts the valid shopping list', validateItems(shoppingItems, 190000) === null);
check('itemsTotal = 190000', itemsTotal(shoppingItems) === 190000);
check('itemsMismatch = 0 when matching', itemsMismatch(shoppingItems, 190000) === 0);
const sumByMember = itemMemberShares(shoppingItems.map(it => ({ ...it, participantIds: [it.memberId] })));
check('Nopi item share = 120000 (70k lipstick + 50k powder)', sumByMember.get(itIds.Nopi) === 120000, [...sumByMember]);
check('Sipa item share = 70000', sumByMember.get(itIds.Sipa) === 70000);
check('participantsFromItems = [Nopi, Sipa]',
  JSON.stringify(participantsFromItems(shoppingItems.map(it => ({ ...it, participantIds: [it.memberId] })))) === JSON.stringify([itIds.Nopi, itIds.Sipa]));

itState = reducer(itState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'it-shop', tripId: tripIt, name: 'Shopping', amount: 190000, category: 'shopping', paidBy: itIds.Nopi, splitMethod: 'itemized', items: shoppingItems, splitBetween: participantsFromItems(shoppingItems), date: '2026-09-26' },
});
const persistedIt = itState.expenses.find(e => e.id === 'it-shop');
check('ADD_EXPENSE persists splitMethod itemized', persistedIt.splitMethod === 'itemized');
check('ADD_EXPENSE persists items array intact', persistedIt.items.length === 3 && persistedIt.items[0].name === 'Lipstick' && persistedIt.items[1].amount === 50000 && persistedIt.items[2].memberId === itIds.Sipa, persistedIt.items);
check('isItemizedExpense detects it', isItemizedExpense(persistedIt) === true);
check('ITEMIZED: Nopi paid 190000, owes 120000, net +70000',
  itNet('Nopi').totalPaid === 190000 && itNet('Nopi').totalShouldPay === 120000 && itNet('Nopi').netBalance === 70000, itNet('Nopi'));
check('ITEMIZED: Sipa owes 70000, net -70000',
  itNet('Sipa').totalShouldPay === 70000 && itNet('Sipa').netBalance === -70000, itNet('Sipa'));
check('ITEMIZED: non-participant Nayla has no share, net 0',
  itNet('Nayla').totalShouldPay === 0 && itNet('Nayla').netBalance === 0, itNet('Nayla'));
check('ITEMIZED: books balance (nets sum to 0)', itNets().reduce((a, b) => a + b, 0) === 0, itNets());

itSet = calculateSettlements(itMembers(), itExpenses());
check('ITEMIZED settlement: exactly one instruction', itSet.length === 1, itSet);
check('ITEMIZED settlement: Sipa → Nopi Rp70.000',
  itSet.length === 1 && itSet[0].from === itIds.Sipa && itSet[0].to === itIds.Nopi && itSet[0].amount === 70000, itSet);

// 13c. Changing an item price updates the member balance.
// Sipa's lipstick 70k → 90k; expense total 190k → 210k to stay consistent.
const priceChangedItems = shoppingItems.map(it =>
  it.id === 'itm-3' ? { ...it, amount: 90000 } : it
);
check('price change: itemsTotal becomes 210000', itemsTotal(priceChangedItems) === 210000);
itState = reducer(itState, {
  type: 'UPDATE_EXPENSE',
  payload: { ...persistedIt, amount: 210000, items: priceChangedItems },
});
check('after price change: Nopi net +90000', itNet('Nopi').netBalance === 90000, itNets());
check('after price change: Sipa net -90000', itNet('Sipa').netBalance === -90000, itNets());
itSet = calculateSettlements(itMembers(), itExpenses());
check('after price change: settlement Sipa → Nopi 90000',
  itSet.length === 1 && itSet[0].amount === 90000, itSet);

// 13d. Adding/removing items updates the total.
// Remove Powder (50k, Nopi): item total 210k → 160k, expense total 160k.
const noPowder = priceChangedItems.filter(it => it.id !== 'itm-2');
check('remove item: itemsTotal drops to 160000', itemsTotal(noPowder) === 160000);
itState = reducer(itState, {
  type: 'UPDATE_EXPENSE',
  payload: { ...itState.expenses.find(e => e.id === 'it-shop'), amount: 160000, items: noPowder },
});
check('after removing Powder: Nopi owes 70000, paid 160000, net +90000',
  itNet('Nopi').totalShouldPay === 70000 && itNet('Nopi').totalPaid === 160000 && itNet('Nopi').netBalance === 90000, itNet('Nopi'));
check('after removing Powder: Sipa still -90000', itNet('Sipa').netBalance === -90000, itNets());
check('after removing Powder: expense amount matches new item total',
  itState.expenses.find(e => e.id === 'it-shop').amount === itemsTotal(noPowder));

// Add Serum 30k for Sipa: item total 160k → 190k.
const withSerum = [...noPowder, { id: 'itm-4', name: 'Serum', amount: 30000, memberId: itIds.Sipa, paidBy: itIds.Nopi, participantIds: [itIds.Sipa] }];
check('add item: itemsTotal rises to 190000', itemsTotal(withSerum) === 190000);
itState = reducer(itState, {
  type: 'UPDATE_EXPENSE',
  payload: { ...itState.expenses.find(e => e.id === 'it-shop'), amount: 190000, items: withSerum },
});
check('after adding Serum: Sipa owes 120000, net -120000', itNet('Sipa').netBalance === -120000, itNets());
check('after adding Serum: Nopi net +120000', itNet('Nopi').netBalance === 120000, itNets());
itSet = calculateSettlements(itMembers(), itExpenses());
check('after adding Serum: settlement Sipa → Nopi 120000',
  itSet.length === 1 && itSet[0].amount === 120000, itSet);

// 13e. Validation — mismatch and field-level rules.
check('mismatch (190k items vs 200k total) is rejected', validateItems(withSerum, 200000) !== null);
check('mismatch message states the difference (Rp10.000)',
  validateItems(withSerum, 200000).includes('Rp10.000'), validateItems(withSerum, 200000));
check('itemsMismatch is negative when items short of total', itemsMismatch(withSerum, 200000) === -10000);
check('items exceeding total also rejected', validateItems(withSerum, 100000) !== null);
check('empty items rejected', validateItems([], 190000) !== null);
check('missing items field rejected', validateItems(undefined, 190000) !== null);
check('empty item name rejected', validateItems([{ id: 'x', name: '', amount: 1000, memberId: itIds.Nopi }], 1000) !== null);
check('zero item amount rejected', validateItems([{ id: 'x', name: 'Serum', amount: 0, memberId: itIds.Nopi }], 0) !== null);
check('item without participant rejected', validateItems([{ id: 'x', name: 'Serum', amount: 1000, memberId: '' }], 1000) !== null);
check('item without payer rejected', validateItems([{ id: 'x', name: 'Serum', amount: 1000, participantIds: [itIds.Nopi] }], 1000) !== null);
check('error message names the missing payer', validateItems([{ id: 'x', name: 'Serum', amount: 1000, participantIds: [itIds.Nopi] }], 1000).includes('select who paid'));
// The save gate AddExpense uses: only dispatch when validateItems returns null.
const blockedSave = validateItems(withSerum, 200000) !== null;
const expensesBefore = itState.expenses.length;
if (!blockedSave) {
  itState = reducer(itState, { type: 'ADD_EXPENSE', payload: { tripId: tripIt, name: 'Bad', amount: 200000, category: 'shopping', paidBy: itIds.Nopi, splitMethod: 'itemized', items: withSerum, date: '2026-09-26' } });
}
check('mismatch prevents the expense from being saved', blockedSave && itState.expenses.length === expensesBefore);

// 13f. Deleting the itemized expense removes its effect.
itState = reducer(itState, { type: 'DELETE_EXPENSE', payload: 'it-shop' });
check('after delete: every member net 0', itNets().every(v => v === 0), itNets());
check('after delete: no settlement instructions', calculateSettlements(itMembers(), itExpenses()).length === 0);

// 13g. Persistence round-trip of itemized data.
itState = reducer(itState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'it-shop2', tripId: tripIt, name: 'Shopping', amount: 190000, category: 'shopping', paidBy: itIds.Nopi, splitMethod: 'itemized', items: shoppingItems, splitBetween: participantsFromItems(shoppingItems), date: '2026-09-26' },
});
globalThis.localStorage.clear();
saveData(itState);
const itReloaded = createInitialState(loadData());
const itReloadedExp = itReloaded.expenses.find(e => e.id === 'it-shop2');
check('itemized expense survives localStorage round-trip (splitMethod + items)',
  itReloadedExp.splitMethod === 'itemized' && itReloadedExp.items.length === 3 &&
  itReloadedExp.items[0].name === 'Lipstick' && itReloadedExp.items[0].amount === 70000 &&
  itReloadedExp.items[2].memberId === itIds.Sipa,
  itReloadedExp.items);
const itReloadBal = calculateBalances(itReloaded.members.filter(m => m.tripId === tripIt), itReloaded.expenses.filter(e => e.tripId === tripIt));
check('reloaded itemized balances: Nopi +70000, Sipa -70000, Nayla 0',
  itReloadBal.get(itIds.Nopi).netBalance === 70000 &&
  itReloadBal.get(itIds.Sipa).netBalance === -70000 &&
  itReloadBal.get(itIds.Nayla).netBalance === 0);
check('reloaded itemized settlement: Sipa → Nopi 70000',
  calculateSettlements(itReloaded.members.filter(m => m.tripId === tripIt), itReloaded.expenses.filter(e => e.tripId === tripIt))
    .every(s => s.from === itIds.Sipa && s.to === itIds.Nopi && s.amount === 70000));

// 13h. Legacy expenses without splitMethod keep the equal-split path.
check('legacy expense (no splitMethod) is not itemized', isItemizedExpense(initialSampleData.expenses[0]) === false);
const legacyBal = calculateBalances(
  initialSampleData.members.filter(m => m.tripId === 'trip-sibayak'),
  initialSampleData.expenses.filter(e => e.tripId === 'trip-sibayak')
);
check('legacy equal-split balances unchanged (Nopi +25000)',
  legacyBal.get('mem-nopi').netBalance === 25000 && legacyBal.get('mem-putra').netBalance === -75000);
console.log('✓ Itemized split tests passed\n');

// 14. Per-item participants AND per-item payer (independent roles)
console.log('14. Per-item participants & payer (independent roles):');
const tripPI = 'trip-peritem';
const piIds = { Nopi: 'pi-nopi', Sipa: 'pi-sipa', Nayla: 'pi-nayla', Gre: 'pi-gre' };
let piState = { userName: 'Nopi', activeTripId: null, trips: [], members: [], expenses: [], settlements: [] };
piState = reducer(piState, { type: 'ADD_TRIP', payload: { id: tripPI, name: 'Food Trip', destination: 'Medan', startDate: '2026-09-26', endDate: '2026-09-27' } });
['Nopi', 'Sipa', 'Nayla', 'Gre'].forEach(n => {
  piState = reducer(piState, { type: 'ADD_MEMBER', payload: { id: piIds[n], name: n, tripId: tripPI } });
});
const piMembers = () => piState.members.filter(m => m.tripId === tripPI);
const piExpenses = () => piState.expenses.filter(e => e.tripId === tripPI);
const piBal = () => calculateBalances(piMembers(), piExpenses());
const piNet = (n) => piBal().get(piIds[n]).netBalance;
const piPaid = (n) => piBal().get(piIds[n]).totalPaid;
const piOwes = (n) => piBal().get(piIds[n]).totalShouldPay;

// Case 1 — Sipa buys item, Nopi pays (participant ≠ payer, one each).
console.log('  Case 1: Sipa buys, Nopi pays');
const itemOne = { id: 'pi-1', name: 'Burger', amount: 60000, participantIds: [piIds.Sipa], paidBy: piIds.Nopi };
check('validate: single participant + single payer is valid', validateItems([itemOne], 60000) === null, validateItems([itemOne], 60000));
piState = reducer(piState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'pi-exp1', tripId: tripPI, name: 'Lunch', amount: 60000, category: 'food', splitMethod: 'itemized', items: [itemOne], paidBy: null, splitBetween: [piIds.Sipa], date: '2026-09-26' },
});
const pi1 = piState.expenses.find(e => e.id === 'pi-exp1');
check('item participantIds persisted', JSON.stringify(pi1.items[0].participantIds) === JSON.stringify([piIds.Sipa]), pi1.items[0]);
check('item paidBy persisted (Nopi)', pi1.items[0].paidBy === piIds.Nopi, pi1.items[0]);
check('C1: Nopi paid 60000, owes 0, net +60000', piPaid('Nopi') === 60000 && piOwes('Nopi') === 0 && piNet('Nopi') === 60000, piBal().get(piIds.Nopi));
check('C1: Sipa owes 60000, paid 0, net -60000', piPaid('Sipa') === 0 && piOwes('Sipa') === 60000 && piNet('Sipa') === -60000);
check('C1: payer is NOT a participant (no auto-share)', piOwes('Nopi') === 0);
check('C1: bystanders Nayla/Gre untouched', piNet('Nayla') === 0 && piNet('Gre') === 0);
const setC1 = calculateSettlements(piMembers(), piExpenses());
check('C1 settlement: Sipa → Nopi 60000 (exactly one instruction)',
  setC1.length === 1 && setC1[0].from === piIds.Sipa && setC1[0].to === piIds.Nopi && setC1[0].amount === 60000, setC1);
piState = reducer(piState, { type: 'DELETE_EXPENSE', payload: 'pi-exp1' });
check('C1 cleaned up: all nets 0', ['Nopi','Sipa','Nayla','Gre'].every(n => piNet(n) === 0));

// Case 2 — Nopi and Sipa share an item, Nopi pays.
console.log('  Case 2: Nopi & Sipa share, Nopi pays');
const itemTwo = { id: 'pi-2', name: 'Taxi ride', amount: 100000, participantIds: [piIds.Nopi, piIds.Sipa], paidBy: piIds.Nopi };
check('validate: 2 participants + payer valid', validateItems([itemTwo], 100000) === null);
piState = reducer(piState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'pi-exp2', tripId: tripPI, name: 'Transport', amount: 100000, category: 'transport', splitMethod: 'itemized', items: [itemTwo], paidBy: null, splitBetween: [piIds.Nopi, piIds.Sipa], date: '2026-09-26' },
});
check('C2: split 100000 two ways = 50000 each', piOwes('Nopi') === 50000 && piOwes('Sipa') === 50000, { n: piOwes('Nopi'), s: piOwes('Sipa') });
check('C2: Nopi paid 100000, net +50000', piPaid('Nopi') === 100000 && piNet('Nopi') === 50000);
check('C2: Sipa net -50000', piNet('Sipa') === -50000);
check('C2: splitBetween derived from participants', JSON.stringify(piState.expenses.find(e => e.id === 'pi-exp2').splitBetween) === JSON.stringify([piIds.Nopi, piIds.Sipa]));
const setC2 = calculateSettlements(piMembers(), piExpenses());
check('C2 settlement: Sipa → Nopi 50000', setC2.length === 1 && setC2[0].from === piIds.Sipa && setC2[0].to === piIds.Nopi && setC2[0].amount === 50000, setC2);
piState = reducer(piState, { type: 'DELETE_EXPENSE', payload: 'pi-exp2' });

// Case 3 — Payer is NOT a participant (three-way split with safe rounding).
console.log('  Case 3: payer Gre, participants Nopi/Sipa/Nayla');
const itemThree = { id: 'pi-3', name: 'Pizza', amount: 100000, participantIds: [piIds.Nopi, piIds.Sipa, piIds.Nayla], paidBy: piIds.Gre };
check('validate: 3 participants + payer valid', validateItems([itemThree], 100000) === null);
piState = reducer(piState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'pi-exp3', tripId: tripPI, name: 'Pizza night', amount: 100000, category: 'food', splitMethod: 'itemized', items: [itemThree], paidBy: null, splitBetween: [piIds.Nopi, piIds.Sipa, piIds.Nayla], date: '2026-09-26' },
});
check('C3: Gre paid 100000, owes 0, net +100000', piPaid('Gre') === 100000 && piOwes('Gre') === 0 && piNet('Gre') === 100000);
check('C3: rounding-safe — shares 33334/33333/33333 sum to 100000',
  piOwes('Nopi') === 33334 && piOwes('Sipa') === 33333 && piOwes('Nayla') === 33333 &&
  piOwes('Nopi') + piOwes('Sipa') + piOwes('Nayla') === 100000,
  { n: piOwes('Nopi'), s: piOwes('Sipa'), y: piOwes('Nayla') });
check('C3: books balance (nets sum to 0)', ['Nopi','Sipa','Nayla','Gre'].reduce((s, n) => s + piNet(n), 0) === 0);
const setC3 = calculateSettlements(piMembers(), piExpenses());
check('C3 settlement total = 100000', setC3.reduce((s, x) => s + x.amount, 0) === 100000, setC3);
const paidInC3 = {};
setC3.forEach(s => { paidInC3[s.to] = (paidInC3[s.to] || 0) + s.amount; });
check('C3: Gre receives exactly 100000', paidInC3[piIds.Gre] === 100000, paidInC3);
const paidOutC3 = {};
setC3.forEach(s => { paidOutC3[s.from] = (paidOutC3[s.from] || 0) + s.amount; });
check('C3: each participant pays their own share',
  paidOutC3[piIds.Nopi] === 33334 && paidOutC3[piIds.Sipa] === 33333 && paidOutC3[piIds.Nayla] === 33333, paidOutC3);
check('C3: payer absent from payment sources (Gre owes nothing)', paidOutC3[piIds.Gre] === undefined, paidOutC3);
piState = reducer(piState, { type: 'DELETE_EXPENSE', payload: 'pi-exp3' });

// Case 4 — Different items, different participants AND different payers.
console.log('  Case 4: different participants & payers per item');
const itemA = { id: 'pi-4', name: 'Karaoke room', amount: 90000, participantIds: [piIds.Nopi, piIds.Sipa], paidBy: piIds.Nayla };
const itemB = { id: 'pi-5', name: 'Cereal', amount: 50000, participantIds: [piIds.Gre], paidBy: piIds.Sipa };
check('validate: mixed item set valid', validateItems([itemA, itemB], 140000) === null);
piState = reducer(piState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'pi-exp4', tripId: tripPI, name: 'Mixed night', amount: 140000, category: 'other', splitMethod: 'itemized', items: [itemA, itemB], paidBy: null, splitBetween: [piIds.Nopi, piIds.Sipa, piIds.Gre], date: '2026-09-26' },
});
check('C4: Nopi owes 45000 (karaoke only)', piOwes('Nopi') === 45000, { n: piOwes('Nopi') });
check('C4: Sipa owes 45000 for karaoke only (cereal is not hers)', piOwes('Sipa') === 45000, { s: piOwes('Sipa') });
check('C4: Gre owes 50000 (cereal only, not karaoke)', piOwes('Gre') === 50000);
check('C4: Nayla owes nothing but paid 90000', piOwes('Nayla') === 0 && piPaid('Nayla') === 90000);
check('C4: Sipa paid 50000 → net +5000', piPaid('Sipa') === 50000 && piNet('Sipa') === 5000);
check('C4: net balances Nopi -45000, Sipa +5000, Nayla +90000, Gre -50000',
  piNet('Nopi') === -45000 && piNet('Sipa') === 5000 && piNet('Nayla') === 90000 && piNet('Gre') === -50000,
  ['Nopi','Sipa','Nayla','Gre'].map(n => piNet(n)));
check('C4: books balance', ['Nopi','Sipa','Nayla','Gre'].reduce((s, n) => s + piNet(n), 0) === 0);

// Case 5 — Balance & settlement verification for the mixed scenario.
console.log('  Case 5: settlement from mixed balances');
const setC4 = calculateSettlements(piMembers(), piExpenses());
const totalOutC4 = {};
setC4.forEach(s => { totalOutC4[s.from] = (totalOutC4[s.from] || 0) + s.amount; });
const totalInC4 = {};
setC4.forEach(s => { totalInC4[s.to] = (totalInC4[s.to] || 0) + s.amount; });
check('C5: total settled = 95000 (all debt)', setC4.reduce((s, x) => s + x.amount, 0) === 95000, setC4);
check('C5: Nopi pays exactly 45000', totalOutC4[piIds.Nopi] === 45000, totalOutC4);
check('C5: Gre pays exactly 50000', totalOutC4[piIds.Gre] === 50000, totalOutC4);
check('C5: Nayla receives exactly 90000', totalInC4[piIds.Nayla] === 90000, totalInC4);
check('C5: Sipa receives exactly 5000', totalInC4[piIds.Sipa] === 5000, totalInC4);
check('C5: minimum transfers (≤ 3 instructions for 2 debtors × 2 creditors)', setC4.length <= 3, setC4);
check('C5: no member both pays and receives', !setC4.some(s1 => setC4.some(s2 => s1.from === s2.to && s1.to === s2.from)), setC4);
// Editing an item updates balances: karaoke price 90000 → 120000, total follows.
const editedItems4 = [itemA, itemB].map(it => it.id === 'pi-4' ? { ...it, amount: 120000 } : it);
piState = reducer(piState, {
  type: 'UPDATE_EXPENSE',
  payload: { ...piState.expenses.find(e => e.id === 'pi-exp4'), amount: 170000, items: editedItems4 },
});
check('C5 edit: karaoke 120k → Nopi/Sipa owe 60000 each', piOwes('Nopi') === 60000 && piOwes('Sipa') === 60000, { n: piOwes('Nopi'), s: piOwes('Sipa') });
check('C5 edit: nets updated (Nopi -60000, Nayla +120000)', piNet('Nopi') === -60000 && piNet('Nayla') === 120000);
const setAfterEdit = calculateSettlements(piMembers(), piExpenses());
const outAfterEdit = {};
setAfterEdit.forEach(s => { outAfterEdit[s.from] = (outAfterEdit[s.from] || 0) + s.amount; });
check('C5 edit: settlement follows (Nopi pays 60000, Gre 50000)',
  outAfterEdit[piIds.Nopi] === 60000 && outAfterEdit[piIds.Gre] === 50000, outAfterEdit);

// Case 6 — localStorage persistence & trip isolation.
console.log('  Case 6: persistence & trip isolation');
const tripISO = 'trip-iso';
let isoState = piState;
isoState = reducer(isoState, { type: 'ADD_TRIP', payload: { id: tripISO, name: 'Solo Trip', destination: 'Jakarta', startDate: '2026-09-20', endDate: '2026-09-21' } });
const isoIds = { Nopi: 'iso-nopi', Karina: 'iso-karina' };
['Nopi', 'Karina'].forEach(n => {
  isoState = reducer(isoState, { type: 'ADD_MEMBER', payload: { id: isoIds[n], name: n, tripId: tripISO } });
});
isoState = reducer(isoState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'iso-exp1', tripId: tripISO, name: 'Dinner', amount: 80000, category: 'food', splitMethod: 'itemized',
    items: [{ id: 'iso-1', name: 'Steak', amount: 80000, participantIds: [isoIds.Karina], paidBy: isoIds.Nopi }],
    paidBy: null, splitBetween: [isoIds.Karina], date: '2026-09-20' },
});
globalThis.localStorage.clear();
saveData(isoState);
const isoReloaded = createInitialState(loadData());
const isoExp = isoReloaded.expenses.find(e => e.id === 'iso-exp1');
check('C6: item participantIds + paidBy survive localStorage round-trip',
  isoExp.items[0].participantIds.length === 1 && isoExp.items[0].participantIds[0] === isoIds.Karina && isoExp.items[0].paidBy === isoIds.Nopi, isoExp.items[0]);
const piReloadedExp = isoReloaded.expenses.find(e => e.id === 'pi-exp4');
check('C6: first trip items untouched by second trip save',
  piReloadedExp.items.length === 2 && piReloadedExp.items[0].participantIds.includes(piIds.Nopi) && piReloadedExp.items[1].paidBy === piIds.Sipa, piReloadedExp.items);
// Per-trip balances stay isolated (same member name 'Nopi', different trip):
const isoMembers = isoReloaded.members.filter(m => m.tripId === tripISO);
const isoExpenses = isoReloaded.expenses.filter(e => e.tripId === tripISO);
const isoBal = calculateBalances(isoMembers, isoExpenses);
check('C6: iso trip balances — Nopi +80000, Karina -80000 (independent)',
  isoBal.get(isoIds.Nopi).netBalance === 80000 && isoBal.get(isoIds.Karina).netBalance === -80000);
const isoSet = calculateSettlements(isoMembers, isoExpenses);
check('C6: iso settlement — Karina → Nopi 80000 only',
  isoSet.length === 1 && isoSet[0].from === isoIds.Karina && isoSet[0].to === isoIds.Nopi && isoSet[0].amount === 80000, isoSet);
const piBalIso = calculateBalances(isoReloaded.members.filter(m => m.tripId === tripPI), isoReloaded.expenses.filter(e => e.tripId === tripPI));
check('C6: first trip balances unchanged by second trip data',
  piBalIso.get(piIds.Nayla).netBalance === 120000 && piBalIso.get(piIds.Gre).netBalance === -50000);
// getExpensePayerIds: per-item payers for itemized, expense payer for equal.
check('C6: getExpensePayerIds(itemized) = per-item payers (Nayla, Sipa)',
  JSON.stringify(getExpensePayerIds(piReloadedExp)) === JSON.stringify([piIds.Nayla, piIds.Sipa]), getExpensePayerIds(piReloadedExp));
check('C6: getExpensePayerIds(equal) = expense payer',
  JSON.stringify(getExpensePayerIds(initialSampleData.expenses[0])) === JSON.stringify(['mem-karina']));
// Legacy single-owner items still resolve (compat path):
const legacyItem = { id: 'lg-1', name: 'Powder', amount: 50000, memberId: 'mem-nopi' };
check('C6: legacy item resolves participants from memberId', JSON.stringify(getItemParticipants(legacyItem)) === JSON.stringify(['mem-nopi']));
check('C6: legacy item falls back to expense payer', getItemPayer(legacyItem, initialSampleData.expenses[1]) === 'mem-nopi');
console.log('✓ Per-item participants & payer tests passed\n');

// 15. Settlement payment detail (which expenses/items fund a payment)
console.log('15. Settlement payment detail:');
const tripPD = 'trip-pdetail';
const dIds = { Nopi: 'd-nopi', Sipa: 'd-sipa', Nela: 'd-nela', Sopa: 'd-sopa', Gre: 'd-gre' };
let dState = { userName: 'Nopi', activeTripId: null, trips: [], members: [], expenses: [], settlements: [] };
dState = reducer(dState, { type: 'ADD_TRIP', payload: { id: tripPD, name: 'Weekend', destination: 'Bandung', startDate: '2026-09-26', endDate: '2026-09-27' } });
['Nopi', 'Sipa', 'Nela', 'Sopa', 'Gre'].forEach(n => {
  dState = reducer(dState, { type: 'ADD_MEMBER', payload: { id: dIds[n], name: n, tripId: tripPD } });
});
const dMembers = () => dState.members.filter(m => m.tripId === tripPD);
const dExpenses = () => dState.expenses.filter(e => e.tripId === tripPD);
const dName = (id) => dMembers().find(m => m.id === id)?.name;

// Expense A (equal, 380k) paid by Nopi, everyone participates.
// Expense B (itemized) with two items:
//   Pizza 100k → participants Nela/Nopi/Sipa, paid by Nopi
//   Taxi   60k → participants Sopa, paid by Sipa
dState = reducer(dState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'd-expA', tripId: tripPD, name: 'Dinner', amount: 380000, category: 'food',
    paidBy: dIds.Nopi, splitMethod: 'equal', splitBetween: [dIds.Nopi, dIds.Sipa, dIds.Nela, dIds.Sopa], date: '2026-09-26' },
});
dState = reducer(dState, {
  type: 'ADD_EXPENSE',
  payload: { id: 'd-expB', tripId: tripPD, name: 'Night out', amount: 160000, category: 'other', paidBy: null,
    splitMethod: 'itemized',
    items: [
      { id: 'd-it1', name: 'Pizza', amount: 100000, participantIds: [dIds.Nela, dIds.Nopi, dIds.Sipa], paidBy: dIds.Nopi },
      { id: 'd-it2', name: 'Taxi', amount: 60000, participantIds: [dIds.Sopa], paidBy: dIds.Sipa },
    ],
    splitBetween: [dIds.Nela, dIds.Nopi, dIds.Sipa, dIds.Sopa], date: '2026-09-26' },
});

// Nela's detail toward Nopi must come from the units Nopi paid and Nela shared.
const nelaToNopi = getPaymentDetails(dIds.Nela, dIds.Nopi, dMembers(), dExpenses());
check('PD: Nela→Nopi has 2 contributing units', nelaToNopi.length === 2, nelaToNopi);
check('PD: contributions sorted by share desc', nelaToNopi.every((c, i) => i === 0 || nelaToNopi[i - 1].share >= c.share), nelaToNopi.map(c => c.share));
const equalUnit = nelaToNopi.find(c => c.title === 'Dinner');
check('PD: equal unit title = expense name', equalUnit && equalUnit.title === 'Dinner');
check('PD: equal unit total = 380000', equalUnit && equalUnit.total === 380000, equalUnit);
check('PD: equal unit uses expense participants', equalUnit && equalUnit.participants.join(',') === 'Nopi,Sipa,Nela,Sopa', equalUnit);
check('PD: equal unit share matches app balance calc (95000)',
  equalUnit && equalUnit.share === calculateBalances(dMembers(), dExpenses().filter(e => e.id === 'd-expA')).get(dIds.Nela).totalShouldPay,
  equalUnit);
check('PD: equal unit payer = Nopi', equalUnit && equalUnit.payerName === 'Nopi', equalUnit);
const pizzaUnit = nelaToNopi.find(c => c.title === 'Pizza');
check('PD: itemized unit uses ITEM name + amount', pizzaUnit && pizzaUnit.title === 'Pizza' && pizzaUnit.total === 100000, pizzaUnit);
check('PD: itemized unit uses ITEM participants only', pizzaUnit && pizzaUnit.participants.join(',') === 'Nela,Nopi,Sipa', pizzaUnit);
check('PD: itemized unit uses ITEM payer', pizzaUnit && pizzaUnit.payerName === 'Nopi', pizzaUnit);
check('PD: itemized unit share = 33334 (rounding-safe third of 100000)', pizzaUnit && pizzaUnit.share === 33334, pizzaUnit);
check('PD: itemized unit shows parent expense name', pizzaUnit && pizzaUnit.parentName === 'Night out', pizzaUnit);
check('PD: Taxi item excluded (Nela neither participant nor payer)', !nelaToNopi.some(c => c.title === 'Taxi'), nelaToNopi.map(c => c.title));

// Detail amounts must never diverge from the balance computation:
const pdBal = calculateBalances(dMembers(), dExpenses());
check('PD: Nela detail sum = her total debt to Nopi-paid units',
  nelaToNopi.reduce((s, c) => s + c.share, 0) === 95000 + 33334, nelaToNopi.map(c => c.share));

// Sopa owes Nopi only from the equal expense (not from Taxi, which Sopa paid by Sipa).
const sopaToNopi = getPaymentDetails(dIds.Sopa, dIds.Nopi, dMembers(), dExpenses());
check('PD: Sopa→Nopi only from equal Dinner (Taxi paid by Sipa)',
  sopaToNopi.length === 1 && sopaToNopi[0].title === 'Dinner' && sopaToNopi[0].share === 95000, sopaToNopi);
check('PD: Sipa paid the Taxi so it is not a Nopi contribution',
  !sopaToNopi.some(c => c.title === 'Taxi'), sopaToNopi.map(c => c.title));

// Reverse direction: nothing is owed by Nopi for her own bills.
const nopiToSipa = getPaymentDetails(dIds.Nopi, dIds.Sipa, dMembers(), dExpenses());
check('PD: no unit where Sipa paid for a Nopi share → empty list', Array.isArray(nopiToSipa) && nopiToSipa.length === 0, nopiToSipa);

// The settlement list itself must still be produced by the same code path.
const pdSet = calculateSettlements(dMembers(), dExpenses());
check('PD: settlement unchanged by adding details', pdSet.length > 0 && pdSet.reduce((s, x) => s + x.amount, 0) > 0, pdSet);
console.log('  Settlement:', pdSet.map(s => `${dName(s.from)} → ${dName(s.to)} ${s.amount}`).join(' | '));
check('PD: balances still balanced', ['Nopi', 'Sipa', 'Nela', 'Sopa', 'Gre'].reduce((s, n) => s + pdBal.get(dIds[n]).netBalance, 0) === 0);
check('PD: member with no share has no contributions anywhere',
  getPaymentDetails(dIds.Gre, dIds.Nopi, dMembers(), dExpenses()).length === 0);
console.log('✓ Settlement payment detail tests passed\n');

console.log('\n' + (failures === 0
  ? 'ALL LOGIC TESTS PASSED SUCCESSFULLY! 🎉'
  : `${failures} TEST(S) FAILED`));
process.exit(failures === 0 ? 0 : 1);

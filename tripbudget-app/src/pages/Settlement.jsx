import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import './Settlement.css';
import { useTripContext } from '../context/TripContext';
import { calculateSettlements, isSettlementPaid, isAllSettled, getPaymentDetails } from '../utils/balance';
import { formatRupiah } from '../utils/money';
import { getTripStatus } from '../utils/helpers';
import ScreenHeader from '../components/ScreenHeader';
import SettlementRow from '../components/SettlementRow';
import SuccessState from '../components/SuccessState';

export default function Settlement() {
  const { tripId } = useParams();
  const { state, dispatch, showToast } = useTripContext();

  const currentTrip = useMemo(() => {
    if (tripId) return state.trips.find(t => t.id === tripId);
    const active = state.trips.find(t => getTripStatus(t.startDate, t.endDate) === 'active');
    if (active) return active;
    if (state.trips.length > 0) return state.trips[0];
    return null;
  }, [state.trips, tripId]);

  const resolvedTripId = currentTrip?.id;

  const members = useMemo(() => {
    if (!resolvedTripId) return [];
    return state.members.filter(m => m.tripId === resolvedTripId);
  }, [state.members, resolvedTripId]);

  const expenses = useMemo(() => {
    if (!resolvedTripId) return [];
    return state.expenses.filter(e => e.tripId === resolvedTripId);
  }, [state.expenses, resolvedTripId]);

  const totalSpending = expenses.reduce((s, e) => s + e.amount, 0);
  const settlements = useMemo(() => calculateSettlements(members, expenses), [members, expenses]);

  // Per-payment detail: which expenses/items fund each settlement.
  // Uses the SAME balance calc as calculateSettlements, so it never invents amounts.
  const detailsMap = useMemo(() => {
    const map = new Map();
    settlements.forEach(s => {
      map.set(`${s.from}->${s.to}`, getPaymentDetails(s.from, s.to, members, expenses));
    });
    return map;
  }, [settlements, members, expenses]);

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown';

  // Only this trip's own settlement records are consulted — another trip's
  // paid status can never affect this one.
  const checkPaid = (from, to) => {
    if (!resolvedTripId) return false;
    return isSettlementPaid(state.settlements, resolvedTripId, from, to);
  };

  const handleMarkPaid = (from, to, amount) => {
    dispatch({
      type: 'MARK_SETTLEMENT_PAID',
      payload: { tripId: resolvedTripId, from, to, amount },
    });
    showToast(`${getMemberName(from)} paid ${getMemberName(to)} ${formatRupiah(amount)}`);
  };

  const allPaid = useMemo(() => {
    if (settlements.length === 0 && expenses.length > 0) return true;
    if (settlements.length === 0) return false;
    return isAllSettled(state.settlements, settlements, resolvedTripId);
  }, [settlements, expenses.length, state.settlements, resolvedTripId]);

  if (!currentTrip) {
    return (
      <div className="settlement-screen">
        <ScreenHeader title="Settlement" />
        <div className="muted" style={{ textAlign: 'center', padding: 40 }}>No trip found</div>
      </div>
    );
  }

  return (
    <div className="settlement-screen">
      <ScreenHeader title="Settlement" />

      {allPaid && expenses.length > 0 ? (
        <SuccessState />
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 16 }}>
            Based on {formatRupiah(totalSpending)} total across {members.length} {members.length === 1 ? 'person' : 'people'}, here's the simplest way to settle up.
          </p>

          <h2 className="section-heading">Payments to make</h2>

          {settlements.length > 0 ? (
            settlements.map((s, i) => (
              <SettlementRow
                key={i}
                fromName={getMemberName(s.from)}
                toName={getMemberName(s.to)}
                amount={s.amount}
                isPaid={checkPaid(s.from, s.to)}
                onMarkPaid={() => handleMarkPaid(s.from, s.to, s.amount)}
                details={detailsMap.get(`${s.from}->${s.to}`)}
              />
            ))
          ) : (
            <div className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>
              No payments needed yet.
            </div>
          )}
        </>
      )}
    </div>
  );
}

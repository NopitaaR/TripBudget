import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Balance.css';
import { useTripContext } from '../context/TripContext';
import { calculateSettlements, isSettlementPaid } from '../utils/balance';
import { formatRupiah } from '../utils/money';
import { getTripStatus } from '../utils/helpers';
import SettlementRow from '../components/SettlementRow';
import SuccessState from '../components/SuccessState';
import Button from '../components/Button';
import IconButton from '../components/IconButton';
import EmptyState from '../components/EmptyState';

export default function Balance() {
  const { tripId } = useParams();
  const { state, dispatch, showToast } = useTripContext();
  const navigate = useNavigate();

  // Selected trip resolution
  const initialTripId = useMemo(() => {
    if (tripId) return tripId;
    if (state.activeTripId && state.trips.some(t => t.id === state.activeTripId)) {
      return state.activeTripId;
    }
    const active = state.trips.find(t => getTripStatus(t.startDate, t.endDate) === 'active');
    if (active) return active.id;
    return state.trips.length > 0 ? state.trips[0].id : '';
  }, [tripId, state.activeTripId, state.trips]);

  const [selectedTripId, setSelectedTripId] = useState(initialTripId);

  useEffect(() => {
    if (initialTripId && selectedTripId !== initialTripId) {
      setSelectedTripId(initialTripId);
    }
  }, [initialTripId, selectedTripId]);

  const currentTrip = useMemo(() => {
    return state.trips.find(t => t.id === selectedTripId) || null;
  }, [state.trips, selectedTripId]);

  const members = useMemo(() => {
    if (!selectedTripId) return [];
    return state.members.filter(m => m.tripId === selectedTripId);
  }, [selectedTripId, state.members]);

  const expenses = useMemo(() => {
    if (!selectedTripId) return [];
    return state.expenses.filter(e => e.tripId === selectedTripId);
  }, [selectedTripId, state.expenses]);

  const settlements = useMemo(() => calculateSettlements(members, expenses), [members, expenses]);

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown';

  // Identify current user ID (matched by userName, or default to first member)
  const currentUserId = useMemo(() => {
    if (members.length === 0) return null;
    const matched = members.find(m => m.name.toLowerCase() === (state.userName || '').toLowerCase());
    return matched ? matched.id : members[0].id;
  }, [members, state.userName]);

  // Settlement status is scoped strictly to the selected trip's own records.
  const checkPaid = (from, to) => {
    if (!selectedTripId) return false;
    return isSettlementPaid(state.settlements, selectedTripId, from, to);
  };

  const youOwe = settlements.filter(s => s.from === currentUserId);
  const youReceive = settlements.filter(s => s.to === currentUserId);

  // Unpaid totals
  const unpaidOwe = youOwe.filter(s => !checkPaid(s.from, s.to));
  const unpaidReceive = youReceive.filter(s => !checkPaid(s.from, s.to));

  const totalOwe = unpaidOwe.reduce((sum, s) => sum + s.amount, 0);
  const totalReceive = unpaidReceive.reduce((sum, s) => sum + s.amount, 0);

  const handleMarkPaid = (from, to, amount) => {
    if (!selectedTripId) return;
    dispatch({
      type: 'MARK_SETTLEMENT_PAID',
      payload: { tripId: selectedTripId, from, to, amount },
    });
    const payerName = from === currentUserId ? 'You' : getMemberName(from);
    const receiverName = to === currentUserId ? 'You' : getMemberName(to);
    showToast(`${payerName} paid ${receiverName} ${formatRupiah(amount)}`);
  };

  const isUserSettled = (youOwe.length === 0 && youReceive.length === 0) || (unpaidOwe.length === 0 && unpaidReceive.length === 0);

  if (state.trips.length === 0) {
    return (
      <div className="balance-screen">
        <div className="balance-topbar">
          <h1>Balance</h1>
          <IconButton ariaLabel="Profile">👤</IconButton>
        </div>
        <EmptyState
          icon="💰"
          heading="No trips yet"
          text="Create a trip to start calculating balances."
          actionLabel="+ Create Trip"
          onAction={() => navigate('/trips/create')}
        />
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div className="balance-screen">
        <div className="balance-topbar">
          <h1>Balance</h1>
          <IconButton ariaLabel="Profile">👤</IconButton>
        </div>
        <div className="muted" style={{ textAlign: 'center', padding: 40 }}>Trip not found</div>
        <Button onClick={() => navigate('/trips')} variant="ghost">View All Trips</Button>
      </div>
    );
  }

  return (
    <div className="balance-screen">
      <div className="balance-topbar">
        <h1>Balance</h1>
        <IconButton ariaLabel="Profile">👤</IconButton>
      </div>

      {expenses.length > 0 && isUserSettled ? (
        <>
          <SuccessState />
          <Button
            onClick={() => navigate(`/trips/${selectedTripId}/settlement`)}
            style={{ marginTop: 24 }}
          >
            View full settlement
          </Button>
        </>
      ) : (
        <>
          {youOwe.length > 0 && (
            <>
              <div className="wallet-hero wallet-hero-owe">
                <div className="wallet-hero-label" style={{ color: '#8A4A32' }}>You currently owe</div>
                <div className="wallet-hero-amount wallet-hero-amount-owe">{formatRupiah(totalOwe)}</div>
              </div>
              {youOwe.map((s, i) => (
                <SettlementRow
                  key={i}
                  fromName="You"
                  toName={getMemberName(s.to)}
                  amount={s.amount}
                  isPaid={checkPaid(s.from, s.to)}
                  onMarkPaid={() => handleMarkPaid(s.from, s.to, s.amount)}
                  label={`You owe ${getMemberName(s.to)}`}
                />
              ))}
            </>
          )}

          {youReceive.length > 0 && (
            <>
              <div className="wallet-hero wallet-hero-get" style={{ marginTop: youOwe.length > 0 ? 22 : 0 }}>
                <div className="wallet-hero-label" style={{ color: '#3E6B54' }}>You will receive</div>
                <div className="wallet-hero-amount wallet-hero-amount-get">{formatRupiah(totalReceive)}</div>
              </div>
              {youReceive.map((s, i) => (
                <SettlementRow
                  key={i}
                  fromName={getMemberName(s.from)}
                  toName="You"
                  amount={s.amount}
                  isPaid={checkPaid(s.from, s.to)}
                  onMarkPaid={() => handleMarkPaid(s.from, s.to, s.amount)}
                  label={`${getMemberName(s.from)} owes you`}
                />
              ))}
            </>
          )}

          {expenses.length === 0 && (
            <div className="balance-empty-trip">
              <div className="muted" style={{ textAlign: 'center', marginBottom: 16 }}>
                No expenses recorded for <b>{currentTrip.name}</b> yet.
              </div>
              <Button onClick={() => navigate(`/trips/${selectedTripId}/add-expense`)}>
                + Add Expense to {currentTrip.name}
              </Button>
            </div>
          )}

          {settlements.length > 0 && (
            <Button
              onClick={() => navigate(`/trips/${selectedTripId}/settlement`)}
              style={{ marginTop: 20 }}
            >
              View full settlement
            </Button>
          )}
        </>
      )}
    </div>
  );
}

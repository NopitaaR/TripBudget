import { useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './TripDetail.css';
import { useTripContext } from '../context/TripContext';
import { calculateBalances } from '../utils/balance';
import { formatRupiah } from '../utils/money';
import { formatDateRange, getTripEmoji } from '../utils/helpers';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import ExpenseRow from '../components/ExpenseRow';
import Button from '../components/Button';
import IconButton from '../components/IconButton';

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useTripContext();

  const trip = state.trips.find(t => t.id === tripId);
  const members = useMemo(() => state.members.filter(m => m.tripId === tripId), [state.members, tripId]);
  const expenses = useMemo(() =>
    state.expenses
      .filter(e => e.tripId === tripId)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [state.expenses, tripId]
  );

  useEffect(() => {
    if (tripId && state.activeTripId !== tripId) {
      dispatch({ type: 'SET_ACTIVE_TRIP', payload: tripId });
    }
  }, [tripId, state.activeTripId, dispatch]);

  const totalSpending = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  // Net balances recomputed from ALL expenses in the trip whenever members,
  // expenses, payers or participants change.
  const balances = useMemo(() => calculateBalances(members, expenses), [members, expenses]);

  const getBalanceStatus = (net) => {
    if (net > 0) return 'Menerima';
    if (net < 0) return 'Harus bayar';
    return 'Tidak ada tagihan';
  };

  const formatNet = (net) => (net > 0 ? `+${formatRupiah(net)}` : formatRupiah(net));

  if (!trip) {
    return (
      <div className="trip-detail-screen">
        <ScreenHeader title="Trip" />
        <div className="muted" style={{ textAlign: 'center', padding: 40 }}>Trip not found</div>
        <Button onClick={() => navigate('/trips')} variant="ghost">View All Trips</Button>
      </div>
    );
  }

  const handleDeleteTrip = () => {
    if (window.confirm(`Are you sure you want to delete "${trip.name}"? All its expenses and members will be removed.`)) {
      dispatch({ type: 'DELETE_TRIP', payload: tripId });
      navigate('/trips');
    }
  };

  return (
    <div className="trip-detail-screen">
      <ScreenHeader
        title={trip.name}
        fontSize="18px"
        onBack={() => navigate('/trips')}
        rightAction={
          <IconButton onClick={handleDeleteTrip} ariaLabel="Delete trip">🗑️</IconButton>
        }
      />

      <div className="muted" style={{ marginBottom: 20 }}>
        {getTripEmoji(trip.name)} {trip.destination ? `${trip.destination} · ` : ''}{formatDateRange(trip.startDate, trip.endDate)} · {members.length} {members.length === 1 ? 'traveler' : 'travelers'}
      </div>

      <div className="stat-row">
        <div className="stat-card stat-card-full">
          <div className="stat-amount">{formatRupiah(totalSpending)}</div>
          <div className="muted" style={{ marginTop: 2 }}>Total spending</div>
        </div>
      </div>

      <div className="section-title-row">
        <h2 className="section-heading" style={{ margin: 0 }}>Members ({members.length})</h2>
        <span className="link-sm" onClick={() => navigate(`/trips/${tripId}/members`)}>
          Manage
        </span>
      </div>
      <div className="member-balance-list">
        {members.map(m => {
          const bal = balances.get(m.id) || { netBalance: 0 };
          const net = bal.netBalance;
          const tier = net > 0 ? 'positive' : net < 0 ? 'negative' : 'zero';
          return (
            <div key={m.id} className={`member-balance-row member-balance-${tier}`}>
              <Avatar name={m.name} />
              <div className="member-balance-info">
                <div className="member-balance-name">{m.name}</div>
                <div className="member-balance-status">{getBalanceStatus(net)}</div>
              </div>
              <div className="member-balance-amount">{formatNet(net)}</div>
            </div>
          );
        })}
        <div
          className="member-balance-row member-balance-add"
          onClick={() => navigate(`/trips/${tripId}/members`)}
        >
          <div className="avatar member-add-avatar">+</div>
          <div className="member-balance-info">
            <div className="member-balance-name">Add member</div>
          </div>
        </div>
      </div>

      <div className="section-title-row">
        <h2 className="section-heading" style={{ margin: 0 }}>Recent expenses</h2>
        <span className="link-sm" onClick={() => navigate(`/trips/${tripId}/expenses`)}>See all</span>
      </div>

      {expenses.length > 0 ? (
        expenses.slice(0, 4).map(exp => (
          <ExpenseRow
            key={exp.id}
            expense={exp}
            members={members}
            onClick={() => navigate(`/trips/${tripId}/expenses/${exp.id}`)}
            showPayer={false}
          />
        ))
      ) : (
        <div className="muted" style={{ padding: '16px 0', textAlign: 'center' }}>No expenses yet</div>
      )}

      <div className="trip-detail-actions">
        <Button onClick={() => navigate(`/trips/${tripId}/add-expense`)}>
          + Add Expense
        </Button>
        <Button variant="ghost" onClick={() => navigate(`/trips/${tripId}/settlement`)}>
          🤝 View Settlement
        </Button>
      </div>
    </div>
  );
}

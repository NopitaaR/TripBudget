import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { useTripContext } from '../context/TripContext';
import { formatRupiah } from '../utils/money';
import { getTripStatus, formatDateRange, getTripEmoji } from '../utils/helpers';
import ExpenseRow from '../components/ExpenseRow';
import EmptyState from '../components/EmptyState';
import IconButton from '../components/IconButton';

export default function Home() {
  const { state, dispatch } = useTripContext();
  const navigate = useNavigate();

  // Find the current active/selected trip
  const currentTrip = useMemo(() => {
    if (state.trips.length === 0) return null;
    if (state.activeTripId) {
      const found = state.trips.find(t => t.id === state.activeTripId);
      if (found) return found;
    }
    const active = state.trips.find(t => getTripStatus(t.startDate, t.endDate) === 'active');
    if (active) return active;
    const upcoming = state.trips
      .filter(t => getTripStatus(t.startDate, t.endDate) === 'upcoming')
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    if (upcoming.length > 0) return upcoming[0];
    return state.trips[0];
  }, [state.trips, state.activeTripId]);

  const otherTrips = useMemo(() => {
    if (!currentTrip) return [];
    return state.trips.filter(t => t.id !== currentTrip.id);
  }, [state.trips, currentTrip]);

  const tripMembers = useMemo(() => {
    if (!currentTrip) return [];
    return state.members.filter(m => m.tripId === currentTrip.id);
  }, [currentTrip, state.members]);

  const tripExpenses = useMemo(() => {
    if (!currentTrip) return [];
    return state.expenses
      .filter(e => e.tripId === currentTrip.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [currentTrip, state.expenses]);

  const totalSpending = useMemo(() => {
    return tripExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [tripExpenses]);

  const recentExpenses = tripExpenses.slice(0, 3);

  const handleSwitchTrip = (tripId) => {
    dispatch({ type: 'SET_ACTIVE_TRIP', payload: tripId });
  };

  return (
    <div className="home-screen">
      <div className="home-topbar">
        <div>
          <div className="home-greeting">Good evening, {state.userName} 👋</div>
          <div className="muted">Ready for your next trip?</div>
        </div>
        <div className="home-topbar-actions">
          <IconButton ariaLabel="Notifications">🔔</IconButton>
          <IconButton ariaLabel="Profile">👤</IconButton>
        </div>
      </div>

      {currentTrip ? (
        <>
          <div className="trip-hero-card" onClick={() => navigate(`/trips/${currentTrip.id}`)}>
            <div className="trip-hero-top">
              <div className="trip-hero-emoji">{getTripEmoji(currentTrip.name)}</div>
              {currentTrip.destination && (
                <div className="trip-hero-dest-pill">📍 {currentTrip.destination}</div>
              )}
            </div>
            <h2 className="trip-hero-name">{currentTrip.name}</h2>
            <div className="trip-hero-meta">
              {formatDateRange(currentTrip.startDate, currentTrip.endDate)} · {tripMembers.length} {tripMembers.length === 1 ? 'traveler' : 'travelers'}
            </div>
            <div className="trip-hero-amount">{formatRupiah(totalSpending)}</div>
            <div className="trip-hero-label">Total spending</div>
            <div className="trip-hero-cta">View trip →</div>
          </div>

          {otherTrips.length > 0 && (
            <div className="home-trip-switcher">
              <div className="home-switcher-header">
                <span className="muted" style={{ fontWeight: 600 }}>Switch trip:</span>
                <span className="link-sm" onClick={() => navigate('/trips')}>
                  All Trips ({state.trips.length}) →
                </span>
              </div>
              <div className="home-trip-chips">
                {state.trips.map(t => (
                  <button
                    key={t.id}
                    className={`home-trip-chip ${t.id === currentTrip.id ? 'active' : ''}`}
                    onClick={() => handleSwitchTrip(t.id)}
                    type="button"
                  >
                    <span>{getTripEmoji(t.name)}</span> {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <h2 className="section-heading">Quick actions</h2>
          <div className="qa-row">
            <div className="qa qa-primary" onClick={() => navigate(`/trips/${currentTrip.id}/add-expense`)}>
              <span className="qa-icon">➕</span>
              <span className="qa-label">Add Expense</span>
            </div>
            <div className="qa" onClick={() => navigate(`/trips/${currentTrip.id}/members`)}>
              <span className="qa-icon">👥</span>
              <span className="qa-label">Members</span>
            </div>
            <div className="qa" onClick={() => navigate(`/trips/${currentTrip.id}/settlement`)}>
              <span className="qa-icon">🤝</span>
              <span className="qa-label">Settlement</span>
            </div>
            <div className="qa" onClick={() => navigate('/trips')}>
              <span className="qa-icon">🧳</span>
              <span className="qa-label">My Trips</span>
            </div>
          </div>

          <div className="section-title-row">
            <h2 className="section-heading" style={{ margin: 0 }}>Recent activity</h2>
            <span className="link-sm" onClick={() => navigate(`/trips/${currentTrip.id}/expenses`)}>
              See all
            </span>
          </div>

          {recentExpenses.length > 0 ? (
            recentExpenses.map(exp => (
              <ExpenseRow
                key={exp.id}
                expense={exp}
                members={tripMembers}
                onClick={() => navigate(`/trips/${currentTrip.id}/expenses/${exp.id}`)}
                showPayer={true}
              />
            ))
          ) : (
            <div className="muted" style={{ padding: '16px 0', textAlign: 'center' }}>
              No expenses recorded yet
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="✈️"
          heading="No trips yet"
          text="Create your first trip to start tracking expenses."
          actionLabel="+ Create Trip"
          onAction={() => navigate('/trips/create')}
        />
      )}
    </div>
  );
}

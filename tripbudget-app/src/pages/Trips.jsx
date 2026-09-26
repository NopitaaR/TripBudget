import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Trips.css';
import { useTripContext } from '../context/TripContext';
import { formatRupiah } from '../utils/money';
import { getTripStatus, formatDateRange, getTripEmoji } from '../utils/helpers';
import { getTripSettlementStatus } from '../utils/balance';
import IconButton from '../components/IconButton';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

export default function Trips() {
  const { state, dispatch } = useTripContext();
  const navigate = useNavigate();

  const grouped = useMemo(() => {
    const upcoming = [];
    const active = [];
    const past = [];
    state.trips.forEach(trip => {
      const status = getTripStatus(trip.startDate, trip.endDate);
      if (status === 'upcoming') upcoming.push(trip);
      else if (status === 'active') active.push(trip);
      else past.push(trip);
    });
    upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    active.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    past.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    return { upcoming, active, past };
  }, [state.trips]);

  const getTripMemberCount = (tripId) => state.members.filter(m => m.tripId === tripId).length;
  const getTripSpending = (tripId) => state.expenses.filter(e => e.tripId === tripId).reduce((s, e) => s + e.amount, 0);

  const handleOpenTrip = (tripId) => {
    dispatch({ type: 'SET_ACTIVE_TRIP', payload: tripId });
    navigate(`/trips/${tripId}`);
  };

  if (state.trips.length === 0) {
    return (
      <div className="trips-screen">
        <div className="trips-topbar">
          <h1>My Trips</h1>
          <IconButton onClick={() => navigate('/trips/create')} ariaLabel="Create trip">+</IconButton>
        </div>
        <EmptyState
          icon="🧳"
          heading="No trips yet"
          text="Your next adventure starts here."
          actionLabel="+ Create Trip"
          onAction={() => navigate('/trips/create')}
        />
      </div>
    );
  }

  const renderTripCard = (trip) => {
    const status = getTripStatus(trip.startDate, trip.endDate);
    const memberCount = getTripMemberCount(trip.id);
    const spending = getTripSpending(trip.id);
    const settlement = getTripSettlementStatus(trip.id, state.members, state.expenses, state.settlements);

    return (
      <div key={trip.id} className="trip-mini-card" onClick={() => handleOpenTrip(trip.id)}>
        {status === 'upcoming' && <Badge type="upcoming" />}
        {status === 'past' && <Badge type="past" />}
        <div className="trip-mini-header">
          <div className="trip-mini-emoji">{getTripEmoji(trip.name)}</div>
          <div className="trip-mini-title-wrap">
            <div className="trip-mini-name">{trip.name}</div>
            {trip.destination && <div className="trip-mini-dest">📍 {trip.destination}</div>}
          </div>
        </div>
        <div className="muted trip-mini-dates">
          {formatDateRange(trip.startDate, trip.endDate)} · {memberCount} {memberCount === 1 ? 'person' : 'people'}
        </div>
        <div className="trip-mini-footer">
          <div className="trip-mini-spending">{formatRupiah(spending)} spent</div>
          <div className={`trip-settlement-tag trip-settlement-${settlement.status}`}>
            {settlement.status === 'settled' && '✓ '}
            {settlement.label}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="trips-screen">
      <div className="trips-topbar">
        <div>
          <h1>My Trips</h1>
          <div className="muted">{state.trips.length} {state.trips.length === 1 ? 'trip' : 'trips'} saved</div>
        </div>
        <IconButton onClick={() => navigate('/trips/create')} ariaLabel="Create trip">+</IconButton>
      </div>

      <Button
        variant="ghost"
        onClick={() => navigate('/trips/create')}
        className="trips-create-btn"
      >
        + Create New Trip
      </Button>

      {grouped.active.length > 0 && (
        <div className="trips-section">
          <h2 className="section-heading">Active Trips</h2>
          {grouped.active.map(renderTripCard)}
        </div>
      )}

      {grouped.upcoming.length > 0 && (
        <div className="trips-section">
          <h2 className="section-heading">Upcoming Trips</h2>
          {grouped.upcoming.map(renderTripCard)}
        </div>
      )}

      {grouped.past.length > 0 && (
        <div className="trips-section">
          <h2 className="section-heading">Past Trips</h2>
          {grouped.past.map(renderTripCard)}
        </div>
      )}
    </div>
  );
}

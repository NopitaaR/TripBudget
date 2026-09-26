import { generateId } from './id.js';
import { initialSampleData } from '../data/sampleData.js';

export function makeSettlementId(tripId, from, to) {
  return `${tripId}-${from}-${to}`;
}

export function migrateState(saved) {
  if (!saved) return null;
  if (saved.settlements && Array.isArray(saved.settlements)) {
    if (!saved.activeTripId && saved.trips && saved.trips.length > 0) {
      saved.activeTripId = saved.trips[0].id;
    }
    return saved;
  }
  const settlements = [];
  const oldPaid = saved.paidSettlements || {};
  Object.keys(oldPaid).forEach(k => {
    if (!oldPaid[k]) return;
    const parts = k.split('-');
    if (parts.length < 3) return;
    const to = parts.pop();
    const from = parts.pop();
    const tripId = parts.join('-');
    settlements.push({
      id: makeSettlementId(tripId, from, to),
      tripId,
      fromMemberId: from,
      toMemberId: to,
      amount: 0,
      status: 'paid',
    });
  });
  delete saved.paidSettlements;
  saved.settlements = settlements;
  if (!saved.activeTripId && saved.trips && saved.trips.length > 0) {
    saved.activeTripId = saved.trips[0].id;
  }
  return saved;
}

export function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload };

    case 'SET_ACTIVE_TRIP':
      return { ...state, activeTripId: action.payload };

    case 'ADD_TRIP': {
      const trip = {
        ...action.payload,
        id: action.payload.id || generateId(),
        createdAt: action.payload.createdAt || new Date().toISOString(),
      };
      return {
        ...state,
        trips: [...state.trips, trip],
        activeTripId: trip.id,
      };
    }

    case 'UPDATE_TRIP': {
      return {
        ...state,
        trips: state.trips.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t),
      };
    }

    case 'DELETE_TRIP': {
      const tripId = action.payload;
      const remainingTrips = state.trips.filter(t => t.id !== tripId);
      const newActiveId = state.activeTripId === tripId
        ? (remainingTrips.length > 0 ? remainingTrips[0].id : null)
        : state.activeTripId;
      return {
        ...state,
        trips: remainingTrips,
        members: state.members.filter(m => m.tripId !== tripId),
        expenses: state.expenses.filter(e => e.tripId !== tripId),
        settlements: state.settlements.filter(s => s.tripId !== tripId),
        activeTripId: newActiveId,
      };
    }

    case 'ADD_MEMBER': {
      const member = {
        ...action.payload,
        id: action.payload.id || generateId(),
      };
      return { ...state, members: [...state.members, member] };
    }

    case 'REMOVE_MEMBER': {
      return { ...state, members: state.members.filter(m => m.id !== action.payload) };
    }

    case 'ADD_EXPENSE': {
      const expense = {
        ...action.payload,
        id: action.payload.id || generateId(),
        createdAt: action.payload.createdAt || new Date().toISOString(),
      };
      return { ...state, expenses: [...state.expenses, expense] };
    }

    case 'UPDATE_EXPENSE': {
      return {
        ...state,
        expenses: state.expenses.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e),
      };
    }

    case 'DELETE_EXPENSE': {
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };
    }

    case 'MARK_SETTLEMENT_PAID': {
      const { tripId, from, to, amount } = action.payload;
      const id = makeSettlementId(tripId, from, to);
      const exists = state.settlements.some(s => s.id === id);
      let settlements;
      if (exists) {
        settlements = state.settlements.map(s =>
          s.id === id ? { ...s, status: 'paid' } : s
        );
      } else {
        settlements = [...state.settlements, {
          id,
          tripId,
          fromMemberId: from,
          toMemberId: to,
          amount,
          status: 'paid',
        }];
      }
      return { ...state, settlements };
    }

    case 'UNMARK_SETTLEMENT_PAID': {
      const { tripId, from, to } = action.payload;
      const id = makeSettlementId(tripId, from, to);
      return {
        ...state,
        settlements: state.settlements.map(s =>
          s.id === id ? { ...s, status: 'pending' } : s
        ),
      };
    }

    case 'RESET_SETTLEMENTS': {
      const tripId = action.payload;
      return {
        ...state,
        settlements: state.settlements.filter(s => s.tripId !== tripId),
      };
    }

    default:
      return state;
  }
}

export function createInitialState(saved) {
  const migrated = migrateState(saved);
  if (migrated && migrated.trips) {
    return migrated;
  }
  return initialSampleData;
}
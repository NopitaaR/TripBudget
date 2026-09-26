import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddMembers.css';
import { useTripContext } from '../context/TripContext';
import ScreenHeader from '../components/ScreenHeader';
import Button from '../components/Button';
import Avatar from '../components/Avatar';

export default function AddMembers() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const { state, dispatch } = useTripContext();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  // Trip must be explicitly scoped — never guess a trip from the collection.
  // (CreateTrip forwards here with a concrete tripId in the URL.)
  const resolvedTripId = tripId || null;
  const resolvedTrip = resolvedTripId
    ? state.trips.find(t => t.id === resolvedTripId)
    : null;

  useEffect(() => {
    if (!resolvedTripId || !resolvedTrip) {
      navigate('/trips', { replace: true });
    }
  }, [resolvedTripId, resolvedTrip, navigate]);

  const members = useMemo(() => {
    if (!resolvedTripId) return [];
    return state.members.filter(m => m.tripId === resolvedTripId);
  }, [state.members, resolvedTripId]);

  const handleAddMember = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Member name is required');
      return;
    }
    if (members.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('This member already exists');
      return;
    }
    setError('');
    dispatch({
      type: 'ADD_MEMBER',
      payload: { name: trimmed, tripId: resolvedTripId },
    });
    setNewName('');
  };

  const handleRemoveMember = (id) => {
    dispatch({ type: 'REMOVE_MEMBER', payload: id });
  };

  const handleContinue = () => {
    if (members.length === 0) {
      setError('Add at least one member');
      return;
    }
    navigate(`/trips/${resolvedTripId}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  return (
    <div className="add-members-screen">
      <ScreenHeader title="Add Travelers" />
      <p className="muted" style={{ marginBottom: 18 }}>Who's joining this trip?</p>

      {members.map(member => (
        <div key={member.id} className="member-row">
          <div className="member-row-left">
            <Avatar name={member.name} />
            <span className="member-row-name">{member.name}</span>
          </div>
          <button
            className="member-remove-btn"
            onClick={() => handleRemoveMember(member.id)}
            aria-label={`Remove ${member.name}`}
          >
            ×
          </button>
        </div>
      ))}

      <div className="add-member-input-row">
        <input
          className="add-member-input"
          placeholder="Enter member name"
          value={newName}
          onChange={e => { setNewName(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {error && <div className="field-error">{error}</div>}

      <Button variant="ghost" onClick={handleAddMember} style={{ marginTop: 16 }}>
        + Add member
      </Button>
      <Button onClick={handleContinue} style={{ marginTop: 12 }}>
        Continue
      </Button>
    </div>
  );
}

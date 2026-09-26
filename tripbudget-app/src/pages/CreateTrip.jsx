import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateTrip.css';
import { useTripContext } from '../context/TripContext';
import ScreenHeader from '../components/ScreenHeader';
import Button from '../components/Button';

export default function CreateTrip() {
  const navigate = useNavigate();
  const { dispatch } = useTripContext();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Trip name is required';
    if (!location.trim()) errs.location = 'Location is required';
    if (!startDate) errs.startDate = 'Start date is required';
    if (!endDate) errs.endDate = 'End date is required';
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errs.endDate = 'End date must be after start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const tripId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tripData = {
      id: tripId,
      name: name.trim(),
      destination: location.trim(),
      startDate,
      endDate,
      notes: notes.trim(),
    };
    dispatch({ type: 'ADD_TRIP', payload: tripData });
    navigate(`/trips/${tripId}/members`, { state: { newTrip: true } });
  };

  return (
    <div className="create-trip-screen">
      <ScreenHeader title="Create New Trip" />

      <div className="field">
        <label>Trip name</label>
        <input
          placeholder="Sibayak Adventure"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {errors.name && <div className="field-error">{errors.name}</div>}
      </div>

      <div className="field">
        <label>Location</label>
        <input
          placeholder="North Sumatra"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
        {errors.location && <div className="field-error">{errors.location}</div>}
      </div>

      <div className="date-row">
        <div className="field" style={{ flex: 1 }}>
          <label>Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          {errors.startDate && <div className="field-error">{errors.startDate}</div>}
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>End date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          {errors.endDate && <div className="field-error">{errors.endDate}</div>}
        </div>
      </div>

      <div className="field">
        <label>Notes (optional)</label>
        <textarea
          rows="3"
          placeholder="Anything the group should know"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <Button onClick={handleSubmit}>Create Trip</Button>
    </div>
  );
}

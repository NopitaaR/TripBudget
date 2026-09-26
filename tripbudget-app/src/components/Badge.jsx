import './Badge.css';

export default function Badge({ type }) {
  return (
    <span className={`badge badge-${type}`}>
      {type === 'upcoming' ? 'Upcoming' : 'Completed'}
    </span>
  );
}

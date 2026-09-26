import './EmptyState.css';
import Button from './Button';

export default function EmptyState({ icon, heading, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h2 className="empty-state-heading">{heading}</h2>
      <p className="empty-state-text">{text}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} style={{ width: 'auto', padding: '12px 24px' }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

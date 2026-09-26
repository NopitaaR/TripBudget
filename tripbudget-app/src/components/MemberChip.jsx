import './MemberChip.css';
import Avatar from './Avatar';

export default function MemberChip({ name, amount, checked, onToggle, showCheckbox = false }) {
  return (
    <div className="member-chip" onClick={showCheckbox ? onToggle : undefined}>
      <div className="member-chip-left">
        <Avatar name={name} />
        <span className="member-chip-name">{name}</span>
      </div>
      {amount !== undefined && <b className="member-chip-amount">{amount}</b>}
      {showCheckbox && (
        <div className={`member-check ${checked ? 'member-check-on' : ''}`}>
          {checked && '✓'}
        </div>
      )}
    </div>
  );
}

import './CategoryChip.css';

export default function CategoryChip({ emoji, label, active, onClick }) {
  return (
    <button
      className={`category-chip ${active ? 'category-chip-active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {emoji && <span>{emoji}</span>} {label}
    </button>
  );
}

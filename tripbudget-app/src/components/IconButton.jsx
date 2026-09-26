import './IconButton.css';

export default function IconButton({ children, onClick, size = 38, className = '', ariaLabel }) {
  return (
    <button
      className={`icon-button ${className}`}
      onClick={onClick}
      style={{ width: size, height: size }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

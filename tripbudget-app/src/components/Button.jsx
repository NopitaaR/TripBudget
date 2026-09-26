import './Button.css';

export default function Button({ children, variant = 'primary', onClick, disabled, className = '', style, type = 'button' }) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

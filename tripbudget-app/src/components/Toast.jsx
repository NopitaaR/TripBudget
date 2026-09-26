import './Toast.css';

export default function Toast({ message, show }) {
  return (
    <div className={`toast ${show ? 'toast-show' : ''}`}>
      ✓ {message}
    </div>
  );
}

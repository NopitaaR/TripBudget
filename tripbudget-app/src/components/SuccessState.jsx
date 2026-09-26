import './SuccessState.css';

export default function SuccessState() {
  return (
    <div className="success-state">
      <div className="check-circle">✓</div>
      <h2 className="success-heading">All settled 🎉</h2>
      <p className="success-text">No outstanding payments.</p>
    </div>
  );
}

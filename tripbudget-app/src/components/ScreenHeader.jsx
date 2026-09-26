import './ScreenHeader.css';
import { useNavigate } from 'react-router-dom';

export default function ScreenHeader({ title, onBack, rightAction, fontSize }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className="screen-header">
      <div className="screen-header-left">
        <button className="back-button" onClick={handleBack} aria-label="Back">←</button>
        <h1 className="screen-header-title" style={fontSize ? { fontSize } : undefined}>{title}</h1>
      </div>
      {rightAction && <div className="screen-header-right">{rightAction}</div>}
    </div>
  );
}

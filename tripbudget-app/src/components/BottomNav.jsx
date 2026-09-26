import './BottomNav.css';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const isActive = (route) => {
    if (route === '/') return path === '/';
    return path.startsWith(route);
  };

  return (
    <nav className="bottom-nav">
      <div
        className={`nav-item ${isActive('/') ? 'nav-item-active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Home</span>
      </div>
      <div
        className={`nav-item ${isActive('/trips') ? 'nav-item-active' : ''}`}
        onClick={() => navigate('/trips')}
      >
        <span className="nav-icon">🧳</span>
        <span className="nav-label">Trips</span>
      </div>
      <div
        className="nav-item nav-item-add"
        onClick={() => navigate('/add-expense')}
      >
        <span className="nav-icon nav-add-circle">+</span>
      </div>
      <div
        className={`nav-item ${isActive('/balance') ? 'nav-item-active' : ''}`}
        onClick={() => navigate('/balance')}
      >
        <span className="nav-icon">💰</span>
        <span className="nav-label">Balance</span>
      </div>
    </nav>
  );
}

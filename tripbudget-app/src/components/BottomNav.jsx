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
    </nav>
  );
}
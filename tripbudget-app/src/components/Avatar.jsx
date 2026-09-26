import './Avatar.css';

export default function Avatar({ name, size = 34 }) {
  const initial = (name || '?')[0].toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initial}
    </div>
  );
}

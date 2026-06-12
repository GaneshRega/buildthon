import { NavLink } from 'react-router-dom';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/api-demo', label: 'API Demo' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__logo">⚡</span> buildthon
        </NavLink>
        <ul className="navbar__links">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`} end={to === '/'}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

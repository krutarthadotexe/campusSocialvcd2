import { NavLink } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar } from './Avatar.jsx';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navItems = [
    { to: '/', label: 'Feed' },
    { to: '/create', label: 'Create' },
    { to: '/discover', label: 'Discover' },
    { to: '/events', label: 'Events' },
    { to: '/messages', label: 'Messages' },
    { to: '/profile', label: 'Profile' },
    { to: '/settings', label: 'Settings' },
    { to: '/notifications', label: 'Alerts' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-profile">
        <Avatar user={user} size="large" />
        <p className="eyebrow">Signed in as</p>
        <h2>{user.name}</h2>
        <p className="handle">@{user.username}</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button className="ghost-button sidebar-logout" type="button" onClick={logout}>
        Logout
      </button>
    </aside>
  );
}

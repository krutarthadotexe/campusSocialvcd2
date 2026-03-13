import { NavLink } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar } from './Avatar.jsx';

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div>
        <Avatar user={user} size="large" />
        <p className="eyebrow">Signed in as</p>
        <h2>{user.name}</h2>
        <p className="handle">@{user.username}</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/">Feed</NavLink>
        <NavLink to="/create">Create</NavLink>
        <NavLink to="/discover">Discover</NavLink>
        <NavLink to="/events">Events</NavLink>
        <NavLink to="/messages">Messages</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <NavLink to="/notifications">Notifications</NavLink>
      </nav>

      <button className="ghost-button" type="button" onClick={logout}>
        Logout
      </button>
    </aside>
  );
}

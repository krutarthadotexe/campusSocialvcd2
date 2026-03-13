import { useEffect, useState } from 'react';
import { Avatar } from './Avatar.jsx';
import { api } from '../lib/api.js';

export function AdminRolePanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadUsers() {
    setError('');
    try {
      const payload = await api.getAdminUsers();
      setUsers(payload.data.users);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleRoleChange(userId, role) {
    setError('');
    setMessage('');
    try {
      await api.updateUserRole(userId, role);
      setMessage('Role updated');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h3>Manage account roles</h3>
        </div>
      </div>
      {message ? <p className="success-banner">{message}</p> : null}
      {error ? <p className="error-banner">{error}</p> : null}
      <div className="stack">
        {users.map((user) => (
          <div key={user._id} className="conversation-row">
            <Avatar user={user} size="medium" />
            <div className="conversation-copy">
              <strong>{user.name}</strong>
              <span className="handle">@{user.username}</span>
              <span className="subtle-text">{user.email}</span>
            </div>
            <select value={user.role} onChange={(event) => handleRoleChange(user._id, event.target.value)}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

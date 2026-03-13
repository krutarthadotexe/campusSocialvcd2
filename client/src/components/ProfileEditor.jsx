import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar } from './Avatar.jsx';

export function ProfileEditor() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || '',
    bio: user.bio || '',
    isPrivate: user.isPrivate || false
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      name: user.name || '',
      bio: user.bio || '',
      isPrivate: user.isPrivate || false
    });
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.updateProfile(form);
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await api.updateAvatar(formData);
        setAvatarFile(null);
      }
      await refreshUser();
      setMessage('Profile updated');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Settings</p>
          <h3>Edit your public presence</h3>
        </div>
      </div>

      <div className="settings-avatar-row">
        <Avatar user={user} size="xlarge" />
        <label>
          Profile picture
          <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
        </label>
      </div>

      <label>
        Name
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      </label>
      <label>
        Bio
        <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={4} />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={form.isPrivate}
          onChange={(event) => setForm({ ...form, isPrivate: event.target.checked })}
        />
        Make account private
      </label>
      {message ? <p className="success-banner">{message}</p> : null}
      {error ? <p className="error-banner">{error}</p> : null}
      <button className="primary-button" type="submit">
        Save profile
      </button>
    </form>
  );
}

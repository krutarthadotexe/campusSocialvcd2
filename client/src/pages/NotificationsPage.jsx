import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const labelMap = {
  follow: 'started following you',
  post_like: 'liked your post',
  comment_like: 'liked your comment',
  comment: 'commented on your post'
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  async function loadNotifications() {
    setError('');
    try {
      const payload = await api.getNotifications();
      setNotifications(payload.data.notifications);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAll() {
    try {
      await api.markAllNotificationsRead();
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="stack">
      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Notifications</p>
            <h3>Persisted activity from follows, likes, and comments</h3>
          </div>
          <button className="ghost-button" type="button" onClick={markAll}>
            Mark all read
          </button>
        </div>
        {error ? <p className="error-banner">{error}</p> : null}
      </div>

      {notifications.map((notification) => (
        <article className={`panel notification-item ${notification.readAt ? 'read' : 'unread'}`} key={notification._id}>
          <p>
            <strong>{notification.actor?.username || 'Someone'}</strong> {labelMap[notification.type] || notification.type}
          </p>
          <span className="subtle-text">{new Date(notification.createdAt).toLocaleString()}</span>
        </article>
      ))}

      {!notifications.length ? <p className="subtle-text">No notifications yet.</p> : null}
    </section>
  );
}

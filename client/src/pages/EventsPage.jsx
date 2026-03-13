import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const initialForm = {
  title: '',
  description: '',
  location: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: ''
};

export function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [editingEventId, setEditingEventId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      const payload = await api.getEvents();
      setEvents(payload.data.events);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const previews = photoFiles.map((file) => ({
      key: `${file.name}-${file.lastModified}`,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setPhotoPreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [photoFiles]);

  function splitDateTime(value) {
    if (!value) {
      return { date: '', time: '' };
    }
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    const iso = local.toISOString();
    return {
      date: iso.slice(0, 10),
      time: iso.slice(11, 16)
    };
  }

  function buildEventDateTime(date, time) {
    if (!date || !time) {
      return null;
    }

    return new Date(`${date}T${time}`);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const startsAt = buildEventDateTime(form.startDate, form.startTime);
      const endsAt = buildEventDateTime(form.endDate, form.endTime);

      if (!startsAt || Number.isNaN(startsAt.getTime()) || !endsAt || Number.isNaN(endsAt.getTime())) {
        throw new Error('Please choose both a date and time for the event start and end.');
      }

      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('location', form.location);
      payload.append('startsAt', startsAt.toISOString());
      payload.append('endsAt', endsAt.toISOString());
      photoFiles.forEach((file) => {
        payload.append('photos', file);
      });

      if (editingEventId) {
        await api.updateEvent(editingEventId, payload);
      } else {
        await api.createEvent(payload);
      }
      setForm(initialForm);
      setPhotoFiles([]);
      setEditingEventId(null);
      setMessage(editingEventId ? 'Event updated' : 'Event published');
      await loadEvents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(eventId) {
    setError('');
    setMessage('');
    try {
      await api.deleteEvent(eventId);
      if (editingEventId === eventId) {
        setEditingEventId(null);
        setForm(initialForm);
        setPhotoFiles([]);
      }
      setMessage('Event deleted');
      await loadEvents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRsvp(eventId, status) {
    setError('');
    try {
      const payload = await api.updateEventRsvp(eventId, status);
      setEvents((current) => current.map((event) => (event._id === eventId ? payload.data.event : event)));
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(event) {
    const start = splitDateTime(event.startsAt);
    const end = splitDateTime(event.endsAt);
    setEditingEventId(event._id);
    setForm({
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: start.date,
      startTime: start.time,
      endDate: end.date,
      endTime: end.time
    });
    setPhotoFiles([]);
  }

  const canManageEvents = user.role === 'teacher' || user.role === 'admin';

  return (
    <section className="stack">
      {canManageEvents ? (
        <form className="panel" onSubmit={handleSubmit}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">Events</p>
              <h3>{editingEventId ? 'Edit campus event' : 'Create a campus event'}</h3>
            </div>
            {editingEventId ? (
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setEditingEventId(null);
                  setForm(initialForm);
                  setPhotoFiles([]);
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
          <label>
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required />
          </label>
          <label>
            Location
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          </label>
          <div className="event-schedule-grid">
            <label>
              Start date
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </label>
            <label>
              Start time
              <input type="time" step="300" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </label>
            <label>
              End date
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </label>
            <label>
              End time
              <input type="time" step="300" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            </label>
          </div>
          <p className="subtle-text event-form-hint">Use the time fields for short same-day events too. On edit, uploading new photos replaces the current event gallery.</p>
          <label>
            Event photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
            />
          </label>
          {photoPreviews.length ? (
            <div className="event-photo-grid">
              {photoPreviews.map((preview) => (
                <img key={preview.key} src={preview.url} alt={preview.name} className="event-photo-preview" />
              ))}
            </div>
          ) : null}
          {message ? <p className="success-banner">{message}</p> : null}
          {error ? <p className="error-banner">{error}</p> : null}
          <button className="primary-button" type="submit">
            {editingEventId ? 'Save event' : 'Publish event'}
          </button>
        </form>
      ) : (
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Events</p>
              <h3>Campus announcements and sessions</h3>
            </div>
          </div>
          <p className="subtle-text">Teacher accounts can create events. Everyone can view them here.</p>
        </div>
      )}

      <div className="stack">
        {loading ? <p className="subtle-text">Loading events...</p> : null}
        {!loading && !events.length ? <p className="subtle-text">No events posted yet.</p> : null}
        {events.map((event) => (
          <article className="panel event-card" key={event._id}>
            {event.photos?.length ? (
              <div className="event-photo-grid">
                {event.photos.map((photo) => (
                  <img key={photo.url} src={photo.url} alt={event.title} className="event-photo-preview" />
                ))}
              </div>
            ) : null}
            <div className="panel-head">
              <div>
                <p className="eyebrow">Event</p>
                <h3>{event.title}</h3>
              </div>
              <span className="subtle-text">{new Date(event.startsAt).toLocaleDateString()}</span>
            </div>
            <p>{event.description}</p>
            <div className="event-meta">
              <span><strong>Location:</strong> {event.location}</span>
              <span><strong>Starts:</strong> {new Date(event.startsAt).toLocaleString()}</span>
              <span><strong>Ends:</strong> {new Date(event.endsAt).toLocaleString()}</span>
              <span><strong>Posted by:</strong> {event.createdBy?.name} (@{event.createdBy?.username})</span>
              <span><strong>Going:</strong> {event.stats?.goingCount || 0}</span>
              <span><strong>Interested:</strong> {event.stats?.interestedCount || 0}</span>
            </div>
            <div className="profile-actions">
              <button
                className={`ghost-button ${event.currentUserRsvp === 'going' ? 'active-chip' : ''}`}
                type="button"
                onClick={() => handleRsvp(event._id, event.currentUserRsvp === 'going' ? 'none' : 'going')}
              >
                {event.currentUserRsvp === 'going' ? 'Going ✓' : 'Going'}
              </button>
              <button
                className={`ghost-button ${event.currentUserRsvp === 'interested' ? 'active-chip' : ''}`}
                type="button"
                onClick={() => handleRsvp(event._id, event.currentUserRsvp === 'interested' ? 'none' : 'interested')}
              >
                {event.currentUserRsvp === 'interested' ? 'Interested ✓' : 'Interested'}
              </button>
              {(user.role === 'admin' || event.createdBy?._id === user.id) ? (
                <>
                  <button className="ghost-button" type="button" onClick={() => startEdit(event)}>
                    Edit
                  </button>
                  <button className="ghost-button danger-button" type="button" onClick={() => handleDelete(event._id)}>
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

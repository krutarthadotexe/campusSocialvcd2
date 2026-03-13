import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Avatar } from './Avatar.jsx';

const ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: 'Square 1:1' },
  { value: '4:5', label: 'Portrait 4:5' },
  { value: '16:9', label: 'Landscape 16:9' },
  { value: '3:2', label: 'Classic 3:2' }
];

export function PostModal({ postId, currentUserId, onClose, onUpdated, onDeleted }) {
  const [post, setPost] = useState(null);
  const [form, setForm] = useState({ caption: '', aspectRatio: '1:1', locationText: '', tags: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setError('');
      try {
        const payload = await api.getPost(postId);
        if (cancelled) {
          return;
        }
        const fetchedPost = payload.data.post;
        setPost(fetchedPost);
        setForm({
          caption: fetchedPost.caption || '',
          aspectRatio: fetchedPost.aspectRatio || '1:1',
          locationText: fetchedPost.locationText || '',
          tags: (fetchedPost.tags || []).join(', ')
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPost();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = await api.updatePostDetails(postId, form);
      setPost(payload.data.post);
      setForm({
        caption: payload.data.post.caption || '',
        aspectRatio: payload.data.post.aspectRatio || '1:1',
        locationText: payload.data.post.locationText || '',
        tags: (payload.data.post.tags || []).join(', ')
      });
      setEditing(false);
      onUpdated(payload.data.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError('');
    try {
      await api.deletePostItem(postId);
      onDeleted(postId);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const isOwner = post && String(post.owner?.id || post.owner?._id) === String(currentUserId);
  const primaryMedia = post?.media?.[0];
  const aspectRatio = post?.aspectRatio || '1:1';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>
          Close
        </button>

        {loading ? <p className="subtle-text">Loading post...</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}

        {post ? (
          <div className="stack">
            <div className="post-user">
              <Avatar user={post.owner} size="small" />
              <div>
                <strong>{post.owner?.name}</strong>
                <p className="handle">@{post.owner?.username}</p>
              </div>
            </div>

            <div className="media-frame" style={{ '--post-aspect-ratio': aspectRatio }}>
              {primaryMedia?.resourceType === 'video' ? (
                <video controls src={primaryMedia.url} />
              ) : (
                <img src={primaryMedia?.url} alt={post.caption || 'Post'} />
              )}
            </div>

            {editing ? (
              <div className="stack">
                <label>
                  Caption
                  <textarea value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} rows={4} />
                </label>
                <label>
                  Display ratio
                  <select value={form.aspectRatio} onChange={(event) => setForm({ ...form, aspectRatio: event.target.value })}>
                    {ASPECT_RATIO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Location
                  <input value={form.locationText} onChange={(event) => setForm({ ...form, locationText: event.target.value })} />
                </label>
                <label>
                  Tags
                  <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="tag1, tag2" />
                </label>
              </div>
            ) : (
              <div className="stack">
                <p className="post-caption">{post.caption || 'No caption.'}</p>
                {post.locationText ? <p className="subtle-text">{post.locationText}</p> : null}
                {post.tags?.length ? <p className="subtle-text">#{post.tags.join(' #')}</p> : null}
              </div>
            )}

            {isOwner ? (
              <div className="post-actions">
                {editing ? (
                  <>
                    <button className="primary-button" type="button" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="ghost-button" type="button" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="ghost-button" type="button" onClick={() => setEditing(true)}>
                      Edit
                    </button>
                    <button className="ghost-button danger-button" type="button" onClick={handleDelete} disabled={saving}>
                      {saving ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

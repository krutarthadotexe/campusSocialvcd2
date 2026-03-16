import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Avatar } from './Avatar.jsx';

export function SharePostModal({ post, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setLoading(true);
      setError('');
      try {
        const payload = await api.getConversations();
        if (cancelled) {
          return;
        }
        setConversations(payload.data.conversations);
        setSelectedConversationId(payload.data.conversations[0]?._id || '');
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

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleShare(event) {
    event.preventDefault();
    if (!selectedConversationId) {
      setError('Select a conversation first.');
      return;
    }

    setSharing(true);
    setError('');
    try {
      await api.sendMessage(selectedConversationId, {
        body: note.trim(),
        sharedPostId: post._id
      });
      setMessage('Post shared successfully.');
      setTimeout(() => onClose(), 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card share-modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>
          Close
        </button>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Share post</p>
            <h3>Send this post in a DM</h3>
          </div>
        </div>

        <div className="share-post-preview">
          <img src={post.media[0]?.url} alt={post.caption || 'Shared post'} />
          <div>
            <strong>{post.owner?.name}</strong>
            <p className="handle">@{post.owner?.username}</p>
            <p>{post.caption || 'No caption.'}</p>
          </div>
        </div>

        {loading ? <p className="subtle-text">Loading conversations...</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}
        {message ? <p className="success-banner">{message}</p> : null}

        {!loading ? (
          conversations.length ? (
            <form className="stack" onSubmit={handleShare}>
              <label>
                Send to
                <select value={selectedConversationId} onChange={(event) => setSelectedConversationId(event.target.value)}>
                  {conversations.map((conversation) => (
                    <option key={conversation._id} value={conversation._id}>
                      {conversation.otherParticipant?.name || conversation.otherParticipant?.username}
                    </option>
                  ))}
                </select>
              </label>

              <div className="share-recipient-list">
                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    type="button"
                    className={`conversation-row ${selectedConversationId === conversation._id ? 'active' : ''}`}
                    onClick={() => setSelectedConversationId(conversation._id)}
                  >
                    <Avatar user={conversation.otherParticipant} size="medium" />
                    <div className="conversation-copy">
                      <strong>{conversation.otherParticipant?.name || conversation.otherParticipant?.username}</strong>
                      <span className="handle">@{conversation.otherParticipant?.username}</span>
                    </div>
                  </button>
                ))}
              </div>

              <label>
                Note
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Add a note (optional)" />
              </label>

              <button className="primary-button" type="submit" disabled={sharing}>
                {sharing ? 'Sharing...' : 'Share in DM'}
              </button>
            </form>
          ) : (
            <p className="subtle-text">Start a conversation first, then you can share posts here.</p>
          )
        ) : null}
      </div>
    </div>
  );
}

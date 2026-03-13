import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState('');

  async function loadConversations(selectId) {
    setError('');
    try {
      const payload = await api.getConversations();
      const items = payload.data.conversations;
      setConversations(items);
      const nextActiveId = selectId || activeConversationId || items[0]?._id || null;
      setActiveConversationId(nextActiveId);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const userId = location.state?.startConversationUserId;
    if (!userId) {
      return;
    }

    let cancelled = false;
    async function bootstrapConversation() {
      try {
        const payload = await api.getDirectConversation(userId);
        if (cancelled) {
          return;
        }
        const conversation = payload.data.conversation;
        await loadConversations(conversation._id);
        navigate('/messages', { replace: true, state: null });
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    bootstrapConversation();
    return () => {
      cancelled = true;
    };
  }, [location.state, navigate]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    async function loadThread() {
      setLoadingThread(true);
      setError('');
      try {
        const payload = await api.getMessages(activeConversationId);
        if (cancelled) {
          return;
        }
        setMessages(payload.data.messages);
        await api.markConversationRead(activeConversationId);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingThread(false);
        }
      }
    }

    loadThread();
    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  async function handleSend(event) {
    event.preventDefault();
    if (!activeConversationId || !draft.trim()) {
      return;
    }

    setError('');
    try {
      const payload = await api.sendMessage(activeConversationId, { body: draft.trim() });
      setMessages((current) => [...current, payload.data.message]);
      setDraft('');
      await loadConversations(activeConversationId);
    } catch (err) {
      setError(err.message);
    }
  }

  const activeConversation = conversations.find((conversation) => conversation._id === activeConversationId);

  return (
    <section className="messages-layout">
      <aside className="panel messages-sidebar">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Messages</p>
            <h3>Your inbox</h3>
          </div>
        </div>

        <div className="messages-list">
          {conversations.map((conversation) => (
            <button
              key={conversation._id}
              type="button"
              className={`conversation-row ${conversation._id === activeConversationId ? 'active' : ''}`}
              onClick={() => setActiveConversationId(conversation._id)}
            >
              <Avatar user={conversation.otherParticipant} size="medium" />
              <div className="conversation-copy">
                <strong>{conversation.otherParticipant?.name || conversation.otherParticipant?.username}</strong>
                <span className="handle">@{conversation.otherParticipant?.username}</span>
                <span className="subtle-text">{conversation.lastMessageText || 'Start the conversation'}</span>
              </div>
            </button>
          ))}
          {!conversations.length ? <p className="subtle-text">Start a conversation from Discover.</p> : null}
        </div>
      </aside>

      <div className="panel messages-thread">
        <div className="panel-head">
          <div className="post-user">
            {activeConversation?.otherParticipant ? <Avatar user={activeConversation.otherParticipant} size="small" /> : null}
            <div>
              <p className="eyebrow">Thread</p>
              <h3>{activeConversation?.otherParticipant?.name || 'Select a conversation'}</h3>
            </div>
          </div>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}
        {loadingThread ? <p className="subtle-text">Loading messages...</p> : null}

        <div className="thread-messages">
          {messages.map((message) => {
            const isMine = String(message.sender?.id || message.sender?._id) === String(user.id);
            return (
              <div
                key={message._id}
                className={`chat-bubble ${isMine ? 'mine' : ''}`}
              >
                <div className="chat-meta">
                  <Avatar user={message.sender} size="tiny" />
                  <strong>{message.sender?.username}</strong>
                </div>
                <p>{message.body}</p>
              </div>
            );
          })}
          {!loadingThread && activeConversationId && !messages.length ? <p className="subtle-text">No messages yet.</p> : null}
          {!activeConversationId ? <p className="subtle-text">Pick a conversation from the left.</p> : null}
        </div>

        <form className="comment-form" onSubmit={handleSend}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={activeConversationId ? 'Write a message...' : 'Select a conversation first'}
            disabled={!activeConversationId}
          />
          <button className="primary-button compact" type="submit" disabled={!activeConversationId}>
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

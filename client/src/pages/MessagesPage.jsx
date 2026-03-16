import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar.jsx';
import { api, resolveApiAssetUrl } from '../lib/api.js';
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
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth > 980);
  const [error, setError] = useState('');

  async function loadConversations(selectId) {
    setError('');
    try {
      const payload = await api.getConversations();
      const items = payload.data.conversations;
      setConversations(items);
      const nextActiveId = selectId ?? activeConversationId;
      setActiveConversationId(nextActiveId);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth > 980);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
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

  async function handleDeleteMessage(messageId) {
    if (!activeConversationId) {
      return;
    }

    setError('');
    try {
      const payload = await api.deleteMessage(activeConversationId, messageId);
      setMessages((current) => current.filter((message) => message._id !== messageId));
      setConversations((current) =>
        current.map((conversation) =>
          conversation._id === activeConversationId ? payload.data.conversation : conversation
        )
      );
      await loadConversations(activeConversationId);
    } catch (err) {
      setError(err.message);
    }
  }

  const activeConversation = conversations.find((conversation) => conversation._id === activeConversationId);
  const showInbox = isDesktop || !activeConversationId;
  const showThread = isDesktop || Boolean(activeConversationId);

  return (
    <section className="messages-layout">
      {showInbox ? (
        <aside className="panel messages-sidebar">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Messages</p>
              <h3>Your inbox</h3>
            </div>
          </div>

          {error ? <p className="error-banner">{error}</p> : null}

          <div className="messages-list">
            {conversations.map((conversation) => (
              <button
                key={conversation._id}
                type="button"
                className="conversation-row"
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
      ) : null}

      {showThread ? (
        <div className="panel messages-thread">
          <div className="panel-head">
            <div className="post-user">
              {activeConversation?.otherParticipant ? <Avatar user={activeConversation.otherParticipant} size="small" /> : null}
              <div>
                <p className="eyebrow">Thread</p>
                <h3>{activeConversation?.otherParticipant?.name || 'Conversation'}</h3>
              </div>
            </div>
            {!isDesktop ? (
              <button className="ghost-button" type="button" onClick={() => setActiveConversationId(null)}>
                Back to inbox
              </button>
            ) : null}
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
                  {message.body ? <p>{message.body}</p> : null}
                  {message.sharedPost ? (
                    <div className="shared-post-card">
                      <img src={resolveApiAssetUrl(message.sharedPost.media?.[0]?.url)} alt={message.sharedPost.caption || 'Shared post'} />
                      <div className="shared-post-copy">
                        <strong>{message.sharedPost.owner?.name}</strong>
                        <span className="handle">@{message.sharedPost.owner?.username}</span>
                        <span>{message.sharedPost.caption || 'No caption.'}</span>
                      </div>
                    </div>
                  ) : null}
                  {isMine ? (
                    <button className="ghost-button danger-button message-delete-button" type="button" onClick={() => handleDeleteMessage(message._id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              );
            })}
            {!activeConversationId ? <p className="subtle-text">Pick a conversation from the inbox to open the thread.</p> : null}
            {!loadingThread && activeConversationId && !messages.length ? <p className="subtle-text">No messages yet.</p> : null}
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
      ) : null}
    </section>
  );
}

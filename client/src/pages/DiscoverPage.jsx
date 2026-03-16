import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar.jsx';
import { PostModal } from '../components/PostModal.jsx';
import { api, resolveApiAssetUrl } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export function DiscoverPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [discoverPosts, setDiscoverPosts] = useState([]);
  const [activePostId, setActivePostId] = useState(null);
  const [error, setError] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    async function loadDiscoverPosts() {
      setLoadingPosts(true);
      setError('');
      try {
        const payload = await api.discoverPosts();
        setDiscoverPosts(payload.data.posts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingPosts(false);
      }
    }

    loadDiscoverPosts();
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    setError('');
    try {
      const payload = await api.searchUsers(query.trim());
      setResults(payload.data.users);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleFollow(user) {
    try {
      if (user.isFollowing) {
        await api.unfollowUser(user._id);
      } else {
        await api.followUser(user._id);
      }

      setResults((current) =>
        current.map((entry) =>
          entry._id === user._id ? { ...entry, isFollowing: !entry.isFollowing } : entry
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <section className="stack">
        <form className="panel search-panel" onSubmit={handleSearch}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">Discover</p>
              <h3>Search people by username or name</h3>
            </div>
          </div>

          <div className="inline-form">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users..." />
            <button className="primary-button compact" type="submit">
              Search
            </button>
          </div>
          {error ? <p className="error-banner">{error}</p> : null}
        </form>

        <div className="result-grid">
          {results.map((user) => (
            <article className="panel profile-snippet" key={user._id}>
              <button className="profile-link-card" type="button" onClick={() => navigate(`/users/${user.username}`)}>
                <div className="discover-head">
                <Avatar user={user} size="medium" />
                <div>
                  <h4>{user.name}</h4>
                  <p className="handle">@{user.username}</p>
                </div>
                </div>
              </button>
              <p>{user.bio || 'No bio yet.'}</p>
              <p className="subtle-text">
                {user.followersCount} followers {user.isPrivate ? '• Private account' : '• Public account'}
              </p>
              <div className="profile-actions">
                <button className="ghost-button" type="button" onClick={() => toggleFollow(user)}>
                  {user.isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => navigate('/messages', { state: { startConversationUserId: user._id } })}
                >
                  Message
                </button>
              </div>
            </article>
          ))}
        </div>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Explore posts</p>
              <h3>Posts from public accounts across campus</h3>
            </div>
          </div>
          <p className="subtle-text">You can browse posts from anyone here unless their account is private and you do not follow them.</p>
          {loadingPosts ? <p className="subtle-text">Loading discover posts...</p> : null}
          {!loadingPosts && !discoverPosts.length ? <p className="subtle-text">No discover posts yet.</p> : null}
          <div className="discover-post-grid">
            {discoverPosts.map((post) => (
              <button key={post._id} className="discover-post-card" type="button" onClick={() => setActivePostId(post._id)}>
                <img src={resolveApiAssetUrl(post.media[0]?.url)} alt={post.caption || 'Discover post'} />
                <div className="discover-post-overlay">
                  <span>@{post.owner?.username}</span>
                </div>
              </button>
            ))}
          </div>
        </article>
      </section>

      {activePostId ? (
        <PostModal
          postId={activePostId}
          currentUserId={currentUser.id}
          onClose={() => setActivePostId(null)}
          onUpdated={(updatedPost) =>
            setDiscoverPosts((current) => current.map((post) => (post._id === updatedPost._id ? updatedPost : post)))
          }
          onDeleted={(postId) => {
            setDiscoverPosts((current) => current.filter((post) => post._id !== postId));
            setActivePostId(null);
          }}
        />
      ) : null}
    </>
  );
}

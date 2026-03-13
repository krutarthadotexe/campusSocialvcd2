import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar.jsx';
import { api } from '../lib/api.js';

export function DiscoverPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

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
            <p className="subtle-text">{user.followersCount} followers</p>
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
    </section>
  );
}

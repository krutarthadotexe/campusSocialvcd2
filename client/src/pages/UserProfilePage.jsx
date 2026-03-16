import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar.jsx';
import { PostModal } from '../components/PostModal.jsx';
import { UserListModal } from '../components/UserListModal.jsx';
import { api, resolveApiAssetUrl } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export function UserProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activePostId, setActivePostId] = useState(null);
  const [listModal, setListModal] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setError('');
      try {
        const profilePayload = await api.getProfile(username);
        const userProfile = {
          ...profilePayload.data.user,
          followStatus: profilePayload.data.followStatus
        };
        setProfile(userProfile);

        const [postsPayload, followersPayload, followingPayload] = await Promise.all([
          api.getUserPosts(userProfile._id || userProfile.id),
          api.getFollowers(userProfile._id || userProfile.id),
          api.getFollowing(userProfile._id || userProfile.id)
        ]);
        setPosts(postsPayload.data.posts);
        setFollowers(followersPayload.data.followers);
        setFollowing(followingPayload.data.following);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, [username]);

  async function toggleFollow() {
    if (!profile) {
      return;
    }
    try {
      if (profile.followStatus === 'accepted') {
        await api.unfollowUser(profile._id || profile.id);
        setProfile((current) => ({ ...current, followStatus: 'none' }));
        setFollowers((current) => current.filter((entry) => entry._id !== currentUser.id));
      } else {
        await api.followUser(profile._id || profile.id);
        setProfile((current) => ({ ...current, followStatus: 'accepted' }));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) {
    return <p className="error-banner">{error}</p>;
  }

  if (!profile) {
    return <p className="subtle-text">Loading profile...</p>;
  }

  const isOwnProfile = profile.username === currentUser.username;

  return (
    <>
      <section className="stack">
        <article className="panel profile-summary">
          <div className="panel-head">
            <div className="profile-hero">
              <Avatar user={profile} size="xlarge" />
              <div>
                <p className="eyebrow">Profile</p>
                <h3>{profile.name}</h3>
                <p className="handle">@{profile.username}</p>
              </div>
            </div>
            {isOwnProfile ? (
              <button className="ghost-button" type="button" onClick={() => navigate('/settings')}>
                Edit profile
              </button>
            ) : (
              <div className="profile-actions">
                <button className="ghost-button" type="button" onClick={toggleFollow}>
                  {profile.followStatus === 'accepted' ? 'Unfollow' : 'Follow'}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => navigate('/messages', { state: { startConversationUserId: profile._id || profile.id } })}
                >
                  Message
                </button>
              </div>
            )}
          </div>
          <div className="stats-row">
            <div>
              <strong>{posts.length}</strong>
              <span>Posts</span>
            </div>
            <button className="stat-button" type="button" onClick={() => setListModal({ title: 'Followers', users: followers })}>
              <strong>{followers.length}</strong>
              <span>Followers</span>
            </button>
            <button className="stat-button" type="button" onClick={() => setListModal({ title: 'Following', users: following })}>
              <strong>{following.length}</strong>
              <span>Following</span>
            </button>
          </div>
          <p>{profile.bio || 'No bio yet.'}</p>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Posts</p>
              <h3>{isOwnProfile ? 'Your uploads' : `${profile.name}'s uploads`}</h3>
            </div>
          </div>
          <div className="mini-post-grid">
            {posts.map((post) => (
              <button key={post._id} className="post-thumb-button" type="button" onClick={() => setActivePostId(post._id)}>
                <img src={resolveApiAssetUrl(post.media[0].url)} alt={post.caption || 'Post'} />
              </button>
            ))}
            {!posts.length ? <p className="subtle-text">No posts yet.</p> : null}
          </div>
        </article>
      </section>

      {activePostId ? (
        <PostModal
          postId={activePostId}
          currentUserId={currentUser.id}
          onClose={() => setActivePostId(null)}
          onUpdated={(updatedPost) => setPosts((current) => current.map((post) => (post._id === updatedPost._id ? updatedPost : post)))}
          onDeleted={(postId) => setPosts((current) => current.filter((post) => post._id !== postId))}
        />
      ) : null}

      {listModal ? (
        <UserListModal title={listModal.title} users={listModal.users} onClose={() => setListModal(null)} />
      ) : null}
    </>
  );
}

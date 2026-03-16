import { useEffect, useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { PostModal } from '../components/PostModal.jsx';
import { UserListModal } from '../components/UserListModal.jsx';
import { api, resolveApiAssetUrl } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export function ProfilePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activePostId, setActivePostId] = useState(null);
  const [listModal, setListModal] = useState(null);

  useEffect(() => {
    async function load() {
      const [postsPayload, followersPayload, followingPayload] = await Promise.all([
        api.getUserPosts(user.id),
        api.getFollowers(user.id),
        api.getFollowing(user.id)
      ]);
      setPosts(postsPayload.data.posts);
      setFollowers(followersPayload.data.followers);
      setFollowing(followingPayload.data.following);
    }

    load();
  }, [user.id]);

  function handleUpdatedPost(updatedPost) {
    setPosts((current) => current.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  }

  function handleDeletedPost(postId) {
    setPosts((current) => current.filter((post) => post._id !== postId));
  }

  return (
    <>
      <section className="stack">
        <article className="panel profile-summary">
          <div className="panel-head">
            <div className="profile-hero">
              <Avatar user={user} size="xlarge" />
              <div>
              <p className="eyebrow">Your stats</p>
              <h3>{user.name}</h3>
              <p className="handle">@{user.username}</p>
              </div>
            </div>
          </div>
          <div className="stats-row">
            <div>
              <strong>{user.postsCount}</strong>
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
          <p>{user.bio || 'Add a short bio to tell people who you are.'}</p>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Recent posts</p>
              <h3>Your uploads</h3>
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
          currentUserId={user.id}
          onClose={() => setActivePostId(null)}
          onUpdated={handleUpdatedPost}
          onDeleted={handleDeletedPost}
        />
      ) : null}
      {listModal ? <UserListModal title={listModal.title} users={listModal.users} onClose={() => setListModal(null)} /> : null}
    </>
  );
}

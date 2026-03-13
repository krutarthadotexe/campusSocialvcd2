import { useEffect, useState } from 'react';
import { PostCard } from '../components/PostCard.jsx';
import { StoryRail } from '../components/StoryRail.jsx';
import { StoryViewerModal } from '../components/StoryViewerModal.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [storyGroups, setStoryGroups] = useState([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadFeed() {
    setLoading(true);
    setError('');

    try {
      const [feedPayload, storyPayload] = await Promise.all([api.feed(), api.getStoryFeed()]);
      setPosts(feedPayload.data.posts);
      setStoryGroups(storyPayload.data.storyGroups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeed();
  }, []);

  async function handleCreateStory(file, caption) {
    const formData = new FormData();
    formData.append('storyMedia', file);
    formData.append('caption', caption);
    await api.createStory(formData);
    await loadFeed();
  }

  function handleStorySeen(ownerId) {
    setStoryGroups((current) =>
      current.map((group) =>
        String(group.owner._id || group.owner.id) === String(ownerId) ? { ...group, hasUnseen: false } : group
      )
    );
  }

  const ownStoryGroup = storyGroups.find((group) => String(group.owner._id || group.owner.id) === String(user.id)) || null;
  const otherStoryGroups = storyGroups.filter((group) => String(group.owner._id || group.owner.id) !== String(user.id));

  return (
    <>
      <section className="stack">
        <StoryRail
          currentUser={user}
          ownStoryGroup={ownStoryGroup}
          storyGroups={otherStoryGroups}
          onOpenStory={(group) => group.stories?.length && setActiveStoryGroup(group)}
          onCreateStory={handleCreateStory}
        />

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Feed</p>
              <h3>Latest posts from you and people you follow</h3>
            </div>
            <button className="ghost-button" type="button" onClick={loadFeed}>
              Refresh
            </button>
          </div>

          {loading ? <p className="subtle-text">Loading feed...</p> : null}
          {error ? <p className="error-banner">{error}</p> : null}
          {!loading && !posts.length ? <p className="subtle-text">No posts yet. Follow someone or publish your first post.</p> : null}
        </div>

        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </section>

      {activeStoryGroup ? (
        <StoryViewerModal
          storyGroup={activeStoryGroup}
          currentUser={user}
          onClose={() => setActiveStoryGroup(null)}
          onSeen={handleStorySeen}
        />
      ) : null}
    </>
  );
}

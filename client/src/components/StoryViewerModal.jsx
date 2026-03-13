import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar.jsx';
import { api } from '../lib/api.js';

export function StoryViewerModal({ storyGroup, currentUser, onClose, onSeen }) {
  const STORY_DURATION_MS = 10000;
  const [index, setIndex] = useState(0);
  const [viewers, setViewers] = useState([]);
  const [error, setError] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedElapsedRef = useRef(0);

  const story = storyGroup.stories[index];
  const isOwner = String(storyGroup.owner._id || storyGroup.owner.id) === String(currentUser.id);

  function goNext() {
    setIndex((current) => {
      if (current >= storyGroup.stories.length - 1) {
        onClose();
        return current;
      }
      return current + 1;
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function markSeen() {
      if (!story) {
        return;
      }
      try {
        await api.viewStory(story._id);
        onSeen(storyGroup.owner._id || storyGroup.owner.id);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    markSeen();
    return () => {
      cancelled = true;
    };
  }, [story?._id]);

  useEffect(() => {
    setProgress(0);
    pausedElapsedRef.current = 0;
    startTimeRef.current = null;
  }, [story?._id]);

  useEffect(() => {
    if (!story || isPaused) {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      return undefined;
    }

    const initialElapsed = pausedElapsedRef.current;

    function tick(timestamp) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - initialElapsed;
      }

      const elapsed = timestamp - startTimeRef.current;
      const nextProgress = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(nextProgress);

      if (elapsed >= STORY_DURATION_MS) {
        pausedElapsedRef.current = 0;
        startTimeRef.current = null;
        goNext();
        return;
      }

      frameRef.current = window.requestAnimationFrame(tick);
    }

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (startTimeRef.current !== null) {
        pausedElapsedRef.current = Math.min(performance.now() - startTimeRef.current, STORY_DURATION_MS);
      }
      startTimeRef.current = null;
    };
  }, [story?._id, isPaused, index]);

  useEffect(() => {
    let cancelled = false;

    async function loadViewers() {
      if (!isOwner || !story) {
        setViewers([]);
        return;
      }
      try {
        const payload = await api.getStoryViewers(story._id);
        if (!cancelled) {
          setViewers(payload.data.viewers);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    loadViewers();
    return () => {
      cancelled = true;
    };
  }, [isOwner, story?._id]);

  if (!story) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card story-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>
          Close
        </button>

        <div className="story-progress-row">
          {storyGroup.stories.map((entry, storyIndex) => (
            <span
              key={entry._id}
              className={`story-progress-segment ${storyIndex < index ? 'done' : ''} ${storyIndex === index ? 'active' : ''}`}
            >
              <span
                className="story-progress-fill"
                style={{
                  width: storyIndex < index ? '100%' : storyIndex === index ? `${progress}%` : '0%'
                }}
              />
            </span>
          ))}
        </div>

        <div className="story-header">
          <div className="post-user">
            <Avatar user={storyGroup.owner} size="small" />
            <div>
              <strong>{storyGroup.owner.name}</strong>
              <p className="handle">@{storyGroup.owner.username}</p>
            </div>
          </div>
          <span className="subtle-text">{new Date(story.createdAt).toLocaleString()}</span>
        </div>

        <div
          className="media-frame"
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
          onPointerLeave={() => setIsPaused(false)}
          onPointerCancel={() => setIsPaused(false)}
        >
          {story.media.resourceType === 'video' ? (
            <video controls autoPlay src={story.media.url} />
          ) : (
            <img src={story.media.url} alt={story.caption || 'Story'} />
          )}
        </div>

        {story.caption ? <p>{story.caption}</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}

        <div className="post-actions">
          <button className="ghost-button" type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>
            Previous
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setIndex((current) => Math.min(storyGroup.stories.length - 1, current + 1))}
            disabled={index === storyGroup.stories.length - 1}
          >
            Next
          </button>
        </div>

        {isOwner ? (
          <div className="stack">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Viewers</p>
                <h3>{viewers.length} seen</h3>
              </div>
            </div>
            {viewers.map((viewer) => (
              <div className="conversation-row" key={viewer.user._id}>
                <Avatar user={viewer.user} size="small" />
                <div className="conversation-copy">
                  <strong>{viewer.user.name}</strong>
                  <span className="handle">@{viewer.user.username}</span>
                  <span className="subtle-text">{new Date(viewer.viewedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {!viewers.length ? <p className="subtle-text">No viewers yet.</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

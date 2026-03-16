import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { resolveApiAssetUrl } from '../lib/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Avatar } from './Avatar.jsx';
import { SharePostModal } from './SharePostModal.jsx';

export function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [liked, setLiked] = useState(Boolean(post.likedByMe));
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLiked(Boolean(post.likedByMe));
    setLikesCount(post.likesCount);
  }, [post._id, post.likedByMe, post.likesCount]);

  async function toggleLike() {
    setError('');
    try {
      if (liked) {
        await api.unlikePost(post._id);
        setLiked(false);
        setLikesCount((count) => Math.max(0, count - 1));
      } else {
        await api.likePost(post._id);
        setLiked(true);
        setLikesCount((count) => count + 1);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadComments() {
    setError('');
    try {
      const payload = await api.getComments(post._id);
      setComments(payload.data.comments);
      setShowComments((value) => !value);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!commentBody.trim()) {
      return;
    }

    setError('');
    try {
      const payload = await api.createComment(post._id, { body: commentBody.trim() });
      setComments((current) => [payload.data.comment, ...current]);
      setShowComments(true);
      setCommentBody('');
    } catch (err) {
      setError(err.message);
    }
  }

  const primaryMedia = post.media[0];
  const aspectRatio = post.aspectRatio || '1:1';
  const isOwner = String(post.owner?.id || post.owner?._id) === String(user.id);

  async function handleDeletePost() {
    setDeleting(true);
    setError('');
    try {
      await api.deletePostItem(post._id);
      onDeleted?.(post._id);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <article className="panel post-card">
      <div className="post-head">
        <div className="post-user">
          <Avatar user={post.owner} size="small" />
          <div>
          <strong>{post.owner?.name || 'Unknown'}</strong>
          <p className="handle">@{post.owner?.username || 'unknown'}</p>
          </div>
        </div>
        <div className="post-head-actions">
          <span className="post-time">{new Date(post.createdAt).toLocaleString()}</span>
          {isOwner ? (
            <button className="ghost-button danger-button" type="button" onClick={handleDeletePost} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete post'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="media-frame" style={{ '--post-aspect-ratio': aspectRatio }}>
        {primaryMedia.resourceType === 'video' ? (
          <video controls src={resolveApiAssetUrl(primaryMedia.url)} />
        ) : (
          <img src={resolveApiAssetUrl(primaryMedia.url)} alt={post.caption || 'Post media'} />
        )}
      </div>

      <p className="post-caption">{post.caption}</p>
      {post.locationText ? <p className="subtle-text">{post.locationText}</p> : null}

      <div className="post-actions">
        <button className={`heart-button ${liked ? 'liked' : ''}`} type="button" onClick={toggleLike} aria-label="Like post">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21.35 10.55 20C5.4 15.24 2 12.09 2 8.25 2 5.42 4.24 3.2 7.05 3.2c1.59 0 3.11.74 4.05 1.92.94-1.18 2.46-1.92 4.05-1.92 2.81 0 5.05 2.22 5.05 5.05 0 3.84-3.4 6.99-8.55 11.76L12 21.35Z" />
          </svg>
          <span>{likesCount}</span>
        </button>
        <button className="ghost-button" type="button" onClick={loadComments}>
          {showComments ? 'Hide comments' : 'Show comments'} · {post.commentsCount}
        </button>
        <button className="ghost-button" type="button" onClick={() => setSharing(true)}>
          Share
        </button>
      </div>

      <form className="comment-form" onSubmit={submitComment}>
        <input
          value={commentBody}
          onChange={(event) => setCommentBody(event.target.value)}
          placeholder="Add a comment"
        />
        <button className="primary-button compact" type="submit">
          Send
        </button>
      </form>

      {showComments ? (
        <div className="comment-list">
          {comments.length ? (
            comments.map((comment) => (
              <div className="comment-item" key={comment._id}>
                <div className="comment-user">
                  <Avatar user={comment.author} size="tiny" />
                  <strong>{comment.author?.username || 'user'}</strong>
                </div>
                <span>{comment.body}</span>
              </div>
            ))
          ) : (
            <p className="subtle-text">No comments yet.</p>
          )}
        </div>
      ) : null}

      {error ? <p className="error-banner">{error}</p> : null}

      {sharing ? <SharePostModal post={post} onClose={() => setSharing(false)} /> : null}
    </article>
  );
}

import { useRef, useState } from 'react';
import { Avatar } from './Avatar.jsx';

export function StoryRail({ currentUser, ownStoryGroup, storyGroups, onOpenStory, onCreateStory }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError('');
    try {
      const caption = window.prompt('Add a caption for your story (optional):', '') || '';
      await onCreateStory(file, caption);
      event.target.value = '';
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Stories</p>
          <h3>24-hour moments from your circle</h3>
        </div>
      </div>
      <input ref={inputRef} hidden type="file" accept="image/*,video/*" onChange={handleFileChange} />
      {error ? <p className="error-banner">{error}</p> : null}

      <div className="story-row">
        <button
          className="story-bubble-button"
          type="button"
          onClick={() => (ownStoryGroup ? onOpenStory(ownStoryGroup) : inputRef.current?.click())}
        >
          <div className="story-ring own own-story-ring">
            <Avatar user={currentUser} size="medium" />
            <span
              className="story-add-icon"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                inputRef.current?.click();
              }}
            >
              +
            </span>
          </div>
          <span>{ownStoryGroup ? 'Your story' : 'Add story'}</span>
        </button>

        {storyGroups.map((group) => (
          <button key={group.owner._id} className="story-bubble-button" type="button" onClick={() => onOpenStory(group)}>
            <div className={`story-ring ${group.hasUnseen ? 'unseen' : 'seen'}`}>
              <Avatar user={group.owner} size="medium" />
            </div>
            <span>@{group.owner.username}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

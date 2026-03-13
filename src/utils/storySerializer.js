import { serializeUser } from './userSerializer.js';

export function serializeStory(story, currentUserId) {
  const plain = story.toObject ? story.toObject() : story;

  return {
    ...plain,
    owner: plain.owner?.username ? serializeUser(plain.owner) : plain.owner,
    media: {
      filename: plain.media.filename,
      contentType: plain.media.contentType,
      sizeBytes: plain.media.sizeBytes,
      resourceType: plain.media.resourceType,
      url: `/api/v1/stories/${plain._id}/media`
    },
    seen: plain.viewers?.some((viewer) => String(viewer.user?._id || viewer.user) === String(currentUserId)) || false
  };
}

export function serializeStoryGroup({ owner, stories, currentUserId }) {
  const serializedStories = stories.map((story) => serializeStory(story, currentUserId));
  const hasUnseen = String(owner._id || owner.id) === String(currentUserId)
    ? false
    : serializedStories.some((story) => !story.seen);

  return {
    owner: owner.username ? serializeUser(owner) : owner,
    stories: serializedStories,
    hasUnseen,
    latestStoryAt: serializedStories[0]?.createdAt || null
  };
}

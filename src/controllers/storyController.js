import { HTTP_STATUS } from '../constants/http.js';
import { Follow } from '../models/Follow.js';
import { Story } from '../models/Story.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { serializeStory, serializeStoryGroup } from '../utils/storySerializer.js';

function activeStoryFilter() {
  return { expiresAt: { $gt: new Date() } };
}

export const createStory = asyncHandler(async (req, res) => {
  const file = req.file;
  const story = await Story.create({
    owner: req.user.id,
    caption: req.validated.body.caption || '',
    media: {
      filename: file.originalname,
      contentType: file.mimetype,
      sizeBytes: file.size,
      data: file.buffer,
      resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image'
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await story.populate('owner', 'username name avatar');
  return sendSuccess(res, HTTP_STATUS.CREATED, { story: serializeStory(story, req.user.id) });
});

export const getStoryFeed = asyncHandler(async (req, res) => {
  const follows = await Follow.find({ follower: req.user.id, status: 'accepted' }).select('following');
  const ownerIds = [req.user.id, ...follows.map((entry) => entry.following)];
  const stories = await Story.find({
    ...activeStoryFilter(),
    owner: { $in: ownerIds }
  })
    .sort({ createdAt: -1 })
    .populate('owner', 'username name avatar')
    .populate('viewers.user', 'username name avatar');

  const grouped = new Map();
  for (const story of stories) {
    const ownerId = String(story.owner._id);
    if (!grouped.has(ownerId)) {
      grouped.set(ownerId, { owner: story.owner, stories: [] });
    }
    grouped.get(ownerId).stories.push(story);
  }

  const storyGroups = Array.from(grouped.values()).map((group) =>
    serializeStoryGroup({ ...group, currentUserId: req.user.id })
  );

  return sendSuccess(res, HTTP_STATUS.OK, { storyGroups });
});

export const getStoryMedia = asyncHandler(async (req, res) => {
  const story = await Story.findOne({ _id: req.params.storyId, ...activeStoryFilter() }).select('media');
  if (!story) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Story not found');
  }

  res.setHeader('Content-Type', story.media.contentType);
  res.setHeader('Content-Length', story.media.sizeBytes);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(story.media.data);
});

export const markStoryViewed = asyncHandler(async (req, res) => {
  const story = await Story.findOne({ _id: req.validated.params.storyId, ...activeStoryFilter() })
    .populate('owner', 'username name avatar')
    .populate('viewers.user', 'username name avatar');
  if (!story) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Story not found');
  }

  const hasViewed = story.viewers.some((viewer) => String(viewer.user?._id || viewer.user) === String(req.user.id));
  if (!hasViewed && String(story.owner._id || story.owner) !== String(req.user.id)) {
    story.viewers.push({ user: req.user.id, viewedAt: new Date() });
    await story.save();
    await story.populate('viewers.user', 'username name avatar');
  }

  return sendSuccess(res, HTTP_STATUS.OK, { story: serializeStory(story, req.user.id) });
});

export const getStoryViewers = asyncHandler(async (req, res) => {
  const story = await Story.findOne({ _id: req.validated.params.storyId, ...activeStoryFilter() })
    .populate('owner', 'username name avatar')
    .populate('viewers.user', 'username name avatar');
  if (!story) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Story not found');
  }
  if (String(story.owner._id || story.owner) !== String(req.user.id)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to view story viewers');
  }

  return sendSuccess(res, HTTP_STATUS.OK, {
    viewers: story.viewers.map((viewer) => ({
      user: viewer.user,
      viewedAt: viewer.viewedAt
    }))
  });
});

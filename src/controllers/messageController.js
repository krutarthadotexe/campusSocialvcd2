import { HTTP_STATUS } from '../constants/http.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { serializeConversation, serializeConversations, serializeMessage, serializeMessages } from '../utils/messageSerializer.js';

function buildParticipantsKey(userA, userB) {
  return [String(userA), String(userB)].sort().join(':');
}

function ensureParticipant(conversation, userId) {
  if (!conversation.participants.some((participant) => String(participant._id || participant) === String(userId))) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You do not have access to this conversation');
  }
}

export const getOrCreateDirectConversation = asyncHandler(async (req, res) => {
  const targetUserId = req.validated.params.userId;
  if (String(targetUserId) === String(req.user.id)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'You cannot message yourself');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  const participantsKey = buildParticipantsKey(req.user.id, targetUserId);
  let conversation = await Conversation.findOne({ participantsKey }).populate('participants', 'username name avatar');

  if (!conversation) {
    conversation = await Conversation.findOneAndUpdate(
      { participantsKey },
      {
        $setOnInsert: {
          participants: [req.user.id, targetUserId],
          participantsKey,
          lastMessageAt: new Date()
        }
      },
      {
        new: true,
        upsert: true
      }
    ).populate('participants', 'username name avatar');
  }

  return sendSuccess(res, HTTP_STATUS.OK, {
    conversation: serializeConversation(conversation, req.user.id)
  });
});

export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user.id })
    .sort({ lastMessageAt: -1, _id: -1 })
    .populate('participants', 'username name avatar');

  const deduped = [];
  const seenKeys = new Set();
  for (const conversation of conversations) {
    if (seenKeys.has(conversation.participantsKey)) {
      continue;
    }
    seenKeys.add(conversation.participantsKey);
    deduped.push(conversation);
  }

  return sendSuccess(res, HTTP_STATUS.OK, {
    conversations: serializeConversations(deduped, req.user.id)
  });
});

export const listMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.validated.params.conversationId).populate('participants', 'username name avatar');
  if (!conversation) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Conversation not found');
  }
  ensureParticipant(conversation, req.user.id);

  const messages = await Message.find({ conversation: conversation.id })
    .sort({ createdAt: 1, _id: 1 })
    .limit(req.validated.query.limit)
    .populate('sender', 'username name avatar')
    .populate({
      path: 'sharedPost',
      populate: {
        path: 'owner',
        select: 'username name avatar'
      }
    });

  return sendSuccess(res, HTTP_STATUS.OK, {
    conversation: serializeConversation(conversation, req.user.id),
    messages: serializeMessages(messages)
  });
});

export const createMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.validated.params.conversationId).populate('participants', 'username name avatar');
  if (!conversation) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Conversation not found');
  }
  ensureParticipant(conversation, req.user.id);

  let sharedPost = null;
  if (req.validated.body.sharedPostId) {
    sharedPost = await Post.findById(req.validated.body.sharedPostId);
    if (!sharedPost) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Post not found');
    }
  }

  const message = await Message.create({
    conversation: conversation.id,
    sender: req.user.id,
    body: req.validated.body.body.trim(),
    sharedPost: sharedPost?.id || null,
    readBy: [req.user.id]
  });

  const nextLastMessageText = sharedPost
    ? `Shared a post${message.body ? `: ${message.body}` : ''}`
    : message.body;
  await Conversation.findByIdAndUpdate(conversation.id, {
    $set: {
      lastMessageText: nextLastMessageText,
      lastMessageAt: message.createdAt
    }
  });
  await message.populate('sender', 'username name avatar');
  await message.populate({
    path: 'sharedPost',
    populate: {
      path: 'owner',
      select: 'username name avatar'
    }
  });
  const updatedConversation = await Conversation.findById(conversation.id).populate('participants', 'username name avatar');

  return sendSuccess(res, HTTP_STATUS.CREATED, {
    message: serializeMessage(message),
    conversation: serializeConversation(updatedConversation || conversation, req.user.id)
  });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { conversationId, messageId } = req.validated.params;
  const conversation = await Conversation.findById(conversationId).populate('participants', 'username name avatar');
  if (!conversation) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Conversation not found');
  }
  ensureParticipant(conversation, req.user.id);

  const message = await Message.findOne({ _id: messageId, conversation: conversation.id }).populate('sender', 'username name avatar');
  if (!message) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Message not found');
  }
  if (String(message.sender?._id || message.sender) !== String(req.user.id)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You can only delete your own messages');
  }

  await Message.deleteOne({ _id: message.id });

  const latestMessage = await Message.findOne({ conversation: conversation.id }).sort({ createdAt: -1, _id: -1 });
  const nextLastMessageText = latestMessage?.sharedPost
    ? `Shared a post${latestMessage.body ? `: ${latestMessage.body}` : ''}`
    : latestMessage?.body || '';
  const nextLastMessageAt = latestMessage?.createdAt || conversation.updatedAt;
  await Conversation.findByIdAndUpdate(conversation.id, {
    $set: {
      lastMessageText: nextLastMessageText,
      lastMessageAt: nextLastMessageAt
    }
  });
  const updatedConversation = await Conversation.findById(conversation.id).populate('participants', 'username name avatar');

  return sendSuccess(res, HTTP_STATUS.OK, {
    message: 'Message deleted successfully',
    conversation: serializeConversation(updatedConversation || conversation, req.user.id)
  });
});

export const markConversationRead = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.validated.params.conversationId);
  if (!conversation) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Conversation not found');
  }
  ensureParticipant(conversation, req.user.id);

  await Message.updateMany(
    { conversation: conversation.id, readBy: { $ne: req.user.id } },
    { $addToSet: { readBy: req.user.id } }
  );

  return sendSuccess(res, HTTP_STATUS.OK, { message: 'Conversation marked as read' });
});

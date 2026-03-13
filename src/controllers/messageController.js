import { HTTP_STATUS } from '../constants/http.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { serializeConversation, serializeConversations, serializeMessage, serializeMessages } from '../utils/messageSerializer.js';

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

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user.id, targetUserId], $size: 2 }
  }).populate('participants', 'username name avatar');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, targetUserId],
      lastMessageAt: new Date()
    });
    await conversation.populate('participants', 'username name avatar');
  }

  return sendSuccess(res, HTTP_STATUS.OK, {
    conversation: serializeConversation(conversation, req.user.id)
  });
});

export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user.id })
    .sort({ lastMessageAt: -1, _id: -1 })
    .populate('participants', 'username name avatar');

  return sendSuccess(res, HTTP_STATUS.OK, {
    conversations: serializeConversations(conversations, req.user.id)
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
    .populate('sender', 'username name avatar');

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

  const message = await Message.create({
    conversation: conversation.id,
    sender: req.user.id,
    body: req.validated.body.body,
    readBy: [req.user.id]
  });

  conversation.lastMessageText = message.body;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();
  await message.populate('sender', 'username name avatar');

  return sendSuccess(res, HTTP_STATUS.CREATED, {
    message: serializeMessage(message),
    conversation: serializeConversation(conversation, req.user.id)
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

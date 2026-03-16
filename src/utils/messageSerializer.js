import { serializeUser } from './userSerializer.js';
import { serializePost } from './postSerializer.js';

export function serializeConversation(conversation, currentUserId) {
  const plain = conversation.toObject ? conversation.toObject() : conversation;
  const otherParticipant = (plain.participants || []).find((participant) => String(participant._id || participant.id || participant) !== String(currentUserId));

  return {
    ...plain,
    otherParticipant: otherParticipant?.username ? serializeUser(otherParticipant) : otherParticipant
  };
}

export function serializeConversations(conversations, currentUserId) {
  return conversations.map((conversation) => serializeConversation(conversation, currentUserId));
}

export function serializeMessage(message) {
  const plain = message.toObject ? message.toObject() : message;

  return {
    ...plain,
    sender: plain.sender?.username ? serializeUser(plain.sender) : plain.sender,
    sharedPost: plain.sharedPost?.media ? serializePost(plain.sharedPost) : plain.sharedPost
  };
}

export function serializeMessages(messages) {
  return messages.map(serializeMessage);
}

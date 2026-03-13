import { serializeUser } from './userSerializer.js';

export function serializeComment(comment) {
  const plain = comment.toObject ? comment.toObject() : comment;

  return {
    ...plain,
    author: plain.author?.username ? serializeUser(plain.author) : plain.author
  };
}

export function serializeComments(comments) {
  return comments.map(serializeComment);
}

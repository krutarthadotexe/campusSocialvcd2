import { serializeUser } from './userSerializer.js';

export function serializePost(post) {
  const plain = post.toObject ? post.toObject() : post;

  return {
    ...plain,
    owner: plain.owner?.username ? serializeUser(plain.owner) : plain.owner,
    media: plain.media.map((item, index) => ({
      filename: item.filename,
      resourceType: item.resourceType,
      contentType: item.contentType,
      sizeBytes: item.sizeBytes,
      duration: item.duration,
      format: item.format,
      url: `/api/v1/posts/${plain._id}/media/${index}`
    }))
  };
}

export function serializePosts(posts) {
  return posts.map(serializePost);
}

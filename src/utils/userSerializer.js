export function serializeUser(user) {
  const plain = user.toObject ? user.toObject() : user;

  return {
    ...plain,
    id: plain.id || String(plain._id),
    role: plain.role,
    avatar: plain.avatar?.data
      ? {
          filename: plain.avatar.filename,
          contentType: plain.avatar.contentType,
          sizeBytes: plain.avatar.sizeBytes,
          url: `/api/v1/users/${plain._id}/avatar`
        }
      : null
  };
}

export function serializeUsers(users) {
  return users.map(serializeUser);
}

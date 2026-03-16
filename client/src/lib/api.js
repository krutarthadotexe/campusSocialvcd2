const configuredApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();

function normalizeApiBase(value) {
  if (!value) {
    return '/api/v1';
  }

  const trimmed = value.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

const API_BASE = normalizeApiBase(configuredApiBase);

function getApiOrigin() {
  if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
    return new URL(API_BASE).origin;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export function resolveApiAssetUrl(path) {
  if (!path) {
    return path;
  }

  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  const origin = getApiOrigin();
  return origin ? new URL(path, origin).toString() : path;
}

let accessToken = localStorage.getItem('accessToken');

function setAccessToken(token) {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

async function request(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (response.status === 401 && retry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request(path, options, false);
    }
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Request failed');
  }

  return payload;
}

export async function refreshSession() {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    const payload = await response.json();
    if (!response.ok) {
      setAccessToken(null);
      return false;
    }

    setAccessToken(payload.data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export const api = {
  setAccessToken,
  getAccessToken: () => accessToken,
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getAdminUsers: () => request('/admin/users'),
  updateUserRole: (userId, role) => request(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  me: () => request('/auth/me'),
  getEvents: () => request('/events'),
  createEvent: (body) => request('/events', { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  updateEvent: (eventId, body) =>
    request(`/events/${eventId}`, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }),
  deleteEvent: (eventId) => request(`/events/${eventId}`, { method: 'DELETE' }),
  updateEventRsvp: (eventId, status) => request(`/events/${eventId}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),
  feed: (cursor) => request(`/posts/feed${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),
  discoverPosts: (cursor) => request(`/posts/discover${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),
  getStoryFeed: () => request('/stories/feed'),
  createStory: (body) => request('/stories', { method: 'POST', body }),
  viewStory: (storyId) => request(`/stories/${storyId}/view`, { method: 'POST' }),
  getStoryViewers: (storyId) => request(`/stories/${storyId}/viewers`),
  createPost: (body) => request('/posts', { method: 'POST', body }),
  getNotifications: () => request('/notifications'),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),
  searchUsers: (query) => request(`/users/search?q=${encodeURIComponent(query)}`),
  getProfile: (username) => request(`/users/${encodeURIComponent(username)}`),
  updateProfile: (body) => request('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  updateAvatar: (body) => request('/users/me/avatar', { method: 'PUT', body }),
  followUser: (userId) => request(`/users/${userId}/follow`, { method: 'POST' }),
  unfollowUser: (userId) => request(`/users/${userId}/follow`, { method: 'DELETE' }),
  getFollowers: (userId) => request(`/users/${userId}/followers`),
  getFollowing: (userId) => request(`/users/${userId}/following`),
  getUserPosts: (userId) => request(`/posts/user/${userId}`),
  getConversations: () => request('/messages/conversations'),
  getDirectConversation: (userId) => request(`/messages/conversations/direct/${userId}`, { method: 'POST' }),
  getMessages: (conversationId) => request(`/messages/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, body) =>
    request(`/messages/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  deleteMessage: (conversationId, messageId) => request(`/messages/conversations/${conversationId}/messages/${messageId}`, { method: 'DELETE' }),
  markConversationRead: (conversationId) => request(`/messages/conversations/${conversationId}/read`, { method: 'POST' }),
  getPost: (postId) => request(`/posts/${postId}`),
  updatePostDetails: (postId, body) => request(`/posts/${postId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePostItem: (postId) => request(`/posts/${postId}`, { method: 'DELETE' }),
  likePost: (postId) => request(`/posts/${postId}/like`, { method: 'POST' }),
  unlikePost: (postId) => request(`/posts/${postId}/like`, { method: 'DELETE' }),
  getComments: (postId) => request(`/posts/${postId}/comments`),
  createComment: (postId, body) => request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(body) })
};

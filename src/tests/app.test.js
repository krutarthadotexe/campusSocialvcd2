import request from 'supertest';

const defaultEnv = {
  NODE_ENV: 'test',
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  TEACHER_ROLE_PASSWORD: 'Teacher123',
  REFRESH_COOKIE_NAME: 'refreshToken',
  CORS_ORIGIN: 'http://localhost:3000'
};

async function loadApp() {
  Object.assign(process.env, defaultEnv);
  const { connectDatabase, disconnectDatabase } = await import('../config/db.js');
  const { createApp } = await import('../app.js');
  await connectDatabase(process.env.MONGO_URI);
  return { app: createApp(), disconnectDatabase };
}

describe('API integration', () => {
  let app;
  let disconnectDatabase;
  let helperModule;

  beforeAll(async () => {
    helperModule = await import('./helpers.js');
    await helperModule.setupTestDatabase();
    ({ app, disconnectDatabase } = await loadApp());
  });

  beforeEach(async () => {
    await helperModule.clearDatabase();
  });

  afterAll(async () => {
    if (disconnectDatabase) {
      await disconnectDatabase();
    }
    await helperModule.teardownTestDatabase();
  });

  it('supports register, login, refresh, logout, and current user flow', async () => {
    const agent = request.agent(app);
    const registerResponse = await agent.post('/api/v1/auth/register').send({
      email: 'user1@example.com',
      username: 'user1',
      password: 'Password123',
      name: 'User One'
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.accessToken).toBeTruthy();

    const meResponse = await agent
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registerResponse.body.data.accessToken}`);
    expect(meResponse.status).toBe(200);

    const refreshResponse = await agent.post('/api/v1/auth/refresh');
    expect(refreshResponse.status).toBe(200);

    const logoutResponse = await agent
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${refreshResponse.body.data.accessToken}`);
    expect(logoutResponse.status).toBe(200);
  });

  it('allows teacher signup only with the teacher role password', async () => {
    const validTeacher = await request(app).post('/api/v1/auth/register').send({
      email: 'teacher-signup@example.com',
      username: 'teacher_signup',
      password: 'Password123',
      name: 'Teacher Signup',
      role: 'teacher',
      rolePassword: 'Teacher123'
    });
    expect(validTeacher.status).toBe(201);
    expect(validTeacher.body.data.user.role).toBe('teacher');

    const invalidTeacher = await request(app).post('/api/v1/auth/register').send({
      email: 'teacher-fail@example.com',
      username: 'teacher_fail',
      password: 'Password123',
      name: 'Teacher Fail',
      role: 'teacher',
      rolePassword: 'WrongPassword'
    });
    expect(invalidTeacher.status).toBe(403);
  });

  it('prevents duplicate follow and surfaces feed posts from followed users', async () => {
    const owner = await helperModule.createAuthenticatedAgent(app, {
      email: 'owner@example.com',
      username: 'owner',
      password: 'Password123',
      name: 'Owner'
    });
    const viewer = await helperModule.createAuthenticatedAgent(app, {
      email: 'viewer@example.com',
      username: 'viewer',
      password: 'Password123',
      name: 'Viewer'
    });

    const postResponse = await owner.agent
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('caption', 'hello')
      .field('aspectRatio', '4:5')
      .attach('media', Buffer.from('fake-image-data'), { filename: 'sample.jpg', contentType: 'image/jpeg' });
    expect(postResponse.status).toBe(201);
    expect(postResponse.body.data.post.media[0].url).toMatch(/^\/api\/v1\/posts\//);
    expect(postResponse.body.data.post.aspectRatio).toBe('4:5');

    const followResponse = await viewer.agent
      .post(`/api/v1/users/${owner.user.id}/follow`)
      .set('Authorization', `Bearer ${viewer.accessToken}`);
    expect(followResponse.status).toBe(201);

    const duplicateFollow = await viewer.agent
      .post(`/api/v1/users/${owner.user.id}/follow`)
      .set('Authorization', `Bearer ${viewer.accessToken}`);
    expect(duplicateFollow.status).toBe(200);

    const feedResponse = await viewer.agent
      .get('/api/v1/posts/feed')
      .set('Authorization', `Bearer ${viewer.accessToken}`);
    expect(feedResponse.status).toBe(200);
    expect(feedResponse.body.data.posts).toHaveLength(1);
  });

  it('requires a media file on post creation', async () => {
    const user = await helperModule.createAuthenticatedAgent(app, {
      email: 'poster@example.com',
      username: 'poster',
      password: 'Password123',
      name: 'Poster'
    });

    const response = await user.agent
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .field('caption', 'missing media');

    expect(response.status).toBe(422);
  });

  it('supports comment, post like, and notifications flow', async () => {
    const author = await helperModule.createAuthenticatedAgent(app, {
      email: 'author@example.com',
      username: 'author',
      password: 'Password123',
      name: 'Author'
    });
    const fan = await helperModule.createAuthenticatedAgent(app, {
      email: 'fan@example.com',
      username: 'fan',
      password: 'Password123',
      name: 'Fan'
    });

    const postResponse = await author.agent
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${author.accessToken}`)
      .field('caption', 'new photo')
      .attach('media', Buffer.from('fake-image-data'), { filename: 'sample.jpg', contentType: 'image/jpeg' });

    const postId = postResponse.body.data.post._id;
    const mediaUrl = postResponse.body.data.post.media[0].url;

    const likeResponse = await fan.agent
      .post(`/api/v1/posts/${postId}/like`)
      .set('Authorization', `Bearer ${fan.accessToken}`);
    expect(likeResponse.status).toBe(201);

    const userPostsResponse = await fan.agent
      .get(`/api/v1/posts/user/${author.user.id}`)
      .set('Authorization', `Bearer ${fan.accessToken}`);
    expect(userPostsResponse.status).toBe(200);
    expect(userPostsResponse.body.data.posts[0].likedByMe).toBe(true);

    const postDetailResponse = await fan.agent
      .get(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${fan.accessToken}`);
    expect(postDetailResponse.status).toBe(200);
    expect(postDetailResponse.body.data.post.likedByMe).toBe(true);

    const commentResponse = await fan.agent
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${fan.accessToken}`)
      .send({ body: 'nice shot' });
    expect(commentResponse.status).toBe(201);

    const notificationsResponse = await author.agent
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${author.accessToken}`);
    expect(notificationsResponse.status).toBe(200);
    expect(notificationsResponse.body.data.notifications).toHaveLength(2);

    const markAllReadResponse = await author.agent
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${author.accessToken}`);
    expect(markAllReadResponse.status).toBe(200);

    const mediaResponse = await fan.agent
      .get(mediaUrl)
      .set('Authorization', `Bearer ${fan.accessToken}`);
    expect(mediaResponse.status).toBe(200);
    expect(mediaResponse.headers['content-type']).toContain('image/jpeg');
  });

  it('supports direct conversations and messages between users', async () => {
    const alice = await helperModule.createAuthenticatedAgent(app, {
      email: 'alice-dm@example.com',
      username: 'alice_dm',
      password: 'Password123',
      name: 'Alice DM'
    });
    const bob = await helperModule.createAuthenticatedAgent(app, {
      email: 'bob-dm@example.com',
      username: 'bob_dm',
      password: 'Password123',
      name: 'Bob DM'
    });

    const conversationResponse = await alice.agent
      .post(`/api/v1/messages/conversations/direct/${bob.user.id}`)
      .set('Authorization', `Bearer ${alice.accessToken}`);
    expect(conversationResponse.status).toBe(200);

    const conversationId = conversationResponse.body.data.conversation._id;

    const duplicateConversationResponse = await alice.agent
      .post(`/api/v1/messages/conversations/direct/${bob.user.id}`)
      .set('Authorization', `Bearer ${alice.accessToken}`);
    expect(duplicateConversationResponse.status).toBe(200);
    expect(duplicateConversationResponse.body.data.conversation._id).toBe(conversationId);

    const sendResponse = await alice.agent
      .post(`/api/v1/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ body: 'hello bob' });
    expect(sendResponse.status).toBe(201);

    const inboxResponse = await bob.agent
      .get('/api/v1/messages/conversations')
      .set('Authorization', `Bearer ${bob.accessToken}`);
    expect(inboxResponse.status).toBe(200);
    expect(inboxResponse.body.data.conversations).toHaveLength(1);

    const threadResponse = await bob.agent
      .get(`/api/v1/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${bob.accessToken}`);
    expect(threadResponse.status).toBe(200);
    expect(threadResponse.body.data.messages[0].body).toBe('hello bob');
  });

  it('supports 24-hour stories, viewing, and viewer lists', async () => {
    const owner = await helperModule.createAuthenticatedAgent(app, {
      email: 'story-owner@example.com',
      username: 'story_owner',
      password: 'Password123',
      name: 'Story Owner'
    });
    const viewer = await helperModule.createAuthenticatedAgent(app, {
      email: 'story-viewer@example.com',
      username: 'story_viewer',
      password: 'Password123',
      name: 'Story Viewer'
    });

    await viewer.agent
      .post(`/api/v1/users/${owner.user.id}/follow`)
      .set('Authorization', `Bearer ${viewer.accessToken}`);

    const createStoryResponse = await owner.agent
      .post('/api/v1/stories')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('caption', 'story time')
      .attach('storyMedia', Buffer.from('fake-story-data'), { filename: 'story.jpg', contentType: 'image/jpeg' });
    expect(createStoryResponse.status).toBe(201);

    const storyId = createStoryResponse.body.data.story._id;

    const feedResponse = await viewer.agent
      .get('/api/v1/stories/feed')
      .set('Authorization', `Bearer ${viewer.accessToken}`);
    expect(feedResponse.status).toBe(200);
    expect(feedResponse.body.data.storyGroups).toHaveLength(1);

    const viewResponse = await viewer.agent
      .post(`/api/v1/stories/${storyId}/view`)
      .set('Authorization', `Bearer ${viewer.accessToken}`);
    expect(viewResponse.status).toBe(200);

    const viewersResponse = await owner.agent
      .get(`/api/v1/stories/${storyId}/viewers`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(viewersResponse.status).toBe(200);
    expect(viewersResponse.body.data.viewers).toHaveLength(1);
  });

  it('allows only teachers to create events while everyone can view them', async () => {
    const admin = await helperModule.createAuthenticatedAgent(app, {
      email: 'admin@example.com',
      username: 'admin_user',
      password: 'Password123',
      name: 'Admin User'
    });
    const teacher = await helperModule.createAuthenticatedAgent(app, {
      email: 'teacher@example.com',
      username: 'teacher_user',
      password: 'Password123',
      name: 'Teacher User',
      role: 'teacher',
      rolePassword: 'Teacher123'
    });
    const student = await helperModule.createAuthenticatedAgent(app, {
      email: 'student@example.com',
      username: 'student_user',
      password: 'Password123',
      name: 'Student User'
    });

    const { User } = await import('../models/User.js');
    await User.findByIdAndUpdate(admin.user.id, { role: 'admin' });

    const forbiddenResponse = await student.agent
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({
        title: 'Student event',
        description: 'Should not be allowed',
        location: 'Campus Hall',
        startsAt: new Date('2026-04-01T10:00:00.000Z').toISOString(),
        endsAt: new Date('2026-04-01T12:00:00.000Z').toISOString()
      });
    expect(forbiddenResponse.status).toBe(403);

    const createResponse = await teacher.agent
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .field('title', 'Faculty meetup')
      .field('description', 'Campus-wide teacher-led event')
      .field('location', 'Main Auditorium')
      .field('startsAt', new Date('2026-04-01T10:00:00.000Z').toISOString())
      .field('endsAt', new Date('2026-04-01T12:00:00.000Z').toISOString())
      .attach('photos', Buffer.from('fake-event-photo'), { filename: 'event.jpg', contentType: 'image/jpeg' });
    expect(createResponse.status).toBe(201);
    const eventId = createResponse.body.data.event._id;
    expect(createResponse.body.data.event.photos).toHaveLength(1);

    const listResponse = await student.agent
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${student.accessToken}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.events).toHaveLength(1);
    expect(listResponse.body.data.events[0].createdBy.username).toBe('teacher_user');

    const eventPhotoResponse = await student.agent
      .get(createResponse.body.data.event.photos[0].url)
      .set('Authorization', `Bearer ${student.accessToken}`);
    expect(eventPhotoResponse.status).toBe(200);
    expect(eventPhotoResponse.headers['content-type']).toContain('image/jpeg');

    const rsvpResponse = await student.agent
      .post(`/api/v1/events/${eventId}/rsvp`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ status: 'going' });
    expect(rsvpResponse.status).toBe(200);
    expect(rsvpResponse.body.data.event.currentUserRsvp).toBe('going');
    expect(rsvpResponse.body.data.event.stats.goingCount).toBe(1);

    const editResponse = await teacher.agent
      .patch(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${teacher.accessToken}`)
      .send({ title: 'Faculty meetup updated' });
    expect(editResponse.status).toBe(200);
    expect(editResponse.body.data.event.title).toBe('Faculty meetup updated');

    const deleteResponse = await teacher.agent
      .delete(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${teacher.accessToken}`);
    expect(deleteResponse.status).toBe(200);
  });

  it('shows public posts in discover and hides private-account posts unless followed', async () => {
    const viewer = await helperModule.createAuthenticatedAgent(app, {
      email: 'discover-viewer@example.com',
      username: 'discover_viewer',
      password: 'Password123',
      name: 'Discover Viewer'
    });
    const publicUser = await helperModule.createAuthenticatedAgent(app, {
      email: 'public-poster@example.com',
      username: 'public_poster',
      password: 'Password123',
      name: 'Public Poster'
    });
    const privateUser = await helperModule.createAuthenticatedAgent(app, {
      email: 'private-poster@example.com',
      username: 'private_poster',
      password: 'Password123',
      name: 'Private Poster'
    });

    const { User } = await import('../models/User.js');
    await User.findByIdAndUpdate(privateUser.user.id, { isPrivate: true });

    const publicPostResponse = await publicUser.agent
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${publicUser.accessToken}`)
      .field('caption', 'public discover post')
      .attach('media', Buffer.from('public-post-data'), { filename: 'public.jpg', contentType: 'image/jpeg' });
    expect(publicPostResponse.status).toBe(201);

    const privatePostResponse = await privateUser.agent
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${privateUser.accessToken}`)
      .field('caption', 'private discover post')
      .attach('media', Buffer.from('private-post-data'), { filename: 'private.jpg', contentType: 'image/jpeg' });
    expect(privatePostResponse.status).toBe(201);

    const discoverBeforeFollow = await viewer.agent
      .get('/api/v1/posts/discover')
      .set('Authorization', `Bearer ${viewer.accessToken}`);
    expect(discoverBeforeFollow.status).toBe(200);
    expect(discoverBeforeFollow.body.data.posts.map((post) => post.caption)).toContain('public discover post');
    expect(discoverBeforeFollow.body.data.posts.map((post) => post.caption)).not.toContain('private discover post');

    await viewer.agent
      .post(`/api/v1/users/${privateUser.user.id}/follow`)
      .set('Authorization', `Bearer ${viewer.accessToken}`);

    const { Follow } = await import('../models/Follow.js');
    await Follow.findOneAndUpdate(
      { follower: viewer.user.id, following: privateUser.user.id },
      { status: 'accepted' }
    );

    const discoverAfterFollow = await viewer.agent
      .get('/api/v1/posts/discover')
      .set('Authorization', `Bearer ${viewer.accessToken}`);
    expect(discoverAfterFollow.status).toBe(200);
    expect(discoverAfterFollow.body.data.posts.map((post) => post.caption)).toContain('private discover post');
  });
});

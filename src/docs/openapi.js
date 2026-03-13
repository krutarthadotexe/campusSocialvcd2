export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Campus Social Media API',
    version: '1.0.0',
    description: 'Express.js REST API for an Instagram-style MVP'
  },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/auth/register': { post: { summary: 'Register a new user' } },
    '/auth/login': { post: { summary: 'Login a user' } },
    '/users/:username': { get: { summary: 'Fetch a user profile' } },
    '/posts': { post: { summary: 'Create a post' } },
    '/feed': { get: { summary: 'Fetch the home feed' } },
    '/notifications': { get: { summary: 'List notifications' } }
  }
};

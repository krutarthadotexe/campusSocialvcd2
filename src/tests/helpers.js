import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet;

export async function setupTestDatabase() {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [{ ip: '127.0.0.1' }]
  });
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = replSet.getUri();
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
}

export async function teardownTestDatabase() {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
}

export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}

export async function createAuthenticatedAgent(app, credentials) {
  const agent = request.agent(app);
  const response = await agent.post('/api/v1/auth/register').send(credentials);

  return {
    agent,
    accessToken: response.body.data.accessToken,
    user: response.body.data.user
  };
}

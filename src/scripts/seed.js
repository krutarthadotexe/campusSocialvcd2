import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { registerUser } from '../services/authService.js';

async function seed() {
  await connectDatabase(env.MONGO_URI);
  await User.deleteMany({});

  await registerUser({
    email: 'alice@example.com',
    username: 'alice',
    password: 'Password123',
    name: 'Alice'
  });

  await registerUser({
    email: 'bob@example.com',
    username: 'bob',
    password: 'Password123',
    name: 'Bob'
  });

  console.log('Seed complete');
  await disconnectDatabase();
}

seed().catch(async (error) => {
  console.error(error);
  await disconnectDatabase();
  process.exit(1);
});

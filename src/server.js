import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

const app = createApp();

connectDatabase(env.MONGO_URI)
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });

import app from './app.js';
import { env } from './config/env.js';
import { initializeDatabase } from '../db/setup_db.js';

const server = app.listen(env.port, async () => {
  console.log(`Aaroham API listening on http://localhost:${env.port}/api/v1`);
  console.log(`Environment: ${env.nodeEnv} · Client origin: ${env.clientUrl}`);
  try {
    await initializeDatabase();
  } catch (e) {
    console.log('[DB Initialization Warning]:', e.message);
  }
});

const shutdown = (signal) => {
  console.log(`${signal} received — shutting down`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

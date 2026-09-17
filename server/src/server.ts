import { connectDB } from './config/db';
import { env } from './config/env';
import app from './app';

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`🚀 Server running on http://localhost:${env.port}`);
    console.log(`📊 Environment: ${env.nodeEnv}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

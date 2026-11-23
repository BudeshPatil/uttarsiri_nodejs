import app from './app.js';
import http from 'http';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import appConfig from './config/appConfig.js';
import connectDB from './config/database.js';

dotenv.config();

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

const startServer = async () => {
  await connectDB();

  const PORT = appConfig.port;
  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection', { message: err.message, stack: err.stack });
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();

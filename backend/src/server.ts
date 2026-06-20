import app from './app';
import { checkDbHealth } from './config/db';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const isDbConnected = await checkDbHealth();
    if (!isDbConnected) {
      logger.warn('PostgreSQL database is unreachable. Starting server anyway (queries will run when DB is restored).');
    } else {
      logger.info('PostgreSQL connection established successfully.');
    }

    app.listen(PORT, () => {
      logger.info(`MindMirror AI Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Server startup failed with exception:', error);
    process.exit(1);
  }
};

startServer();

import app from '@/app';
import logger from '@/utils/logger';

// handling uncaught exceptions--
process.on('uncaughtException', (err) => {
  logger.error(`Error: ${err.message} | Stack: ${err.stack}`);
  logger.error(`Shutting down the server due to uncaught exception!`);
  process.exit(1);
});

// server--
const server = app.listen(process.env.PORT, () => {
  logger.info(`Server listening on port ${process.env.PORT}`);
});

// unhandled promise rejection--
process.on('unhandledRejection', (err) => {
  logger.error(`Error: ${err}`);
  logger.error(`Shutting down the server due to unhandled promise rejection!`);

  server.close(() => {
    process.exit(1);
  });
});

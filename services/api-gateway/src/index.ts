// services/api-gateway/src/index.ts
import { app, setupProxies } from "./app";
import config from "./config";
import logger from "./utils/logger";

// Start the server
async function startServer(): Promise<void> {
  try {
    await setupProxies();

    app.listen(config.port, () => {
      logger.info(`API Gateway running on port ${config.port}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught exception:", error);
  // Give the process time to log the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled rejection:", reason);
  // Give the process time to log the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  // Close server, DB connections, etc.
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

startServer();

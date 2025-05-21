// services/api-gateway/src/utils/logger.ts

import pino from "pino";
import config from "../config";

// Configure Pino logger
const logger = pino({
  level: config.logging.level || "info",
  transport:
    config.nodeEnv !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  // Add standard fields to all logs
  base: {
    service: "api-gateway",
  },
});

export default logger;

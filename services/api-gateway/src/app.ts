// services/api-gateway/src/app.ts

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  createProxyMiddleware,
  Options as ProxyOptions,
} from "http-proxy-middleware";
import config from "./config";
import pinoLogger from "./utils/logger";
import pinoHttp from "pino-http";
import { loadServiceRegistry } from "./services/registry";
import errorHandler from "./middleware/errorHandler";

// Types
type ServiceConfig = {
  name: string;
  url: string;
  prefix: string;
};

// Initialize Express app
const app = express();

// ADD: Set up Pino HTTP request logging middleware
const requestLogger = pinoHttp({
  logger: pinoLogger,
  // Generate a unique request ID if not present
  genReqId: (req) =>
    (req.headers["x-correlation-id"] as string) ||
    `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
  // Custom serializers to control what gets logged
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
  },
});

// ADD: Use Pino HTTP middleware (place this before other middleware)
app.use(requestLogger);

// Security middleware
app.use(helmet()); // Helps secure Express apps with various HTTP headers
app.use(
  cors({
    origin: config.cors.allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});
app.use(limiter);

app.use(express.json({ limit: "1mb" })); // Body limit to prevent large payload attacks

app.use((req: Request, res: Response, next: NextFunction) => {
  // Pino has already assigned a request ID - use that instead
  const requestId = (req as any).id;

  // Set it as the correlation ID in the response headers
  res.setHeader("x-correlation-id", requestId);
  next();
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).send({
    status: "ok",
    service: "api-gateway",
    timestamp: new Date().toISOString(),
  });
});

// Add this to your app.ts file after the health check endpoint

// Test route for logging
app.get("/test-logs", (req: Request, res: Response) => {
  // Log at different levels
  pinoLogger.info({
    msg: "This is an info log from the test endpoint",
    testId: "test-info",
  });

  pinoLogger.warn({
    msg: "This is a warning log from the test endpoint",
    testId: "test-warn",
  });

  pinoLogger.error({
    msg: "This is an error log from the test endpoint",
    testId: "test-error",
  });

  // Log with different contexts
  pinoLogger.info({
    msg: "Info log with extra context",
    user: "testUser",
    action: "logTest",
    testId: "test-context",
  });

  res.status(200).send({
    message: "Log test completed, check your console output",
    requestId: (req as any).id,
  });
});

// Load service registry and set up proxies
async function setupProxies(): Promise<void> {
  try {
    const services: ServiceConfig[] = await loadServiceRegistry();

    services.forEach((service) => {
      const proxyOptions: ProxyOptions = {
        target: service.url,
        changeOrigin: true,
        pathRewrite: {
          [`^${service.prefix}`]: "",
        },
        logLevel: "silent", // CHANGE: Use silent to let Pino handle logging
        onProxyReq: (proxyReq, req, res) => {
          // ADDED: Add correlation ID to proxied request
          const requestId = (req as any).id;
          proxyReq.setHeader("x-correlation-id", requestId);
        },
        onError: (err, req, res) => {
          // MODIFY to use Pino's structured logging
          const requestId = (req as any).id;
          pinoLogger.error({
            msg: `Proxy error for service ${service.name}`,
            error: err.message,
            service: service.name,
            requestId: requestId,
          });

          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Bad Gateway",
              message: `Cannot connect to ${service.name} service`,
              correlationId: requestId,
            })
          );
        },
      };

      app.use(service.prefix, createProxyMiddleware(proxyOptions));
      // MODIFY to use Pino's structured logging
      pinoLogger.info({
        msg: `Proxy configured for ${service.name}`,
        service: service.name,
        prefix: service.prefix,
      });
    });
  } catch (error) {
    // MODIFY to use Pino's structured logging
    pinoLogger.error({
      msg: "Failed to set up proxies",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

// Global error handler
app.use(errorHandler);

export { app, setupProxies };

// services/api-gateway/src/config.ts

interface ServiceConfig {
  name: string;
  url: string;
  prefix: string;
}

interface Config {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  cors: {
    allowedOrigins: string[];
  };
  services: {
    order: ServiceConfig;
    restaurant: ServiceConfig;
  };
  logging: {
    level: string;
    prettyPrint?: boolean;
  };
}

// Default configurations with environment variable overrides
const config: Config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
  },

  services: {
    order: {
      name: "order-service",
      url: process.env.ORDER_SERVICE_URL || "http://localhost:3001",
      prefix: "/orders",
    },
    restaurant: {
      name: "restaurant-service",
      url: process.env.RESTAURANT_SERVICE_URL || "http://localhost:3002",
      prefix: "/restaurants",
    },
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
    prettyPrint: process.env.NODE_ENV !== "production", // Pretty print in non-production environments
  },
};

export default config;

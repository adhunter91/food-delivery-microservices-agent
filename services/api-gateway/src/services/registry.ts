// services/api-gateway/src/services/registry.ts

import config from "../config";

// Define the ServiceConfig type
export type ServiceConfig = {
  name: string;
  url: string;
  prefix: string;
};

/**
 * Loads service registry information
 * In a real production system, this might come from a service discovery
 * system like Consul, etcd, or Kubernetes Service Discovery
 */
export async function loadServiceRegistry(): Promise<ServiceConfig[]> {
  // For now, we'll return a static configuration from our config file
  // In a real system, this might make API calls or read from a database
  return [
    {
      name: config.services.order.name,
      url: config.services.order.url,
      prefix: config.services.order.prefix,
    },
    {
      name: config.services.restaurant.name,
      url: config.services.restaurant.url,
      prefix: config.services.restaurant.prefix,
    },
  ];
}

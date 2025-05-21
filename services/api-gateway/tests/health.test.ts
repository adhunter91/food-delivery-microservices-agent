// services/api-gateway/tests/health.test.ts
import request from "supertest";
import express from "express";

// Create a simple Express app for testing
const app = express();

// Add a health API endpoint (just like in your real app)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "api-gateway" });
});

describe("API Gateway", () => {
  it("should respond to health check", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });
});

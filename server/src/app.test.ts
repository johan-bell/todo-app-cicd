import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("health", () => {
  it("GET /api/health returns ok without needing a database", async () => {
    const res = await request(createApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

import { Hono } from "hono";
import { afterEach, describe, expect, it } from "vitest";
import { tokenGate } from "../../../../src/mastra/server/tokenGate";

function app() {
  const hono = new Hono();
  hono.use("*", tokenGate);
  hono.get("/app/refdocs", (ctx) => ctx.json({ ok: true }));
  hono.get("/api/mcp/canon/mcp", (ctx) => ctx.json({ ok: true }));
  hono.get("/health", (ctx) => ctx.text("ok"));
  return hono;
}

describe("tokenGate", () => {
  afterEach(() => {
    delete process.env.CANON_API_TOKEN;
  });

  it("allows everything when CANON_API_TOKEN is unset", async () => {
    const res = await app().request("/app/refdocs");
    expect(res.status).toBe(200);
  });

  it("requires the bearer token on /app/* and /api/* when set", async () => {
    process.env.CANON_API_TOKEN = "s3cret";
    const server = app();
    expect((await server.request("/app/refdocs")).status).toBe(401);
    expect((await server.request("/api/mcp/canon/mcp")).status).toBe(401);
    const ok = await server.request("/app/refdocs", {
      headers: { Authorization: "Bearer s3cret" },
    });
    expect(ok.status).toBe(200);
  });

  it("leaves /health open", async () => {
    process.env.CANON_API_TOKEN = "s3cret";
    expect((await app().request("/health")).status).toBe(200);
  });
});

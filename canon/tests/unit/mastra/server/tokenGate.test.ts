import { Hono } from "hono";
import { afterEach, describe, expect, it } from "vitest";
import { tokenGate } from "../../../../src/mastra/server/tokenGate";

function app() {
  const a = new Hono();
  a.use("*", tokenGate);
  a.get("/app/refdocs", (c) => c.json({ ok: true }));
  a.get("/api/mcp/canon/mcp", (c) => c.json({ ok: true }));
  a.get("/health", (c) => c.text("ok"));
  return a;
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
    const a = app();
    expect((await a.request("/app/refdocs")).status).toBe(401);
    expect((await a.request("/api/mcp/canon/mcp")).status).toBe(401);
    const ok = await a.request("/app/refdocs", { headers: { Authorization: "Bearer s3cret" } });
    expect(ok.status).toBe(200);
  });

  it("leaves /health open", async () => {
    process.env.CANON_API_TOKEN = "s3cret";
    expect((await app().request("/health")).status).toBe(200);
  });
});

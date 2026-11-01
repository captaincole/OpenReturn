import { Hono } from "hono";
import { afterEach, describe, expect, it } from "vitest";
import { bearerMatches, requestGuard } from "../../../../src/mastra/server/requestGuard";

function app() {
  const hono = new Hono();
  hono.use("*", requestGuard);
  hono.get("/app/state", (ctx) => ctx.json({ ok: true }));
  return hono;
}

const get = (headers: Record<string, string>) =>
  app().request("http://127.0.0.1:4111/app/state", { headers });

describe("requestGuard", () => {
  afterEach(() => {
    delete process.env.ALLOWED_HOSTS;
  });

  it("allows loopback hosts with no Origin (the proxy, MCP clients)", async () => {
    for (const host of ["127.0.0.1:4111", "localhost:4111", "[::1]:4111"]) {
      expect((await get({ Host: host })).status).toBe(200);
    }
  });

  it("allows a same-machine Origin (Studio)", async () => {
    expect((await get({ Host: "localhost:4111", Origin: "http://localhost:4111" })).status).toBe(
      200,
    );
  });

  it("refuses a foreign Origin", async () => {
    expect((await get({ Host: "127.0.0.1:4111", Origin: "https://evil.example" })).status).toBe(
      403,
    );
    expect((await get({ Host: "127.0.0.1:4111", Origin: "null" })).status).toBe(403);
  });

  it("refuses a foreign Host (DNS rebinding)", async () => {
    expect((await get({ Host: "rebind.evil.example:4111" })).status).toBe(403);
  });

  it("answers to ALLOWED_HOSTS", async () => {
    process.env.ALLOWED_HOSTS = "taxbox.local";
    expect(
      (await get({ Host: "taxbox.local:4111", Origin: "http://taxbox.local:4111" })).status,
    ).toBe(200);
  });

  it("matches subdomains of a wildcard entry, not the bare domain", async () => {
    process.env.ALLOWED_HOSTS = "*.example.app";
    expect((await get({ Host: "preview-abc123.example.app" })).status).toBe(200);
    expect((await get({ Host: "a.b.example.app:443" })).status).toBe(200);
    expect((await get({ Host: "example.app" })).status).toBe(403);
    expect((await get({ Host: "evilexample.app" })).status).toBe(403);
  });
});

describe("bearerMatches", () => {
  it("matches only the exact bearer token", () => {
    expect(bearerMatches("Bearer s3cret", "s3cret")).toBe(true);
    expect(bearerMatches("Bearer s3cre", "s3cret")).toBe(false);
    expect(bearerMatches(undefined, "s3cret")).toBe(false);
  });
});

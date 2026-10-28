import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

type FakeTool = { execute: (input: unknown) => Promise<unknown> };
let fakeTools: Record<string, FakeTool> = {};
let listToolsError: Error | undefined;

/* Like MCPClient: a server that is down shows up in `errors`, not as a throw. */
vi.mock("@mastra/mcp", () => ({
  MCPClient: class {
    async listToolsetsWithErrors() {
      if (listToolsError) return { toolsets: {}, errors: { canon: listToolsError.message } };
      return { toolsets: { canon: fakeTools }, errors: {} };
    }
    async disconnect() {}
  },
}));

const { callCanon, disconnectCanon, isCanonUnreachable } =
  await import("../../../../src/mastra/canon/client");

const text = (value: unknown) => ({
  isError: false,
  content: [{ type: "text", text: JSON.stringify(value) }],
});

afterEach(async () => {
  await disconnectCanon();
  fakeTools = {};
  listToolsError = undefined;
});

describe("callCanon", () => {
  it("parses a structured tool result", async () => {
    fakeTools = { searchRefDocs: { execute: async () => ({ results: [{ n: 1 }] }) } };
    const out = await callCanon(
      "searchRefDocs",
      { query: "q" },
      z.object({ results: z.array(z.any()) }),
    );
    expect(out.results).toHaveLength(1);
  });

  it("unwraps a workflow run's result from its text envelope", async () => {
    fakeTools = {
      run_ground: {
        execute: async () =>
          text({ status: "success", steps: {}, result: { verdict: "accurate" } }),
      },
    };
    const out = await callCanon("run_ground", {}, z.object({ verdict: z.string() }));
    expect(out.verdict).toBe("accurate");
  });

  it("reports a failed workflow run as a tool error, not an unreachable one", async () => {
    fakeTools = {
      run_ground: {
        execute: async () =>
          text({ status: "failed", error: { message: "rule: no structured output" } }),
      },
    };
    const err = await callCanon("run_ground", {}, z.unknown()).catch((e: unknown) => e);
    expect((err as Error).name).toBe("CanonToolError");
    expect((err as Error).message).toContain("rule: no structured output");
    expect(isCanonUnreachable(err)).toBe(false);
  });

  it("is unreachable when the client cannot list tools, and tries again next time", async () => {
    listToolsError = new Error("fetch failed");
    const err = await callCanon("run_ask", {}, z.unknown()).catch((e: unknown) => e);
    expect(isCanonUnreachable(err)).toBe(true);

    listToolsError = undefined;
    fakeTools = {
      run_ask: { execute: async () => text({ status: "success", result: { ok: 1 } }) },
    };
    await expect(callCanon("run_ask", {}, z.object({ ok: z.number() }))).resolves.toEqual({
      ok: 1,
    });
  });

  it("is unreachable when the call itself throws", async () => {
    fakeTools = {
      run_ask: {
        execute: async () => {
          throw new Error("Request timed out");
        },
      },
    };
    const err = await callCanon("run_ask", {}, z.unknown()).catch((e: unknown) => e);
    expect(isCanonUnreachable(err)).toBe(true);
  });
});

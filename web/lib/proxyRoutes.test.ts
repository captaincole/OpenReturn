import { describe, expect, it } from "vitest";
import { AGENT_ROUTES, CANON_ROUTES, isProxyRoute } from "./proxyRoutes";

const segments = (path: string): string[] => path.split("/").filter((part) => part.length > 0);

const agentAllows = (method: string, path: string): boolean =>
  isProxyRoute(AGENT_ROUTES, method, segments(path));

const canonAllows = (method: string, path: string): boolean =>
  isProxyRoute(CANON_ROUTES, method, segments(path));

describe("the agent proxy's routes", () => {
  it("forwards each call the browser makes", () => {
    expect(agentAllows("GET", "/app/state")).toBe(true);
    expect(agentAllows("POST", "/app/filings")).toBe(true);
    expect(agentAllows("DELETE", "/app/filings/filing-1")).toBe(true);
    expect(agentAllows("POST", "/app/ask")).toBe(true);
    expect(agentAllows("GET", "/app/ask/thread-1")).toBe(true);
    expect(agentAllows("POST", "/app/ask/thread-1/turns")).toBe(true);
    expect(agentAllows("POST", "/api/agents/cade/stream")).toBe(true);
    expect(agentAllows("POST", "/api/agents/cade-deductions/stream")).toBe(true);
    expect(agentAllows("GET", "/api/memory/threads/user-1::2025/messages")).toBe(true);
  });

  it("refuses Mastra's other routes", () => {
    expect(agentAllows("GET", "/api/memory/threads")).toBe(false);
    expect(agentAllows("GET", "/api/memory/threads/user-1::2025")).toBe(false);
    expect(agentAllows("DELETE", "/api/memory/threads/user-1::2025")).toBe(false);
    expect(agentAllows("GET", "/api/agents")).toBe(false);
    expect(agentAllows("GET", "/api/agents/cade")).toBe(false);
    expect(agentAllows("POST", "/api/agents/cade/model")).toBe(false);
    expect(agentAllows("POST", "/api/agents/cade/generate")).toBe(false);
    expect(agentAllows("POST", "/api/tools/record-tax-facts/execute")).toBe(false);
    expect(agentAllows("GET", "/api/workflows")).toBe(false);
    expect(agentAllows("GET", "/api/observability/traces")).toBe(false);
  });

  it("refuses an agent that is not a conversation", () => {
    expect(agentAllows("POST", "/api/agents/other/stream")).toBe(false);
  });

  it("refuses an app route the browser does not call", () => {
    expect(agentAllows("POST", "/app/session/reset")).toBe(false);
    expect(agentAllows("POST", "/app/filings/filing-1/reviews/retry")).toBe(false);
  });

  it("refuses a listed path with another method", () => {
    expect(agentAllows("POST", "/app/state")).toBe(false);
    expect(agentAllows("GET", "/app/filings/filing-1")).toBe(false);
    expect(agentAllows("PUT", "/app/filings/filing-1")).toBe(false);
  });

  it("refuses a path that is longer or shorter than a listed one", () => {
    expect(agentAllows("GET", "/app")).toBe(false);
    expect(agentAllows("GET", "/app/state/extra")).toBe(false);
    expect(agentAllows("GET", "/")).toBe(false);
  });

  it("refuses a dot segment where an id goes", () => {
    expect(agentAllows("GET", "/api/memory/threads/../messages")).toBe(false);
    expect(agentAllows("GET", "/app/ask/..")).toBe(false);
    expect(agentAllows("DELETE", "/app/filings/.")).toBe(false);
  });
});

describe("the Canon proxy's routes", () => {
  it("forwards the reference library's calls", () => {
    expect(canonAllows("GET", "/app/refdocs")).toBe(true);
    expect(canonAllows("GET", "/app/refdocs/irs-1040-inst-2025/pdf")).toBe(true);
    expect(canonAllows("GET", "/app/refdocs/ca-540-inst-2025/html")).toBe(true);
  });

  it("refuses Canon's other routes", () => {
    expect(canonAllows("GET", "/api/mcp/canon/mcp")).toBe(false);
    expect(canonAllows("GET", "/api/workflows")).toBe(false);
    expect(canonAllows("GET", "/api/memory/threads")).toBe(false);
    expect(canonAllows("POST", "/app/refdocs")).toBe(false);
    expect(canonAllows("GET", "/app/refdocs/../pdf")).toBe(false);
  });
});

import { DEDUCTIONS_CONVERSATION, RETURN_CONVERSATION } from "./chatSession";

/*
 * The routes each proxy forwards. Cade and Canon are Mastra servers: next to the app's own
 * routes they serve Mastra's (every thread, traces, tools, workflows, the agent's model).
 * The browser needs the few listed here. A request for any other route gets a 404 from the
 * proxy and never reaches the server.
 *
 * A path is segments separated by "/". A segment that starts with ":" stands for one value
 * (an id); every other segment must match exactly.
 */
export interface ProxyRoute {
  method: "GET" | "POST" | "DELETE";
  path: string;
}

const streamRoute = (agentId: string): ProxyRoute => ({
  method: "POST",
  path: `/api/agents/${agentId}/stream`,
});

export const AGENT_ROUTES: ProxyRoute[] = [
  { method: "GET", path: "/app/state" },
  { method: "POST", path: "/app/filings" },
  { method: "DELETE", path: "/app/filings/:filingId" },
  { method: "POST", path: "/app/ask" },
  { method: "GET", path: "/app/ask/:threadId" },
  { method: "POST", path: "/app/ask/:threadId/turns" },
  streamRoute(RETURN_CONVERSATION.agentId),
  streamRoute(DEDUCTIONS_CONVERSATION.agentId),
  { method: "GET", path: "/api/memory/threads/:threadId/messages" },
];

export const CANON_ROUTES: ProxyRoute[] = [
  { method: "GET", path: "/app/refdocs" },
  { method: "GET", path: "/app/refdocs/:docId/pdf" },
  { method: "GET", path: "/app/refdocs/:docId/html" },
  { method: "GET", path: "/app/law/status" },
  { method: "GET", path: "/app/law/sections/:section" },
];

const isPlaceholder = (segment: string): boolean => segment.startsWith(":");

/* A URL parser folds "." and ".." away, so the server would get a path that is not the one matched. */
const isDotSegment = (value: string): boolean => value === "." || value === "..";

const segmentMatches = (segment: string, value: string): boolean =>
  isPlaceholder(segment) ? value.length > 0 && !isDotSegment(value) : segment === value;

const pathMatches = (routePath: string, path: string[]): boolean => {
  const segments = routePath.split("/").filter((segment) => segment.length > 0);
  return (
    segments.length === path.length &&
    segments.every((segment, index) => segmentMatches(segment, path[index]))
  );
};

/* `path` is the catch-all route's segments, already decoded by Next.js. */
export const isProxyRoute = (routes: ProxyRoute[], method: string, path: string[]): boolean =>
  routes.some((route) => route.method === method && pathMatches(route.path, path));

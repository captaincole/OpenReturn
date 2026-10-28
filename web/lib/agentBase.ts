/* The browser never talks to the agent directly and never holds an agent credential. */
export function agentUrl(path: string): string {
  return `/api/agent${path.startsWith("/") ? path : `/${path}`}`;
}

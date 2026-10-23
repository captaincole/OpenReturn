/*
 * Reference-library calls go through the same-origin /api/canon proxy,
 * the twin of agentUrl (lib/agentBase.ts): the session cookie
 * authenticates them, and the Next server forwards to Canon on localhost.
 */
export function canonUrl(path: string): string {
  return `/api/canon${path.startsWith("/") ? path : `/${path}`}`;
}

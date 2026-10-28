/*
 * The upstream URL for a request to one of the server-side proxies
 * (/api/agent, /api/canon). Next.js decodes each catch-all segment, so a
 * segment can hold "/" or "\" (sent as %2F or %5C). Joined raw, such a
 * path can start "//other.host/…", which new URL() reads as another host:
 * the proxy would fetch it with the session's authority and serve the
 * reply on this origin. Each segment is encoded again, and a path that
 * still leaves the base origin (an empty first segment) returns null;
 * the caller answers 400.
 */
export function proxyTarget(path: string[], search: string, base: string): URL | null {
  const target = new URL(`/${path.map(encodeURIComponent).join("/")}${search}`, base);
  return target.origin === new URL(base).origin ? target : null;
}

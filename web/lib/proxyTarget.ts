/*
 * The upstream URL for a request to one of the server-side proxies
 * (/api/agent, /api/canon). Next.js decodes each catch-all segment, so a
 * segment can hold "/" or "\" (sent as %2F or %5C). Joined, such a path
 * can start "//other.host/…", which new URL() reads as another host: the
 * proxy would fetch it with the session's authority and serve the reply
 * on this origin. Returns null for any such path; the caller answers 400.
 */
export function proxyTarget(path: string[], search: string, base: string): URL | null {
  const unsafe = (seg: string) => seg === "" || seg === "." || seg === ".." || /[/\\]/.test(seg);
  if (path.some(unsafe)) return null;
  const baseUrl = new URL(base);
  const target = new URL(`/${path.map(encodeURIComponent).join("/")}${search}`, baseUrl);
  return target.origin === baseUrl.origin ? target : null;
}

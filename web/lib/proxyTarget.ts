/*
 * Next.js decodes catch-all segments, so %2F or %5C gives a segment with "/"
 * or "\". Joined raw, "//other.host/…" reads as another host: the proxy would
 * fetch it with the session's authority. Returns null; the caller answers 400.
 */
export function proxyTarget(path: string[], search: string, base: string): URL | null {
  const target = new URL(`/${path.map(encodeURIComponent).join("/")}${search}`, base);
  return target.origin === new URL(base).origin ? target : null;
}

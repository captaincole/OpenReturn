export async function getUserId(): Promise<string | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  const body = (await res.json()) as { userId?: string };
  return body.userId ?? null;
}

/* Empty on purpose: the session cookie authenticates the /api/agent proxy. */
export async function authHeaders(): Promise<HeadersInit> {
  return {};
}

/*
 * Ends the session and leaves the app. The server names the next page: the
 * login screen, or Cloudflare's sign-out when the instance is behind Access.
 * A full page load: no client state of the old session stays.
 */
export async function signOut(): Promise<void> {
  const res = await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
  const body = res?.ok ? ((await res.json()) as { next?: string }) : {};
  window.location.assign(body.next ?? "/login");
}

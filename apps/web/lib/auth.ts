/*
 * Client-side auth helpers. The session lives in an httpOnly cookie the
 * browser cannot read. Identity checks go through /api/auth/me and
 * sign-out through /api/auth/logout. Agent calls need no headers — the
 * same cookie authenticates them through the /api/agent proxy.
 */

export async function getUserId(): Promise<string | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  const body = (await res.json()) as { userId?: string };
  return body.userId ?? null;
}

/**
 * Kept for call-site compatibility. Agent requests are same-origin via
 * the /api/agent proxy and the session cookie authenticates them, so
 * this returns no headers.
 */
export async function authHeaders(): Promise<HeadersInit> {
  return {};
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
}

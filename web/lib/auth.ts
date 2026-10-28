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

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
}

"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError(res.status === 401 ? "Wrong password." : `Login failed (${res.status}).`);
      setSubmitting(false);
      return;
    }
    /* refresh() re-runs Server Components with the new session cookie. */
    router.refresh();
    router.push("/");
  }

  return (
    <div className="bg-grid relative flex min-h-screen items-center justify-center bg-bg-base px-6">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="mb-10 text-center">
          <div className="mb-4 text-[11px] tracking-[0.28em] text-ink-muted uppercase">
            OpenReturn
          </div>
          <h1 className="mb-3 font-serif text-4xl text-ink-primary">Sign in</h1>
          <p className="text-sm text-ink-secondary">Enter your password to unlock this instance.</p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
            className="input-base"
          />
          {error && <div className="px-1 text-sm text-danger">{error}</div>}
          <button type="submit" disabled={submitting || !password} className="btn-primary">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-10 text-center text-xs text-ink-faint">
          Self-hosted · Your data stays on this machine
        </div>
      </div>
    </div>
  );
}

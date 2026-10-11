"use client";

/*
 * First-run setup: create the instance owner. One-shot — the API 409s
 * once an owner exists, and the server layout then redirects to /login.
 */

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function SetupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = displayName.trim() && email.trim() && password.length >= 8 && !submitting;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, password }),
    });
    if (!res.ok) {
      let message = `Setup failed (${res.status}).`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body?.error) message = body.error;
      } catch {
        /* keep default */
      }
      setError(message);
      setSubmitting(false);
      return;
    }
    router.refresh();
    router.push("/");
  }

  return (
    <div className="bg-grid relative flex min-h-screen items-center justify-center bg-bg-base px-6">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="mb-10 text-center">
          <div className="mb-4 text-[11px] tracking-[0.28em] text-ink-muted uppercase">Summa</div>
          <h1 className="mb-3 font-serif text-4xl text-ink-primary">Welcome</h1>
          <p className="text-sm text-ink-secondary">
            This instance is yours. Set a name, email, and password to get started — everything
            stays on this machine.
          </p>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            autoFocus
            autoComplete="name"
            className="input-base"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (used on your tax forms)"
            autoComplete="email"
            className="input-base"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ characters)"
            autoComplete="new-password"
            className="input-base"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            className="input-base"
          />
          {error && <div className="px-1 text-sm text-red-400">{error}</div>}
          <button type="submit" disabled={!canSubmit} className="btn-primary">
            {submitting ? "Setting up…" : "Create owner account"}
          </button>
        </form>
      </div>
    </div>
  );
}

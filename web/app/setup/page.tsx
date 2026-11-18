"use client";

import { readSetupForm } from "@/lib/authForms";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function SetupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* The form is read when it is sent (lib/authForms.ts): autofill may fill it with no input event. */
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const read = readSetupForm(new FormData(event.currentTarget));
    if ("error" in read) {
      setError(read.error);
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(read.values),
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
          <div className="mb-4 text-[11px] tracking-[0.28em] text-ink-muted uppercase">
            OpenReturn
          </div>
          <h1 className="mb-3 font-serif text-4xl text-ink-primary">Welcome</h1>
          <p className="text-sm text-ink-secondary">
            This instance is yours. Set a name, email, and password to get started — everything
            stays on this machine.
          </p>
        </div>

        {/* method="post": a form sent before the script runs never puts a password in the URL. */}
        <form method="post" onSubmit={(event) => void onSubmit(event)} className="space-y-3">
          <input
            type="text"
            name="displayName"
            placeholder="Your name"
            autoFocus
            autoComplete="name"
            className="input-base"
          />
          <input
            type="email"
            name="email"
            placeholder="Email (used on your tax forms)"
            autoComplete="email"
            className="input-base"
          />
          <input
            type="password"
            name="password"
            placeholder="Password (8+ characters)"
            autoComplete="new-password"
            className="input-base"
          />
          <input
            type="password"
            name="confirm"
            placeholder="Confirm password"
            autoComplete="new-password"
            className="input-base"
          />
          {error && <div className="px-1 text-sm text-danger">{error}</div>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Setting up…" : "Create owner account"}
          </button>
        </form>
      </div>
    </div>
  );
}

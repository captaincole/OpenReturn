"use client";

/*
 * Client-side "Start a new filing" trigger. It posts to /app/filings on
 * the agent. The endpoint is idempotent: a re-click returns the existing
 * filing instead of an error. On success it navigates to /r/<year>.
 * Errors render inline below the button, not as a console warning.
 */

import { signOut } from "@/lib/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFiling, UnauthorizedError } from "@/lib/api";

export function StartFilingButton({
  taxYear,
  className,
  children,
}: {
  taxYear: number;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { filing } = await createFiling(taxYear);
      router.push(`/r/${filing.taxYear}`);
      router.refresh();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        await signOut();
        router.push("/login");
        return;
      }
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={className}
      >
        {busy ? "Starting…" : children}
      </button>
      {error && (
        <div className="text-[12px] text-red-400">{error}</div>
      )}
    </div>
  );
}

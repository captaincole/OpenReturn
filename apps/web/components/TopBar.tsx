"use client";

/*
 * Top bar for the return-scoped layout. It renders above the chat +
 * workspace split pane. It is the one source of truth for "where am I".
 * Per the labeling rule, chat and workspace headers DO NOT re-announce
 * the active return.
 *
 * Structure:
 *   [W → /]  [Return picker ▾]               [Luca is working] [☀] [AC]
 *
 * The return picker is the title-weight element. It uses font-semibold
 * sans because Fraunces renders numerals with cursive stylistic features
 * that read oddly on years like "2025". Activity, Forms, and Documents are
 * sections of one workspace page, not tabs here.
 */

import { useAppShell } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { deleteFiling, UnauthorizedError } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { type TaxReturn } from "@/lib/returns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TopBarProps {
  activeReturn: TaxReturn;
  returns: TaxReturn[];
}

/* Active return + dropdown. The primary "where am I" cue. */
function ReturnPicker({ activeReturn, returns }: TopBarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function pickReturn(r: TaxReturn) {
    setOpen(false);
    router.push(`/r/${r.id}`);
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="-mx-2 flex items-baseline gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-bg-elevated"
      >
        <span className="text-[15px] leading-none font-semibold tracking-tight text-ink-primary">
          {activeReturn.label}
        </span>
        <span className="text-[11px] leading-none text-ink-muted">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated shadow-2xl shadow-black/40 light:shadow-black/10">
            <Link
              href="/"
              className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-bg-panel hover:text-ink-primary"
              onClick={() => setOpen(false)}
            >
              <span className="text-ink-muted">←</span>
              All returns
            </Link>
            {returns.map((r) => (
              <button
                key={r.filingId}
                onClick={() => pickReturn(r)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
                  "transition-colors hover:bg-bg-panel",
                  r.id === activeReturn.id && "bg-bg-panel",
                )}
              >
                <div>
                  <div className="text-sm text-ink-primary">{r.label}</div>
                  <div className="mt-0.5 text-[11px] text-ink-muted">
                    {r.state === "active" ? "In progress" : "Filed"}
                  </div>
                </div>
                {r.id === activeReturn.id && <span className="text-sm text-accent">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* Avatar + account dropdown; owns the delete-filing flow. */
function AccountMenu({ activeReturn }: { activeReturn: TaxReturn }) {
  const router = useRouter();
  const { profile, onSignOut } = useAppShell();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    if (
      !confirm(
        `Delete your ${activeReturn.year} filing? This wipes all facts, decisions, and uploaded documents. You can start a new ${activeReturn.year} filing from the home page afterwards.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteFiling(activeReturn.filingId);
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        await signOut();
        router.push("/login");
        return;
      }
      alert(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/20 text-xs font-medium text-accent transition-colors hover:bg-accent/30"
        title="Account"
      >
        {profile.initials}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated shadow-2xl shadow-black/40 light:shadow-black/10">
            {profile.email && (
              <div className="border-b border-border-subtle px-4 py-3">
                <div className="text-[11px] tracking-wider text-ink-muted uppercase">
                  Signed in as
                </div>
                <div className="mt-0.5 truncate text-sm text-ink-primary">{profile.email}</div>
              </div>
            )}
            <button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="w-full px-4 py-2.5 text-left text-sm text-danger/90 transition-colors hover:bg-bg-panel hover:text-danger disabled:opacity-50"
            >
              {deleting ? "Deleting…" : `Delete this filing`}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                void onSignOut();
              }}
              className="w-full border-t border-border-subtle px-4 py-2.5 text-left text-sm text-ink-secondary transition-colors hover:bg-bg-panel hover:text-ink-primary"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TopBar({ activeReturn, returns }: TopBarProps) {
  const { lucaBusy } = useAppShell();

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-bg-base/95 px-4 backdrop-blur-sm lg:px-6">
      {/* Brand mark. Links to the all-returns page. */}
      <Link
        href="/"
        title="All returns"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 transition-colors hover:bg-accent/25"
      >
        <span className="font-serif text-sm leading-none text-accent">W</span>
      </Link>

      <div className="h-6 w-px shrink-0 bg-border-subtle" />

      <ReturnPicker activeReturn={activeReturn} returns={returns} />

      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-2">
        {lucaBusy && (
          <div className="hidden items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-2.5 py-1.5 text-xs text-warn sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-warn" />
            <span>Luca is working</span>
          </div>
        )}

        <ThemeToggle />
        <AccountMenu activeReturn={activeReturn} />
      </div>
    </header>
  );
}

"use client";

/*
 * Top bar for the return-scoped layout. It renders above the chat +
 * workspace split pane. It is the one source of truth for "where am I".
 * Per the labeling rule, chat and workspace headers DO NOT re-announce
 * the active return.
 *
 * Structure:
 *   [W → /]  [Return picker ▾]  ·  Home  Forms  Documents   [progress] [AC]
 *
 * The return picker is the title-weight element. It uses font-semibold
 * sans because Fraunces renders numerals with cursive stylistic features
 * that read oddly on years like "2025". Workspace tabs are subordinate.
 */

import { useAppShell } from "@/components/AppShell";
import { deleteFiling, UnauthorizedError } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { type TaxReturn } from "@/lib/returns";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface TopBarProps {
  activeReturn: TaxReturn;
  returns: TaxReturn[];
}

const TABS = [
  { id: "home", label: "Home", path: "" },
  { id: "forms", label: "Forms", path: "/forms" },
  { id: "documents", label: "Documents", path: "/documents" },
] as const;

export function TopBar({ activeReturn, returns }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, profile, lucaBusy, onSignOut } = useAppShell();
  const [returnMenuOpen, setReturnMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
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
      setAccountMenuOpen(false);
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

  const basePath = `/r/${activeReturn.id}`;
  /*
   * TODO: replace with a real overall-progress signal when the agent
   * exposes one. computeOverallPct (the forms-complete fraction) reads 0
   * until the last form lands. That shows "no progress" through a long
   * chat. For now, scale with the fact count so the chip moves from the
   * start and tops out near completion.
   */
  const pct = state ? Math.min(95, Math.max(8, state.factCount * 4)) : 8;

  function isTabActive(tabPath: string): boolean {
    if (tabPath === "") return pathname === basePath;
    return pathname === `${basePath}${tabPath}` || pathname.startsWith(`${basePath}${tabPath}/`);
  }

  function pickReturn(r: TaxReturn) {
    setReturnMenuOpen(false);
    router.push(`/r/${r.id}`);
  }

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

      {/* Active return. The primary "where am I" cue. */}
      <div className="relative shrink-0">
        <button
          onClick={() => setReturnMenuOpen((v) => !v)}
          className="-mx-2 flex items-baseline gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-bg-elevated"
        >
          <span className="text-[15px] leading-none font-semibold tracking-tight text-ink-primary">
            {activeReturn.label}
          </span>
          <span className="text-[11px] leading-none text-ink-muted">▾</span>
        </button>
        {returnMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setReturnMenuOpen(false)} />
            <div className="absolute top-full left-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated shadow-2xl shadow-black/40">
              <Link
                href="/"
                className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-bg-panel hover:text-ink-primary"
                onClick={() => setReturnMenuOpen(false)}
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

      {/* Workspace tabs. Subordinate to the return picker. */}
      <div className="hidden shrink-0 px-1 text-ink-faint md:block">·</div>
      <nav className="hidden min-w-0 flex-1 items-center gap-0.5 md:flex">
        {TABS.map((t) => {
          const active = isTabActive(t.path);
          return (
            <Link
              key={t.id}
              href={`${basePath}${t.path}`}
              className={cn(
                "rounded-md px-2.5 py-1 text-[13px] transition-colors",
                active
                  ? "bg-bg-elevated text-ink-primary"
                  : "text-ink-secondary hover:bg-bg-elevated/50 hover:text-ink-primary",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 md:hidden" />

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-2">
        {lucaBusy && (
          <div className="hidden items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1.5 text-xs text-amber-200 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-amber-400" />
            <span>Luca is working</span>
          </div>
        )}
        {state && activeReturn.realDataAvailable && !lucaBusy && (
          <div className="hidden items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-2.5 py-1.5 text-xs sm:flex">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-ink-secondary tabular-nums">{pct}%</span>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setAccountMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/20 text-xs font-medium text-accent transition-colors hover:bg-accent/30"
            title="Account"
          >
            {profile.initials}
          </button>
          {accountMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAccountMenuOpen(false)} />
              <div className="absolute top-full right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated shadow-2xl shadow-black/40">
                {profile.email && (
                  <div className="border-b border-border-subtle px-4 py-3">
                    <div className="text-[11px] tracking-wider text-ink-muted uppercase">
                      Signed in as
                    </div>
                    <div className="mt-0.5 truncate text-sm text-ink-primary">{profile.email}</div>
                  </div>
                )}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-300 transition-colors hover:bg-bg-panel hover:text-red-200 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : `Delete this filing`}
                </button>
                <button
                  onClick={() => {
                    setAccountMenuOpen(false);
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
      </div>
    </header>
  );
}

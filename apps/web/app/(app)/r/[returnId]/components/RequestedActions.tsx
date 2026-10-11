"use client";

import { useAppShell } from "@/components/AppShell";
import { ACTIVITY_TAX_YEAR } from "@/lib/activity";
import {
  fetchOpenActions,
  markActionProcessing,
  skipAction,
  type RequestedAction,
} from "@/lib/requestedActions";
import { uploadDocument } from "@/lib/uploads";
import { useEffect, useRef, useState } from "react";

/*
 * Short fixed poll against the /api routes. The libsql app DB has no push
 * channel (Supabase Realtime left with Postgres). For one user on one box
 * a short interval is indistinguishable from push.
 */
export const POLL_INTERVAL_MS = 3000;

/*
 * Requested Actions — things Luca needs the user to DO. Pulls live rows
 * from requested_actions (status 'open' or 'processing') through
 * /api/requested-actions on a fast poll, plus an immediate refetch after
 * resets and turns.
 *
 * v1 handles only kind='upload' (document requests). Upload runs the
 * existing uploadDocument() flow, then marks the action 'processing'
 * with the new document id; the card stays visible until Luca dismisses
 * it after ingest. Skip sets status 'skipped', which removes the card
 * because the query returns only open and processing rows.
 */
export function RequestedActionsCard() {
  const { lucaBusy, sendChat, setMobilePane, resetTick, turnTick } = useAppShell();
  const [actions, setActions] = useState<RequestedAction[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  /*
   * Fetch on mount, reset, and turn, then poll. The poll replaces the
   * old realtime channel and also catches Luca's background dismissals.
   */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await fetchOpenActions(ACTIVITY_TAX_YEAR);
        if (!cancelled) setActions(rows);
      } catch (err) {
        console.warn("[actions] fetch failed:", err);
        if (!cancelled) setActions((prev) => prev ?? []);
      }
    }

    void load();
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [resetTick, turnTick]);

  async function handleUpload(action: RequestedAction, file: File) {
    setBusyId(action.id);
    try {
      const uploaded = await uploadDocument(file);
      /*
       * The card flips to "processing" and stays visible until Luca
       * calls dismiss-requested-action after ingest. This update is
       * optimistic; the next poll patches the same state.
       */
      await markActionProcessing(action.id, uploaded.id);
      setActions((prev) =>
        prev ? prev.map((x) => (x.id === action.id ? { ...x, status: "processing" } : x)) : prev,
      );
      /*
       * Mobile users cannot see the chat from the workspace pane. Flip
       * them to it so they see Luca react to the upload.
       */
      setMobilePane("chat");
      /*
       * Same code path as the textarea — sendChat is the canonical
       * entry point. skipUpload=true because we already wrote the file
       * to user_documents above.
       */
      await sendChat({
        text: action.documentType
          ? `Uploaded ${action.documentType} — ${file.name}`
          : `Uploaded ${file.name}`,
        file,
        skipUpload: true,
      });
    } catch (err) {
      console.warn("[actions] upload failed:", err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSkip(action: RequestedAction) {
    setBusyId(action.id);
    try {
      await skipAction(action.id);
      setActions((prev) => (prev ? prev.filter((x) => x.id !== action.id) : prev));
    } catch (err) {
      console.warn("[actions] skip failed:", err);
    } finally {
      setBusyId(null);
    }
  }

  const isEmpty = !actions || actions.length === 0;

  return (
    <section className="card">
      <div className="card-header">
        <span>Requested actions</span>
        <span className="tracking-normal text-ink-muted normal-case tabular-nums">
          {actions?.length ?? 0}
        </span>
      </div>
      {isEmpty ? (
        <div className="px-5 pt-1 pb-5 text-sm leading-relaxed text-ink-muted">
          Nothing waiting on you. Luca will drop a card here when he needs a specific document.
        </div>
      ) : (
        <div className="space-y-2.5 px-5 pb-5">
          {actions!.map((a) => (
            <ActionCard
              key={a.id}
              action={a}
              busy={busyId === a.id || lucaBusy}
              onUpload={(file) => handleUpload(a, file)}
              onSkip={() => handleSkip(a)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ActionCard({
  action,
  busy,
  onUpload,
  onSkip,
}: {
  action: RequestedAction;
  busy: boolean;
  onUpload: (file: File) => void;
  onSkip: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessing = action.status === "processing";
  return (
    <div className="surface flex items-start gap-3.5 px-4 py-3.5 transition-colors hover:border-border-strong">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 text-accent">
        {action.kind === "upload" && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
        {action.kind === "confirm" && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {action.kind === "decide" && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink-primary">{action.title}</div>
        {isProcessing ? (
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-amber-300/90">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-amber-400" />
            <span>Luca is reviewing this…</span>
          </div>
        ) : (
          action.detail && (
            <div className="mt-0.5 text-[12px] leading-relaxed text-ink-secondary">
              {action.detail}
            </div>
          )
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action.kind === "upload" && !isProcessing && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={action.acceptPattern ?? "application/pdf,image/png,image/jpeg,image/webp"}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:bg-bg-elevated disabled:text-ink-muted"
            >
              {busy ? "Uploading…" : "Upload PDF"}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onSkip}
          disabled={busy}
          className="px-2 py-1.5 text-xs text-ink-muted transition-colors hover:text-ink-secondary disabled:opacity-50"
        >
          {isProcessing ? "Cancel" : "Skip"}
        </button>
      </div>
    </div>
  );
}

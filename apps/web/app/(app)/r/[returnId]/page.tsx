"use client";

/*
 * Home tab for the active return. A synthesized dashboard:
 *   - Progress card with clickable category drill-downs
 *   - Requested actions (the Plan list lives in the chat pane)
 *   - Activity ticker with an inline detail panel
 *
 * Real data comes from useAppShell() — state.forms, state.pendingFacts,
 * state.pendingDecisions. The category sub-items are static for now (no
 * categorization endpoint yet); the per-category pct is a hand-rolled
 * mapping until we wire it server-side.
 */

import { useAppShell } from "@/components/AppShell";
import {
  ACTIVITY_TAX_YEAR,
  fetchActivityItems,
  type ActivityItem,
  type Verdict,
} from "@/lib/activity";
import { computeOverallPct, type FormSummary } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  fetchOpenActions,
  markActionProcessing,
  skipAction,
  type RequestedAction,
} from "@/lib/requestedActions";
import { uploadDocument } from "@/lib/uploads";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/*
 * Short fixed poll against the /api routes. The libsql app DB has no push
 * channel (Supabase Realtime left with Postgres). For one user on one box
 * a short interval is indistinguishable from push.
 */
const POLL_INTERVAL_MS = 3000;

type CategoryItemStatus = "done" | "doing" | "todo";

interface CategoryItem {
  id: string;
  label: string;
  status: CategoryItemStatus;
  note?: string;
}

interface Category {
  id: string;
  label: string;
  pct: number;
  items: CategoryItem[];
  /*
   * Filename substrings that filter user_documents into the per-category
   * "Documents" quick links. Hand-mapped until the agent tags uploads
   * with a category at ingest time.
   */
  docHints: string[];
  /*
   * Form IDs from state.forms to show as quick links. Each link shows
   * the form's current fill % inline, so the user sees what this
   * category becomes on the actual return.
   */
  formIds: string[];
}

/*
 * Static category definitions. When the agent gains a categorization
 * endpoint these become server-derived; until then, edit this file.
 */
const CATEGORIES: Category[] = [
  {
    id: "filing",
    label: "Filing status",
    pct: 100,
    items: [
      { id: "f1", label: "Filing status", status: "done", note: "Single" },
      { id: "f2", label: "Dependents", status: "done", note: "None for 2025" },
      { id: "f3", label: "Residency (state)", status: "done", note: "Full-year California" },
    ],
    docHints: [],
    formIds: ["1040", "540"],
  },
  {
    id: "wages",
    label: "Wages",
    pct: 100,
    items: [
      { id: "w1", label: "W-2 wages", status: "done" },
      { id: "w2", label: "Federal withholding", status: "done" },
      {
        id: "w3",
        label: "Self-employment income (1099-NEC)",
        status: "todo",
        note: "Confirm none",
      },
    ],
    docHints: ["w-2", "w2", "1099-nec"],
    formIds: ["1040"],
  },
  {
    id: "investments",
    label: "Investments",
    pct: 20,
    items: [
      { id: "i1", label: "Dividends (1099-DIV)", status: "doing", note: "Luca is asking now" },
      { id: "i2", label: "Interest (1099-INT)", status: "done" },
      { id: "i3", label: "Capital gains (Schedule D / 8949)", status: "todo" },
      { id: "i4", label: "Crypto disposals", status: "todo" },
      { id: "i5", label: "Other investment income (1099-MISC, royalties)", status: "todo" },
    ],
    docHints: ["1099-int", "1099-div", "1099-b", "1099-misc", "k-1", "k1"],
    formIds: ["1040", "schedule-d", "8949"],
  },
  {
    id: "deductions",
    label: "Deductions",
    pct: 0,
    items: [
      {
        id: "d1",
        label: "Standard vs itemized comparison",
        status: "todo",
        note: "Decides which path is worth pursuing",
      },
      { id: "d2", label: "Charitable contributions", status: "todo" },
      { id: "d3", label: "Mortgage interest (Form 1098)", status: "todo" },
      { id: "d4", label: "State and local taxes (SALT)", status: "todo" },
      { id: "d5", label: "Medical expenses (over 7.5% of AGI)", status: "todo" },
    ],
    docHints: ["1098", "donation", "charity", "receipt"],
    formIds: ["1040", "schedule-a"],
  },
];

/*
 * Pick the default expanded category: prefer an in-progress one
 * (0 < pct < 100), then the first incomplete one.
 */
function defaultExpandedCategoryId(): string {
  const inProgress = CATEGORIES.find((c) => c.pct > 0 && c.pct < 100);
  if (inProgress) return inProgress.id;
  const incomplete = CATEGORIES.find((c) => c.pct < 100);
  return (incomplete ?? CATEGORIES[0]).id;
}

interface UploadRow {
  id: string;
  filename: string;
  created_at: string;
}

export default function HomeTab() {
  const { activeReturn, state, resetTick, turnTick } = useAppShell();
  /*
   * Default-expand the in-progress category so the user lands on a
   * populated drill-down and never sees an empty Progress card.
   */
  const [expandedCat, setExpandedCat] = useState<string | null>(() => defaultExpandedCategoryId());
  const [uploads, setUploads] = useState<UploadRow[]>([]);

  /*
   * Load uploads so the per-category quick links can filter by filename
   * hint. Refetch on resetTick and turnTick so new documents appear
   * without a manual refresh.
   */
  useEffect(() => {
    if (!activeReturn.realDataAvailable) return;
    let cancelled = false;
    fetch("/api/uploads", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as UploadRow[];
      })
      .then((rows) => {
        if (!cancelled) setUploads(rows);
      })
      .catch((err) => {
        console.warn("[home] failed to load uploads:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [activeReturn.realDataAvailable, resetTick, turnTick]);

  if (!activeReturn.realDataAvailable) {
    return <PlaceholderHome />;
  }

  const expanded = expandedCat ? CATEGORIES.find((c) => c.id === expandedCat) : null;
  const overallPct = state ? computeOverallPct(state.forms) : 0;
  const openCount = state ? state.pendingDecisions.length + state.pendingFacts.length : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 pt-4 pb-10 lg:px-10 lg:pt-6">
      <section className="card p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] tracking-[0.18em] text-ink-muted uppercase">Progress</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-ink-primary tabular-nums">
              {overallPct}% complete
            </div>
          </div>
          {state && (
            <div className="text-sm text-ink-secondary tabular-nums">
              {state.factCount} facts · {openCount} open · {state.forms.length} forms
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {CATEGORIES.map((cat) => (
            <ProgressSegment
              key={cat.id}
              label={cat.label}
              pct={cat.pct}
              active={expandedCat === cat.id}
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
            />
          ))}
        </div>

        {expanded && (
          <CategoryDetailsPanel
            key={expanded.id}
            category={expanded}
            uploads={uploads}
            forms={state?.forms ?? []}
            returnId={activeReturn.id}
            onCollapse={() => setExpandedCat(null)}
          />
        )}
      </section>

      {/*
       * The Plan list moved into the chat pane, above the input. This
       * slot holds things Luca asks the USER to do — uploads,
       * confirmations, decisions — that do not fit a natural chat turn.
       */}
      <RequestedActionsCard />

      <ActivityTicker refreshKey={turnTick + resetTick * 10000} />
    </div>
  );
}

function PlaceholderHome() {
  /*
   * Unreachable today — same story as ChatPane.placeholderMessageFor.
   * The layout redirect keeps years without a filing out of /r/*, and
   * every queried TaxReturn has realDataAvailable=true.
   */
  const { activeReturn } = useAppShell();
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center lg:px-10">
      <div className="text-[11px] tracking-[0.22em] text-ink-muted uppercase">
        {activeReturn.label}
      </div>
      <h1 className="mt-3 font-serif text-3xl text-ink-primary">
        {activeReturn.state === "filed" ? "Filed and read-only" : "Not started yet"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-secondary">
        {activeReturn.state === "filed"
          ? "This return is in the archive."
          : "Real work happens on your active return."}
      </p>
    </div>
  );
}

function ProgressSegment({
  label,
  pct,
  active = false,
  onClick,
}: {
  label: string;
  pct: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg p-2 text-left transition-colors",
        active ? "bg-accent/10 ring-1 ring-accent/30" : "hover:bg-bg-elevated/40",
      )}
    >
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={cn(
            "h-full transition-all duration-500",
            pct === 100 ? "bg-emerald-400" : pct > 0 ? "bg-accent" : "bg-transparent",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className={cn(
          "mt-1.5 flex items-center justify-between gap-1 truncate text-[11px]",
          active ? "text-ink-primary" : "text-ink-muted",
        )}
      >
        <span>{label}</span>
        <span className="tabular-nums opacity-70">{pct}%</span>
      </div>
    </button>
  );
}

/*
 * Expanded drill-down panel for a category. The workflow list caps at 3
 * items with a 'See N more' toggle. This keeps the Progress card short,
 * so Requested Actions and Activity stay visible above the fold on a
 * normal desktop. State resets on category change because the parent
 * keys this component by category.id.
 */
const WORKFLOWS_CAP = 3;

function CategoryDetailsPanel({
  category,
  uploads,
  forms,
  returnId,
  onCollapse,
}: {
  category: Category;
  uploads: UploadRow[];
  forms: FormSummary[];
  returnId: string;
  onCollapse: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? category.items : category.items.slice(0, WORKFLOWS_CAP);
  const hiddenCount = category.items.length - visibleItems.length;

  return (
    <div className="mt-5 animate-fade-in border-t border-border-subtle pt-5">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            {category.label}
          </span>
          <span className="text-[11px] text-ink-faint">· {category.items.length} workflows</span>
        </div>
        <button
          onClick={onCollapse}
          className="text-[11px] tracking-wider text-ink-muted uppercase transition-colors hover:text-ink-primary"
        >
          Collapse ↑
        </button>
      </div>

      <ul className="space-y-1">
        {visibleItems.map((item) => (
          <CategoryItemRow key={item.id} item={item} />
        ))}
      </ul>

      {category.items.length > WORKFLOWS_CAP && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-1.5 ml-3 text-[11px] text-accent transition-colors hover:text-accent-hover"
        >
          {showAll ? "Show less" : `See ${hiddenCount} more`}
        </button>
      )}

      <CategoryQuickLinks category={category} uploads={uploads} forms={forms} returnId={returnId} />
    </div>
  );
}

/*
 * Quick-link strip under the workflows list. Two subsections:
 * "Documents" lists uploads whose filename matches a docHint substring;
 * "Forms" lists state.forms entries whose formId is in the category's
 * formIds. Both link into the relevant tab. The strip hides only when
 * both subsections are empty.
 */
function CategoryQuickLinks({
  category,
  uploads,
  forms,
  returnId,
}: {
  category: Category;
  uploads: UploadRow[];
  forms: FormSummary[];
  returnId: string;
}) {
  const matchingDocs = useMemo(() => {
    if (category.docHints.length === 0) return [];
    return uploads.filter((doc) => {
      const lower = doc.filename.toLowerCase();
      return category.docHints.some((h) => lower.includes(h));
    });
  }, [category.docHints, uploads]);

  const matchingForms = useMemo(() => {
    if (category.formIds.length === 0) return [];
    const wanted = new Set(category.formIds);
    return forms.filter((f) => wanted.has(f.formId.toLowerCase()) || wanted.has(f.formId));
  }, [category.formIds, forms]);

  if (matchingDocs.length === 0 && matchingForms.length === 0) return null;

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border-subtle pt-4 md:grid-cols-2">
      <div>
        <div className="mb-2 text-[10px] tracking-[0.18em] text-ink-muted uppercase">Documents</div>
        {matchingDocs.length === 0 ? (
          <div className="text-[12px] text-ink-muted">
            No matching uploads yet.{" "}
            <Link href={`/r/${returnId}/documents`} className="text-accent hover:text-accent-hover">
              Upload →
            </Link>
          </div>
        ) : (
          <ul className="space-y-1">
            {matchingDocs.slice(0, 4).map((doc) => (
              <li key={doc.id}>
                <a
                  href={`/documents/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-[12px] text-ink-secondary hover:text-ink-primary"
                >
                  <span className="text-ink-faint">📎</span>
                  <span className="truncate">{doc.filename}</span>
                  <span className="ml-auto shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
                    ↗
                  </span>
                </a>
              </li>
            ))}
            {matchingDocs.length > 4 && (
              <li>
                <Link
                  href={`/r/${returnId}/documents`}
                  className="text-[11px] text-accent hover:text-accent-hover"
                >
                  +{matchingDocs.length - 4} more →
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-2 text-[10px] tracking-[0.18em] text-ink-muted uppercase">Forms</div>
        {matchingForms.length === 0 ? (
          <div className="text-[12px] text-ink-muted">No forms drafted yet for this category.</div>
        ) : (
          <ul className="space-y-2">
            {matchingForms.map((f) => {
              const total = Math.max(0, f.fieldCount - f.unsupportedFieldCount);
              const filled = Math.max(0, total - f.blockedFieldCount);
              const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
              return (
                <li key={f.formId}>
                  <Link href={`/r/${returnId}/forms`} className="group block">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[12px] text-ink-secondary group-hover:text-ink-primary">
                        {f.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-ink-muted tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-elevated">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          pct === 100 ? "bg-emerald-400" : pct > 0 ? "bg-accent" : "bg-transparent",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryItemRow({ item }: { item: CategoryItem }) {
  const isDone = item.status === "done";
  const isDoing = item.status === "doing";
  return (
    <li>
      <button
        className={cn(
          "group flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors",
          !isDone && "hover:bg-bg-elevated/50",
        )}
      >
        {isDone ? (
          <svg
            viewBox="0 0 16 16"
            className="mt-[3px] h-3.5 w-3.5 shrink-0 text-emerald-400"
            aria-hidden
          >
            <circle cx="8" cy="8" r="7.5" fill="currentColor" opacity="0.18" />
            <path
              d="M4.5 8.2 6.8 10.5 11.5 5.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        ) : isDoing ? (
          <span className="mt-[5px] h-2.5 w-2.5 shrink-0 animate-pulse-soft rounded-full bg-accent" />
        ) : (
          <span className="mt-[4px] h-3 w-3 shrink-0 rounded-full border border-border-strong" />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-sm leading-snug",
              isDoing && "font-medium text-ink-primary",
              isDone && "text-ink-muted",
              !isDoing &&
                !isDone &&
                "text-ink-secondary transition-colors group-hover:text-ink-primary",
            )}
          >
            {item.label}
          </div>
          {item.note && (
            <div className="mt-0.5 text-[11px] leading-snug text-ink-muted">{item.note}</div>
          )}
        </div>
        {!isDone && (
          <span
            className={cn(
              "mt-0.5 shrink-0 text-[11px] transition-opacity",
              isDoing ? "text-accent opacity-100" : "text-accent opacity-0 group-hover:opacity-100",
            )}
          >
            {isDoing ? "In progress" : "Start →"}
          </span>
        )}
      </button>
    </li>
  );
}

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
function RequestedActionsCard() {
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

/*
 * Horizontal strip of recent facts and decisions, newest on the left. A
 * fade gradient on the right edge signals more content on scroll. Polls
 * /api/activity on a short interval; new tax_facts / ai_decisions rows
 * and verdict updates land within one poll. A click on a chip opens an
 * inline detail panel with the rationale, supporting facts, and verdict
 * reason behind a decision, so the user sees what Luca was thinking.
 */
function ActivityTicker({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [selected, setSelected] = useState<ActivityItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await fetchActivityItems(30);
        if (!cancelled) setItems(rows);
      } catch (err) {
        console.warn("[ticker] fetch failed:", err);
        if (!cancelled) setItems((prev) => prev ?? []);
      }
    }

    void load();
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refreshKey]);

  return (
    <section className="card">
      <div className="card-header">
        <span>Activity</span>
        <span className="tracking-normal text-ink-muted normal-case tabular-nums">
          {items?.length ?? 0} recent
        </span>
      </div>
      {items === null ? (
        <div className="px-5 pb-5 text-sm text-ink-muted">Loading…</div>
      ) : items.length === 0 ? (
        <div className="px-5 pb-5 text-sm text-ink-muted">
          Nothing yet. Items appear here the moment Luca records them.
        </div>
      ) : (
        <>
          <div
            className="relative px-5 pb-3"
            style={{ maskImage: "linear-gradient(to right, black 94%, transparent)" }}
          >
            <div className="flex snap-x scroll-px-5 gap-2.5 overflow-x-auto overflow-y-hidden">
              {items.map((item) => (
                <ActivityChip
                  key={item.id}
                  item={item}
                  active={selected?.id === item.id}
                  onClick={() => setSelected(selected?.id === item.id ? null : item)}
                />
              ))}
            </div>
          </div>

          {selected && <ActivityDetailPanel item={selected} onClose={() => setSelected(null)} />}
        </>
      )}
    </section>
  );
}

function ActivityChip({
  item,
  active,
  onClick,
}: {
  item: ActivityItem;
  active: boolean;
  onClick: () => void;
}) {
  const isDecision = item.kind === "decision";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "surface flex w-[180px] shrink-0 snap-start flex-col gap-1.5 p-3 text-left",
        "animate-fade-in transition-colors",
        active
          ? "border-accent/30 bg-accent/10 ring-1 ring-accent/30"
          : "hover:border-border-strong hover:bg-bg-elevated/40",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-[9px] font-medium tracking-[0.18em] uppercase",
            isDecision ? "text-accent" : "text-ink-muted",
          )}
        >
          {item.kind}
        </span>
        <span className="text-[10px] text-ink-faint tabular-nums">{timeAgo(item.createdAt)}</span>
      </div>
      <div
        className="truncate text-[12px] leading-tight text-ink-primary"
        title={humanizeKey(item.title)}
      >
        {humanizeKey(item.title)}
      </div>
      <div
        className="truncate text-[12px] leading-tight text-ink-secondary"
        title={briefValue(item.value)}
      >
        {briefValue(item.value)}
      </div>
      {isDecision && item.verdict && <VerdictBadge verdict={item.verdict} />}
    </button>
  );
}

/*
 * Detail panel rendered inside the Activity card, below the chip row,
 * when a chip is clicked. Matches the Progress drill-down pattern: the
 * card grows vertically instead of overlaying a modal.
 */
function ActivityDetailPanel({ item, onClose }: { item: ActivityItem; onClose: () => void }) {
  const isDecision = item.kind === "decision";
  return (
    <div className="animate-fade-in border-t border-border-subtle px-5 pt-4 pb-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <span
            className={cn(
              "text-[10px] font-medium tracking-[0.18em] uppercase",
              isDecision ? "text-accent" : "text-ink-muted",
            )}
          >
            {item.kind}
          </span>
          <span className="truncate font-serif text-[15px] text-ink-primary">
            {humanizeKey(item.title)}
          </span>
          <span className="shrink-0 text-[11px] text-ink-faint tabular-nums">
            {timeAgo(item.createdAt)} ago
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[11px] tracking-wider text-ink-muted uppercase transition-colors hover:text-ink-primary"
        >
          Collapse ↑
        </button>
      </div>

      <div className="space-y-4 text-sm">
        <DetailBlock label="Value">
          <ValueDisplay value={item.value} />
        </DetailBlock>

        {isDecision && item.verdict && (
          <DetailBlock label="Review verdict">
            <div className="flex flex-wrap items-center gap-2">
              <VerdictBadge verdict={item.verdict} />
              {item.confidence && (
                <span className="text-[10px] tracking-wide text-ink-muted uppercase">
                  {item.confidence} confidence
                </span>
              )}
            </div>
            {item.verdictReason && (
              <p className="mt-2 leading-relaxed whitespace-pre-wrap text-ink-secondary">
                {item.verdictReason}
              </p>
            )}
          </DetailBlock>
        )}

        {isDecision && item.rationale && (
          <DetailBlock label="Why Luca decided this">
            <p className="leading-relaxed whitespace-pre-wrap text-ink-secondary">
              {item.rationale}
            </p>
          </DetailBlock>
        )}

        {isDecision && item.supportingFactKeys && item.supportingFactKeys.length > 0 && (
          <DetailBlock label="Supporting facts">
            <ul className="space-y-1">
              {item.supportingFactKeys.map((k) => (
                <li key={k} className="truncate font-mono text-[12px] text-ink-secondary">
                  {k}
                </li>
              ))}
            </ul>
          </DetailBlock>
        )}

        {item.sourceNote && (
          <DetailBlock label="Source">
            <p className="text-[13px] text-ink-secondary">{item.sourceNote}</p>
          </DetailBlock>
        )}

        <div className="border-t border-border-subtle pt-2 font-mono text-[11px] text-ink-faint">
          {item.title}
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] tracking-[0.18em] text-ink-muted uppercase">{label}</div>
      {children}
    </div>
  );
}

function ValueDisplay({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <p className="text-ink-secondary">—</p>;
  if (typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <p className="text-ink-secondary">—</p>;
    return (
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
        {entries.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="pt-0.5 text-[11px] tracking-wide text-ink-muted uppercase">
              {k.replace(/_/g, " ")}
            </dt>
            <dd className="break-words text-ink-primary">{briefValue(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return <p className="break-words text-ink-primary">{briefValue(value)}</p>;
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const tones: Record<Verdict, string> = {
    pending: "text-ink-secondary bg-bg-elevated",
    accurate: "text-emerald-400 bg-emerald-400/10",
    inaccurate: "text-red-400 bg-red-400/10",
    ungroundable: "text-amber-400 bg-amber-400/10",
    needs_more_facts: "text-amber-400 bg-amber-400/10",
    review_failed: "text-ink-muted bg-bg-elevated",
  };
  const labels: Record<Verdict, string> = {
    pending: "Reviewing",
    accurate: "Grounded",
    inaccurate: "Conflict",
    ungroundable: "No source",
    needs_more_facts: "Needs info",
    review_failed: "Failed",
  };
  return (
    <span
      className={cn(
        "mt-0.5 inline-block self-start rounded px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase",
        tones[verdict],
      )}
    >
      {labels[verdict]}
    </span>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

function humanizeKey(key: string): string {
  const parts = key.split(/[._]/);
  return parts
    .map((part, i) =>
      i === 0
        ? part.charAt(0).toUpperCase() + part.replace(/-/g, " ").slice(1)
        : part.replace(/-/g, " "),
    )
    .join(" · ");
}

function briefValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.length === 0 ? "—" : `${v.length} items`;
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return "—";
    const [k, val] = entries[0];
    return `${k}: ${briefValue(val)}`;
  }
  return String(v);
}

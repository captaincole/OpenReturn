"use client";

import { fetchActivityItems, type ActivityItem, type Verdict } from "@/lib/activity";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/format";
import { useEffect, useState } from "react";

interface ActivityCardProps {
  /*
   * The parent bumps this when activity may have changed (new turn,
   * reset). A bump also wipes and refetches after a session reset. The
   * interval poll handles incremental updates between bumps.
   */
  refreshKey: number;
}

const ACTIVITY_LIMIT = 50;
/*
 * Plain interval polling against /api/activity. The libsql app DB has no
 * push channel (Supabase Realtime left with Postgres). For one user on
 * one box, a fast regular poll is indistinguishable from push.
 */
const POLL_INTERVAL_MS = 3000;

const VERDICT_LABEL: Record<Verdict, string> = {
  pending: "Reviewing…",
  accurate: "Grounded",
  inaccurate: "Conflict",
  ungroundable: "No source",
  needs_more_facts: "Needs info",
  review_failed: "Review failed",
};

const VERDICT_TONE: Record<Verdict, string> = {
  pending: "text-ink-secondary bg-bg-elevated animate-pulse-soft",
  accurate: "text-emerald-400 bg-emerald-400/10",
  inaccurate: "text-red-400 bg-red-400/10",
  ungroundable: "text-amber-400 bg-amber-400/10",
  needs_more_facts: "text-amber-400 bg-amber-400/10",
  review_failed: "text-ink-muted bg-bg-elevated",
};

function formatTitle(rawKey: string, dropFirstSegment: boolean): string {
  const parts = rawKey.split(".");
  const visible = dropFirstSegment ? parts.slice(1) : parts;
  if (visible.length === 0) return rawKey;
  return visible
    .map((part, i) => {
      const words = part.replace(/_/g, " ");
      return i === 0 ? words.charAt(0).toUpperCase() + words.slice(1) : words;
    })
    .join(" · ");
}

function formatFieldLabel(key: string): string {
  const words = key.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    return v.length === 0 ? "—" : v.map(formatScalar).join(", ");
  }
  return JSON.stringify(v);
}

function brief(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value !== "object" || Array.isArray(value)) {
    return formatScalar(value);
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "—";
  return entries
    .slice(0, 2)
    .map(([k, v]) => `${formatFieldLabel(k)}: ${formatScalar(v)}`)
    .join(" · ");
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function ActivityCard({ refreshKey }: ActivityCardProps) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /*
   * Fetch on mount and on each refreshKey bump, then poll on a fast
   * regular interval. Both paths replace the whole list. The endpoint
   * returns the newest ACTIVITY_LIMIT rows already sorted, so there is no
   * client-side merge to get wrong. Verdict updates (pending → grounded)
   * arrive automatically.
   */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await fetchActivityItems(ACTIVITY_LIMIT);
        if (!cancelled) setItems(rows);
      } catch (err) {
        console.warn("[activity] fetch failed:", err);
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

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="card flex min-h-0 flex-1 flex-col">
      <div className="card-header shrink-0">
        <span>Activity</span>
        <span className="tracking-normal text-ink-muted normal-case tabular-nums">
          {items?.length ?? 0}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {items === null && <div className="px-5 py-6 text-sm text-ink-muted">Loading…</div>}
        {items?.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-ink-muted">
            Nothing recorded yet. Start a chat to populate the ledger.
          </div>
        )}
        {items?.map((item, idx) => (
          <ActivityRow
            key={item.id}
            item={item}
            isFirst={idx === 0}
            isExpanded={expanded.has(item.id)}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ActivityRow({
  item,
  isFirst,
  isExpanded,
  onToggle,
}: {
  item: ActivityItem;
  isFirst: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isDecision = item.kind === "decision";
  const title = formatTitle(item.title, isDecision);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full px-5 py-3.5 text-left",
        "transition-colors hover:bg-bg-elevated/50",
        !isFirst && "border-t border-border-subtle",
      )}
      aria-expanded={isExpanded}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={cn(
            "text-[9px] font-medium tracking-[0.18em] uppercase",
            isDecision ? "text-accent" : "text-ink-muted",
          )}
        >
          {item.kind}
        </span>
        <span className="text-[11px] text-ink-faint tabular-nums">{timeAgo(item.createdAt)}</span>
      </div>

      <div className="mt-1 flex items-center gap-2 text-ink-primary">
        <span className="truncate text-sm font-medium">{title}</span>
        <span
          className={cn(
            "ml-auto shrink-0 text-xs text-ink-muted transition-transform duration-150",
            isExpanded && "rotate-90",
          )}
          aria-hidden
        >
          ▸
        </span>
      </div>

      {!isExpanded && (
        <div className="mt-1 truncate text-sm text-ink-secondary">{brief(item.value)}</div>
      )}

      {isExpanded && <ExpandedBody item={item} />}

      {isDecision && item.verdict && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
              VERDICT_TONE[item.verdict],
            )}
          >
            {VERDICT_LABEL[item.verdict]}
          </span>
          {item.confidence && (
            <span className="text-[10px] tracking-wide text-ink-muted uppercase">
              {item.confidence} confidence
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function ExpandedBody({ item }: { item: ActivityItem }) {
  return (
    <div className="mt-3 space-y-3 text-sm">
      <ValueDisplay value={item.value} />

      {item.kind === "decision" && item.rationale && (
        <DetailBlock label="Why">
          <p className="leading-relaxed whitespace-pre-wrap text-ink-secondary">{item.rationale}</p>
        </DetailBlock>
      )}

      {item.kind === "decision" && item.verdictReason && item.verdict !== "accurate" && (
        <DetailBlock label="Reviewer note">
          <p className="leading-relaxed whitespace-pre-wrap text-ink-secondary">
            {item.verdictReason}
          </p>
        </DetailBlock>
      )}

      {item.kind === "decision" &&
        item.supportingFactKeys &&
        item.supportingFactKeys.length > 0 && (
          <DetailBlock label="Supporting facts">
            <ul className="space-y-0.5">
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

      <div className="pt-1 font-mono text-[11px] text-ink-faint">{item.title}</div>
    </div>
  );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] tracking-[0.18em] text-ink-muted uppercase">{label}</div>
      {children}
    </div>
  );
}

function ValueDisplay({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="text-ink-secondary">—</p>;
  }
  if (isObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <p className="text-ink-secondary">—</p>;
    }
    return (
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
        {entries.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="pt-0.5 text-[11px] tracking-wide text-ink-muted uppercase">
              {formatFieldLabel(k)}
            </dt>
            <dd className="break-words text-ink-primary">{formatScalar(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return <p className="break-words text-ink-primary">{formatScalar(value)}</p>;
}

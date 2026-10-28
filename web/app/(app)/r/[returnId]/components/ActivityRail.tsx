"use client";

import { fetchActivityItems, type ActivityItem, type Verdict } from "@/lib/activity";
import { cn } from "@/lib/cn";
import { briefValue, humanizeKey, timeAgo } from "@/lib/format";
import { useEffect, useState } from "react";
import { POLL_INTERVAL_MS } from "./RequestedActions";

export function ActivityTicker({ refreshKey }: { refreshKey: number }) {
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
          Nothing yet. Items appear here the moment Cade records them.
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
          <DetailBlock label="Why Cade decided this">
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
    accurate: "text-ok bg-ok/10",
    inaccurate: "text-danger bg-danger/10",
    ungroundable: "text-warn bg-warn/10",
    needs_more_facts: "text-warn bg-warn/10",
    review_failed: "text-ink-muted bg-bg-elevated",
    review_unreached: "text-ink-muted bg-bg-elevated",
  };
  const labels: Record<Verdict, string> = {
    pending: "Reviewing",
    accurate: "Grounded",
    inaccurate: "Conflict",
    ungroundable: "No source",
    needs_more_facts: "Needs info",
    review_failed: "Failed",
    review_unreached: "Retry pending",
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

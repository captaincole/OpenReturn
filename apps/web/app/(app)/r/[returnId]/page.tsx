"use client";

/*
 * Home tab for the active return. A synthesized dashboard:
 *   - Progress card with clickable category drill-downs
 *   - Requested actions (the Plan list lives in the chat pane)
 *   - Activity ticker with an inline detail panel
 *
 * Real data comes from useAppShell() — state.forms, state.pendingFacts,
 * state.pendingDecisions. The category model (static sub-items, the
 * hand-rolled per-category pct) lives in components/ProgressCategories.
 */

import { useAppShell } from "@/components/AppShell";
import { computeOverallPct } from "@/lib/api";
import { useEffect, useState } from "react";
import { ActivityTicker } from "./components/ActivityRail";
import {
  CATEGORIES,
  CategoryDetailsPanel,
  defaultExpandedCategoryId,
  ProgressSegment,
  type UploadRow,
} from "./components/ProgressCategories";
import { RequestedActionsCard } from "./components/RequestedActions";

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

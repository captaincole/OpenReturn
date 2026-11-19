"use client";

import { type PlanItem } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useState } from "react";

const CAP = 3;

/* The return's open plan items, at the top of the composer. */
export function PlanRail({ plan, hidden }: { plan: PlanItem[]; hidden: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const active = plan.filter((item) => item.status !== "done");
  if (hidden || active.length === 0) return null;

  const visible = showAll ? active : active.slice(0, CAP);

  return (
    <div className="border-b border-border-subtle px-4 py-2 sm:pt-3 sm:pb-2.5">
      {!showAll && <PhonePlanLine active={active} onShowAll={() => setShowAll(true)} />}
      <div className={cn(!showAll && "hidden sm:block")}>
        <PlanList
          active={active}
          visible={visible}
          showAll={showAll}
          onToggle={() => setShowAll(!showAll)}
        />
      </div>
    </div>
  );
}

/*
 * A phone with the keyboard up has room for one line: the item Cade is on,
 * and a button that opens the list.
 */
function PhonePlanLine({ active, onShowAll }: { active: PlanItem[]; onShowAll: () => void }) {
  return (
    <div className="flex items-center gap-2 sm:hidden">
      <ul className="min-w-0 flex-1">
        <PlanRailRow item={active[0]} />
      </ul>
      {active.length > 1 && (
        <button
          type="button"
          onClick={onShowAll}
          className="shrink-0 text-[11px] text-accent hover:text-accent-hover"
        >
          +{active.length - 1} more
        </button>
      )}
    </div>
  );
}

interface PlanListProps {
  active: PlanItem[];
  visible: PlanItem[];
  showAll: boolean;
  onToggle: () => void;
}

function PlanList({ active, visible, showAll, onToggle }: PlanListProps) {
  const hiddenCount = active.length - visible.length;
  return (
    <>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10px] tracking-[0.18em] text-ink-muted uppercase">Plan</span>
        <span className="text-[10px] text-ink-muted tabular-nums">{active.length} active</span>
      </div>
      <ul className="space-y-1.5">
        {visible.map((item) => (
          <PlanRailRow key={item.id} item={item} />
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-1.5 text-[11px] text-accent hover:text-accent-hover"
        >
          See {hiddenCount} more
        </button>
      )}
      {showAll && active.length > 1 && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-1.5 text-[11px] text-ink-muted hover:text-ink-secondary"
        >
          Show less
        </button>
      )}
    </>
  );
}

function PlanRailRow({ item }: { item: PlanItem }) {
  const isDoing = item.status === "doing";
  return (
    <li className="flex items-start gap-2">
      {isDoing ? (
        <span className="mt-[5px] h-2 w-2 shrink-0 animate-pulse-soft rounded-full bg-accent" />
      ) : (
        <span className="mt-[4px] h-2.5 w-2.5 shrink-0 rounded-full border border-border-strong" />
      )}
      <span
        className={cn(
          "truncate text-[12px] leading-snug",
          isDoing ? "text-ink-primary" : "text-ink-secondary",
        )}
      >
        {item.title}
      </span>
    </li>
  );
}

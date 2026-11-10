"use client";

import { type PlanItem } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useState } from "react";

/* The return's open plan items, at the top of the composer. */
export function PlanRail({ plan, hidden }: { plan: PlanItem[]; hidden: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const active = plan.filter((item) => item.status !== "done");
  if (hidden || active.length === 0) return null;

  const CAP = 3;
  const visible = showAll ? active : active.slice(0, CAP);
  const hiddenCount = active.length - visible.length;

  return (
    <div className="border-b border-border-subtle px-4 pt-3 pb-2.5">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10px] tracking-[0.18em] text-ink-muted uppercase">Plan</span>
        <span className="text-[10px] text-ink-muted tabular-nums">{active.length} active</span>
      </div>
      <ul className="space-y-1.5">
        {visible.map((item) => (
          <PlanRailRow key={item.id} item={item} />
        ))}
      </ul>
      {hiddenCount > 0 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-1.5 text-[11px] text-accent hover:text-accent-hover"
        >
          See {hiddenCount} more
        </button>
      )}
      {showAll && active.length > CAP && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mt-1.5 text-[11px] text-ink-muted hover:text-ink-secondary"
        >
          Show less
        </button>
      )}
    </div>
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

"use client";

import type { PlanItem, PlanItemStatus } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";

/*
 * Renders Luca's rolling plan from /app/state. The parent page re-fetches
 * state after each chat turn or reset, and the card re-renders. Items keep
 * stable ids across status changes, so the same row visually transitions
 * todo → doing → done. When a row flips to done, it stays visible for
 * FADE_OUT_MS so the user sees the checkmark. Then it drops out.
 *
 * An empty plan renders the card with a short placeholder line.
 */

const FADE_OUT_MS = 1100;

interface PlanCardProps {
  plan: PlanItem[];
}

interface DisplayItem extends PlanItem {
  // Set when the row is done or dropped upstream. A timer then removes it.
  leaving?: boolean;
}

export function PlanCard({ plan }: PlanCardProps) {
  const [display, setDisplay] = useState<DisplayItem[]>(plan);
  const removalTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /*
   * Reconcile `display` when the upstream plan changes. Incoming items
   * replace their display rows, except rows already marked leaving — those
   * finish their fade. Items that the upstream plan dropped also get the
   * leaving flag, so they fade instead of popping out.
   */
  useEffect(() => {
    setDisplay((prev) => {
      const incomingById = new Map(plan.map((p) => [p.id, p]));
      const next: DisplayItem[] = [];

      // Adopt the new status of items still present upstream.
      for (const incoming of plan) {
        const wasLeaving = prev.find((p) => p.id === incoming.id)?.leaving;
        if (wasLeaving) {
          /*
           * The row already fades out. Do not restore it because the
           * upstream snapshot still includes it. A committed fade always
           * completes.
           */
          continue;
        }
        next.push(incoming);
      }

      /*
       * The upstream plan dropped these items, for example when Luca
       * rewrote the array without them. Keep them briefly with their last
       * status so the disappearance is not a hard pop-out. We cannot tell
       * a deliberate drop from a missed status flip, so treat both the
       * same.
       */
      for (const old of prev) {
        if (incomingById.has(old.id)) continue;
        if (old.leaving) {
          next.push(old);
          continue;
        }
        next.push({ ...old, leaving: true });
        scheduleRemoval(old.id);
      }

      /*
       * Also schedule `done` items to leave. Keep them visible meanwhile
       * so the checkmark animation is readable.
       */
      for (const item of next) {
        if (item.status === "done" && !item.leaving) {
          item.leaving = true;
          scheduleRemoval(item.id);
        }
      }

      return next;
    });
    // Deps are intentionally limited to `plan`. See the removal timers above.
  }, [plan]);

  function scheduleRemoval(id: string) {
    if (removalTimers.current.has(id)) return;
    const timer = setTimeout(() => {
      setDisplay((prev) => prev.filter((p) => p.id !== id));
      removalTimers.current.delete(id);
    }, FADE_OUT_MS);
    removalTimers.current.set(id, timer);
  }

  /*
   * Capture the timers Map so the cleanup closure clears the same
   * instance after re-renders.
   */
  const timersAtCleanup = removalTimers.current;
  useEffect(() => {
    return () => {
      for (const t of timersAtCleanup.values()) clearTimeout(t);
      timersAtCleanup.clear();
    };
  }, [timersAtCleanup]);

  const activeCount = display.filter((d) => !d.leaving).length;
  const isEmpty = display.length === 0;

  return (
    <section className="card flex min-h-0 flex-1 flex-col">
      <div className="card-header shrink-0">
        <span>Plan</span>
        {activeCount > 0 && (
          <span className="tracking-normal text-ink-muted normal-case tabular-nums">
            {activeCount}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="px-5 pt-1 pb-5 text-sm leading-relaxed text-ink-muted">
            Luca&rsquo;s next steps will appear here as he works.
          </div>
        ) : (
          <ul className="space-y-2.5 px-5 pb-4">
            {display.map((item) => (
              <PlanRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PlanRow({ item }: { item: DisplayItem }) {
  const isDoing = item.status === "doing";
  const isDone = item.status === "done";

  return (
    <li
      className={cn(
        "flex items-start gap-2.5 transition-all duration-500",
        item.leaving && "-translate-y-0.5 opacity-0",
      )}
    >
      <StatusIcon status={item.status} />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm leading-snug transition-colors duration-300",
            isDoing && "font-medium text-ink-primary",
            isDone && "text-ink-muted line-through decoration-ink-faint/60",
            !isDoing && !isDone && "text-ink-secondary",
          )}
        >
          {item.title}
        </div>
        {item.note && !isDone && (
          <div className="mt-0.5 text-[12px] leading-snug text-ink-muted">{item.note}</div>
        )}
      </div>
    </li>
  );
}

function StatusIcon({ status }: { status: PlanItemStatus }) {
  if (status === "done") {
    return (
      <svg viewBox="0 0 16 16" className="mt-[3px] h-3.5 w-3.5 shrink-0 text-ok" aria-hidden>
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
    );
  }
  if (status === "doing") {
    return (
      <span
        className="mt-[5px] h-2.5 w-2.5 shrink-0 animate-pulse-soft rounded-full bg-accent"
        aria-label="In progress"
      />
    );
  }
  return (
    <span
      className="mt-[4px] h-3 w-3 shrink-0 rounded-full border border-border-strong"
      aria-label="To do"
    />
  );
}

"use client";

import { cn } from "@/lib/cn";
import {
  ALL_JURISDICTIONS,
  canTurnOff,
  jurisdictionLabel,
  toggleJurisdiction,
  type Jurisdiction,
} from "@/lib/jurisdictions";
import { useId } from "react";

/*
 * One switch per library. Each is a toggle button (aria-pressed), so Tab and
 * Space or Enter work. The last switch that is on cannot turn off: it says so
 * with aria-disabled and a title, and stays in the tab order.
 */
export function JurisdictionSwitches({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: readonly Jurisdiction[];
  onChange: (next: Jurisdiction[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const labelId = useId();
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      <span id={labelId} className="text-[12px] text-ink-muted">
        Search
      </span>
      {ALL_JURISDICTIONS.map((jurisdiction) => {
        const on = value.includes(jurisdiction);
        const locked = !canTurnOff(value, jurisdiction);
        return (
          <button
            key={jurisdiction}
            type="button"
            aria-pressed={on}
            aria-disabled={locked || undefined}
            disabled={disabled}
            title={locked ? "At least one library stays on" : undefined}
            onClick={() => {
              if (!locked) onChange(toggleJurisdiction(value, jurisdiction));
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition-colors disabled:opacity-60",
              on
                ? "border-accent/50 bg-accent/15 text-ink-primary"
                : "border-border-subtle text-ink-muted hover:border-border-strong hover:text-ink-primary",
              locked && "cursor-default",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                on ? "bg-accent" : "border border-border-strong",
              )}
            />
            {jurisdictionLabel(jurisdiction)}
          </button>
        );
      })}
    </div>
  );
}

import { cn } from "@/lib/cn";
import { FIELD_STATES, STATE_LABELS, type FieldState, type StateCounts } from "@/lib/formGraph";

/* Verified, locked and not run are theme status colors; unsupported is neutral: nothing is there. */
export const STATE_BG: Record<FieldState, string> = {
  verified: "bg-ok",
  locked: "bg-warn",
  not_run: "bg-accent",
  unsupported: "bg-ink-muted",
};

export const STATE_FILL: Record<FieldState, string> = {
  verified: "fill-ok",
  locked: "fill-warn",
  not_run: "fill-accent",
  unsupported: "fill-ink-muted",
};

export function StateDot({ state }: { state: FieldState }) {
  return <span className={cn("inline-block h-2 w-2 shrink-0 rounded-[2px]", STATE_BG[state])} />;
}

/* The counts as text, so the colors never carry the numbers alone. */
export function StateCountsLine({ states }: { states: StateCounts }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-secondary">
      {FIELD_STATES.map((state) => (
        <li key={state} className="flex items-center gap-1.5">
          <StateDot state={state} />
          <span className="text-ink-primary tabular-nums">{states[state].toLocaleString()}</span>
          {STATE_LABELS[state].toLowerCase()}
        </li>
      ))}
    </ul>
  );
}

export function StateBar({ states }: { states: StateCounts }) {
  const shown = FIELD_STATES.filter((state) => states[state] > 0);
  return (
    <div className="flex h-2.5 w-full gap-0.5" aria-hidden>
      {shown.map((state) => (
        <div
          key={state}
          title={`${states[state]} ${STATE_LABELS[state].toLowerCase()}`}
          className={cn("min-w-1 rounded-[2px]", STATE_BG[state])}
          style={{ flexGrow: states[state], flexBasis: 0 }}
        />
      ))}
    </div>
  );
}

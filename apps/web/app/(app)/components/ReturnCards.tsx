import { cn } from "@/lib/cn";
import { type TaxReturn } from "@/lib/returns";
import { CURRENT_TAX_YEAR } from "./constants";
import { Section } from "./Section";
import { StartFilingButton } from "./StartFilingButton";

export function ReturnsSection({
  returns,
  hasCurrentYear,
}: {
  returns: TaxReturn[];
  hasCurrentYear: boolean;
}) {
  if (returns.length === 0) {
    return (
      <Section title="Tax returns">
        <EmptyReturnsCta />
      </Section>
    );
  }
  return (
    <Section
      title="Tax returns"
      right={
        returns.some((r) => r.state === "filed") ? (
          <button className="text-sm text-ink-secondary hover:text-ink-primary">
            View archive →
          </button>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {returns.map((r) => (
          <ReturnCard key={r.filingId} ret={r} />
        ))}
        {hasCurrentYear ? <NewReturnTile /> : <StartReturnTile />}
      </div>
    </Section>
  );
}

function ReturnCard({ ret }: { ret: TaxReturn }) {
  const isActive = ret.state === "active";
  const isFiled = ret.state === "filed";
  return (
    <a
      href={`/r/${ret.id}`}
      className={cn(
        "card flex min-h-[160px] flex-col gap-4 p-5 transition-all",
        isActive
          ? "ring-1 ring-accent/30 hover:border-accent/30 hover:ring-accent/50"
          : "hover:border-border-strong",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-ink-muted uppercase">
            Tax Year {ret.year}
          </div>
          <div className="mt-1 text-[15px] font-semibold tracking-tight text-ink-primary">
            {ret.label}
          </div>
        </div>
        {isActive && (
          <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] tracking-wider text-accent uppercase">
            Active
          </span>
        )}
        {isFiled && (
          <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] tracking-wider text-emerald-400 uppercase">
            Filed
          </span>
        )}
      </div>

      <div className="mt-auto">
        {isActive ? (
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-ink-muted">In progress</span>
            <span className="text-ink-secondary">Open →</span>
          </div>
        ) : (
          <div className="text-[12px] text-ink-muted">Filed</div>
        )}
      </div>
    </a>
  );
}

/*
 * Large inline CTA when the user has no filings yet. It replaces the
 * returns grid. The page intentionally looks empty until the user starts
 * a filing; placeholder cards would hide that state.
 */
function EmptyReturnsCta() {
  return (
    <div className="card flex flex-col items-start gap-5 p-8 sm:p-10">
      <div>
        <div className="text-[10px] tracking-[0.18em] text-ink-muted uppercase">
          Tax Year {CURRENT_TAX_YEAR}
        </div>
        <h3 className="mt-1.5 font-serif text-2xl text-ink-primary">
          Start your {CURRENT_TAX_YEAR} filing
        </h3>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-secondary">
          Luca will walk you through everything — wages, investments, deductions — and keep a
          citation for every fact. You can pause and pick up where you left off anytime.
        </p>
      </div>
      <StartFilingButton
        taxYear={CURRENT_TAX_YEAR}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Start filing →
      </StartFilingButton>
    </div>
  );
}

function StartReturnTile() {
  return (
    <StartFilingButton
      taxYear={CURRENT_TAX_YEAR}
      className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/40 p-5 text-center text-accent transition-colors hover:border-accent hover:text-accent-hover"
    >
      <span className="text-2xl">+</span>
      <span className="text-sm">Start {CURRENT_TAX_YEAR} return</span>
    </StartFilingButton>
  );
}

function NewReturnTile() {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-subtle p-5 text-center text-ink-muted">
      <span className="text-2xl opacity-40">+</span>
      <span className="text-sm">New returns open in {CURRENT_TAX_YEAR + 1}</span>
    </div>
  );
}

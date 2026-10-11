import { CURRENT_TAX_YEAR } from "./constants";
import { Section } from "./Section";
import { StartFilingButton } from "./StartFilingButton";

export function ContinueWithSection({
  hasCurrentYear,
  hasAnyFiledReturn,
}: {
  hasCurrentYear: boolean;
  hasAnyFiledReturn: boolean;
}) {
  return (
    <Section title="Continue with">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {hasCurrentYear ? (
          <DisabledWorkflowCard
            title={`Start ${CURRENT_TAX_YEAR} filing`}
            desc={`You already have a ${CURRENT_TAX_YEAR} return in progress. Open it from above.`}
            icon="+"
            note="Already in progress"
          />
        ) : (
          <StartFilingCard taxYear={CURRENT_TAX_YEAR} />
        )}
        <LockedWorkflowCard
          title="Tax planning session"
          desc="Look ahead — reduce next year's liability before December."
          icon="○"
          unlockText={hasAnyFiledReturn ? "Coming soon" : "Unlocked after your first filed return"}
        />
      </div>
    </Section>
  );
}

function StartFilingCard({ taxYear }: { taxYear: number }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 text-base text-accent">
        +
      </div>
      <div>
        <div className="text-[15px] font-medium text-ink-primary">Start a new filing</div>
        <div className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
          Begin your {taxYear} return. Luca will guide intake from scratch.
        </div>
      </div>
      <StartFilingButton
        taxYear={taxYear}
        className="mt-1 self-start text-[12px] text-accent transition-colors hover:text-accent-hover"
      >
        Start {taxYear} filing →
      </StartFilingButton>
    </div>
  );
}

function DisabledWorkflowCard({
  title,
  desc,
  icon,
  note,
}: {
  title: string;
  desc: string;
  icon: string;
  note: string;
}) {
  return (
    <div className="card flex cursor-not-allowed flex-col gap-3 p-5 opacity-60">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-elevated text-base text-ink-muted">
        {icon}
      </div>
      <div>
        <div className="text-[15px] font-medium text-ink-primary">{title}</div>
        <div className="mt-1 text-[13px] leading-relaxed text-ink-secondary">{desc}</div>
      </div>
      <div className="text-[11px] tracking-wider text-ink-muted uppercase">{note}</div>
    </div>
  );
}

function LockedWorkflowCard({
  title,
  desc,
  icon,
  unlockText,
}: {
  title: string;
  desc: string;
  icon: string;
  unlockText: string;
}) {
  return (
    <div className="card relative flex flex-col gap-3 overflow-hidden p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-elevated text-base text-ink-muted">
        {icon}
      </div>
      <div>
        <div className="text-[15px] font-medium text-ink-primary">{title}</div>
        <div className="mt-1 text-[13px] leading-relaxed text-ink-secondary">{desc}</div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
        <LockIcon className="h-3 w-3" />
        <span>{unlockText}</span>
      </div>
    </div>
  );
}

export function LockOverlay({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-bg-base/40 backdrop-blur-[2px]">
      <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated/90 px-4 py-2.5 text-[12px] text-ink-secondary">
        <LockIcon className="h-3.5 w-3.5" />
        <span>{text}</span>
      </div>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

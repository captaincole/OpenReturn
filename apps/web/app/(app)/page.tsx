/*
 * Home-home — the person-scope landing page, above any single return.
 *
 * Server component, no client state. The parent (app)/layout.tsx gates
 * auth. No AppShell and no chat, because no return is active here.
 *
 * Sections:
 *   1. Your returns      — filings from listOwnerReturns; the empty state
 *                          shows one big "Start your 2025 filing" CTA.
 *   2. Continue with     — "Start a new filing" (action) + "Tax planning
 *                          session" (locked placeholder).
 *   3. Your tax picture  — four chart cards, overlay-locked until the
 *                          user has a filed return.
 *
 * The charts read mock data under the overlay because we do not capture
 * year-over-year history yet. When we do, replace the consts with a
 * serverDb query and remove the overlay.
 */

import { cn } from "@/lib/cn";
import { getOwnerSession } from "@/lib/localAuth";
import { deriveProfile, type UserProfile } from "@/lib/profile";
import { type TaxReturn } from "@/lib/returns";
import { listOwnerReturns } from "@/lib/serverDb";
import { redirect } from "next/navigation";
import { HomeTopBar } from "./HomeTopBar";
import { StartFilingButton } from "./StartFilingButton";

const CURRENT_TAX_YEAR = 2025;

/*
 * Mock historical data. Replace with a serverDb query when we capture
 * year-over-year aggregates. A "locked" overlay covers the charts, so
 * the user sees what comes next and we do not present the data as real.
 */
const INCOME = [
  { year: 2021, value: 145000 },
  { year: 2022, value: 162000 },
  { year: 2023, value: 178000 },
  { year: 2024, value: 192000 },
  { year: 2025, value: 186400 },
];
const EFFECTIVE_RATE = [
  { year: 2021, value: 22.4 },
  { year: 2022, value: 23.1 },
  { year: 2023, value: 24.0 },
  { year: 2024, value: 24.6 },
  { year: 2025, value: 23.8 },
];
const REFUND: { year: number; value: number | null }[] = [
  { year: 2021, value: 2100 },
  { year: 2022, value: -1400 },
  { year: 2023, value: 3200 },
  { year: 2024, value: 4210 },
  { year: 2025, value: null },
];
const CHARITABLE = [
  { year: 2021, value: 4200 },
  { year: 2022, value: 5800 },
  { year: 2023, value: 7500 },
  { year: 2024, value: 9100 },
  { year: 2025, value: 10500 },
];

export default async function HomeHome() {
  const session = await getOwnerSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);

  const returns = await listOwnerReturns(session.userId);
  const hasCurrentYear = returns.some((r) => r.year === CURRENT_TAX_YEAR);
  const hasAnyFiledReturn = returns.some((r) => r.state === "filed");

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} />
      <main className="flex-1 px-6 py-10 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl space-y-14">
          <Greeting profile={profile} />

          <ReturnsSection returns={returns} hasCurrentYear={hasCurrentYear} />

          <ContinueWithSection
            hasCurrentYear={hasCurrentYear}
            hasAnyFiledReturn={hasAnyFiledReturn}
          />

          <TaxPictureSection locked={!hasAnyFiledReturn} />
        </div>
      </main>
    </div>
  );
}

function Greeting({ profile }: { profile: UserProfile }) {
  return (
    <header>
      <h1 className="font-serif text-4xl text-ink-primary">Hi, {profile.firstName}.</h1>
      <p className="mt-2.5 text-[15px] text-ink-secondary">Your tax life, in one place.</p>
    </header>
  );
}

function ReturnsSection({
  returns,
  hasCurrentYear,
}: {
  returns: TaxReturn[];
  hasCurrentYear: boolean;
}) {
  if (returns.length === 0) {
    return (
      <Section title="Your returns">
        <EmptyReturnsCta />
      </Section>
    );
  }
  return (
    <Section
      title="Your returns"
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
        {!hasCurrentYear && <NewReturnTile />}
      </div>
    </Section>
  );
}

function ContinueWithSection({
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

function TaxPictureSection({ locked }: { locked: boolean }) {
  return (
    <Section title="Your tax picture">
      <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Income"
          subtitle="Wages + investment income, last 5 years"
          value={fmtCurrencyFull(INCOME[INCOME.length - 1].value)}
          valueLabel="2025 (in progress)"
        >
          <BarChart data={INCOME} colorClass="fill-accent" valueFormatter={fmtCurrencyShort} />
        </ChartCard>
        <ChartCard
          title="Effective tax rate"
          subtitle="Federal, after deductions"
          value={`${EFFECTIVE_RATE[EFFECTIVE_RATE.length - 1].value.toFixed(1)}%`}
          valueLabel="2025 (estimated)"
        >
          <LineChart
            data={EFFECTIVE_RATE}
            valueFormatter={(v) => `${v.toFixed(1)}%`}
            domain={[20, 26]}
          />
        </ChartCard>
        <ChartCard
          title="Federal refund / owed"
          subtitle="What came back or went out"
          value="Pending"
          valueLabel="2025 (calculating)"
        >
          <DivergentBarChart data={REFUND} valueFormatter={fmtSigned} />
        </ChartCard>
        <ChartCard
          title="Charitable giving"
          subtitle="Cash + non-cash donations"
          value={fmtCurrencyFull(CHARITABLE[CHARITABLE.length - 1].value)}
          valueLabel="2025 year-to-date"
        >
          <BarChart
            data={CHARITABLE}
            colorClass="fill-emerald-400"
            valueFormatter={fmtCurrencyShort}
          />
        </ChartCard>
        {locked && <LockOverlay text="Unlocked after your first filed return" />}
      </div>
    </Section>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-[11px] tracking-[0.22em] text-ink-muted uppercase">{title}</h2>
        {right}
      </div>
      {children}
    </section>
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

function NewReturnTile() {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-subtle p-5 text-center text-ink-muted">
      <span className="text-2xl opacity-40">+</span>
      <span className="text-sm">New returns open in {CURRENT_TAX_YEAR + 1}</span>
    </div>
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

function LockOverlay({ text }: { text: string }) {
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

function ChartCard({
  title,
  subtitle,
  value,
  valueLabel,
  children,
}: {
  title: string;
  subtitle: string;
  value: string;
  valueLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] tracking-[0.18em] text-ink-muted uppercase">{title}</div>
          <div className="mt-1 text-[13px] text-ink-secondary">{subtitle}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-semibold tracking-tight text-ink-primary tabular-nums">
            {value}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-muted">{valueLabel}</div>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

const CHART_W = 400;
const CHART_H = 140;
const CHART_PAD_X = 16;
const CHART_PAD_Y = 24;

function BarChart({
  data,
  colorClass,
  valueFormatter,
}: {
  data: { year: number; value: number }[];
  colorClass: string;
  valueFormatter: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value)) * 1.18;
  const slotW = (CHART_W - 2 * CHART_PAD_X) / data.length;
  const barW = slotW * 0.55;

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 24}`} className="w-full">
      {data.map((d, i) => {
        const x = CHART_PAD_X + slotW * i + (slotW - barW) / 2;
        const h = (d.value / max) * (CHART_H - 2 * CHART_PAD_Y);
        const y = CHART_H - CHART_PAD_Y - h;
        const isCurrent = i === data.length - 1;
        return (
          <g key={d.year}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={3}
              className={colorClass}
              opacity={isCurrent ? 0.55 : 1}
            />
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              className="fill-ink-secondary text-[10px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {valueFormatter(d.value)}
            </text>
            <text
              x={x + barW / 2}
              y={CHART_H + 14}
              textAnchor="middle"
              className="fill-ink-muted text-[10px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {d.year}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({
  data,
  valueFormatter,
  domain,
}: {
  data: { year: number; value: number }[];
  valueFormatter: (v: number) => string;
  domain: [number, number];
}) {
  const [min, max] = domain;
  const slotW = (CHART_W - 2 * CHART_PAD_X) / (data.length - 1);

  const points = data.map((d, i) => {
    const x = CHART_PAD_X + slotW * i;
    const y = CHART_H - CHART_PAD_Y - ((d.value - min) / (max - min)) * (CHART_H - 2 * CHART_PAD_Y);
    return { x, y, d };
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${CHART_H - CHART_PAD_Y} L ${points[0].x} ${CHART_H - CHART_PAD_Y} Z`;

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 24}`} className="w-full">
      <defs>
        <linearGradient id="home-line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(124 92 255)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(124 92 255)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#home-line-fill)" />
      <path
        d={linePath}
        stroke="rgb(124 92 255)"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p) => (
        <g key={p.d.year}>
          <circle
            cx={p.x}
            cy={p.y}
            r={3.5}
            className="fill-bg-base"
            stroke="rgb(124 92 255)"
            strokeWidth={1.5}
          />
          <text
            x={p.x}
            y={p.y - 10}
            textAnchor="middle"
            className="fill-ink-secondary text-[10px]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {valueFormatter(p.d.value)}
          </text>
          <text
            x={p.x}
            y={CHART_H + 14}
            textAnchor="middle"
            className="fill-ink-muted text-[10px]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {p.d.year}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DivergentBarChart({
  data,
  valueFormatter,
}: {
  data: { year: number; value: number | null }[];
  valueFormatter: (v: number) => string;
}) {
  const present = data.filter((d): d is { year: number; value: number } => d.value !== null);
  const max = Math.max(...present.map((d) => Math.abs(d.value))) * 1.18;
  const baseline = CHART_H / 2;
  const halfH = (CHART_H - 2 * CHART_PAD_Y) / 2;
  const slotW = (CHART_W - 2 * CHART_PAD_X) / data.length;
  const barW = slotW * 0.55;

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 24}`} className="w-full">
      <line
        x1={CHART_PAD_X}
        y1={baseline}
        x2={CHART_W - CHART_PAD_X}
        y2={baseline}
        stroke="rgb(46 46 56)"
        strokeWidth={1}
      />
      {data.map((d, i) => {
        const x = CHART_PAD_X + slotW * i + (slotW - barW) / 2;
        const isPending = d.value === null;
        const v = d.value ?? 0;
        const h = (Math.abs(v) / max) * halfH;
        const y = v >= 0 ? baseline - h : baseline;
        const labelY = v >= 0 ? y - 6 : y + h + 11;

        return (
          <g key={d.year}>
            {!isPending && (
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={3}
                className={v >= 0 ? "fill-emerald-400" : "fill-red-400"}
              />
            )}
            {isPending && (
              <rect
                x={x}
                y={baseline - 2}
                width={barW}
                height={4}
                rx={2}
                className="fill-ink-faint/40"
              />
            )}
            {!isPending && (
              <text
                x={x + barW / 2}
                y={labelY}
                textAnchor="middle"
                className="fill-ink-secondary text-[10px]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {valueFormatter(v)}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={CHART_H + 14}
              textAnchor="middle"
              className="fill-ink-muted text-[10px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {d.year}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function fmtCurrencyFull(n: number): string {
  return `$${n.toLocaleString()}`;
}
function fmtCurrencyShort(n: number): string {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}
function fmtSigned(n: number): string {
  if (n > 0) return `+$${n.toLocaleString()}`;
  if (n < 0) return `-$${Math.abs(n).toLocaleString()}`;
  return "$0";
}

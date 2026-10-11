"use client";

/*
 * Home-home mock — the person-scope landing page, above any single
 * return. No chat (no active return to chat about). Full-width dashboard:
 *   1. Your returns           — all in-progress + filed returns
 *   2. Continue with          — workflow entry points (new return, amend, plan)
 *   3. Your tax picture       — lifetime visualizations (income, refund, etc.)
 *
 * Mock data only. The return cards link into /preview (the return-scoped
 * view) to demonstrate the navigation model.
 */

import { cn } from "@/lib/cn";
import Link from "next/link";

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Mock data
 * ────────────────────────────────────────────────────────────────────────────
 */

const RETURNS = [
  {
    id: "2025",
    year: 2025,
    label: "2025 Return",
    state: "active" as const,
    progress: 60,
    openAsks: 3,
    subtitle: "60% complete · 3 open asks",
  },
  {
    id: "2024-amend",
    year: 2024,
    label: "2024 Amend",
    state: "empty" as const,
    progress: 0,
    openAsks: 0,
    subtitle: "Not started",
  },
  {
    id: "2023",
    year: 2023,
    label: "2023 Return",
    state: "filed" as const,
    progress: 100,
    openAsks: 0,
    filedOn: "Mar 12, 2024",
    outcome: "Refund $4,210",
    outcomePositive: true,
  },
  {
    id: "2022",
    year: 2022,
    label: "2022 Return",
    state: "filed" as const,
    progress: 100,
    openAsks: 0,
    filedOn: "Mar 28, 2023",
    outcome: "Owed $1,400",
    outcomePositive: false,
  },
];

const WORKFLOWS = [
  {
    id: "new-2026",
    title: "Start 2026 return",
    desc: "Begin a new tax year. Luca will guide intake from scratch.",
    icon: "+",
  },
  {
    id: "amend",
    title: "Amend a prior year",
    desc: "Open a previously filed return to correct or update.",
    icon: "↻",
  },
  {
    id: "planning",
    title: "Tax planning session",
    desc: "Look ahead — reduce next year's liability before December.",
    icon: "○",
  },
];

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

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Page
 * ────────────────────────────────────────────────────────────────────────────
 */

export default function HomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar />
      <main className="flex-1 px-6 py-10 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-6xl space-y-14">
          <header>
            <h1 className="font-serif text-4xl text-ink-primary">Hi, Alex.</h1>
            <p className="mt-2.5 text-[15px] text-ink-secondary">Your tax life, in one place.</p>
          </header>

          <Section
            title="Your returns"
            right={
              <button className="text-sm text-ink-secondary hover:text-ink-primary">
                View archive →
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {RETURNS.map((r) => (
                <ReturnCard key={r.id} ret={r} />
              ))}
              <NewReturnCard />
            </div>
          </Section>

          <Section title="Continue with">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {WORKFLOWS.map((w) => (
                <WorkflowCard key={w.id} workflow={w} />
              ))}
            </div>
          </Section>

          <Section title="Your tax picture">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard
                title="Income"
                subtitle="Wages + investment income, last 5 years"
                value={fmtCurrencyFull(INCOME[INCOME.length - 1].value)}
                valueLabel="2025 (in progress)"
              >
                <BarChart
                  data={INCOME}
                  colorClass="fill-accent"
                  valueFormatter={(v) => fmtCurrencyShort(v)}
                />
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
                  valueFormatter={(v) => fmtCurrencyShort(v)}
                />
              </ChartCard>
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Top bar — minimal, no return picker (no return is active here)
 * ────────────────────────────────────────────────────────────────────────────
 */

function HomeTopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-bg-base/95 px-4 backdrop-blur-sm lg:px-6">
      <Link
        href="/preview/home"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 transition-colors hover:bg-accent/25"
        title="Home"
      >
        <span className="font-serif text-sm leading-none text-accent">W</span>
      </Link>
      <div className="h-6 w-px shrink-0 bg-border-subtle" />
      <span className="text-[15px] font-semibold tracking-tight text-ink-primary">Home</span>
      <div className="flex-1" />
      <button
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-ink-secondary transition-colors hover:border-border-strong hover:text-ink-primary"
        title="Settings"
      >
        ⚙
      </button>
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/20 text-xs font-medium text-accent">
        AC
      </div>
    </header>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Section wrapper
 * ────────────────────────────────────────────────────────────────────────────
 */

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

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Return cards
 * ────────────────────────────────────────────────────────────────────────────
 */

function ReturnCard({ ret }: { ret: (typeof RETURNS)[number] }) {
  const isActive = ret.state === "active";
  const isFiled = ret.state === "filed";
  const isEmpty = ret.state === "empty";

  return (
    <Link
      href="/preview"
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
        {isActive && (
          <>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
              <div className="h-full bg-accent" style={{ width: `${ret.progress}%` }} />
            </div>
            <div className="mt-2 flex items-baseline justify-between text-[11px]">
              <span className="text-ink-muted tabular-nums">{ret.progress}% complete</span>
              <span className="text-ink-secondary">{ret.openAsks} open asks</span>
            </div>
          </>
        )}
        {isFiled && (
          <div className="text-[12px] leading-relaxed">
            <div
              className={cn(
                "font-semibold tabular-nums",
                ret.outcomePositive ? "text-emerald-400" : "text-red-400",
              )}
            >
              {ret.outcome}
            </div>
            <div className="mt-0.5 text-ink-muted">Filed {ret.filedOn}</div>
          </div>
        )}
        {isEmpty && <div className="text-[12px] text-ink-muted">Not started — open to begin.</div>}
      </div>
    </Link>
  );
}

function NewReturnCard() {
  return (
    <button className="group flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-subtle p-5 text-center text-ink-muted transition-colors hover:border-accent/50 hover:text-ink-primary">
      <span className="text-2xl transition-colors group-hover:text-accent">+</span>
      <span className="text-sm">Start a new return</span>
    </button>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Workflow cards
 * ────────────────────────────────────────────────────────────────────────────
 */

function WorkflowCard({ workflow }: { workflow: (typeof WORKFLOWS)[number] }) {
  return (
    <button className="card group flex flex-col gap-3 p-5 text-left transition-colors hover:border-border-strong">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 text-base text-accent transition-colors group-hover:bg-accent/25">
        {workflow.icon}
      </div>
      <div>
        <div className="text-[15px] font-medium text-ink-primary">{workflow.title}</div>
        <div className="mt-1 text-[13px] leading-relaxed text-ink-secondary">{workflow.desc}</div>
      </div>
    </button>
  );
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Chart card + charts (hand-rolled SVG)
 * ────────────────────────────────────────────────────────────────────────────
 */

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
        <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(124 92 255)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(124 92 255)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#line-fill)" />
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
        const yearY = CHART_H + 14;

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
              y={yearY}
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

/*
 * ────────────────────────────────────────────────────────────────────────────
 * Formatters
 * ────────────────────────────────────────────────────────────────────────────
 */

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

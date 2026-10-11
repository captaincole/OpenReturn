import { Section } from "./Section";
import { LockOverlay } from "./WorkflowCards";

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

export function TaxPictureSection({ locked }: { locked: boolean }) {
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

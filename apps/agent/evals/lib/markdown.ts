export const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/* "72%" when every run scored the same; "72% (61–78)" when runs differ. */
export function scoreCell(scores: number[]): string {
  const [lo, hi] = [Math.min(...scores), Math.max(...scores)];
  return lo === hi ? pct(avg(scores)) : `${pct(avg(scores))} (${pct(lo).slice(0, -1)}–${pct(hi)})`;
}

export const table = (head: string[], rows: string[][]) =>
  [
    `| ${head.join(" | ")} |`,
    `|${head.map(() => " --- ").join("|")}|`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");

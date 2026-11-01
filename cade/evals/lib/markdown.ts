export const pct = (share: number) => `${(share * 100).toFixed(0)}%`;

export const avg = (xs: number[]) =>
  xs.length ? xs.reduce((total, value) => total + value, 0) / xs.length : 0;

export function scoreCell(scores: number[]): string {
  const [lo, hi] = [Math.min(...scores), Math.max(...scores)];
  return lo === hi ? pct(avg(scores)) : `${pct(avg(scores))} (${pct(lo).slice(0, -1)}–${pct(hi)})`;
}

export const table = (head: string[], rows: string[][]) =>
  [
    `| ${head.join(" | ")} |`,
    `|${head.map(() => " --- ").join("|")}|`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");

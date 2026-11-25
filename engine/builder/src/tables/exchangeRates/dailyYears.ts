/*
 * A currency's daily H.10 rates as the engine reads them
 * (engine/src/data/exchange-rates/h10-daily.json): one string per year, with
 * one entry per calendar day from January 1, separated by commas. An entry is
 * the rate as printed, or empty on a day the pages print none (a weekend, a
 * holiday, "ND"). Empty entries at the end of a year are left off.
 */

import type { H10Rows } from "./parseH10History.js";

const DAY_MS = 86_400_000;

const isoOf = (time: number) => new Date(time).toISOString().slice(0, 10);

const timeOf = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`);

/* The days the pages list, from the first rate to the last day listed. */
export interface DailyYears {
  firstDay: string;
  lastDay: string;
  years: Record<string, string>;
}

export function dailyYears(rows: H10Rows): DailyYears {
  const dates = [...rows.keys()].sort();
  const firstRate = dates.find((date) => rows.get(date) !== null);
  if (firstRate === undefined) throw new Error("H.10: no rate on the pages");
  const lastDay = dates[dates.length - 1];
  const entriesByYear = new Map<string, string[]>();
  for (let time = timeOf(firstRate); time <= timeOf(lastDay); time += DAY_MS) {
    const date = isoOf(time);
    const year = date.slice(0, 4);
    if (!entriesByYear.has(year)) {
      // Days of the year before the first rate are empty.
      const before = (time - timeOf(`${year}-01-01`)) / DAY_MS;
      entriesByYear.set(year, Array<string>(before).fill(""));
    }
    entriesByYear.get(year)!.push(rows.get(date) ?? "");
  }
  const years: Record<string, string> = {};
  for (const [year, entries] of entriesByYear) {
    while (entries.length > 0 && entries[entries.length - 1] === "") entries.pop();
    years[year] = entries.join(",");
  }
  return { firstDay: firstRate, lastDay, years };
}

/*
 * One H.10 history page (https://www.federalreserve.gov/releases/h10/hist/):
 * a table with a date and a rate on each row. Dates print as "3-JAN-00" (the
 * 2000-to-present pages) or "1-Jan-90" (the older pages); a day with no rate
 * prints "ND". The page is untrusted input: it is read as text only, and a
 * row that is not a date and a rate stops the build.
 */

import { load } from "cheerio";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/* "ND", and "NC", which the 1990-99 South African rand page prints on U.S. holidays. */
const NO_RATE = ["ND", "NC"];
const NO_BREAK_SPACE = " ";
const RATE_CHARACTERS = "0123456789.";

/* An ISO date ("2025-05-22") → the rate as printed ("10.1795"), or null for "ND". */
export type H10Rows = Map<string, string | null>;

const cellText = (text: string) => text.replaceAll(NO_BREAK_SPACE, " ").trim();

const twoDigits = (value: number) => String(value).padStart(2, "0");

/* "3-JAN-00" with the page's century → "2000-01-03". */
export function isoDateOf(printed: string, century: number): string {
  const parts = printed.split("-");
  const day = Number(parts[0]);
  const month = MONTHS.indexOf((parts[1] ?? "").toUpperCase()) + 1;
  const year = century + Number(parts[2]);
  const valid =
    parts.length === 3 &&
    parts[2].length === 2 &&
    Number.isInteger(day) &&
    day >= 1 &&
    day <= 31 &&
    month >= 1 &&
    Number.isInteger(year);
  if (!valid) throw new Error(`H.10: not a date: "${printed}"`);
  return `${year}-${twoDigits(month)}-${twoDigits(day)}`;
}

/* "1.0155" stays as printed; "ND" or "NC" is null; anything else stops the build. */
export function rateOf(printed: string): string | null {
  if (NO_RATE.includes(printed)) return null;
  const digitsOnly = [...printed].every((character) => RATE_CHARACTERS.includes(character));
  const value = Number(printed);
  if (!digitsOnly || printed === "" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`H.10: not a rate: "${printed}"`);
  }
  return printed;
}

/* Every date and rate on the page. A page with no table (a currency that did not exist yet) has none. */
export function parseH10History(html: string, century: number): H10Rows {
  const dom = load(html);
  const rows: H10Rows = new Map();
  const table = dom("table").first();
  table.find("tr").each((_, row) => {
    const dateCell = dom(row).find("th").first();
    const rateCell = dom(row).find("td").first();
    if (dateCell.length === 0 || rateCell.length === 0) return;
    const date = isoDateOf(cellText(dateCell.text()), century);
    if (rows.has(date)) throw new Error(`H.10: ${date} is on the page twice`);
    rows.set(date, rateOf(cellText(rateCell.text())));
  });
  return rows;
}

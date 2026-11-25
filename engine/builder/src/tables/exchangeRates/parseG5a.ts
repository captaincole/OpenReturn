/*
 * One G.5A annual release (https://www.federalreserve.gov/releases/g5a/):
 * "the average rates of exchange in <year> together with comparable figures
 * for other years", in a table with a COUNTRY, a CURRENCY and one column per
 * year. A country with an asterisk prints U.S. dollars per unit. The page is
 * untrusted input, read as text only. Releases before about 2014 print the
 * table as preformatted text, not a table; parseG5a returns null for them.
 */

import { load } from "cheerio";
import { rateOf } from "./parseH10History.js";

const ASTERISK = "*";

export interface G5aRow {
  country: string;
  dollarsPerUnit: boolean;
  /* Year → the average as printed; a year the release prints no figure for is absent. */
  averages: Map<number, string>;
}

const yearOf = (text: string): number => {
  const year = Number(text.trim());
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error(`G.5A: not a year column: "${text}"`);
  }
  return year;
};

/* "N.A." and empty cells print no figure. */
const averageOf = (text: string): string | undefined => {
  const printed = text.trim();
  if (printed === "" || printed === "N.A." || printed === "ND") return undefined;
  return rateOf(printed) ?? undefined;
};

export function parseG5a(html: string): G5aRow[] | null {
  const dom = load(html);
  const table = dom("table.pubtables").first();
  if (table.length === 0) return null;
  const headers = table
    .find("thead th")
    .map((_, cell) => dom(cell).text().trim())
    .get();
  if (headers[0] !== "COUNTRY" || headers[1] !== "CURRENCY") {
    throw new Error(`G.5A: unexpected header: ${headers.join(" | ")}`);
  }
  const years = headers.slice(2).map(yearOf);
  const rows: G5aRow[] = [];
  table.find("tr").each((_, row) => {
    const label = dom(row).find("th").first().text().trim();
    const cells = dom(row).find("td");
    if (label === "" || cells.length !== years.length + 1) return;
    const averages = new Map<number, string>();
    years.forEach((year, index) => {
      const average = averageOf(dom(cells[index + 1]).text());
      if (average !== undefined) averages.set(year, average);
    });
    const dollarsPerUnit = label.startsWith(ASTERISK);
    rows.push({ country: dollarsPerUnit ? label.slice(1) : label, dollarsPerUnit, averages });
  });
  return rows;
}

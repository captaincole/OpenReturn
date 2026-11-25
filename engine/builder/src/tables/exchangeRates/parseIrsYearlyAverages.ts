/*
 * The IRS page "Yearly average currency exchange rates"
 * (https://www.irs.gov/individuals/international-taxpayers/yearly-average-currency-exchange-rates):
 * one table with a Country, a Currency and one column per year, in units of
 * the currency for one U.S. dollar ("divide the foreign currency amount by the
 * applicable yearly average exchange rate"). The page is untrusted input: it
 * is read as text only. Other years' cells are not read (the page prints a
 * few as "0,924" or ".73.686").
 */

import { load } from "cheerio";
import { rateOf } from "./parseH10History.js";

export interface IrsYearlyAverage {
  country: string;
  currency: string;
  /* As printed: "0.886". */
  average: string;
}

/* Every row's figure for one year. A page with no column for the year stops the build. */
export function parseIrsYearlyAverages(html: string, year: number): IrsYearlyAverage[] {
  const dom = load(html);
  const table = dom("table").first();
  const headers = table
    .find("thead th")
    .map((_, cell) => dom(cell).text().trim())
    .get();
  if (headers[0] !== "Country" || headers[1] !== "Currency") {
    throw new Error(`IRS yearly averages: unexpected header: ${headers.join(" | ")}`);
  }
  const column = headers.indexOf(String(year));
  if (column === -1) throw new Error(`IRS yearly averages: no column for ${year}`);
  const rows: IrsYearlyAverage[] = [];
  table.find("tbody tr").each((_, row) => {
    const cells = dom(row)
      .find("td")
      .map((_index, cell) => dom(cell).text().trim())
      .get();
    if (cells.length !== headers.length) return;
    const average = rateOf(cells[column]);
    if (average === null) return;
    rows.push({ country: cells[0], currency: cells[1], average });
  });
  return rows;
}

/* Pure: the jurisdiction rows in, the generated table of the root README out. */

import { percent, table, wholeNumber, type JurisdictionRow } from "./report.js";

/* The percent comes first here: it is the number a reader looks for. */
const supportedWithCounts = (row: JurisdictionRow): string =>
  `**${percent(row.fields, 0)}** (${wholeNumber(row.fields.covered)} of ${wholeNumber(row.fields.total)})`;

export function renderReadmeTable(jurisdictions: JurisdictionRow[]): string {
  return table(
    ["Jurisdiction", "Forms", "Fields supported", "Tested"],
    jurisdictions.map((row) => [
      row.name,
      row.forms,
      supportedWithCounts(row),
      percent(row.branches, 1),
    ]),
  );
}

export interface Markers {
  start: string;
  end: string;
}

export const TABLE_MARKERS: Markers = {
  start: "<!-- coverage-table:start -->",
  end: "<!-- coverage-table:end -->",
};

/* Replaces the lines between the two marker lines, and keeps the marker lines. */
export function replaceBetween(text: string, markers: Markers, body: string): string {
  const start = text.indexOf(markers.start);
  const end = text.indexOf(markers.end);
  if (start === -1 || end < start) {
    throw new Error(`The README has no ${markers.start} … ${markers.end} pair.`);
  }
  const endLineStart = text.lastIndexOf("\n", end) + 1;
  return `${text.slice(0, start + markers.start.length)}\n${body}\n${text.slice(endLineStart)}`;
}

export function updateReadme(readme: string, jurisdictions: JurisdictionRow[]): string {
  return replaceBetween(readme, TABLE_MARKERS, renderReadmeTable(jurisdictions));
}

/* Pure: the jurisdiction rows in, the two generated parts of the root README out. */

import { percent, table, wholeNumber, type JurisdictionRow } from "./report.js";

/* The README heading that the chips open. */
const SECTION_ANCHOR = "#form-support";
const CHIP_COLOR = "0f766e";

/* shields.io reads a dash as the separator between label, message and color. */
const chipText = (text: string): string => encodeURIComponent(text).replaceAll("-", "--");

function chip(row: JurisdictionRow): string {
  const label = row.name.toLowerCase();
  const supported = percent(row.fields, 0);
  const src = `https://img.shields.io/badge/${chipText(label)}-${chipText(supported)}-${CHIP_COLOR}`;
  const alt = `${row.name}: ${supported} of form fields supported`;
  return `  <a href="${SECTION_ANCHOR}"><img src="${src}" alt="${alt}"></a>`;
}

/* One chip for each jurisdiction and tax year: the share of form fields the engine supports. */
export function renderChips(jurisdictions: JurisdictionRow[]): string {
  return jurisdictions.map(chip).join("\n");
}

/* The percent comes first here: it is the number on the chip. */
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

export const CHIP_MARKERS: Markers = {
  start: "<!-- coverage-chips:start -->",
  end: "<!-- coverage-chips:end -->",
};

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
  const withChips = replaceBetween(readme, CHIP_MARKERS, renderChips(jurisdictions));
  return replaceBetween(withChips, TABLE_MARKERS, renderReadmeTable(jurisdictions));
}

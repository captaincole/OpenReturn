/* Pure: the jurisdiction rows in, the generated table of the root README out. */

import type { InputDocument } from "../formLists/index.js";
import { renderReadmeFormLists, type FormListSummary } from "./formLists.js";
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

/* A share with its counts: "**25%** (50 of 197)". */
const shareWithCounts = (covered: number, total: number): string =>
  `**${percent({ covered, total }, 0)}** (${wholeNumber(covered)} of ${wholeNumber(total)})`;

/*
 * The table at the top of the README: for each jurisdiction, the forms with
 * rules against the publisher's list, and the fields the engine computes.
 */
export function renderSolvedTable(
  jurisdictions: JurisdictionRow[],
  formLists: FormListSummary[],
): string {
  const fieldsOf = (name: string): string => {
    const row = jurisdictions.find((each) => each.name === name);
    return row ? supportedWithCounts(row) : "none";
  };
  return table(
    ["", ...formLists.map((summary) => summary.name)],
    [
      [
        "Forms with rules",
        ...formLists.map((summary) => shareWithCounts(summary.all.withRules, summary.all.total)),
      ],
      ["Fields computed", ...formLists.map((summary) => fieldsOf(summary.name))],
    ],
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

export const SOLVED_MARKERS: Markers = {
  start: "<!-- solved-table:start -->",
  end: "<!-- solved-table:end -->",
};

export const FORM_LIST_MARKERS: Markers = {
  start: "<!-- form-list-table:start -->",
  end: "<!-- form-list-table:end -->",
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

export function updateReadme(
  readme: string,
  jurisdictions: JurisdictionRow[],
  formLists: FormListSummary[],
  documents: InputDocument[],
): string {
  const withSolved = replaceBetween(
    readme,
    SOLVED_MARKERS,
    renderSolvedTable(jurisdictions, formLists),
  );
  const withCoverage = replaceBetween(withSolved, TABLE_MARKERS, renderReadmeTable(jurisdictions));
  return replaceBetween(
    withCoverage,
    FORM_LIST_MARKERS,
    renderReadmeFormLists(formLists, documents),
  );
}

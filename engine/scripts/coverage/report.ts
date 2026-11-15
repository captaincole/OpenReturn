/* Pure: c8's per-file counts and each form's field counts in, the text of docs/coverage.md out. */

export interface Counts {
  covered: number;
  total: number;
}

/* The part of c8's json-summary entry this report reads. */
export interface FileCoverage {
  lines: Counts;
  branches: Counts;
}

export interface FormInput {
  displayName: string;
  /* The form's folder under engine/src, for example "federal/8959". */
  relativeDir: string;
  scenarios: number;
  /* covered = fields with a binding; total = every field in the form's catalog. */
  fields: Counts;
}

export interface CoverageRow {
  lines: Counts;
  branches: Counts;
}

export type FormRow = FormInput & CoverageRow;

export interface CoverageReport {
  forms: FormRow[];
  /* Code under engine/src/federal and engine/src/state that no one form owns. */
  shared: CoverageRow;
  total: CoverageRow & { fields: Counts };
}

const NO_COUNTS: Counts = { covered: 0, total: 0 };

const addCounts = (left: Counts, right: Counts): Counts => ({
  covered: left.covered + right.covered,
  total: left.total + right.total,
});

const sumCoverage = (files: FileCoverage[]): CoverageRow => ({
  lines: files.map((file) => file.lines).reduce(addCounts, NO_COUNTS),
  branches: files.map((file) => file.branches).reduce(addCounts, NO_COUNTS),
});

/* The trailing slash keeps federal/8995 from taking the files of federal/8995-a. */
const isInFolder = (filePath: string, relativeDir: string): boolean =>
  filePath.startsWith(`${relativeDir}/`);

/* filesBySrcPath: c8's per-file counts, keyed by the path relative to engine/src. */
export function buildCoverageReport(
  filesBySrcPath: Record<string, FileCoverage>,
  forms: FormInput[],
): CoverageReport {
  const entries = Object.entries(filesBySrcPath);
  const coverageOf = (belongs: (filePath: string) => boolean): CoverageRow =>
    sumCoverage(entries.filter(([filePath]) => belongs(filePath)).map(([, file]) => file));
  const isInAForm = (filePath: string): boolean =>
    forms.some((form) => isInFolder(filePath, form.relativeDir));

  return {
    forms: forms.map((form) => ({
      ...form,
      ...coverageOf((filePath) => isInFolder(filePath, form.relativeDir)),
    })),
    shared: coverageOf((filePath) => !isInAForm(filePath)),
    total: {
      ...coverageOf(() => true),
      fields: forms.map((form) => form.fields).reduce(addCounts, NO_COUNTS),
    },
  };
}

const NO_VALUE = "—";

const wholeNumber = (value: number): string => value.toLocaleString("en-US");

function percent(counts: Counts, decimals: number): string {
  return counts.total === 0
    ? NO_VALUE
    : `${((100 * counts.covered) / counts.total).toFixed(decimals)}%`;
}

function percentWithCounts(counts: Counts): string {
  return counts.total === 0
    ? NO_VALUE
    : `${percent(counts, 1)} (${wholeNumber(counts.covered)} of ${wholeNumber(counts.total)})`;
}

function fieldsSupported(fields: Counts): string {
  return fields.total === 0
    ? NO_VALUE
    : `${wholeNumber(fields.covered)} of ${wholeNumber(fields.total)} (${percent(fields, 0)})`;
}

const tableRow = (cells: Array<string | number>): string => `| ${cells.join(" | ")} |`;

function table(header: string[], rows: Array<Array<string | number>>): string {
  return [tableRow(header), tableRow(header.map(() => "---")), ...rows.map(tableRow)].join("\n");
}

const INTRO = `This report shows how much of the form code the scenarios run, and how many fields of each form the engine supports. A scenario is one test taxpayer in \`engine/tests/scenarios\`: the golden suite computes the return and compares each form with a checked copy. The form code is the files in \`engine/src/federal\` and \`engine/src/state\`.

- **Scenarios:** the scenarios that file the form.
- **Lines:** the share of the code lines that ran. A rule of one line counts when its file loads, so this number is high.
- **Branches:** the share of the code paths that ran. A rule that never ran is one path not taken, so this number shows the cases that no scenario has.
- **Fields supported:** the share of the form's fields that the engine computes. The engine declares each other field unsupported and leaves it blank. A supported field can still stop at a case that the engine does not handle.

A dash means that there is nothing to measure: the form has a field list and no code yet.`;

const OUTRO = `For the lines and paths that did not run, run \`npm run coverage\`. It prints one row for each file with the line numbers, and writes a page for each file to \`engine/coverage/index.html\`.`;

export function renderCoverageReport(args: {
  report: CoverageReport;
  date: string;
  scenarioCount: number;
}): string {
  const { report, date, scenarioCount } = args;
  const summary = table(
    ["Scenarios", "Forms", "Lines", "Branches", "Fields supported"],
    [
      [
        scenarioCount,
        report.forms.length,
        percentWithCounts(report.total.lines),
        percentWithCounts(report.total.branches),
        fieldsSupported(report.total.fields),
      ],
    ],
  );
  const byForm = table(
    ["Form", "Scenarios", "Lines", "Branches", "Fields supported"],
    [
      ...report.forms.map((form) => [
        form.displayName,
        form.scenarios,
        percent(form.lines, 1),
        percent(form.branches, 1),
        fieldsSupported(form.fields),
      ]),
      [
        "Code that forms share",
        NO_VALUE,
        percent(report.shared.lines, 1),
        percent(report.shared.branches, 1),
        NO_VALUE,
      ],
    ],
  );
  return [
    "# Engine coverage",
    `_Generated by \`npm run coverage\` on ${date}. Do not edit by hand._`,
    INTRO,
    "## Summary",
    summary,
    "## By form",
    byForm,
    OUTRO,
    "",
  ].join("\n\n");
}

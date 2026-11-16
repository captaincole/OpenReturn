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

/* One jurisdiction in one tax year: the unit that the README reports. */
export interface Jurisdiction {
  /* For example "Federal 2025". */
  name: string;
  /* The jurisdiction's folder under engine/src, for example "state/ca". */
  dir: string;
}

export interface FormInput {
  displayName: string;
  /* The form's folder under engine/src, for example "federal/8959". */
  relativeDir: string;
  jurisdiction: Jurisdiction;
  scenarios: number;
  /* covered = fields with a binding; total = every field in the form's catalog. */
  fields: Counts;
}

export interface CoverageRow {
  lines: Counts;
  branches: Counts;
}

export type FormRow = FormInput & CoverageRow;

export interface JurisdictionRow extends CoverageRow {
  name: string;
  forms: number;
  fields: Counts;
}

export interface CoverageReport {
  jurisdictions: JurisdictionRow[];
  forms: FormRow[];
  /* Code under engine/src/federal and engine/src/state that no one form owns. */
  shared: CoverageRow;
  total: JurisdictionRow;
}

const JURISDICTION_NAMES: Record<string, string> = {
  federal: "Federal",
  "state/ca": "California",
};

/* "federal/8959" is in "federal"; "state/ca/540" is in "state/ca". */
function jurisdictionDir(relativeDir: string): string {
  const folders = relativeDir.split("/");
  return folders[0] === "state" ? `${folders[0]}/${folders[1]}` : folders[0];
}

export function jurisdictionOf(relativeDir: string, taxYear: number): Jurisdiction {
  const dir = jurisdictionDir(relativeDir);
  return { name: `${JURISDICTION_NAMES[dir] ?? dir} ${taxYear}`, dir };
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

const sumFields = (forms: FormInput[]): Counts =>
  forms.map((form) => form.fields).reduce(addCounts, NO_COUNTS);

/* The trailing slash keeps federal/8995 from taking the files of federal/8995-a. */
const isInFolder = (filePath: string, relativeDir: string): boolean =>
  filePath.startsWith(`${relativeDir}/`);

/* The jurisdictions in the order of their first form. */
function jurisdictionsOf(forms: FormInput[]): Jurisdiction[] {
  const byName = new Map(forms.map((form) => [form.jurisdiction.name, form.jurisdiction]));
  return [...byName.values()];
}

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
    /* A jurisdiction's code is its forms and the code that they share. */
    jurisdictions: jurisdictionsOf(forms).map((jurisdiction) => {
      const itsForms = forms.filter((form) => form.jurisdiction.name === jurisdiction.name);
      return {
        name: jurisdiction.name,
        forms: itsForms.length,
        fields: sumFields(itsForms),
        ...coverageOf((filePath) => isInFolder(filePath, jurisdiction.dir)),
      };
    }),
    forms: forms.map((form) => ({
      ...form,
      ...coverageOf((filePath) => isInFolder(filePath, form.relativeDir)),
    })),
    shared: coverageOf((filePath) => !isInAForm(filePath)),
    total: {
      name: "All",
      forms: forms.length,
      fields: sumFields(forms),
      ...coverageOf(() => true),
    },
  };
}

const NO_VALUE = "—";

export const wholeNumber = (value: number): string => value.toLocaleString("en-US");

export function percent(counts: Counts, decimals: number): string {
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

export function table(header: string[], rows: Array<Array<string | number>>): string {
  return [tableRow(header), tableRow(header.map(() => "---")), ...rows.map(tableRow)].join("\n");
}

const INTRO = `This report shows how many fields of each form the engine supports, and how much of the form code the scenarios run. A scenario is one test taxpayer in \`engine/tests/scenarios\`: the golden suite computes the return and compares each form with a checked copy. The form code is the files in \`engine/src/federal\` and \`engine/src/state\`.

- **Fields supported:** the share of the form's fields that the engine computes. The engine declares each other field unsupported and leaves it blank. A supported field can still stop at a case that the engine does not handle.
- **Branches:** the share of the code paths that ran. A rule that never ran is one path not taken, so this number shows the cases that no scenario has.
- **Lines:** the share of the code lines that ran. A rule of one line counts when its file loads, so this number is high.
- **Scenarios:** the scenarios that file the form.

A dash means that there is nothing to measure: the form has a field list and no code yet.`;

const OUTRO = `For the lines and paths that did not run, run \`npm run coverage\`. It prints one row for each file with the line numbers, and writes a page for each file to \`engine/coverage/index.html\`.`;

function summaryTable(report: CoverageReport): string {
  return table(
    ["Jurisdiction", "Forms", "Fields supported", "Branches", "Lines"],
    [...report.jurisdictions, report.total].map((row) => [
      row.name,
      row.forms,
      fieldsSupported(row.fields),
      percentWithCounts(row.branches),
      percentWithCounts(row.lines),
    ]),
  );
}

function byFormTable(report: CoverageReport): string {
  return table(
    ["Form", "Jurisdiction", "Scenarios", "Fields supported", "Branches", "Lines"],
    [
      ...report.forms.map((form) => [
        form.displayName,
        form.jurisdiction.name,
        form.scenarios,
        fieldsSupported(form.fields),
        percent(form.branches, 1),
        percent(form.lines, 1),
      ]),
      [
        "Code that forms share",
        NO_VALUE,
        NO_VALUE,
        NO_VALUE,
        percent(report.shared.branches, 1),
        percent(report.shared.lines, 1),
      ],
    ],
  );
}

export function renderCoverageReport(args: {
  report: CoverageReport;
  date: string;
  scenarioCount: number;
}): string {
  const { report, date, scenarioCount } = args;
  return [
    "# Engine coverage",
    `_Generated by \`npm run coverage\` on ${date}. Do not edit by hand._`,
    INTRO,
    "## Summary",
    `The golden suite ran ${scenarioCount} scenarios. A jurisdiction's code is its forms and the code that they share.`,
    summaryTable(report),
    "## By form",
    byFormTable(report),
    OUTRO,
    "",
  ].join("\n\n");
}

import { describe, expect, it } from "vitest";
import {
  formsOnNoList,
  renderFormListPage,
  summarizeFormList,
} from "../../../scripts/coverage/formLists.js";
import { replaceBetween, updateReadme } from "../../../scripts/coverage/readme.js";
import {
  buildCoverageReport,
  jurisdictionOf,
  renderCoverageReport,
  type FileCoverage,
  type FormInput,
} from "../../../scripts/coverage/report.js";
import type { FormList } from "../../../scripts/formLists/index.js";

const file = (
  linesCovered: number,
  lines: number,
  branchesCovered: number,
  branches: number,
): FileCoverage => ({
  lines: { covered: linesCovered, total: lines },
  branches: { covered: branchesCovered, total: branches },
});

const form = (displayName: string, relativeDir: string, supported: number, fields: number) =>
  ({
    displayName,
    relativeDir,
    jurisdiction: jurisdictionOf(relativeDir, 2025),
    scenarios: 2,
    fields: { covered: supported, total: fields },
  }) satisfies FormInput;

const FILES: Record<string, FileCoverage> = {
  "federal/8995/bindings.ts": file(90, 100, 30, 40),
  "federal/8995/lines.ts": file(10, 100, 10, 60),
  "federal/8995-a/bindings.ts": file(50, 50, 8, 10),
  "federal/qbi/shared.ts": file(20, 25, 1, 2),
  "federal/index.ts": file(5, 5, 1, 1),
  "state/ca/540/bindings.ts": file(8, 10, 3, 4),
};

const FORMS = [
  form("Form 8995", "federal/8995", 31, 33),
  form("Form 8995-A", "federal/8995-a", 81, 94),
  form("Form 540", "state/ca/540", 5, 10),
  form("Schedule D (540)", "state/ca/schedule-d-ca", 0, 0),
];

describe("buildCoverageReport", () => {
  const report = buildCoverageReport(FILES, FORMS);

  it("adds the files of a form's folder, and not the folder that starts with the same name", () => {
    expect(report.forms[0]).toMatchObject({
      lines: { covered: 100, total: 200 },
      branches: { covered: 40, total: 100 },
    });
    expect(report.forms[1]).toMatchObject({
      lines: { covered: 50, total: 50 },
      branches: { covered: 8, total: 10 },
    });
  });

  it("puts the files that no form owns in the shared row", () => {
    expect(report.shared).toEqual({
      lines: { covered: 25, total: 30 },
      branches: { covered: 2, total: 3 },
    });
  });

  it("totals every file and every form's fields", () => {
    expect(report.total).toEqual({
      name: "All",
      forms: 4,
      lines: { covered: 183, total: 290 },
      branches: { covered: 53, total: 117 },
      fields: { covered: 117, total: 137 },
    });
  });

  it("makes one row for each jurisdiction and tax year, with the code that its forms share", () => {
    expect(report.jurisdictions).toEqual([
      {
        name: "Federal 2025",
        forms: 2,
        lines: { covered: 175, total: 280 },
        branches: { covered: 50, total: 113 },
        fields: { covered: 112, total: 127 },
      },
      {
        name: "California 2025",
        forms: 2,
        lines: { covered: 8, total: 10 },
        branches: { covered: 3, total: 4 },
        fields: { covered: 5, total: 10 },
      },
    ]);
  });

  it("names a jurisdiction that has no name here by its folder", () => {
    expect(jurisdictionOf("state/ny/it-201", 2026)).toEqual({
      name: "state/ny 2026",
      dir: "state/ny",
    });
  });
});

describe("renderCoverageReport", () => {
  const text = renderCoverageReport({
    report: buildCoverageReport(FILES, FORMS),
    date: "2026-01-02",
    scenarioCount: 2,
  });

  it("writes one summary row for each jurisdiction, then the total", () => {
    expect(text).toContain(
      "| Federal 2025 | 2 | 112 of 127 (88%) | 44.2% (50 of 113) | 62.5% (175 of 280) |",
    );
    expect(text).toContain(
      "| California 2025 | 2 | 5 of 10 (50%) | 75.0% (3 of 4) | 80.0% (8 of 10) |",
    );
    expect(text).toContain(
      "| All | 4 | 117 of 137 (85%) | 45.3% (53 of 117) | 63.1% (183 of 290) |",
    );
  });

  it("writes one row for each form, and a dash where a form has no code or fields", () => {
    expect(text).toContain("| Form 8995 | Federal 2025 | 2 | 31 of 33 (94%) | 40.0% | 50.0% |");
    expect(text).toContain("| Schedule D (540) | California 2025 | 2 | — | — | — |");
    expect(text).toContain("| Code that forms share | — | — | — | 66.7% | 83.3% |");
  });

  it("names the date of the run", () => {
    expect(text).toContain("on 2026-01-02.");
  });
});

const FEDERAL_LIST: FormList = {
  list: "Accepted forms",
  publisher: "IRS",
  taxYear: 2025,
  sourceUrl: "https://example.test/list",
  sourceDate: "2025-11-18",
  jurisdiction: "federal",
  forms: [
    { name: "Form 8995", title: "Simplified", maxPerReturn: "1", short: "8995", tier1: true },
    { name: "Form 8995A", short: "8995-a" },
    { name: "Form 8582CR", tier1: true },
    { name: "Form W2", kind: "document", maxPerReturn: "50" },
    { name: "Form 4868", kind: "other" },
  ],
};

const DOCUMENTS = [
  { name: "Form W-2", title: "Wage and Tax Statement", ingestTool: "ingest-w2-structured" },
  { name: "Form 1099-B", title: "Proceeds", ingestTool: "ingest-1099-b" },
];

const CALIFORNIA_LIST: FormList = {
  ...FEDERAL_LIST,
  publisher: "FTB",
  jurisdiction: "state/ca",
  forms: [
    { name: "Form 540", short: "540", tier1: true },
    { name: "Schedule D (540)", short: "schedule-d-ca", tier1: true },
  ],
};

const FORM_LISTS = [FEDERAL_LIST, CALIFORNIA_LIST].map((list) => summarizeFormList(list, FORMS));

describe("summarizeFormList", () => {
  it("counts the forms the engine has, and the forms with one or more supported fields", () => {
    expect(FORM_LISTS[0]).toMatchObject({
      name: "Federal 2025",
      states: ["rules", "rules", "not_in_engine", "document", "other"],
      all: { total: 3, inEngine: 2, withRules: 2 },
      tier1: { total: 2, inEngine: 1, withRules: 1 },
    });
  });

  it("leaves a document, another return and a request out of the counts", () => {
    expect(FORM_LISTS[0].all.total).toBe(3);
    expect(FEDERAL_LIST.forms).toHaveLength(5);
  });

  it("counts a form with a field list and no supported field as a form with no rules", () => {
    expect(FORM_LISTS[1]).toMatchObject({
      states: ["rules", "no_rules"],
      tier1: { total: 2, inEngine: 2, withRules: 1 },
    });
  });

  it("finds an engine form that no list has", () => {
    expect(formsOnNoList([FEDERAL_LIST], FORMS)).toEqual([
      "state/ca/540",
      "state/ca/schedule-d-ca",
    ]);
    expect(formsOnNoList([FEDERAL_LIST, CALIFORNIA_LIST], FORMS)).toEqual([]);
  });
});

describe("renderFormListPage", () => {
  const page = renderFormListPage(FORM_LISTS, DOCUMENTS, "2026-01-02");

  it("writes one row for each form of a list, with its state", () => {
    expect(page).toContain("| Form 8995 | Simplified | Yes | Rules | 1 |");
    expect(page).toContain("| Form 8582CR |  | Yes | Not in the engine |  |");
    expect(page).toContain("| Schedule D (540) |  | Yes | No rules yet |  |");
    expect(page).toContain("| Form W2 |  |  | Not a form: a document | 50 |");
    expect(page).toContain("| Form 4868 |  |  | Not a form: another return or a request |  |");
  });

  it("names the source and the counts of each list", () => {
    expect(page).toContain(
      "Source: [Accepted forms](https://example.test/list), IRS, dated 2025-11-18.",
    );
    expect(page).toContain(
      "The list has 5 rows, and 3 are forms and schedules to compute. The engine has 2 of them, and 2 have rules.",
    );
  });

  it("lists the input documents that Cade reads", () => {
    expect(page).toContain("Cade reads 2 kinds of input document.");
    expect(page).toContain("| Form 1099-B | Proceeds |");
  });
});

describe("updateReadme", () => {
  const README = [
    "<!-- solved-table:start -->",
    "<!-- solved-table:end -->",
    "before",
    "## Form support",
    "<!-- coverage-table:start -->",
    "an old table",
    "<!-- coverage-table:end -->",
    "between",
    "<!-- form-list-table:start -->",
    "<!-- form-list-table:end -->",
    "after",
  ].join("\n");
  const text = updateReadme(
    README,
    buildCoverageReport(FILES, FORMS).jurisdictions,
    FORM_LISTS,
    DOCUMENTS,
  );

  it("writes the table, and keeps the marker lines and the text around them", () => {
    expect(text).toContain(
      [
        "<!-- coverage-table:start -->",
        "| Jurisdiction | Forms | Fields supported | Tested |",
        "| --- | --- | --- | --- |",
        "| Federal 2025 | 2 | **88%** (112 of 127) | 44.2% |",
        "| California 2025 | 2 | **50%** (5 of 10) | 75.0% |",
        "<!-- coverage-table:end -->",
        "between",
      ].join("\n"),
    );
    expect(text).toContain("before\n## Form support\n<!-- coverage-table:start -->");
    expect(text).not.toContain("an old table");
  });

  it("writes the form list table between its own marker lines", () => {
    expect(text).toContain(
      [
        "<!-- form-list-table:start -->",
        "| Forms | Federal 2025 | California 2025 |",
        "| --- | --- | --- |",
        "| Forms and schedules for an individual return | 3 | 2 |",
        "| In the engine | 2 | 2 |",
        "| With rules | 2 | 1 |",
        "| Tier 1 forms | 2 | 2 |",
        "| Tier 1 in the engine | 1 | 2 |",
        "| Tier 1 with rules | 1 | 1 |",
        "",
        "Cade reads 2 kinds of input document, such as Form W-2 and Form 1099-B.",
        "<!-- form-list-table:end -->",
        "after",
      ].join("\n"),
    );
  });

  it("writes the top table: forms with rules and fields computed, by jurisdiction", () => {
    const top = text.slice(text.indexOf("<!-- solved-table:start -->"), text.indexOf("## Form"));
    expect(top).toContain("| Forms with rules | **67%** (2 of 3) |");
    expect(top).toContain("| Fields computed | **");
  });

  it("writes the same text on a second run", () => {
    expect(
      updateReadme(text, buildCoverageReport(FILES, FORMS).jurisdictions, FORM_LISTS, DOCUMENTS),
    ).toBe(text);
  });

  it("fails when the README has lost a marker", () => {
    expect(() => replaceBetween("no markers", { start: "<a>", end: "</a>" }, "x")).toThrow(
      "The README has no <a>",
    );
  });
});

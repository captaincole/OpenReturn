import { describe, expect, it } from "vitest";
import { replaceBetween, updateReadme } from "../../../scripts/coverage/readme.js";
import {
  buildCoverageReport,
  jurisdictionOf,
  renderCoverageReport,
  type FileCoverage,
  type FormInput,
} from "../../../scripts/coverage/report.js";

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

describe("updateReadme", () => {
  const README = [
    "before",
    "## Form support",
    "<!-- coverage-table:start -->",
    "an old table",
    "<!-- coverage-table:end -->",
    "after",
  ].join("\n");
  const text = updateReadme(README, buildCoverageReport(FILES, FORMS).jurisdictions);

  it("writes the table, and keeps the marker lines and the text around them", () => {
    expect(text).toContain(
      [
        "<!-- coverage-table:start -->",
        "| Jurisdiction | Forms | Fields supported | Tested |",
        "| --- | --- | --- | --- |",
        "| Federal 2025 | 2 | **88%** (112 of 127) | 44.2% |",
        "| California 2025 | 2 | **50%** (5 of 10) | 75.0% |",
        "<!-- coverage-table:end -->",
        "after",
      ].join("\n"),
    );
    expect(text).toContain("before\n## Form support\n<!-- coverage-table:start -->");
    expect(text).not.toContain("an old table");
  });

  it("writes the same text on a second run", () => {
    expect(updateReadme(text, buildCoverageReport(FILES, FORMS).jurisdictions)).toBe(text);
  });

  it("fails when the README has lost a marker", () => {
    expect(() => replaceBetween("no markers", { start: "<a>", end: "</a>" }, "x")).toThrow(
      "The README has no <a>",
    );
  });
});

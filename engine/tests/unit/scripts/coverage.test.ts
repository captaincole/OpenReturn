import { describe, expect, it } from "vitest";
import {
  buildCoverageReport,
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
    scenarios: 2,
    fields: { covered: supported, total: fields },
  }) satisfies FormInput;

const FILES: Record<string, FileCoverage> = {
  "federal/8995/bindings.ts": file(90, 100, 30, 40),
  "federal/8995/lines.ts": file(10, 100, 10, 60),
  "federal/8995-a/bindings.ts": file(50, 50, 8, 10),
  "federal/qbi/shared.ts": file(20, 25, 1, 2),
  "federal/index.ts": file(5, 5, 1, 1),
};

const FORMS = [
  form("Form 8995", "federal/8995", 31, 33),
  form("Form 8995-A", "federal/8995-a", 81, 94),
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
      lines: { covered: 175, total: 280 },
      branches: { covered: 50, total: 113 },
      fields: { covered: 112, total: 127 },
    });
  });
});

describe("renderCoverageReport", () => {
  const text = renderCoverageReport({
    report: buildCoverageReport(FILES, FORMS),
    date: "2026-01-02",
    scenarioCount: 2,
  });

  it("writes the summary row with the counts", () => {
    expect(text).toContain("| 2 | 3 | 62.5% (175 of 280) | 44.2% (50 of 113) | 112 of 127 (88%) |");
  });

  it("writes one row for each form, and a dash where a form has no code or fields", () => {
    expect(text).toContain("| Form 8995 | 2 | 50.0% | 40.0% | 31 of 33 (94%) |");
    expect(text).toContain("| Schedule D (540) | 2 | — | — | — |");
    expect(text).toContain("| Code that forms share | — | 83.3% | 66.7% | — |");
  });

  it("names the date of the run", () => {
    expect(text).toContain("on 2026-01-02.");
  });
});

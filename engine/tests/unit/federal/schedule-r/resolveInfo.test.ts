/*
 * Schedule R's must-file rule and its questions: tcb-us-010 (a QSS under 65,
 * retired on disability, with a disability pension) with one change each.
 */

import { describe, expect, it } from "vitest";
import { ELDERLY_OR_DISABLED_KEYS } from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { resolveScheduleRInfo } from "../../../../src/federal/schedule-r/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { tcbUs010Scenario as base } from "../../../scenarios/tcb-us-010/index.js";

function resolve(change: {
  facts?: (facts: TaxFactRow[]) => TaxFactRow[];
  decisions?: (decisions: AIDecisionRow[]) => AIDecisionRow[];
}) {
  const facts = change.facts ? change.facts(base.facts) : base.facts;
  const decisions = change.decisions ? change.decisions(base.decisions) : base.decisions;
  const info = resolveScheduleRInfo(makeResolverInputs({ facts, decisions }));
  return {
    files: info.mustFile?.["schedule-r"]?.value,
    missing: info.missingInputs?.["schedule-r"],
  };
}

const setFact = (key: string, value: unknown) => (facts: TaxFactRow[]) =>
  facts.map((fact) => (fact.key === key ? { ...fact, value } : fact));
const dropFact = (key: string) => (facts: TaxFactRow[]) => facts.filter((fact) => fact.key !== key);
const setStatus = (status: string) => (decisions: AIDecisionRow[]) =>
  decisions.map((row) =>
    row.decisionKey === "decisions.scope.filing_status" ? { ...row, decision: status } : row,
  );

describe("Schedule R must-file", () => {
  it("files for a person under 65 retired on disability", () => {
    expect(resolve({})).toEqual({ files: true, missing: [] });
  });

  it("does not file when the person did not retire on disability", () => {
    const facts = setFact(ELDERLY_OR_DISABLED_KEYS.taxpayerRetiredOnDisability, false);
    expect(resolve({ facts }).files).toBe(false);
  });

  it("files and asks while the retired answer is missing", () => {
    const { files, missing } = resolve({
      facts: dropFact(ELDERLY_OR_DISABLED_KEYS.taxpayerRetiredOnDisability),
    });
    expect(files).toBe(true);
    expect(missing).toContain(ELDERLY_OR_DISABLED_KEYS.taxpayerRetiredOnDisability);
  });

  it("waits for the date of birth", () => {
    expect(resolve({ facts: dropFact("identity.dob") }).files).toBeUndefined();
  });

  it("does not file at or above Table 1's AGI limit ($17,500 for QSS)", () => {
    const facts = (rows: TaxFactRow[]) =>
      rows.map((fact) =>
        fact.key === "employer.employer"
          ? { ...fact, value: { ...(fact.value as object), box1: 7000 } }
          : fact,
      );
    expect(resolve({ facts }).files).toBe(false);
  });

  it("married filing separately: only after living apart all year, under $12,500 of AGI", () => {
    const decisions = setStatus("married_filing_separately");
    // Without the $4,000 of interest, AGI is $12,000.
    const apart = (value: boolean) => (facts: TaxFactRow[]) => [
      ...facts.filter((fact) => fact.category !== "investment_income"),
      {
        ...facts[0],
        id: "f-apart",
        category: "filing_status",
        key: "filing_status.lived_apart_from_spouse_all_year",
        value,
      },
    ];
    expect(resolve({ decisions, facts: apart(false) }).files).toBe(false);
    expect(resolve({ decisions, facts: apart(true) }).files).toBe(true);
    expect(resolve({ decisions }).files).toBe(false);
  });
});

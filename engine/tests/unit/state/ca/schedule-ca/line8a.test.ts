/*
 * Schedule CA line 8a, the federal NOL deduction
 * (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b01): column A copies
 * Schedule 1 line 8a and column C adds it back, so California AGI and tax do
 * not take the federal deduction (state/ca/schedule-ca/nolDeduction.ts). The
 * base is the synthetic California taxpayer erith, with a federal carryover
 * from 2016 and no California carryover.
 */

import { describe, expect, it } from "vitest";
import { NOL_KEYS } from "../../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { erithScenario as base } from "../../../../scenarios/synthetic/erith/index.js";

const CARRYOVER: TaxFactRow = {
  ...base.facts[0]!,
  id: "f-nol-carryovers",
  category: "other",
  key: NOL_KEYS.carryovers,
  value: [{ yearOfLoss: 2016, carryoverTo2025: 5000 }],
};

function evaluate(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "schedule-ca-line-8a-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
  });
  return (fieldId: string) => {
    const found = result.forms
      .get(fieldId.split(".")[0]!)
      ?.fields.find((entry) => entry.fieldId === fieldId)?.result;
    return found?.ok ? found.value : undefined;
  };
}

const CA_LINES = [
  "form-540.line.17_ca_agi",
  "form-540.line.19_taxable_income",
  "form-540.line.31_tax_amount",
];

describe("Schedule CA line 8a", () => {
  it("is blank with no federal NOL deduction", () => {
    const value = evaluate(base.facts);
    expect(value("schedule-ca.1.line.b8a_federal")).toBeUndefined();
    expect(value("schedule-ca.1.line.b8a_additions")).toBeUndefined();
  });

  it("adds the federal NOL back in column C, so California AGI and tax do not change", () => {
    const without = evaluate(base.facts);
    const value = evaluate([...base.facts, CARRYOVER]);
    expect(value("schedule-1.0.line.8a")).toBe(5000);
    expect(value("form-1040.line.11a")).toBe(sumOf(without("form-1040.line.11a")) - 5000);
    expect(value("schedule-ca.1.line.b8a_federal")).toBe(5000);
    expect(value("schedule-ca.1.line.b8a_additions")).toBe(5000);
    expect(value("schedule-ca.2.line.b9a_additions")).toBe(
      sumOf(without("schedule-ca.2.line.b9a_additions")) + 5000,
    );
    for (const line of CA_LINES) expect(value(line)).toBe(without(line));
    expect(value("form-540.line.17_ca_agi")).toBe(62263);
    expect(value("form-540.line.31_tax_amount")).toBe(1931);
  });
});

function sumOf(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

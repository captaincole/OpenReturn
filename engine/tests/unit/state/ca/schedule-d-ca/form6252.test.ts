/*
 * Schedule D (540) with a Form 6252 capital asset gain. Federal Schedule D line
 * 4 or 11 holds it, so line 10 (federal 1040 line 7a) does too. California's
 * gain goes on line 1 from FTB 3805E line 26
 * (ca-3805e-inst-2025::sec::line-26-and-line-37::b01), which has no rules yet.
 * Without that row lines 11 and 12a would subtract the whole installment gain
 * on Schedule CA line 7a column B, so the totals are a gap. Built on the
 * rosalind facts, whose California carryover files Schedule D (540).
 */

import { describe, expect, it } from "vitest";
import { makeInstallmentSaleFactKey } from "../../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { sculpture } from "../../../../scenarios/synthetic/chiad/facts.js";
import { rosalindScenario as base } from "../../../../scenarios/synthetic/rosalind/index.js";

const installment: TaxFactRow = {
  ...base.facts[0],
  id: "f-sculpture",
  category: "capital_gains",
  key: makeInstallmentSaleFactKey("sculpture"),
  value: sculpture,
};

function evaluate(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "schedule-d-ca-6252-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  return (fieldId: string) => {
    const form = result.forms.get("schedule-d-ca");
    if (form?.mustFile.ok && form.mustFile.value === false) return "not filed";
    const field = form?.fields.find((each) => each.fieldId === `schedule-d-ca.${fieldId}`);
    if (!field) return "missing";
    if (field.result.ok) return field.result.value;
    return field.result.unsupported ? "unsupported" : undefined;
  };
}

describe("Schedule D (540) with a Form 6252 capital asset gain", () => {
  it("lines 11, 12a and 12b are a gap until FTB 3805E gives California's line 1 row", () => {
    const line = evaluate([...base.facts, installment]);
    expect(["3.line.11", "3.line.12a", "3.line.12b"].map(line)).toEqual([
      "unsupported",
      "unsupported",
      "unsupported",
    ]);
    expect(typeof line("3.line.10")).toBe("number");
  });

  it("without the installment sale the lines are figured as before", () => {
    const line = evaluate(base.facts);
    expect(line("3.line.11")).not.toBe("unsupported");
  });
});

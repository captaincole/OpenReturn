/*
 * Schedule D (540) with a Form 6252 capital asset gain. Federal Schedule D line
 * 4 or 11 holds it, so line 10 (federal 1040 line 7a) does too. California's
 * gain goes on line 1 from FTB 3805E line 26
 * (ca-3805e-inst-2025::sec::line-26-and-line-37::b01). With the same amounts on
 * both returns, the row adds the same gain to line 11 that line 10 holds, so
 * line 12a does not change. Built on the rosalind facts, whose California
 * carryover files Schedule D (540).
 */

import { describe, expect, it } from "vitest";
import { makeInstallmentSaleFactKey } from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { sculpture } from "../../../../scenarios/synthetic/chiad/facts.js";
import { rosalindScenario as base } from "../../../../scenarios/synthetic/rosalind/index.js";

/* Form 6252 line 26 of the sculpture: 30,000 × 0.2833. */
const SCULPTURE_GAIN = 8499;

const installment: TaxFactRow = {
  ...base.facts[0],
  id: "f-sculpture",
  category: "capital_gains",
  key: makeInstallmentSaleFactKey("sculpture"),
  value: sculpture,
};

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "schedule-d-ca-6252-test", taxYear: base.taxYear },
    facts,
    decisions,
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
  const without = evaluate(base.facts);
  const withSale = evaluate([...base.facts, installment]);

  it("FTB 3805E line 26 is a line 1 row after the sales, gain in column (e)", () => {
    // Rosalind's sales fill rows a and on; the next row is the FTB 3805E row.
    const sales = ["a", "b", "c", "d", "e", "f"].filter(
      (letter) => without(`0.line.1${letter}.description`) !== undefined,
    );
    const row = `0.line.1${"abcdef"[sales.length]}`;
    expect(withSale(`${row}.description`)).toBe("Bronze sculpture, 'Tidewater' (FTB 3805E)");
    expect(withSale(`${row}.gain`)).toBe(SCULPTURE_GAIN);
    expect(withSale(`${row}.sales_price`)).toBeUndefined();
    expect(withSale(`${row}.cost_basis`)).toBeUndefined();
  });

  it("lines 10 and 11 both take the gain, so line 12a is the same as without the sale", () => {
    expect(withSale("3.line.10")).toBe((without("3.line.10") as number) + SCULPTURE_GAIN);
    expect(withSale("3.line.11")).toBe((without("3.line.11") as number) + SCULPTURE_GAIN);
    expect([withSale("3.line.12a"), withSale("3.line.12b")]).toEqual([
      without("3.line.12a"),
      without("3.line.12b"),
    ]);
  });

  it("with FTB 3805E off by decision, lines 11, 12a and 12b are a gap", () => {
    const off = evaluate(
      [...base.facts, installment],
      [
        ...base.decisions,
        decisionRow({
          userId: base.userId,
          taxYear: base.taxYear,
          key: "decisions.scope.must_file_3805e",
          decision: false,
          rationale: "test",
        }),
      ],
    );
    expect(["3.line.11", "3.line.12a", "3.line.12b"].map(off)).toEqual([
      "unsupported",
      "unsupported",
      "unsupported",
    ]);
  });
});

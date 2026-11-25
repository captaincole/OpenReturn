/*
 * Form 8801 line 23: Form 6251 line 7 less the AMT foreign tax credit that
 * Form 6251 line 8 would hold, also when Form 6251 leaves line 8 blank (the
 * DECISION comment above line23Of in credit.ts).
 */

import { describe, expect, it } from "vitest";
import type { ForeignTaxSource } from "../../../../src/federal/1116/sources.js";
import { line23Of, type Form8801CreditInfo } from "../../../../src/federal/8801/credit.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { logainScenario as base } from "../../../scenarios/synthetic/logain/index.js";

const source: ForeignTaxSource = {
  factKey: "account.fund.dividends",
  payer: "Fund",
  country: "RIC",
  category: "passive",
  incomeKind: "dividends",
  grossIncome: undefined,
  foreignTaxPaid: 250,
  onPayeeStatement: true,
};

const FORM_6251_FILES = { "form-6251": { value: true } };

const noCreditInfo = {
  filingStatus: "single",
  mustFile: FORM_6251_FILES,
} as unknown as Form8801CreditInfo;

const electionInfo = {
  ...noCreditInfo,
  foreignTax: { sources: [source], election: true, categories: [], claimAccrued: false },
} as unknown as Form8801CreditInfo;

/* Form 6251 line 7 at 165,806 and line 10 above it, so Form 6251 leaves line 8 blank. */
const accessor = (line7: number) => ({
  "form-1040.line.16": 201_393,
  "form-6251.0.line.7_tax_on_line_6": line7,
  "form-6251.0.line.10_regular_tax_less_credits": 201_143,
});

describe("Form 8801 line 23", () => {
  it("no foreign tax credit: line 23 is Form 6251 line 7, as before", () => {
    expect(line23Of(accessor(165_806), noCreditInfo)).toBe(165_806);
  });

  it("the election: line 23 is line 7 less Schedule 3 line 1, with Form 6251 line 8 blank", () => {
    expect(line23Of(accessor(165_806), electionInfo)).toBe(165_556);
  });

  it("a credit larger than line 7: line 23 is 0", () => {
    expect(line23Of(accessor(100), electionInfo)).toBe(0);
  });

  it("Form 6251 line 7 blank: line 23 waits", () => {
    expect(line23Of({ "form-1040.line.16": 201_393 }, electionInfo)).toBeUndefined();
  });
});

describe("Form 8801 line 23 on the logain return", () => {
  function evaluate(extra: ReturnType<typeof decisionRow>[] = []) {
    const result = evaluateScenario({
      filing: { id: "form-8801-line-23", taxYear: base.taxYear },
      facts: base.facts,
      decisions: [...base.decisions, ...extra],
      authEmail: null,
    });
    const field = (formId: string, id: string) =>
      result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
    const value = (formId: string, id: string) => {
      const found = field(formId, id);
      return found?.ok ? found.value : undefined;
    };
    return { field, value };
  }

  it("the election: Form 6251 still prints line 9 as line 7; line 23 subtracts the credit", () => {
    const run = evaluate();
    expect(run.value("form-6251", "0.line.8_amt_foreign_tax_credit")).toBeUndefined();
    expect(run.value("form-6251", "0.line.9_tentative_minimum_tax")).toBe(165_806);
    expect(run.value("form-8801", "1.line.23_current_year_tentative_minimum_tax")).toBe(165_556);
    expect(run.value("form-8801", "1.line.25_minimum_tax_credit")).toBe(35_587);
  });

  it("Form 1116 on the return: line 23 and the lines after it are unsupported", () => {
    const form1116 = decisionRow({
      userId: base.userId,
      taxYear: base.taxYear,
      key: "decisions.scope.must_file_1116",
      decision: true,
      rationale: "t",
    });
    const run = evaluate([form1116]);
    const line23 = run.field("form-8801", "1.line.23_current_year_tentative_minimum_tax");
    expect(line23).toMatchObject({ ok: false, unsupported: true });
    expect((line23 as { reason: string }).reason).toContain("second set of Forms 1116");
    for (const id of ["1.line.25_minimum_tax_credit", "1.line.26_credit_carryforward_next_year"]) {
      expect(run.field("form-8801", id)).toMatchObject({ ok: false, unsupported: true });
    }
  });
});

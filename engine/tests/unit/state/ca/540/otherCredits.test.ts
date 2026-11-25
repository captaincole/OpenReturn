/*
 * Form 540 lines 43 and 44 with both other credits the engine figures: the
 * credit for prior year AMT (FTB 3510, code 188) and the other state tax
 * credit (Schedule S, code 187). The synthetic setalle scenario (FTB 3510) is
 * the base, with elyas's Massachusetts Schedule S fact added.
 */

import { describe, expect, it } from "vitest";
import { isOtherStateTaxFactKey } from "../../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { elyasScenario as elyas } from "../../../../scenarios/synthetic/elyas/index.js";
import { setalleScenario as setalle } from "../../../../scenarios/synthetic/setalle/index.js";
import type { Scenario } from "../../../../types.js";

const massachusetts: TaxFactRow = {
  ...elyas.facts.find((fact) => isOtherStateTaxFactKey(fact.key))!,
  userId: setalle.userId,
  taxYear: setalle.taxYear,
};

function evaluate(facts: TaxFactRow[], base: Scenario = setalle) {
  const result = evaluateScenario({
    filing: { id: "other-credits-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const value = (formId: string, id: string) => {
    const found = result.forms
      .get(formId)
      ?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
    return found?.ok ? found.value : undefined;
  };
  const line540 = (id: string) => value("form-540", id) as number | string | undefined;
  const gap = (id: string) =>
    (
      result.forms.get("form-540")?.fields.find((each) => each.fieldId === `form-540.${id}`)
        ?.result as { unsupported?: boolean } | undefined
    )?.unsupported === true;
  return { files, value, line540, gap };
}

const LINES_43_44 = [
  "line.43_credit_name",
  "line.43_credit_code",
  "line.43_credit_amount",
  "line.44_credit_name",
  "line.44_credit_code",
  "line.44_credit_amount",
];

describe("Form 540 lines 43 and 44 with both other credits", () => {
  const run = evaluate([...setalle.facts, massachusetts]);
  const amtCredit = run.value("schedule-p", "2.part3.10_prior_year_amt_credit_used_col_b");
  const otherStateCredit = run.value("schedule-p", "3.part3.20_other_state_tax_credit_used_col_b");

  it("files FTB 3510, Schedule S and Schedule P (540)", () => {
    expect(["form-3510", "schedule-s", "schedule-p"].map(run.files)).toEqual([true, true, true]);
  });

  it("line 43 is the prior year AMT credit and line 44 the other state tax credit", () => {
    expect(amtCredit).toBe(6_450);
    expect(otherStateCredit).toBe(run.value("schedule-s", "0.line.12_other_state_tax_credit"));
    expect(LINES_43_44.map(run.line540)).toEqual([
      "Prior Year AMT",
      "188",
      amtCredit,
      "Other State Tax",
      "187",
      otherStateCredit,
    ]);
  });

  it("Schedule S line 2 is line 35 less the prior year AMT credit, not its own credit", () => {
    const line35 = run.line540("line.35_total_tax_after_credits") as number;
    const line2 = run.value("schedule-s", "0.line.2_california_tax_liability");
    expect(line2).toBe(line35 - (amtCredit as number));
    expect([line35, line2, otherStateCredit]).toEqual([23_775, 17_325, 1_500]);
    // Schedule P line 11 is the same balance: the tax after the Section A credits.
    expect(run.value("schedule-p", "2.part3.11_tax_balance_col_c")).toBe(line2);
  });

  it("line 47 adds both credits and line 48 is figured: nothing waits", () => {
    const line35 = run.line540("line.35_total_tax_after_credits") as number;
    const total = (amtCredit as number) + (otherStateCredit as number);
    expect(otherStateCredit).toBeGreaterThan(0);
    expect(run.line540("line.47_total_credits")).toBe(total);
    expect(run.line540("line.48_tax_after_credits")).toBe(Math.max(0, line35 - total));
    expect([total, run.line540("line.48_tax_after_credits")]).toEqual([7_950, 15_825]);
  });
});

describe("Form 540 lines 43 and 44 with one other credit", () => {
  it("only the prior year AMT credit: line 43 holds it and line 44 is blank", () => {
    const run = evaluate(setalle.facts);
    expect(LINES_43_44.map(run.line540)).toEqual([
      "Prior Year AMT",
      "188",
      6_450,
      undefined,
      undefined,
      undefined,
    ]);
    expect(run.line540("line.47_total_credits")).toBe(6_450);
  });

  it("only the other state tax credit: line 43 holds it and line 44 is blank", () => {
    const run = evaluate(elyas.facts, elyas);
    expect(LINES_43_44.map(run.line540)).toEqual([
      "Other State Tax",
      "187",
      1_450,
      undefined,
      undefined,
      undefined,
    ]);
    expect(run.line540("line.47_total_credits")).toBe(1_450);
  });

  it("neither form: lines 43 and 44 are unsupported and line 48 is line 35", () => {
    const facts = elyas.facts.filter((fact) => !isOtherStateTaxFactKey(fact.key));
    const run = evaluate(facts, elyas);
    expect(run.files("schedule-s")).toBe(false);
    expect(LINES_43_44.map(run.gap)).toEqual(LINES_43_44.map(() => true));
    expect(run.line540("line.48_tax_after_credits")).toBe(
      run.line540("line.35_total_tax_after_credits"),
    );
  });
});

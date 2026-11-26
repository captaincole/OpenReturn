/*
 * Form 8379 on a whole return: who files, Part I's stops, Part II, each Part
 * III line, the gaps, and that the form changes no amount on the return. The
 * synthetic erian scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  BLINDNESS_KEYS,
  INJURED_SPOUSE_KEY,
  makeW2FactKey,
  type InjuredSpouseFactValue,
  type InjuredSpouseShares,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { erianClaim } from "../../../scenarios/synthetic/erian/facts.js";
import { erianScenario as base } from "../../../scenarios/synthetic/erian/index.js";

const FORM = "form-8379";
const ERIAN_W2 = makeW2FactKey("alachua-hollow");
const BASTIEN_W2 = makeW2FactKey("santa-fe-river");

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const valueOf = (key: string) => base.facts.find((fact) => fact.key === key)!.value as object;

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const claim = (
  change: Partial<InjuredSpouseFactValue>,
  shares: Partial<InjuredSpouseShares> = {},
): InjuredSpouseFactValue => ({
  ...erianClaim,
  ...change,
  shares: { ...erianClaim.shares, ...shares },
});

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8379-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const form = result.forms.get(FORM);
  const files = form?.mustFile.ok ? form.mustFile.value : undefined;
  const field = (id: string) =>
    form?.fields.find((each) => each.fieldId === `${FORM}.${id}`)?.result;
  const line = (id: string) => {
    const found = field(id);
    return found?.ok ? found.value : undefined;
  };
  const columns = (prefix: string) =>
    ["a", "b", "c"].map((column) => line(`1.${prefix}_col_${column}`));
  const values = (formId: string) =>
    Object.fromEntries(
      (result.forms.get(formId)?.fields ?? []).map((each) => [
        each.fieldId,
        each.result.ok ? each.result.value : "(blank)",
      ]),
    );
  return { files, field, line, columns, values, missing: form?.missingInputs ?? [] };
}

const withStatus = (status: string) =>
  base.decisions.map((each) =>
    each.decisionKey === "decisions.scope.filing_status" ? { ...each, decision: status } : each,
  );

describe("Form 8379 who files (irs-8379-inst-2025::sec::are-you-an-injured-spouse::b01)", () => {
  it("files for a joint return whose refund pays only the other spouse's debt", () => {
    const run = evaluate(base.facts);
    expect(run.files).toBe(true);
    expect(run.missing).toEqual([]);
  });

  it("does not file without the fact", () => {
    expect(evaluate(factsWith({ [INJURED_SPOUSE_KEY]: undefined })).files).toBe(false);
  });

  it("does not file when the injured spouse owes the debt too (line 4 Yes)", () => {
    const run = evaluate(factsWith({ [INJURED_SPOUSE_KEY]: claim({ legallyObligated: true }) }));
    expect(run.files).toBe(false);
  });

  it("does not file when no debt takes the overpayment (line 3 No)", () => {
    const run = evaluate(
      factsWith({ [INJURED_SPOUSE_KEY]: claim({ offsetForOtherSpouseDebt: false }) }),
    );
    expect(run.files).toBe(false);
  });

  it("does not file on a separate return (line 2 No)", () => {
    expect(evaluate(base.facts, withStatus("married_filing_separately")).files).toBe(false);
  });

  it("the explicit decision files it with no fact, and asks for the fact", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_8379", true)];
    const run = evaluate(factsWith({ [INJURED_SPOUSE_KEY]: undefined }), decisions);
    expect(run.files).toBe(true);
    expect(run.missing).toContain(INJURED_SPOUSE_KEY);
    expect(run.line("0.line.3_overpayment_spouse_debt_yes")).toBeUndefined();
  });

  it("the explicit decision false keeps it off", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_8379", false)];
    expect(evaluate(base.facts, decisions).files).toBe(false);
  });

  it("leaves the return when Part I ends at line 9 No", () => {
    // No withholding or payments for Erian, and no refundable credit on the return.
    const facts = factsWith({
      [ERIAN_W2]: { ...valueOf(ERIAN_W2), box2: 0 },
      [INJURED_SPOUSE_KEY]: claim(
        {},
        { payments: 0, nonrefundableCredits: 0, refundableCredits: 0 },
      ),
      "dependent.liora-thalmont": undefined,
      "dependent.cassian-thalmont": undefined,
    });
    expect(evaluate(facts).files).toBe(false);
  });
});

describe("no facts, nothing changes", () => {
  it("every Form 1040 and schedule value is the same with or without the fact", () => {
    const withForm = evaluate(base.facts);
    const without = evaluate(factsWith({ [INJURED_SPOUSE_KEY]: undefined }));
    for (const formId of ["form-1040", "schedule-1", "schedule-2", "schedule-8812"]) {
      expect(without.values(formId)).toEqual(withForm.values(formId));
    }
  });
});

describe("Part I", () => {
  it("line 6 Yes skips lines 7 to 9, and no Yes box after it is checked", () => {
    const run = evaluate(base.facts);
    expect(run.line("0.line.2_filed_joint_return_yes")).toBe(true);
    expect(run.line("0.line.3_overpayment_spouse_debt_yes")).toBe(true);
    expect(run.line("0.line.4_obligated_past_due_no")).toBe(true);
    expect(run.line("0.line.5_community_property_resident_no")).toBe(true);
    expect(run.line("0.line.6_made_reported_payments_yes")).toBe(true);
    for (const id of ["7_had_earned_income", "8_claimed_eic_actc", "9_claimed_refundable_credit"]) {
      expect(run.line(`0.line.${id}_yes`)).toBe(false);
      expect(run.line(`0.line.${id}_no`)).toBe(false);
    }
  });

  it("line 5 Yes names the community property states and skips lines 6 to 9", () => {
    const run = evaluate(
      factsWith({ [INJURED_SPOUSE_KEY]: claim({ communityPropertyStates: ["TX", "NM"] }) }),
    );
    expect(run.files).toBe(true);
    expect(run.line("0.line.5_community_property_resident_yes")).toBe(true);
    // "Enter the name(s) of the community property state(s)": names, not codes.
    expect(run.line("0.line.5_community_property_states")).toBe("Texas, New Mexico");
    expect(run.line("0.line.6_made_reported_payments_yes")).toBe(false);
  });

  it("line 7 Yes and line 8 Yes: no payments, wages, and the additional child tax credit", () => {
    const facts = factsWith({
      [ERIAN_W2]: { ...valueOf(ERIAN_W2), box2: 0 },
      [INJURED_SPOUSE_KEY]: claim({}, { payments: 0 }),
    });
    const run = evaluate(facts);
    expect(run.files).toBe(true);
    expect(run.line("0.line.6_made_reported_payments_no")).toBe(true);
    expect(run.line("0.line.7_had_earned_income_yes")).toBe(true);
    expect(run.line("0.line.8_claimed_eic_actc_yes")).toBe(true);
    expect(run.line("0.line.9_claimed_refundable_credit_yes")).toBe(false);
  });
});

describe("Part II (irs-8379-face-2025::sec::face-part-ii::b01)", () => {
  it("shows the taxpayer first and checks the injured spouse's box", () => {
    const run = evaluate(base.facts);
    expect(run.line("0.line.10_first_spouse_name")).toBe("Erian Thalmont");
    expect(run.line("0.line.10_second_spouse_name")).toBe("Bastien Thalmont");
    expect(run.line("0.line.10_first_spouse_injured")).toBe(true);
    expect(run.line("0.line.10_second_spouse_injured")).toBe(false);
    expect(run.line("0.line.11_refund_in_both_names")).toBe(false);
    expect(run.line("0.line.12_different_mailing_address_yes")).toBe(true);
  });

  it("line 12 No with no other address", () => {
    const run = evaluate(
      factsWith({ [INJURED_SPOUSE_KEY]: claim({ refundMailingAddress: undefined }) }),
    );
    expect(run.line("0.line.12_different_mailing_address_no")).toBe(true);
    expect(run.line("0.line.12_refund_mailing_address")).toBeUndefined();
  });

  it("Part IV stays blank: the form is attached to the return", () => {
    expect(evaluate(base.facts).line("1.signing.injured_spouse_phone")).toBeUndefined();
  });
});

describe("Part III", () => {
  it("column (a) is the joint return; (b) + (c) = (a) on every line", () => {
    const run = evaluate(base.facts);
    expect(run.columns("line.13a_income_w2")).toEqual([68000, 46000, 22000]);
    expect(run.columns("line.13b_all_other_income")).toEqual([4300, 150, 4150]);
    expect(run.columns("line.14_adjustments_to_income")).toEqual([300, 300, 0]);
    expect(run.columns("line.15_standard_or_itemized_deductions")).toEqual([31500, 15750, 15750]);
    expect(run.columns("line.16_nonrefundable_credits")).toEqual([4386, 2193, 2193]);
    expect(run.columns("line.17_refundable_credits")).toEqual([14, 7, 7]);
    expect(run.columns("line.18_other_taxes")).toEqual([400, 0, 400]);
    expect(run.columns("line.19_federal_income_tax_withheld")).toEqual([3700, 2600, 1100]);
    expect(run.columns("line.20_payments")).toEqual([1000, 500, 500]);
  });

  it("the injured spouse shown second takes the spouse's W-2 and withholding", () => {
    const run = evaluate(factsWith({ [INJURED_SPOUSE_KEY]: claim({ injuredSpouse: "spouse" }) }));
    expect(run.line("0.line.10_second_spouse_injured")).toBe(true);
    expect(run.columns("line.13a_income_w2")).toEqual([68000, 22000, 46000]);
    // Bastien's W-2 box 2 and his 1099-R box 4.
    expect(run.columns("line.19_federal_income_tax_withheld")).toEqual([3700, 1100, 2600]);
  });

  it("line 15: the injured spouse's blindness box adds $1,600 to column (b) only", () => {
    const run = evaluate(factsWith({}, [row("identity", BLINDNESS_KEYS.taxpayer, true)]));
    expect(run.columns("line.15_standard_or_itemized_deductions")).toEqual([33100, 17350, 15750]);
  });

  it("line 19 adds the stated withholding on other Forms 1099", () => {
    const run = evaluate(factsWith({ [INJURED_SPOUSE_KEY]: claim({}, { otherWithholding: 0 }) }));
    expect(run.columns("line.19_federal_income_tax_withheld")).toEqual([3700, 2600, 1100]);
  });

  it("a share above column (a) is a gap, not a number", () => {
    const run = evaluate(factsWith({ [INJURED_SPOUSE_KEY]: claim({}, { adjustments: 500 }) }));
    expect(isGap(run.field("1.line.14_adjustments_to_income_col_b"))).toBe(true);
  });

  it("line 20 is a gap when the spouses do not agree on the joint estimated payments", () => {
    const run = evaluate(factsWith({ [INJURED_SPOUSE_KEY]: claim({ paymentsNotAgreed: true }) }));
    expect(isGap(run.field("1.line.20_payments_col_b"))).toBe(true);
    expect(isGap(run.field("1.line.20_payments_col_c"))).toBe(true);
  });

  const secondJob = (of: string): TaxFactRow =>
    row("wages", makeW2FactKey("second-job"), {
      ...valueOf(of),
      employerName: "Ichetucknee Tubing Co",
      employerEin: "00-0008381",
      box4: 10000,
    });

  it("line 19 puts the other spouse's excess social security tax in column (c)", () => {
    /*
     * Bastien: 1,364 + 10,000 − 10,918.20 = 445.80 → 446 (Schedule 3 line 11).
     * Column (a): line 25d 2,600 + 700 + 700 + 400 = 4,400, plus 446.
     */
    const run = evaluate(factsWith({}, [secondJob(BASTIEN_W2)]));
    expect(run.columns("line.19_federal_income_tax_withheld")).toEqual([4846, 2600, 2246]);
  });

  it("line 19 adds the injured spouse's own excess social security tax in column (b)", () => {
    /*
     * Erian: 2,852 + 10,000 − 10,918.20 = 1,933.80 → 1,934; column (b) 2,600 + 2,600 + 1,934.
     * Column (a): line 25d 2,600 + 2,600 + 700 + 400 = 6,300, plus 1,934.
     */
    const run = evaluate(factsWith({}, [secondJob(ERIAN_W2)]));
    expect(run.columns("line.19_federal_income_tax_withheld")).toEqual([8234, 7134, 1100]);
  });

  it("line 19 is a gap when a spouse's excess social security tax is one", () => {
    const railroad = row("wages", makeW2FactKey("second-job"), {
      ...valueOf(BASTIEN_W2),
      employerEin: "00-0008381",
      box4: 0,
      box14: [{ label: "Tier 1 tax", amount: 10000 }],
    });
    const run = evaluate(factsWith({}, [railroad]));
    expect(isGap(run.field("1.line.19_federal_income_tax_withheld_col_b"))).toBe(true);
  });

  it("a W-2 that cannot be placed with a spouse is asked for, and line 13a waits", () => {
    const unplaced = { ...valueOf(BASTIEN_W2), owner: undefined, employee: undefined };
    const run = evaluate(factsWith({ [BASTIEN_W2]: unplaced }));
    expect(run.missing).toContain(BASTIEN_W2);
    expect(run.line("1.line.13a_income_w2_col_b")).toBeUndefined();
  });

  it("itemizing asks for the injured spouse's share of the deductions", () => {
    const decisions = base.decisions.map((each) =>
      each.decisionKey === "decisions.itemize_vs_standard"
        ? { ...each, decision: "itemized" }
        : each,
    );
    expect(evaluate(base.facts, decisions).missing).toContain(INJURED_SPOUSE_KEY);
  });
});

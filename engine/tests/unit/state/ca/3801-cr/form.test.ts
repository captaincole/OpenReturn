/*
 * FTB 3801-CR on a whole return: who files, what it asks, the worksheet each
 * credit takes, Part IV, the gaps, the credit's way to Form 540 lines 43 to 45
 * and Schedule P (540) lines 16 to 18, and "no facts, nothing changes". The
 * synthetic kiruna (Schedule P) and leonin (no Schedule P) scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  CA_PTE_CREDIT_CARRYOVER_KEY,
  isCaPassiveCreditFactKey,
  isW2FactKey,
  makeCaPassiveCreditFactKey,
  makeCaPteElectiveCreditFactKey,
  makeOtherStateTaxFactKey,
  SPOUSE_KEYS,
  type CaPassiveCreditFactValue,
  type W2FactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { kirunaScenario as kiruna } from "../../../../scenarios/synthetic/kiruna/index.js";
import { leoninScenario as leonin } from "../../../../scenarios/synthetic/leonin/index.js";
import type { Scenario } from "../../../../types.js";

const withDecision = (base: Scenario, key: string, value: unknown): AIDecisionRow[] => [
  ...base.decisions.filter((each) => each.decisionKey !== key),
  decisionRow({ userId: base.userId, taxYear: base.taxYear, key, decision: value, rationale: "t" }),
];

const creditFact = (
  base: Scenario,
  slug: string,
  value: Partial<CaPassiveCreditFactValue>,
): TaxFactRow => ({
  id: `f-${slug}`,
  userId: base.userId,
  taxYear: base.taxYear,
  category: "other",
  key: makeCaPassiveCreditFactKey(slug),
  value,
  sourceNote: "test",
  createdAt: "2026-11-26T00:00:00Z",
});

const withoutCredits = (facts: TaxFactRow[]) =>
  facts.filter((fact) => !isCaPassiveCreditFactKey(fact.key));

function evaluate(base: Scenario, facts = base.facts, decisions = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3801-cr-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  const line = (id: string) => value("form-3801-cr", id);
  const form540 = (id: string) => value("form-540", `line.${id}`);
  const missing = result.forms.get("form-3801-cr")?.missingInputs ?? [];
  return { files, field, value, line, form540, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;
const reasonOf = (result: unknown) => (result as { reason?: string } | undefined)?.reason;

const ACTIVITY = { name: "Test Partners LP", rentalRealEstate: false };

describe("FTB 3801-CR who files", () => {
  it("files with kiruna's credits and asks nothing", () => {
    const run = evaluate(kiruna);
    expect(run.files("form-3801-cr")).toBe(true);
    expect(run.missing).toEqual([]);
  });

  it("does not file without a credit, with credits of 0, without a California return, or when the decision says no", () => {
    expect(evaluate(kiruna, withoutCredits(kiruna.facts)).files("form-3801-cr")).toBe(false);
    const zero = creditFact(kiruna, "zero", {
      creditCode: "183",
      column: "current",
      amount: 0,
      activity: ACTIVITY,
    });
    expect(evaluate(kiruna, [...withoutCredits(kiruna.facts), zero]).files("form-3801-cr")).toBe(
      false,
    );
    const noCalifornia = withDecision(kiruna, "decisions.scope.must_file_ca_540", false);
    expect(evaluate(kiruna, kiruna.facts, noCalifornia).files("form-3801-cr")).toBe(false);
    const no = withDecision(kiruna, "decisions.scope.must_file_3801_cr", false);
    expect(evaluate(kiruna, kiruna.facts, no).files("form-3801-cr")).toBe(false);
  });

  it("asks again for a credit that is not complete, or whose worksheet is not chosen yet", () => {
    const partial = creditFact(kiruna, "partial", { creditCode: "183", amount: 900 });
    const housing = creditFact(kiruna, "housing", {
      creditCode: "172",
      column: "current",
      amount: 900,
      activity: { name: "Housing LP", rentalRealEstate: true },
    });
    const orphan = creditFact(kiruna, "orphan", {
      creditCode: "185",
      column: "current",
      amount: 500,
      activity: ACTIVITY,
    });
    const run = evaluate(kiruna, [...kiruna.facts, partial, housing, orphan]);
    expect(run.files("form-3801-cr")).toBe(true);
    expect(run.missing).toEqual([
      makeCaPassiveCreditFactKey("partial"),
      makeCaPassiveCreditFactKey("housing"),
      makeCaPassiveCreditFactKey("orphan"),
    ]);
    expect(run.line("1.line.17_passive_activity_credits_allowed")).toBeUndefined();
  });

  it("a separate return asks whether the spouses lived apart all year", () => {
    const decisions = withDecision(
      kiruna,
      "decisions.scope.filing_status",
      "married_filing_separately",
    );
    const run = evaluate(kiruna, kiruna.facts, decisions);
    expect(run.missing).toContain(SPOUSE_KEYS.livedApartAllYear);
  });
});

describe("FTB 3801-CR on the kiruna return (net passive income, Schedule P)", () => {
  it("lines 1a to 17 and the hand check of the README", () => {
    const run = evaluate(kiruna);
    const at = (id: string) => run.line(`0.line.${id}`);
    expect([at("1c_rental_real_estate_total"), at("3c_housing_post_1989_total")]).toEqual([
      1500, 5500,
    ]);
    expect([at("4c_other_passive_total"), at("5_total_passive_credits")]).toEqual([3300, 10300]);
    // 22,000 of net passive income at 9.3%; line 14's 5,000 at 9.3%.
    expect([at("6_tax_on_net_passive_income"), at("15_tax_on_line_14_amount")]).toEqual([
      2046, 465,
    ]);
    expect(at("13_ftb_3801_line_9_amount")).toBeUndefined();
    // 2,046 + 465 + the low-income housing offset: line 3c (5,500), less than 8,254 − 465.
    expect(run.line("1.line.17_passive_activity_credits_allowed")).toBe(2046 + 465 + 5500);
  });

  it("Schedule P (540) lines 16 to 18 take the credits in the order of use; Form 540 line 45 adds them", () => {
    const run = evaluate(kiruna);
    const row = (line: number, column: string) =>
      run.value("schedule-p", `3.part3.${line}_${column}`);
    expect([row(16, "credit_code"), row(17, "credit_code"), row(18, "credit_code")]).toEqual([
      "183",
      "185",
      "172",
    ]);
    expect([row(16, "credit_amount_col_a"), row(17, "credit_amount_col_a")]).toEqual([2133, 378]);
    expect([row(18, "credit_used_col_b"), row(18, "tax_balance_col_c")]).toEqual([5500, 764]);
    expect(isGap(run.field("schedule-p", "3.part3.19_credit_code"))).toBe(true);
    expect(run.form540("45_schedule_p_credits")).toBe(8011);
    expect(run.form540("43_credit_amount")).toBeUndefined();
    expect(run.form540("48_tax_after_credits")).toBe(8775 - 8011);
  });

  it("a credit is never used past the tax: column (b) stops at the balance, column (d) carries the rest", () => {
    // Wages of $28,706: taxable income $45,000, Form 540 line 31 $1,235, line 35 $1,082.
    const smallWages = kiruna.facts.map((fact) =>
      isW2FactKey(fact.key)
        ? {
            ...fact,
            value: {
              ...(fact.value as W2FactValue),
              ...{ box1: 28706, box3: 28706, box5: 28706, box16: 28706 },
            },
          }
        : fact,
    );
    const run = evaluate(kiruna, smallWages);
    // Line 17 is 7,332 (line 6 886 + line 16 946 + the housing offset 5,500), shared 1,648 / 184 / 5,500.
    expect(run.line("1.line.17_passive_activity_credits_allowed")).toBe(7332);
    const row = (line: number) =>
      [
        "credit_amount_col_a",
        "credit_used_col_b",
        "tax_balance_col_c",
        "credit_carryover_col_d",
      ].map((column) => run.value("schedule-p", `3.part3.${line}_${column}`));
    expect(run.value("schedule-p", "2.part3.11_tax_balance_col_c")).toBe(1082);
    expect(row(16)).toEqual([1648, 1082, 0, 566]);
    expect(row(17)).toEqual([184, 0, 0, 184]);
    expect(row(18)).toEqual([5500, 0, 0, 5500]);
    expect(run.form540("47_total_credits")).toBe(1082);
    expect(run.form540("48_tax_after_credits")).toBe(0);
  });
});

describe("the credits after Section B2 on the kiruna return", () => {
  const massachusetts: TaxFactRow = {
    ...creditFact(kiruna, "ma", {}),
    category: "state_local_tax",
    key: makeOtherStateTaxFactKey("ma"),
    value: {
      state: "MA",
      items: [{ description: "Wages", californiaAmount: 20000, otherStateAmount: 20000 }],
      taxPaid: 1000,
      otherStateAdjustedGrossIncome: 20000,
    },
  };

  it("Schedule S line 2 is Form 540 line 48 without the other state tax credit: line 35 less the passive credits", () => {
    const run = evaluate(kiruna, [...kiruna.facts, massachusetts]);
    expect(run.value("schedule-s", "0.line.2_california_tax_liability")).toBe(8775 - 8011);
    // 764 × 0.1429 = 109, less than the $1,000 paid.
    expect(run.value("schedule-s", "0.line.12_other_state_tax_credit")).toBe(109);
    expect(run.value("schedule-p", "3.part3.20_other_state_tax_credit_used_col_b")).toBe(109);
    expect(run.form540("45_schedule_p_credits")).toBe(8011 + 109);
    expect(run.form540("48_tax_after_credits")).toBe(8775 - 8011 - 109);
  });

  it("Schedule P (540) attaches with more than two credits, with no decision", () => {
    expect(kiruna.decisions.some((each) => each.decisionKey.endsWith("schedule_p"))).toBe(false);
    expect(evaluate(kiruna).files("schedule-p")).toBe(true);
    // Leonin's two passive credits: lines 43 and 44, no Schedule P; a third credit attaches it.
    expect(evaluate(leonin).files("schedule-p")).toBe(false);
    const third = { ...massachusetts, userId: leonin.userId };
    expect(evaluate(leonin, [...leonin.facts, third]).files("schedule-p")).toBe(true);
    expect(evaluate(kiruna, withoutCredits(kiruna.facts)).files("schedule-p")).toBe(false);
  });
});

describe("FTB 3801-CR on the leonin return (no FTB 3801, no Schedule P)", () => {
  it("line 6 from the rental's net income, Form 540 lines 43 and 44", () => {
    const run = evaluate(leonin);
    expect(run.files("form-3801")).toBe(false);
    expect(run.line("0.line.2c_housing_pre_1990_total")).toBe(2400);
    expect(run.line("0.line.6_tax_on_net_passive_income")).toBe(1302);
    // 1,302 + the housing offset: line 7 (2,298), less than line 2c (2,400). Every credit is allowed.
    expect(run.line("1.line.17_passive_activity_credits_allowed")).toBe(3600);
    expect([run.form540("43_credit_code"), run.form540("43_credit_amount")]).toEqual(["183", 1200]);
    expect([run.form540("44_credit_code"), run.form540("44_credit_amount")]).toEqual(["172", 2400]);
    expect(run.form540("47_total_credits")).toBe(3600);
  });

  it("with no Schedule P, a credit stops at the tax left", () => {
    const big = creditFact(leonin, "big", {
      creditCode: "172",
      column: "current",
      amount: 90000,
      activity: { name: "Big Housing LP", rentalRealEstate: true, before1990: false },
    });
    const run = evaluate(leonin, [...leonin.facts, big]);
    // Line 17 allows all 93,600 (the offset has no dollar limit); line 35 is 4,684.
    expect(run.line("1.line.17_passive_activity_credits_allowed")).toBe(93600);
    expect(run.form540("43_credit_amount")).toBe(1200);
    expect(run.form540("44_credit_amount")).toBe(4684 - 1200);
    expect(run.form540("47_total_credits")).toBe(4684);
    expect(run.form540("48_tax_after_credits")).toBe(0);
  });

  it("a separate return living with the spouse: the housing credit is on line 4 and gets no offset", () => {
    const decisions = withDecision(
      leonin,
      "decisions.scope.filing_status",
      "married_filing_separately",
    );
    const spouse: TaxFactRow = {
      ...creditFact(leonin, "spouse", {}),
      category: "filing_status",
      key: SPOUSE_KEYS.livedApartAllYear,
      value: false,
    };
    const run = evaluate(leonin, [...leonin.facts, spouse], decisions);
    expect(run.line("0.line.2c_housing_pre_1990_total")).toBeUndefined();
    expect(run.line("0.line.4c_other_passive_total")).toBe(3600);
    const line6 = run.line("0.line.6_tax_on_net_passive_income");
    expect(line6).toBeGreaterThan(0);
    expect(run.line("1.line.17_passive_activity_credits_allowed")).toBe(line6);
  });
});

describe("the credits after Section B2", () => {
  it("the PTE elective tax credit (Section B4) takes only the tax the passive credits leave", () => {
    const pte: TaxFactRow = {
      ...creditFact(leonin, "pte", {}),
      category: "state_local_tax",
      key: makeCaPteElectiveCreditFactKey("raisin-row"),
      value: { entityName: "Raisin Row Packers LLC", entityId: "201900003801", credit: 5000 },
    };
    const carryover: TaxFactRow = {
      ...creditFact(leonin, "pte-carry", {}),
      key: CA_PTE_CREDIT_CARRYOVER_KEY,
      value: 0,
    };
    const run = evaluate(leonin, [...leonin.facts, pte, carryover]);
    // Form 540 line 35 is 4,684; the passive credits take 3,600 first.
    expect(run.value("form-3804-cr", "0.part2.4_credit_claimed_current_year")).toBe(4684 - 3600);
    expect(run.form540("45_schedule_p_credits")).toBe(4684);
    expect(run.form540("48_tax_after_credits")).toBe(0);
  });
});

describe("Part IV", () => {
  const election = (slug: string, name: string) =>
    creditFact(leonin, slug, {
      creditCode: "183",
      column: "prior_year_unallowed",
      amount: 2000,
      activity: { name, rentalRealEstate: false },
      basisIncreaseElection: {
        propertyDescription: "Laboratory centrifuges and analyzers placed in service in 2022",
        amount: 1500.4,
      },
    });

  it("one election fills lines 18 to 21 and lowers the credit by the basis adjustment", () => {
    const run = evaluate(leonin, [...leonin.facts, election("sold", "Old Lab LP")]);
    expect(run.line("1.line.18_elect_increase_basis_credit_property")).toBe(true);
    expect(run.line("1.line.19_name_of_activity_disposed")).toBe("Old Lab LP");
    expect(run.line("1.line.20_credit_property_description_row1")).toBe(
      "Laboratory centrifuges and analyzers",
    );
    expect(run.line("1.line.20_credit_property_description_row2")).toBe(
      "placed in service in 2022",
    );
    expect(run.line("1.line.21_unallowed_credit_reduced_basis")).toBe(1500);
    // Line 4b: 2,000 less the 1,500 basis adjustment.
    expect(run.line("0.line.4b_other_passive_prior_unallowed")).toBe(500);
  });

  it("a second election is a gap; with none, line 18 is unchecked", () => {
    const run = evaluate(leonin, [...leonin.facts, election("a", "A LP"), election("b", "B LP")]);
    expect(isGap(run.field("form-3801-cr", "1.line.19_name_of_activity_disposed"))).toBe(true);
    expect(evaluate(leonin).line("1.line.18_elect_increase_basis_credit_property")).toBe(false);
  });
});

describe("FTB 3801-CR gaps", () => {
  it("a credit from a publicly traded partnership: Form 540 lines 43 to 48 are unsupported", () => {
    const ptp = creditFact(leonin, "ptp", {
      creditCode: "183",
      column: "current",
      amount: 700,
      activity: { name: "Listed LP", rentalRealEstate: false, publiclyTradedPartnership: true },
    });
    const run = evaluate(leonin, [...leonin.facts, ptp]);
    expect(run.line("0.line.5_total_passive_credits")).toBe(3600);
    expect(isGap(run.field("form-540", "line.47_total_credits"))).toBe(true);
  });

  it("a Form 540NR return: the tax lines are unsupported", () => {
    const decisions = [
      ...withDecision(leonin, "decisions.scope.must_file_ca_540", false),
      decisionRow({
        userId: leonin.userId,
        taxYear: leonin.taxYear,
        key: "decisions.scope.must_file_540nr",
        decision: true,
        rationale: "t",
      }),
    ];
    const run = evaluate(leonin, leonin.facts, decisions);
    expect(run.files("form-3801-cr")).toBe(true);
    expect(isGap(run.field("form-3801-cr", "0.line.6_tax_on_net_passive_income"))).toBe(true);
  });
});

describe("no credit facts, nothing changes", () => {
  it("Form 540 lines 43 to 45 and Schedule P (540) lines 16 to 18 keep their reasons", () => {
    // Schedule P (540) by decision: without the credits, nothing else attaches it.
    const decisions = withDecision(kiruna, "decisions.scope.must_file_schedule_p", true);
    const run = evaluate(kiruna, withoutCredits(kiruna.facts), decisions);
    expect(isGap(run.field("form-540", "line.43_credit_amount"))).toBe(true);
    expect(isGap(run.field("form-540", "line.45_schedule_p_credits"))).toBe(true);
    expect(run.form540("48_tax_after_credits")).toBe(8775);
    expect(reasonOf(run.field("schedule-p", "3.part3.16_credit_used_col_b"))).toBe(
      "Section B2 line 16, a credit with carryover provisions chosen from the Credit Table — no credit facts.",
    );
  });
});

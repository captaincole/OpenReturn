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
  makeCaPassiveCreditFactKey,
  makeCaPteElectiveCreditFactKey,
  SPOUSE_KEYS,
  type CaPassiveCreditFactValue,
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
    expect(run.line("1.line.17_passive_activity_credits_allowed")).toBe(2511);
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
    expect([row(16, "credit_amount_col_a"), row(17, "credit_amount_col_a")]).toEqual([1201, 166]);
    expect([row(18, "credit_used_col_b"), row(18, "tax_balance_col_c")]).toEqual([1144, 6264]);
    expect(isGap(run.field("schedule-p", "3.part3.19_credit_code"))).toBe(true);
    expect(run.form540("45_schedule_p_credits")).toBe(2511);
    expect(run.form540("43_credit_amount")).toBeUndefined();
    expect(run.form540("48_tax_after_credits")).toBe(8775 - 2511);
  });

  it("a credit is never used past the tax: column (b) stops at the balance, column (d) carries the rest", () => {
    const big = creditFact(kiruna, "big", {
      creditCode: "183",
      column: "current",
      amount: 40000,
      activity: { name: "Big Rental LLC", rentalRealEstate: true, activelyParticipated: true },
    });
    const run = evaluate(kiruna, [...kiruna.facts, big]);
    const row = (column: string) => run.value("schedule-p", `3.part3.16_${column}`);
    const available = row("credit_amount_col_a") as number;
    const used = row("credit_used_col_b") as number;
    expect(used).toBeLessThanOrEqual(8775);
    expect(row("credit_carryover_col_d")).toBe(available - used);
    expect(run.form540("48_tax_after_credits")).toBeGreaterThanOrEqual(0);
  });
});

describe("FTB 3801-CR on the leonin return (no FTB 3801, no Schedule P)", () => {
  it("line 6 from the rental's net income, Form 540 lines 43 and 44", () => {
    const run = evaluate(leonin);
    expect(run.files("form-3801")).toBe(false);
    expect(run.line("0.line.2c_housing_pre_1990_total")).toBe(2400);
    expect(run.line("0.line.6_tax_on_net_passive_income")).toBe(1302);
    expect(run.line("1.line.17_passive_activity_credits_allowed")).toBe(1302);
    expect([run.form540("43_credit_code"), run.form540("43_credit_amount")]).toEqual(["183", 434]);
    expect([run.form540("44_credit_code"), run.form540("44_credit_amount")]).toEqual(["172", 868]);
    expect(run.form540("47_total_credits")).toBe(1302);
  });

  it("with no Schedule P, a credit stops at the tax left", () => {
    const big = creditFact(leonin, "big", {
      creditCode: "183",
      column: "current",
      amount: 90000,
      activity: ACTIVITY,
    });
    const run = evaluate(leonin, [...leonin.facts, big]);
    // Line 35 is 4,684; line 6 is 1,302, so line 17 is 1,302 and fits.
    expect(run.form540("47_total_credits")).toBe(1302);
    const total =
      (run.form540("43_credit_amount") as number) + (run.form540("44_credit_amount") as number);
    expect(total).toBe(1302);
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
    // Form 540 line 35 is 4,684; the passive credits take 1,302 first.
    expect(run.value("form-3804-cr", "0.part2.4_credit_claimed_current_year")).toBe(4684 - 1302);
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
    const run = evaluate(kiruna, withoutCredits(kiruna.facts));
    expect(isGap(run.field("form-540", "line.43_credit_amount"))).toBe(true);
    expect(isGap(run.field("form-540", "line.45_schedule_p_credits"))).toBe(true);
    expect(run.form540("48_tax_after_credits")).toBe(8775);
    expect(reasonOf(run.field("schedule-p", "3.part3.16_credit_used_col_b"))).toBe(
      "Section B2 line 16, a credit with carryover provisions chosen from the Credit Table — no credit facts.",
    );
  });
});

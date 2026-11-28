/*
 * Form 8882 on a whole return: who files, each line, the reductions on
 * Schedule C and Form 4562, Form 3800 line 1k and the gaps. The synthetic
 * jac scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeChildcareExpenditureFactKey,
  makeGeneralBusinessCreditFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type ChildcareExpenditureFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  CHILDCARE_BUILDING,
  EXPENDITURES,
  LANDSCAPING_KEY,
  STAFFING_ID,
  landscaping,
} from "../../../scenarios/synthetic/jac/facts.js";
import { jacScenario as base } from "../../../scenarios/synthetic/jac/index.js";

const key = (slug: string) => makeChildcareExpenditureFactKey(slug);
const BUILDING_KEY = key("center-construction");
const TEACHERS_KEY = key("center-teachers");
const K1_KEYS = [makePartnershipK1FactKey(STAFFING_ID), makeK1HoldingFactKey(STAFFING_ID)];
const EXPENDITURE_KEYS = EXPENDITURES.map(([slug]) => key(slug));

const decision = (decisionKey: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key: decisionKey,
    decision: value,
    rationale: "test",
  });

const row = (category: string, factKey: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${factKey}`,
  category,
  key: factKey,
  value,
});

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const original = (factKey: string) =>
  base.facts.find((fact) => fact.key === factKey)!.value as ChildcareExpenditureFactValue;
const spent = (factKey: string, value: Partial<ChildcareExpenditureFactValue>) => ({
  [factKey]: { ...original(factKey), ...value },
});
const without = (keys: string[]) => Object.fromEntries(keys.map((each) => [each, undefined]));

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8882-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8882", id);
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const L1 = "0.line.1_qualified_childcare_facility_expenditures_dollars";
const L1_CENTS = "0.line.1_qualified_childcare_facility_expenditures_cents";
const L2 = "0.line.2_multiply_1_by_25_percent_dollars";
const L3 = "0.line.3_resource_referral_expenditures_dollars";
const L4 = "0.line.4_multiply_3_by_10_percent_dollars";
const L5 = "0.line.5_credit_from_pass_through_entities_dollars";
const L6 = "0.line.6_add_lines_dollars";
const L7 = "0.line.7_smaller_of_6_or_150000_dollars";
const L7_CENTS = "0.line.7_smaller_of_6_or_150000_cents";
const L8 = "0.line.8_allocated_to_beneficiaries_dollars";
const L9 = "0.line.9_subtract_8_from_7_dollars";
const L9_CENTS = "0.line.9_subtract_8_from_7_cents";
const COL_E = "2.part3.1k_form_8882_col_e";
const BASIS = "0.line.19j_row1_basis";

/* The Schedule C lines and the building's basis that the credit lowers. */
const reducedLines = (out: ReturnType<typeof evaluate>) => ({
  benefits: out.value("schedule-c", "0.line.14"),
  supplies: out.value("schedule-c", "0.line.22"),
  wages: out.value("schedule-c", "0.line.26"),
  other: out.value("schedule-c", "1.line.48"),
  basis: out.value("form-4562", BASIS),
});

describe("the jac return", () => {
  const out = evaluate(base.facts);

  it("fills lines 1 to 7, with 00 in each cents box, and leaves lines 8 and 9 for estates and trusts", () => {
    expect(out.files("form-8882")).toBe(true);
    expect(out.line(L1)).toBe(251_000);
    expect(out.line(L2)).toBe(62_750);
    expect(out.line(L3)).toBe(6_000);
    expect(out.line(L4)).toBe(600);
    expect(out.line(L5)).toBe(3_500);
    expect(out.line(L6)).toBe(66_850);
    expect(out.line(L7)).toBe(66_850);
    expect(out.line(L1_CENTS)).toBe("00");
    expect(out.line(L7_CENTS)).toBe("00");
    expect(out.line(L8)).toBeUndefined();
    expect(out.line(L9)).toBeUndefined();
    expect(out.line(L9_CENTS)).toBeUndefined();
    expect(out.missing("form-8882")).toEqual([]);
  });

  it("takes each expenditure's part of line 7 off the line that holds it", () => {
    // Shares of 63,350: 40,000 (building), 13,000 (wages), 2,250 (supplies), 7,500 (benefits), 600 (referral).
    expect(reducedLines(out)).toEqual({
      benefits: 60_000 - 7_500,
      supplies: 140_000 - 2_250,
      wages: 620_000 - 13_000,
      other: 6_000 - 600,
      basis: 160_000 - 40_000,
    });
  });

  it("Form 3800 line 1k takes the own credit and the K-1 credit: line 7", () => {
    expect(out.value("form-3800", COL_E)).toBe(66_850);
  });
});

describe("no facts of this form", () => {
  it("without expenditure facts: no Form 8882, every line of the business as stated, Form 3800 takes the K-1", () => {
    const out = evaluate(factsWith(without(EXPENDITURE_KEYS)));
    expect(out.files("form-8882")).toBe(false);
    expect(reducedLines(out)).toEqual({
      benefits: 60_000,
      supplies: 140_000,
      wages: 620_000,
      other: 6_000,
      basis: 160_000,
    });
    expect(out.value("form-3800", COL_E)).toBe(3_500);
  });

  it("without expenditure facts or the K-1: neither Form 8882 nor Form 3800 files", () => {
    const out = evaluate(factsWith(without([...EXPENDITURE_KEYS, ...K1_KEYS])));
    expect(out.files("form-8882")).toBe(false);
    expect(out.files("form-3800")).toBe(false);
  });
});

describe("who files", () => {
  it("a K-1 alone files only with the decision: lines 1 to 4 blank, line 7 is line 5", () => {
    const facts = factsWith(without(EXPENDITURE_KEYS));
    const out = evaluate(facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8882", true),
    ]);
    expect(out.files("form-8882")).toBe(true);
    expect(out.line(L1)).toBeUndefined();
    expect(out.line(L4)).toBeUndefined();
    expect(out.line(L5)).toBe(3_500);
    expect(out.line(L6)).toBe(3_500);
    expect(out.line(L7)).toBe(3_500);
    expect(out.value("form-3800", COL_E)).toBe(3_500);
  });

  it("the decision false with expenditure facts: no form, and line 1k is a gap", () => {
    const out = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8882", false),
    ]);
    expect(out.files("form-8882")).toBe(false);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("only resource and referral expenditures: lines 1 and 2 blank", () => {
    const facts = factsWith(without([...EXPENDITURE_KEYS.slice(0, 4), ...K1_KEYS]));
    const out = evaluate(facts);
    expect(out.files("form-8882")).toBe(true);
    expect(out.line(L1)).toBeUndefined();
    expect(out.line(L2)).toBeUndefined();
    expect(out.line(L4)).toBe(600);
    expect(out.line(L5)).toBeUndefined();
    expect(out.line(L7)).toBe(600);
    expect(out.value("schedule-c", "1.line.48")).toBe(5_400);
  });
});

describe("the $150,000 limit", () => {
  const bigBuilding = (extra: Record<string, unknown> = {}) =>
    factsWith({
      ...spent(BUILDING_KEY, { amount: 600_000 }),
      [LANDSCAPING_KEY]: {
        ...landscaping,
        depreciation: {
          ...landscaping.depreciation,
          assets: [{ ...landscaping.depreciation!.assets![0], cost: 600_000 }],
        },
      },
      ...extra,
    });

  it("own credit over the limit: line 7 is $150,000, and the reductions add to it", () => {
    const out = evaluate(bigBuilding(without(K1_KEYS)));
    // 150,000 + 13,000 + 2,250 + 7,500 = 172,750 on line 2; 600 on line 4.
    expect(out.line(L2)).toBe(172_750);
    expect(out.line(L6)).toBe(173_350);
    expect(out.line(L7)).toBe(150_000);
    const lines = reducedLines(out);
    const taken =
      60_000 -
      (lines.benefits as number) +
      (140_000 - (lines.supplies as number)) +
      (620_000 - (lines.wages as number)) +
      (6_000 - (lines.other as number)) +
      (600_000 - (lines.basis as number));
    expect(taken).toBe(150_000);
    expect(out.value("form-3800", COL_E)).toBe(150_000);
  });

  it("with a K-1 and line 6 over the limit: line 7 is $150,000 and line 1k is a gap", () => {
    const out = evaluate(bigBuilding());
    expect(out.line(L7)).toBe(150_000);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });
});

describe("gaps and waits", () => {
  it("an asset the depreciation does not have: lines 1 to 7 are gaps and nothing is reduced", () => {
    const out = evaluate(factsWith(spent(BUILDING_KEY, { asset: "A different building" })));
    expect(isGap(out.field("form-8882", L1))).toBe(true);
    expect(isGap(out.field("form-8882", L7))).toBe(true);
    expect(out.value("schedule-c", "0.line.26")).toBe(620_000);
    expect(out.value("form-4562", BASIS)).toBe(160_000);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("property not placed in service in 2025: line 1 counts it, and no basis changes", () => {
    const out = evaluate(
      factsWith(spent(BUILDING_KEY, { asset: undefined, notPlacedInService: true })),
    );
    expect(out.line(L1)).toBe(251_000);
    expect(out.value("form-4562", BASIS)).toBe(160_000);
    expect(out.value("schedule-c", "0.line.26")).toBe(607_000);
  });

  it("a credit larger than the line that deducts it is a gap", () => {
    const out = evaluate(factsWith(spent(TEACHERS_KEY, { deductedOn: "advertising" })));
    expect(isGap(out.field("form-8882", L2))).toBe(true);
    expect(out.value("schedule-c", "0.line.26")).toBe(620_000);
  });

  it("a fact with no place for its amount is malformed: the form waits on it", () => {
    const out = evaluate(factsWith(spent(TEACHERS_KEY, { deductedOn: undefined })));
    expect(out.missing("form-8882")).toContain(TEACHERS_KEY);
    expect(out.line(L1)).toBeUndefined();
    expect(out.line(L7)).toBeUndefined();
  });

  it("a business the owner does not materially participate in: line 1k is a gap", () => {
    const out = evaluate(
      factsWith({ [LANDSCAPING_KEY]: { ...landscaping, materiallyParticipated: false } }),
    );
    expect(out.line(L7)).toBe(66_850);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("line G not answered: Form 3800 waits on the business", () => {
    const out = evaluate(
      factsWith({ [LANDSCAPING_KEY]: { ...landscaping, materiallyParticipated: undefined } }),
    );
    expect(out.missing("form-3800")).toContain(LANDSCAPING_KEY);
  });

  it("a stated line 1k credit with no pass-through entity next to the facts is a gap", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("childcare-by-hand"), {
      sourceForm: "8882",
      line: "1k",
      amount: 63_350,
      passive: false,
    });
    const out = evaluate(factsWith({}, [stated]));
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("a stated line 1k credit from an estate's notice adds to line 5", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("estate-notice"), {
      sourceForm: "8882",
      line: "1k",
      amount: 1_200.4,
      passive: false,
      passThroughEin: "00-0001234",
    });
    const out = evaluate(factsWith({}, [stated]));
    expect(out.line(L5)).toBe(4_700);
    expect(out.line(L7)).toBe(68_050);
    expect(out.value("form-3800", COL_E)).toBe(68_050);
  });

  it("the building is the asset named, so its description must match exactly once", () => {
    expect(original(BUILDING_KEY).asset).toBe(CHILDCARE_BUILDING);
  });
});

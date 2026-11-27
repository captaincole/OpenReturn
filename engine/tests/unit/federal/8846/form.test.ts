/*
 * Form 8846 on a whole return: who files, each line, the gaps, Schedule C line
 * 23 and Form 3800 line 4f. The synthetic natti scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeBusinessFactKey,
  makeGeneralBusinessCreditFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeTipCreditFactKey,
  type BusinessFactValue,
  type PartnershipK1FactValue,
  type TipCreditFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  OYSTER_BAR_ID,
  SALON_ID,
  SALON_KEY,
  oysterBarK1,
  salon,
  salonTips,
} from "../../../scenarios/synthetic/natti/facts.js";
import { nattiScenario as base } from "../../../scenarios/synthetic/natti/index.js";

const TIPS_KEY = makeTipCreditFactKey(SALON_ID);

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

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const tips = (value: Partial<TipCreditFactValue>) => ({ [TIPS_KEY]: { ...salonTips, ...value } });

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8846-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8846", id);
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const L1 = "0.line.1_tips_received_by_employees";
const L2 = "0.line.2_tips_not_subject_to_credit";
const L3 = "0.line.3_subtract_2_from_1";
const BOX = "0.line.4_wages_exceeded_limit_check";
const L4 = "0.line.4_multiply_3_by_7_65_percent";
const L5 = "0.line.5_credit_from_partnerships_s_corps";
const L6 = "0.line.6_add_lines";
const COL_E = "3.part3.4f_form_8846_col_e";
const COL_G = "3.part3.4f_form_8846_col_g";
const LINE_23 = "0.line.23";

describe("the natti return", () => {
  const out = evaluate(base.facts);

  it("fills every line", () => {
    expect(out.files("form-8846")).toBe(true);
    expect(out.line(L1)).toBe(184600);
    expect(out.line(L2)).toBe(1363);
    expect(out.line(L3)).toBe(183237);
    expect(out.line(BOX)).toBe(true);
    expect(out.line(L4)).toBe(12686);
    expect(out.line(L5)).toBe(2350);
    expect(out.line(L6)).toBe(15036);
    expect(out.missing("form-8846")).toEqual([]);
  });

  it("Schedule C line 23 is the stated taxes less line 4", () => {
    expect(out.value("schedule-c", LINE_23)).toBe(56200 - 12686);
  });

  it("Form 3800 line 4f adds to line 6", () => {
    expect(out.value("form-3800", COL_E)).toBe(15036);
    expect(out.value("form-3800", COL_G)).toBe(15036);
  });
});

describe("who files", () => {
  it("no tip credit fact: Form 8846 does not file, Schedule C keeps its taxes, Form 3800 takes the K-1", () => {
    const out = evaluate(factsWith({ [TIPS_KEY]: undefined }));
    expect(out.files("form-8846")).toBe(false);
    expect(out.value("schedule-c", LINE_23)).toBe(56200);
    expect(out.value("form-3800", COL_E)).toBe(2350);
  });

  it("a K-1 alone files only with the decision: lines 1 to 4 blank, line 6 is line 5", () => {
    const facts = factsWith({ [TIPS_KEY]: undefined });
    const out = evaluate(facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8846", true),
    ]);
    expect(out.files("form-8846")).toBe(true);
    expect(out.line(L1)).toBeUndefined();
    expect(out.line(L4)).toBeUndefined();
    expect(out.line(BOX)).toBeUndefined();
    expect(out.line(L5)).toBe(2350);
    expect(out.line(L6)).toBe(2350);
    expect(out.value("form-3800", COL_E)).toBe(2350);
  });

  it("the election not to claim: no form, no reduction, no own credit on Form 3800", () => {
    const out = evaluate(factsWith(tips({ electNotToClaim: true })));
    expect(out.files("form-8846")).toBe(false);
    expect(out.value("schedule-c", LINE_23)).toBe(56200);
    expect(out.value("form-3800", COL_E)).toBe(2350);
  });

  it("the decision false with a claimed fact: no form, and line 4f is a gap, never the deduction and the credit both lost", () => {
    const out = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8846", false),
    ]);
    expect(out.files("form-8846")).toBe(false);
    expect(out.files("form-3800")).toBe(true);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
    expect(isGap(out.field("form-3800", COL_G))).toBe(true);
  });

  it("the decision false with no own credit: Form 3800 takes only the K-1", () => {
    const out = evaluate(factsWith(tips({ electNotToClaim: true })), [
      ...base.decisions,
      decision("decisions.scope.must_file_8846", false),
    ]);
    expect(out.files("form-8846")).toBe(false);
    expect(out.value("schedule-c", LINE_23)).toBe(56200);
    expect(out.value("form-3800", COL_E)).toBe(2350);
  });
});

describe("line 4", () => {
  it("no employee over the wage base: the box is unchecked and line 3 × 7.65%", () => {
    const out = evaluate(factsWith(tips({ employeeOverWageBase: false })));
    expect(out.line(BOX)).toBe(false);
    // 183,237 × 0.0765 = 14,017.63
    expect(out.line(L4)).toBe(14018);
    expect(out.value("schedule-c", LINE_23)).toBe(56200 - 14018);
  });

  it("the box with no Medicare-only amount waits on the fact", () => {
    const out = evaluate(factsWith(tips({ tipsSubjectOnlyToMedicare: undefined })));
    expect(out.line(BOX)).toBe(true);
    expect(out.line(L4)).toBeUndefined();
    expect(out.line(L6)).toBeUndefined();
    expect(out.missing("form-8846")).toContain(TIPS_KEY);
    expect(out.missing("form-3800")).toContain(TIPS_KEY);
    expect(out.value("schedule-c", LINE_23)).toBe(56200);
  });

  it("a food or beverage business uses $5.15 an hour", () => {
    const out = evaluate(factsWith(tips({ kind: "food_or_beverage" })));
    // March 618 − 360 = 258; April 669.50 − 390 = 279.50; July 412 − 170.40 = 241.60; August 0.
    expect(out.line(L2)).toBe(779);
  });
});

describe("gaps", () => {
  it("a tip credit that names no business on the return", () => {
    const out = evaluate(factsWith(tips({ businessKey: makeBusinessFactKey("elsewhere") })));
    expect(isGap(out.field("form-8846", L1))).toBe(true);
    expect(isGap(out.field("form-8846", L4))).toBe(true);
    expect(isGap(out.field("form-8846", L6))).toBe(true);
    expect(out.line(L5)).toBe(2350);
    expect(isGap(out.field("form-3800", COL_G))).toBe(true);
  });

  it("month tips above line 1", () => {
    const out = evaluate(factsWith(tips({ tipsReceived: 2000 })));
    expect(isGap(out.field("form-8846", L2))).toBe(true);
  });

  it("Medicare-only tips above the creditable tips", () => {
    const out = evaluate(factsWith(tips({ tipsSubjectOnlyToMedicare: 190000 })));
    expect(isGap(out.field("form-8846", L4))).toBe(true);
  });

  it("stated taxes below the credit", () => {
    const business: BusinessFactValue = {
      ...salon,
      expenses: { ...salon.expenses, taxesAndLicenses: 5000 },
    };
    const out = evaluate(factsWith({ [SALON_KEY]: business }));
    expect(isGap(out.field("form-8846", L4))).toBe(true);
    expect(out.value("schedule-c", LINE_23)).toBe(5000);
  });

  it("a stated Form 3800 line 4f credit is a gap: Form 8846 figures it", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("tips"), {
      sourceForm: "8846",
      line: "4f",
      amount: 500,
      passive: false,
    });
    const out = evaluate(factsWith({}, [stated]));
    expect(isGap(out.field("form-3800", COL_G))).toBe(true);
  });
});

describe("Form 3800 column (d) or (e)", () => {
  it("an owner who does not materially participate: a passive credit the engine does not limit, a gap", () => {
    const out = evaluate(factsWith({ [SALON_KEY]: { ...salon, materiallyParticipated: false } }));
    expect(out.line(L4)).toBe(12686);
    expect(isGap(out.field("form-3800", COL_G))).toBe(true);
  });

  it("no answer on material participation: Form 3800 waits on the business", () => {
    const out = evaluate(
      factsWith({ [SALON_KEY]: { ...salon, materiallyParticipated: undefined } }),
    );
    expect(out.missing("form-3800")).toContain(SALON_KEY);
  });
});

describe("line 5 with two K-1s that show cents", () => {
  it("each K-1 rounds before the add, so line 6 equals Form 3800 line 4f (DECISION in resolveInfo.ts)", () => {
    const secondId = "redwater-tavern";
    const first: PartnershipK1FactValue = {
      ...oysterBarK1,
      boxes: [
        { box: "1", amount: 12000 },
        { box: "15", code: "N", amount: 600.4 },
      ],
    };
    const second: PartnershipK1FactValue = {
      ...oysterBarK1,
      entityName: "Redwater Tavern LLC",
      entityEin: "00-0018846",
      boxes: [{ box: "15", code: "N", amount: 1200.4 }],
    };
    const holding = base.facts.find((fact) => fact.key === makeK1HoldingFactKey(OYSTER_BAR_ID));
    const out = evaluate(
      factsWith({ [makePartnershipK1FactKey(OYSTER_BAR_ID)]: first }, [
        row("k1", makePartnershipK1FactKey(secondId), second),
        row("k1", makeK1HoldingFactKey(secondId), holding?.value),
      ]),
    );
    // $600 + $1,200, not $1,800.80 rounded to $1,801.
    expect(out.line(L5)).toBe(1800);
    expect(out.line(L6)).toBe(12686 + 1800);
    expect(out.value("form-3800", COL_E)).toBe(12686 + 1800);
  });
});

describe("two businesses", () => {
  it("each business's part of line 4 comes off its own line 23, and the parts add to line 4", () => {
    const secondId = "varrow-nail-bar";
    const secondKey = makeBusinessFactKey(secondId);
    const second: BusinessFactValue = {
      ...salon,
      name: "Varrow Nail Bar",
      grossReceipts: 200000,
      expenses: { wages: 90000, taxesAndLicenses: 9000, rentOtherProperty: 30000 },
    };
    const secondTips: TipCreditFactValue = {
      businessKey: secondKey,
      kind: "beauty_service",
      tipsReceived: 30000.3,
      belowRateMonths: [],
      employeeOverWageBase: false,
    };
    const out = evaluate(
      factsWith({}, [
        row("self_employment", secondKey, second),
        row("self_employment", makeTipCreditFactKey(secondId), secondTips),
      ]),
    );
    // Line 1: 184,600.40 + 30,000.30 = 214,601; line 3 = 213,238; line 4 = 191,758 × 0.0765 + 311.46
    expect(out.line(L1)).toBe(214601);
    expect(out.line(L3)).toBe(213238);
    expect(out.line(L4)).toBe(14981);
    // Line 4 prorated by each business's own credit (12,685.94 and 2,295.02): 12,686 and 2,295.
    expect(out.value("schedule-c", LINE_23)).toBe(56200 - 12686);
    expect(out.value("form-3800", COL_E)).toBe(14981 + 2350);
  });
});

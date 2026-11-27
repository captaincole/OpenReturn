/*
 * Form 8826 on a whole return: who files, each line, the prior-year answers,
 * the gaps, the Schedule C expense lines and Form 3800 line 1e. The synthetic
 * elam scenario is the base; flann is the California return.
 */

import { describe, expect, it } from "vitest";
import {
  DISABLED_ACCESS_KEYS,
  makeBusinessFactKey,
  makeDisabledAccessFactKey,
  makeGeneralBusinessCreditFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type BusinessFactValue,
  type DisabledAccessFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  ACCESS_EXPENDITURES,
  GYM_KEY,
  PARTNERSHIP_ID,
  gym,
  partnershipK1,
} from "../../../scenarios/synthetic/elam/facts.js";
import { elamScenario as base } from "../../../scenarios/synthetic/elam/index.js";
import { RESTROOM_KEY } from "../../../scenarios/synthetic/flann/facts.js";
import { flannScenario } from "../../../scenarios/synthetic/flann/index.js";

const RAMP_KEY = makeDisabledAccessFactKey("entrance-ramp");
const INTERPRETER_KEY = makeDisabledAccessFactKey("class-interpreter");
const K1_KEY = makePartnershipK1FactKey(PARTNERSHIP_ID);
const RECEIPTS = DISABLED_ACCESS_KEYS.priorYearGrossReceipts;
const EMPLOYEES = DISABLED_ACCESS_KEYS.priorYearFullTimeEmployees;

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
function factsWith(
  changes: Record<string, unknown>,
  extra: TaxFactRow[] = [],
  facts: TaxFactRow[] = base.facts,
): TaxFactRow[] {
  const kept = facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const ramp = (value: Partial<DisabledAccessFactValue>) => ({
  [RAMP_KEY]: { ...ACCESS_EXPENDITURES["entrance-ramp"], ...value },
});
const noOwnExpenditures = { [RAMP_KEY]: undefined, [INTERPRETER_KEY]: undefined };

function evaluate(
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
  name = "form-8826-test",
) {
  const result = evaluateScenario({
    filing: { id: name, taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8826", id);
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const L1 = "0.line.1_total_eligible_access_expenditures_dollars";
const L1_CENTS = "0.line.1_total_eligible_access_expenditures_cents";
const L3 = "0.line.3_subtract_2_from_1_dollars";
const L5 = "0.line.5_smaller_of_3_or_4_dollars";
const L6 = "0.line.6_multiply_5_by_50_percent_dollars";
const L6_CENTS = "0.line.6_multiply_5_by_50_percent_cents";
const L7 = "0.line.7_credit_from_partnerships_s_corporations_dollars";
const L7_CENTS = "0.line.7_credit_from_partnerships_s_corporations_cents";
const L8 = "0.line.8_total_disabled_access_credit_dollars";
const COL_A = "2.part3.1e_form_8826_col_a";
const COL_E = "2.part3.1e_form_8826_col_e";
const COL_G = "2.part3.1e_form_8826_col_g";
const CONTRACT_LABOR = "0.line.11";
const REPAIRS = "0.line.21";

describe("the elam return", () => {
  const out = evaluate(base.facts);

  it("fills every line", () => {
    expect(out.files("form-8826")).toBe(true);
    expect(out.line("0.header.taxpayer_name")).toBe("Elam Varrowind");
    expect(out.line(L1)).toBe(8650);
    expect(out.line(L3)).toBe(8400);
    expect(out.line(L5)).toBe(8400);
    expect(out.line(L6)).toBe(4200);
    expect(out.line(L7)).toBe(600);
    expect(out.line(L8)).toBe(4800);
    expect(out.missing("form-8826")).toEqual([]);
  });

  it("a cents box prints 00 next to each amount: every line is whole dollars", () => {
    expect(out.line(L1_CENTS)).toBe("00");
    expect(out.line(L6_CENTS)).toBe("00");
    expect(out.line(L7_CENTS)).toBe("00");
  });

  it("Schedule C lines 11 and 21 are the stated amounts less each part of line 6", () => {
    // 4,200 prorated by 7,400 and 1,250: 3,593 and 607.
    expect(out.value("schedule-c", REPAIRS)).toBe(15900 - 3593);
    expect(out.value("schedule-c", CONTRACT_LABOR)).toBe(4600 - 607);
  });

  it("Form 3800 line 1e is line 8: the own credit as one item, and the K-1", () => {
    expect(out.value("form-3800", COL_A)).toBe(2);
    expect(out.value("form-3800", COL_E)).toBe(4800);
    expect(out.value("form-3800", COL_G)).toBe(4800);
  });
});

describe("no expenditures of the taxpayer's own business", () => {
  const facts = factsWith(noOwnExpenditures);

  it("Form 8826 does not file, Schedule C keeps its expenses, Form 3800 takes the K-1", () => {
    const out = evaluate(facts);
    expect(out.files("form-8826")).toBe(false);
    expect(out.value("schedule-c", REPAIRS)).toBe(15900);
    expect(out.value("schedule-c", CONTRACT_LABOR)).toBe(4600);
    expect(out.value("form-3800", COL_E)).toBe(600);
  });

  it("the prior-year answers are not asked", () => {
    const out = evaluate(factsWith({ ...noOwnExpenditures, [RECEIPTS]: undefined }));
    expect(out.missing("form-3800")).not.toContain(RECEIPTS);
  });

  it("a K-1 alone files only with the decision: lines 1 to 6 blank, line 8 is line 7", () => {
    const out = evaluate(facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8826", true),
    ]);
    expect(out.files("form-8826")).toBe(true);
    expect(out.line(L1)).toBeUndefined();
    expect(out.line(L1_CENTS)).toBeUndefined();
    expect(out.line(L6)).toBeUndefined();
    expect(out.line(L7)).toBe(600);
    expect(out.line(L8)).toBe(600);
    expect(out.value("form-3800", COL_E)).toBe(600);
  });

  it("no K-1 either: nothing changes from a return with no disabled access credit", () => {
    const out = evaluate(factsWith({ ...noOwnExpenditures, [K1_KEY]: undefined }));
    expect(out.files("form-8826")).toBe(false);
    expect(out.value("form-3800", COL_E)).toBeUndefined();
    expect(out.value("schedule-c", REPAIRS)).toBe(gym.expenses?.repairs);
  });
});

describe("the eligible small business test", () => {
  it("no 2024 gross receipts: the form waits on them, and Schedule C is not reduced yet", () => {
    const out = evaluate(factsWith({ [RECEIPTS]: undefined }));
    expect(out.files("form-8826")).toBe(true);
    expect(out.missing("form-8826")).toEqual([RECEIPTS]);
    expect(out.missing("form-3800")).toContain(RECEIPTS);
    expect(out.line(L1)).toBeUndefined();
    expect(out.line(L8)).toBeUndefined();
    expect(out.value("schedule-c", REPAIRS)).toBe(15900);
  });

  it("gross receipts above $1,000,000: the form waits on the full-time employees", () => {
    const out = evaluate(factsWith({ [RECEIPTS]: 1_000_001 }));
    expect(out.missing("form-8826")).toEqual([EMPLOYEES]);
  });

  it("gross receipts above $1,000,000 and 30 full-time employees: eligible", () => {
    const out = evaluate(
      factsWith({ [RECEIPTS]: 1_400_000 }, [row("self_employment", EMPLOYEES, 30)]),
    );
    expect(out.line(L6)).toBe(4200);
  });

  it("gross receipts above $1,000,000 and 31 full-time employees: no form, no reduction, the K-1 still on Form 3800", () => {
    const out = evaluate(
      factsWith({ [RECEIPTS]: 1_400_000 }, [row("self_employment", EMPLOYEES, 31)]),
    );
    expect(out.files("form-8826")).toBe(false);
    expect(out.value("schedule-c", REPAIRS)).toBe(15900);
    expect(out.value("form-3800", COL_E)).toBe(600);
  });

  it("not eligible, and the decision files the form anyway: lines 1 to 6 are a gap", () => {
    const out = evaluate(
      factsWith({ [RECEIPTS]: 1_400_000 }, [row("self_employment", EMPLOYEES, 31)]),
      [...base.decisions, decision("decisions.scope.must_file_8826", true)],
    );
    expect(isGap(out.field("form-8826", L1))).toBe(true);
    expect(isGap(out.field("form-8826", L8))).toBe(true);
    expect(out.value("schedule-c", REPAIRS)).toBe(15900);
  });
});

describe("ADA Tax Incentives Packet (U.S. Department of Justice), the example of a small business that uses both", () => {
  /*
   * "$20,000 cost of access improvements (rest room, ramp, 3 doors widened) - $5,000 maximum
   * credit = $15,000 remaining for deduction"; the credit is "based on $10,250 of expenditures".
   */
  it("$20,000 of improvements: a $5,000 credit and $15,000 left to deduct", () => {
    const improvements = { ...gym, expenses: { ...gym.expenses, repairs: 20_000 } };
    const out = evaluate(
      factsWith({
        [GYM_KEY]: improvements,
        [INTERPRETER_KEY]: undefined,
        ...ramp({ expenditures: 20_000 }),
      }),
    );
    expect(out.line(L1)).toBe(20_000);
    expect(out.line(L3)).toBe(19_750);
    expect(out.line(L5)).toBe(10_000);
    expect(out.line(L6)).toBe(5_000);
    expect(out.value("schedule-c", REPAIRS)).toBe(15_000);
  });
});

describe("the limits", () => {
  it("$250 or less: line 6 is 0, no reduction and no own item on Form 3800", () => {
    const out = evaluate(
      factsWith({ [INTERPRETER_KEY]: undefined, ...ramp({ expenditures: 250 }) }),
    );
    expect(out.files("form-8826")).toBe(true);
    expect(out.line(L3)).toBe(0);
    expect(out.line(L6)).toBe(0);
    expect(out.line(L8)).toBe(600);
    expect(out.value("schedule-c", REPAIRS)).toBe(15900);
    expect(out.value("form-3800", COL_A)).toBeUndefined();
    expect(out.value("form-3800", COL_E)).toBe(600);
  });

  it("line 8 stops at $5,000, and Form 3800 line 1e prorates its two sources to it", () => {
    const out = evaluate(
      factsWith({ [INTERPRETER_KEY]: undefined, ...ramp({ expenditures: 12_000 }) }),
    );
    expect(out.line(L5)).toBe(10_000);
    expect(out.line(L6)).toBe(5_000);
    expect(out.line(L8)).toBe(5_000);
    expect(out.value("schedule-c", REPAIRS)).toBe(15900 - 5000);
    expect(out.value("form-3800", COL_E)).toBe(5_000);
  });
});

describe("line 7 with two K-1s that show cents (decision A103)", () => {
  const SECOND_ID = "truckee-crag";
  const withCents = { ...partnershipK1, boxes: [{ box: "15", code: "K", amount: 300.4 }] };
  const second = { ...withCents, entityName: "Truckee Crag LLC", entityEin: "88-4418827" };
  const holding = {
    owner: "taxpayer",
    materiallyParticipated: true,
    allInvestmentAtRisk: true,
    partnershipBasisAtStart: 30000,
  };

  it("each K-1 rounds before the add: $300.40 and $300.40 give $600, as Form 3800 line 1e", () => {
    const out = evaluate(
      factsWith({ [K1_KEY]: withCents }, [
        row("k1", makePartnershipK1FactKey(SECOND_ID), second),
        row("k1", makeK1HoldingFactKey(SECOND_ID), holding),
      ]),
    );
    expect(out.line(L7)).toBe(600);
    expect(out.line(L8)).toBe(4800);
    expect(out.value("form-3800", COL_E)).toBe(4800);
  });
});

describe("who files", () => {
  it("the decision false with a claimed fact: no form, and line 1e is a gap, never the deduction and the credit both lost", () => {
    const out = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8826", false),
    ]);
    expect(out.files("form-8826")).toBe(false);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("a malformed fact is asked again", () => {
    const out = evaluate(factsWith({ [RAMP_KEY]: { businessKey: GYM_KEY, expenditures: 7400 } }));
    expect(out.files("form-8826")).toBe(true);
    expect(out.missing("form-8826")).toContain(RAMP_KEY);
  });
});

describe("expenditures deducted in Part V (other expenses)", () => {
  /*
   * The Schedule C instructions list the deduction for removing barriers in
   * Part V (irs-1040sc-inst-2025::sec::part-v::b03). The ramp's $7,400 moves
   * from repairs to a Part V entry; its part of line 6 is still 3,593
   * (4,200 × 7,400 / 8,650), and it comes off that entry: 7,400 − 3,593.
   */
  const inPartV: BusinessFactValue = {
    ...gym,
    expenses: { ...gym.expenses, repairs: 15900 - 7400 },
    otherExpenses: [
      { description: "Climbing wall inspection", amount: 900 },
      { description: "Barrier removal", amount: 7400 },
    ],
  };
  const barrier = { deductedOn: "otherExpenses" as const, otherExpense: "Barrier removal" };

  it("the part of line 6 comes off the named entry, and lines 27b and 48 fall with it", () => {
    const out = evaluate(factsWith({ ...ramp(barrier), [GYM_KEY]: inPartV }));
    expect(out.line(L6)).toBe(4200);
    expect(out.value("schedule-c", REPAIRS)).toBe(8500);
    expect(out.value("schedule-c", CONTRACT_LABOR)).toBe(4600 - 607);
    expect(out.value("schedule-c", "1.line.48")).toBe(900 + 7400 - 3593);
    expect(out.value("schedule-c", "0.line.27b")).toBe(900 + 7400 - 3593);
    expect(out.value("schedule-c", "1.line.48_amount_1")).toBe(900);
    expect(out.value("schedule-c", "1.line.48_amount_2")).toBe(7400 - 3593);
  });

  it("a Part V fact with no entry named is asked again", () => {
    const out = evaluate(factsWith(ramp({ deductedOn: "otherExpenses" })));
    expect(out.missing("form-8826")).toContain(RAMP_KEY);
  });

  it("an entry named on a line that is not Part V is asked again", () => {
    const out = evaluate(factsWith(ramp({ otherExpense: "Barrier removal" })));
    expect(out.missing("form-8826")).toContain(RAMP_KEY);
  });
});

describe("gaps", () => {
  it("expenditures that name no business on the return", () => {
    const out = evaluate(factsWith(ramp({ businessKey: makeBusinessFactKey("elsewhere") })));
    expect(isGap(out.field("form-8826", L1))).toBe(true);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
    expect(out.value("schedule-c", REPAIRS)).toBe(15900);
  });

  it("capitalized expenditures: the basis reduction is not modeled", () => {
    const out = evaluate(factsWith(ramp({ deductedOn: "capitalized" })));
    expect(isGap(out.field("form-8826", L6))).toBe(true);
    expect(out.value("schedule-c", REPAIRS)).toBe(15900);
  });

  it("a member of a controlled group: line 6 is a share of the group's credit", () => {
    const out = evaluate(factsWith(ramp({ memberOfControlledGroup: true })));
    expect(isGap(out.field("form-8826", L6))).toBe(true);
  });

  it("a part of line 6 above the stated expense line", () => {
    // The ramp's part, 3,593, is above the $3,200 of legal and professional services.
    const out = evaluate(factsWith(ramp({ deductedOn: "legalAndProfessional" })));
    expect(isGap(out.field("form-8826", L6))).toBe(true);
    expect(out.value("schedule-c", "0.line.17")).toBe(3200);
  });

  it("a part of line 6 equal to or below the stated expense line comes off it", () => {
    /*
     * 20,000 and 1,250: line 6 is 5,000; the ramp's part, 5,000 × 20,000 / 21,250 = 4,705.88
     * → 4,706, is below the $6,200 of advertising; the interpreter's is 294.
     */
    const out = evaluate(factsWith(ramp({ deductedOn: "advertising", expenditures: 20_000 })));
    expect(out.line(L6)).toBe(5000);
    expect(out.value("schedule-c", "0.line.8")).toBe(6200 - 4706);
    expect(out.value("schedule-c", CONTRACT_LABOR)).toBe(4600 - 294);
  });

  it("a part of line 6 above the named Part V entry, or a Part V entry the business does not list", () => {
    const barrier = { deductedOn: "otherExpenses" as const, otherExpense: "Barrier removal" };
    const small = { ...gym, otherExpenses: [{ description: "Barrier removal", amount: 1000 }] };
    const above = evaluate(factsWith({ ...ramp(barrier), [GYM_KEY]: small }));
    expect(isGap(above.field("form-8826", L6))).toBe(true);
    expect(above.value("schedule-c", "1.line.48")).toBe(1000);
    const unlisted = evaluate(factsWith(ramp(barrier)));
    expect(isGap(unlisted.field("form-8826", L6))).toBe(true);
  });

  it("a stated Form 3800 line 1e credit with no entity is a gap: Form 8826 figures it", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("access"), {
      sourceForm: "8826",
      line: "1e",
      amount: 500,
      passive: false,
    });
    const out = evaluate(factsWith({}, [stated]));
    expect(isGap(out.field("form-3800", COL_G))).toBe(true);
  });
});

describe("Form 3800 column (d) or (e)", () => {
  it("an owner who does not materially participate: a passive credit the engine does not limit, a gap", () => {
    const out = evaluate(factsWith({ [GYM_KEY]: { ...gym, materiallyParticipated: false } }));
    expect(out.line(L6)).toBe(4200);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("line G not answered: Form 3800 waits on the business", () => {
    const out = evaluate(factsWith({ [GYM_KEY]: { ...gym, materiallyParticipated: undefined } }));
    expect(out.missing("form-3800")).toContain(GYM_KEY);
  });
});

describe("California: the flann return", () => {
  it("Schedule CA line 3 column B adds back the federal reduction: no FTB 3548 is filed", () => {
    const out = evaluate(flannScenario.facts, flannScenario.decisions, "flann-test");
    expect(out.line(L1)).toBe(3101);
    expect(out.line(L6)).toBe(1426);
    expect(out.value("schedule-c", REPAIRS)).toBe(9800 - 1426);
    expect(out.value("schedule-ca", "0.line.b3_subtractions")).toBe(1426);
  });

  it("with no expenditures, Schedule CA line 3 column B is blank", () => {
    const facts = factsWith({ [RESTROOM_KEY]: undefined }, [], flannScenario.facts);
    const out = evaluate(facts, flannScenario.decisions, "flann-test");
    expect(out.files("form-8826")).toBe(false);
    expect(out.value("schedule-ca", "0.line.b3_subtractions")).toBeUndefined();
  });
});

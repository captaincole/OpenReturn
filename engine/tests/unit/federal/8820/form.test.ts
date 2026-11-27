/*
 * Form 8820 on a whole return: who files, each line, the gaps, the Schedule C
 * reduction, Form 3800 line 1h and Schedule CA line 3 column B. The synthetic
 * jon (the election, line 2b, a K-1) and eward (no election, California)
 * scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  ORPHAN_DRUG_CREDIT_KEY,
  makeGeneralBusinessCreditFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type OrphanDrugCreditFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  TRIALS_KEY,
  orphanDrugCredit as ewardCredit,
  trials,
} from "../../../scenarios/synthetic/eward/facts.js";
import { ewardScenario as eward } from "../../../scenarios/synthetic/eward/index.js";
import {
  LAB_KEY,
  PARTNERSHIP_ID,
  orphanDrugCredit as jonCredit,
  lab,
} from "../../../scenarios/synthetic/jon/facts.js";
import { jonScenario as jon } from "../../../scenarios/synthetic/jon/index.js";
import type { Scenario } from "../../../types.js";

const decision = (base: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (base: Scenario, category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(base: Scenario, changes: Record<string, unknown>, extra: TaxFactRow[] = []) {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

function evaluate(
  base: Scenario,
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
) {
  const result = evaluateScenario({
    filing: { id: "form-8820-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8820", id);
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const L1 = "0.line.1_qualified_clinical_testing_expenses_dollars";
const L1_CENTS = "0.line.1_qualified_clinical_testing_expenses_cents";
const YES = "0.line.2a_elect_reduced_credit_280c_yes";
const NO = "0.line.2a_elect_reduced_credit_280c_no";
const L2A = "0.line.2a_credit_amount_dollars";
const L2B = "0.line.2b_form_8932_wages_portion_dollars";
const L2C = "0.line.2c_subtract_2b_from_2a_dollars";
const L3 = "0.line.3_pass_through_orphan_drug_credit_dollars";
const L4 = "0.line.4_add_lines_2c_and_3_dollars";
const L5 = "0.line.5_allocated_to_beneficiaries_dollars";
const L6 = "0.line.6_estates_trusts_subtract_5_from_4_dollars";
const COL_E = "2.part3.1h_form_8820_col_e";
const WAGES = "0.line.26";
const SUPPLIES = "0.line.22";
const MACHINERY = "0.line.20a";
const CONTRACT = "0.line.11";
const CA_LINE_3_B = "0.line.b3_subtractions";

const credit = (base: Scenario, value: Partial<OrphanDrugCreditFactValue>) => ({
  [ORPHAN_DRUG_CREDIT_KEY]: {
    ...(base === jon ? jonCredit : ewardCredit),
    ...value,
  },
});

describe("the jon return: the election, line 2b and a K-1", () => {
  const out = evaluate(jon, jon.facts);

  it("fills lines 1 to 4 and Part II", () => {
    expect(out.files("form-8820")).toBe(true);
    expect(out.line(L1)).toBe(169551);
    expect(out.line(L1_CENTS)).toBe("00");
    expect(out.line(YES)).toBe(true);
    expect(out.line(NO)).toBe(false);
    expect(out.line(L2A)).toBe(33486);
    expect(out.line(L2B)).toBe(900);
    expect(out.line(L2C)).toBe(32586);
    expect(out.line(L3)).toBe(4250);
    expect(out.line(L4)).toBe(36836);
    expect(out.line("1.line.7c_date_drug_designated_col_d")).toBe("11/20/2024");
    expect(out.line("1.line.7d_orphan_drug_name_col_b")).toBeUndefined();
    expect(out.missing("form-8820")).toEqual([]);
  });

  it("an individual leaves lines 5 and 6 blank", () => {
    expect(out.line(L5)).toBeUndefined();
    expect(out.line(L6)).toBeUndefined();
  });

  it("the election keeps the Schedule C expenses whole", () => {
    expect(out.value("schedule-c", WAGES)).toBe(lab.expenses!.wages);
    expect(out.value("schedule-c", SUPPLIES)).toBe(lab.expenses!.supplies);
  });

  it("Form 3800 line 1h adds to line 4", () => {
    expect(out.value("form-3800", COL_E)).toBe(36836);
  });
});

describe("the eward return: no election, California", () => {
  const out = evaluate(eward, eward.facts);

  it("fills lines 1 to 4 with the No box", () => {
    expect(out.line(L1)).toBe(200000);
    expect(out.line(YES)).toBe(false);
    expect(out.line(NO)).toBe(true);
    expect(out.line(L2A)).toBe(50000);
    expect(out.line(L2B)).toBeUndefined();
    expect(out.line(L2C)).toBe(50000);
    expect(out.line(L3)).toBeUndefined();
    expect(out.line(L4)).toBe(50000);
  });

  it("line 2a comes off the Schedule C lines that hold the expenses", () => {
    const stated = trials.expenses!;
    expect(out.value("schedule-c", WAGES)).toBe(stated.wages! - 20000);
    expect(out.value("schedule-c", SUPPLIES)).toBe(stated.supplies! - 10000);
    expect(out.value("schedule-c", MACHINERY)).toBe(stated.rentVehiclesMachinery! - 6000);
    expect(out.value("schedule-c", CONTRACT)).toBe(stated.contractLabor! - 14000);
  });

  it("Schedule CA line 3 column B gives the reduction back (ftb-pub-1001-2025 ::b08)", () => {
    expect(out.value("schedule-ca", CA_LINE_3_B)).toBe(50000);
  });

  it("Form 3800 line 1h takes line 2c", () => {
    expect(out.value("form-3800", COL_E)).toBe(50000);
  });
});

describe("no facts, nothing changes", () => {
  const out = evaluate(eward, factsWith(eward, { [ORPHAN_DRUG_CREDIT_KEY]: undefined }));

  it("no orphan drug fact: no form, Schedule C as stated, no column B", () => {
    expect(out.files("form-8820")).toBe(false);
    const stated = trials.expenses!;
    expect(out.value("schedule-c", WAGES)).toBe(stated.wages);
    expect(out.value("schedule-c", SUPPLIES)).toBe(stated.supplies);
    expect(out.value("schedule-c", MACHINERY)).toBe(stated.rentVehiclesMachinery);
    expect(out.value("schedule-c", CONTRACT)).toBe(stated.contractLabor);
    expect(out.value("schedule-ca", CA_LINE_3_B) ?? 0).toBe(0);
    expect(out.files("form-3800")).toBe(false);
  });

  it("the election with no expenses still files the form, with zeros", () => {
    const zero = evaluate(
      eward,
      factsWith(eward, credit(eward, { reducedCreditElection: true, expenses: {}, drugs: [] })),
    );
    expect(zero.files("form-8820")).toBe(true);
    expect(zero.line(YES)).toBe(true);
    expect(zero.line(L1)).toBe(0);
    expect(zero.line(L2A)).toBe(0);
    expect(zero.value("schedule-c", WAGES)).toBe(trials.expenses!.wages);
  });
});

describe("who files", () => {
  const withoutOwnChanges = {
    [ORPHAN_DRUG_CREDIT_KEY]: undefined,
    [makeGeneralBusinessCreditFactKey("form-8932")]: undefined,
  };
  const withoutOwn = factsWith(jon, withoutOwnChanges);

  it("a K-1 credit alone does not file it; Form 3800 line 1h takes the K-1 (purpose-of-form::b01)", () => {
    const out = evaluate(jon, withoutOwn);
    expect(out.files("form-8820")).toBe(false);
    expect(out.value("form-3800", COL_E)).toBe(4250);
  });

  it("the decision files it with the K-1 alone: line 3 and line 4, lines 1 to 2c blank", () => {
    const out = evaluate(jon, withoutOwn, [
      ...jon.decisions,
      decision(jon, "decisions.scope.must_file_8820", true),
    ]);
    expect(out.files("form-8820")).toBe(true);
    expect(out.line(L1)).toBeUndefined();
    expect(out.line(YES)).toBeUndefined();
    expect(out.line(L3)).toBe(4250);
    expect(out.line(L4)).toBe(4250);
  });

  it("line 3 rounds each K-1 before the add, so line 4 equals Form 3800 line 1h (DECISION in resolveInfo.ts)", () => {
    const key = makePartnershipK1FactKey(PARTNERSHIP_ID);
    const second = "second-rare-partners";
    const k1 = jon.facts.find((fact) => fact.key === key)!.value as PartnershipK1FactValue;
    const zOnly = (amount: number) => [{ box: "15", code: "Z", amount }];
    const facts = factsWith(jon, { ...withoutOwnChanges, [key]: { ...k1, boxes: zOnly(3000.4) } }, [
      row(jon, "k1", makePartnershipK1FactKey(second), {
        ...k1,
        entityName: "Second Rare Partners LP",
        entityEin: "00-0008821",
        boxes: zOnly(1200.4),
      }),
      row(jon, "k1", makeK1HoldingFactKey(second), {
        owner: "taxpayer",
        materiallyParticipated: true,
        allInvestmentAtRisk: true,
        partnershipBasisAtStart: 60000,
      }),
    ]);
    const out = evaluate(jon, facts, [
      ...jon.decisions,
      decision(jon, "decisions.scope.must_file_8820", true),
    ]);
    // $3,000.40 and $1,200.40 give $3,000 + $1,200, not $4,200.80 rounded to $4,201.
    expect(out.line(L3)).toBe(4200);
    expect(out.line(L4)).toBe(4200);
    expect(out.value("form-3800", COL_E)).toBe(4200);
  });

  it("the decision false with the credit claimed is a gap on line 1h, never a lost deduction alone", () => {
    const out = evaluate(eward, eward.facts, [
      ...eward.decisions,
      decision(eward, "decisions.scope.must_file_8820", false),
    ]);
    expect(out.files("form-8820")).toBe(false);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("the decision false with the election leaves nothing reduced and no gap", () => {
    const out = evaluate(jon, jon.facts, [
      ...jon.decisions,
      decision(jon, "decisions.scope.must_file_8820", false),
    ]);
    expect(out.files("form-8820")).toBe(false);
    expect(out.value("form-3800", COL_E)).toBe(4250);
  });

  it("a spouse's business on a separate return is not on this return", () => {
    const spouse = { ...trials, owner: "spouse" as const };
    const out = evaluate(eward, factsWith(eward, { [TRIALS_KEY]: spouse }), [
      ...eward.decisions.filter((each) => each.decisionKey !== "decisions.scope.filing_status"),
      decision(eward, "decisions.scope.filing_status", "married_filing_separately"),
    ]);
    expect(out.files("form-8820")).toBe(false);
  });
});

describe("answers the form waits on", () => {
  it("Part II: line 1 with no drug listed", () => {
    const out = evaluate(eward, factsWith(eward, credit(eward, { drugs: [] })));
    expect(out.missing("form-8820")).toContain(ORPHAN_DRUG_CREDIT_KEY);
    expect(out.line(L1)).toBeUndefined();
  });

  it("line 2b: a Form 8932 credit and clinical wages with no answer", () => {
    const out = evaluate(
      jon,
      factsWith(jon, credit(jon, { differentialWageCreditOnSameWages: undefined })),
    );
    expect(out.missing("form-8820")).toContain(ORPHAN_DRUG_CREDIT_KEY);
    expect(out.line(L2C)).toBeUndefined();
    expect(out.line(L4)).toBeUndefined();
  });

  it("a malformed fact is asked again", () => {
    const out = evaluate(
      eward,
      factsWith(eward, { [ORPHAN_DRUG_CREDIT_KEY]: { businessKey: TRIALS_KEY } }),
    );
    expect(out.files("form-8820")).toBe(true);
    expect(out.missing("form-8820")).toEqual([ORPHAN_DRUG_CREDIT_KEY]);
  });

  it("Form 3800 asks for the business's line G when it is unknown", () => {
    const { materiallyParticipated: _, ...unknown } = trials;
    const out = evaluate(eward, factsWith(eward, { [TRIALS_KEY]: unknown }));
    expect(out.missing("form-3800")).toContain(TRIALS_KEY);
  });
});

describe("gaps", () => {
  it("a fact that names a business not on the return", () => {
    const out = evaluate(eward, factsWith(eward, credit(eward, { businessKey: "business.none" })));
    expect(isGap(out.field("form-8820", L1))).toBe(true);
    expect(isGap(out.field("form-8820", L4))).toBe(true);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("line 2b with no Form 8932 credit on the return", () => {
    const out = evaluate(
      eward,
      factsWith(eward, credit(eward, { differentialWageCreditOnSameWages: 500 })),
    );
    expect(isGap(out.field("form-8820", L2B))).toBe(true);
  });

  it("line 2b more than the Form 8932 credit", () => {
    const out = evaluate(
      jon,
      factsWith(jon, credit(jon, { differentialWageCreditOnSameWages: 2401 })),
    );
    expect(isGap(out.field("form-8820", L2C))).toBe(true);
  });

  it("a reduction the Schedule C lines cannot hold, and Schedule C keeps its stated lines", () => {
    const small = { ...trials, expenses: { ...trials.expenses, contractLabor: 1000 } };
    const out = evaluate(eward, factsWith(eward, { [TRIALS_KEY]: small }));
    expect(isGap(out.field("form-8820", L2A))).toBe(true);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
    expect(out.value("schedule-c", WAGES)).toBe(trials.expenses!.wages);
  });

  it("more than 26 drugs need a second Part II page", () => {
    const drug = ewardCredit.drugs[0]!;
    const drugs = Array.from({ length: 27 }, () => drug);
    const out = evaluate(eward, factsWith(eward, credit(eward, { drugs })));
    expect(isGap(out.field("form-8820", "1.line.7a_orphan_drug_name_col_b"))).toBe(true);
    expect(out.line(L4)).toBe(50000);
  });

  it("a business the owner does not materially participate in: a passive credit gap on line 1h", () => {
    const passive = { ...trials, materiallyParticipated: false };
    const out = evaluate(eward, factsWith(eward, { [TRIALS_KEY]: passive }));
    expect(out.line(L4)).toBe(50000);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("a stated line 1h credit is a gap: Form 8820 figures it", () => {
    const stated = row(jon, "other", makeGeneralBusinessCreditFactKey("orphan"), {
      sourceForm: "8820",
      line: "1h",
      amount: 1000,
      passive: false,
    });
    const out = evaluate(jon, factsWith(jon, { [ORPHAN_DRUG_CREDIT_KEY]: undefined }, [stated]));
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("a K-1 code Z with no amount is a gap on line 3", () => {
    const key = makePartnershipK1FactKey(PARTNERSHIP_ID);
    const k1 = jon.facts.find((fact) => fact.key === key)!.value as { boxes: object[] };
    const boxes = [
      { box: "1", amount: 25000 },
      { box: "15", code: "Z" },
    ];
    const out = evaluate(jon, factsWith(jon, { [key]: { ...k1, boxes } }));
    expect(isGap(out.field("form-8820", L3))).toBe(true);
  });
});

describe("the business key", () => {
  it("jon's credit names his practice", () => {
    expect(jonCredit.businessKey).toBe(LAB_KEY);
  });
});

/*
 * Form 8941 on a whole return: who files, each line, the gaps, the premiums
 * deduction (Schedule C line 14, Schedule F line 15), Form 3800 line 4h and
 * Schedule CA line 3 column B. The synthetic jaim (both phaseouts, a K-1) and
 * kenly (no phaseout, California) are the bases; daise's ranch is the farm.
 */

import { describe, expect, it } from "vitest";
import {
  SMALL_EMPLOYER_HEALTH_CREDIT_KEY,
  makeFarmFactKey,
  makePartnershipK1FactKey,
  type FarmFactValue,
  type SmallEmployerHealthCreditFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { FARM_ID, ranch } from "../../../scenarios/synthetic/daise/facts.js";
import { daiseScenario as daise } from "../../../scenarios/synthetic/daise/index.js";
import {
  COMPANY_KEY,
  NURSERY_ID,
  company,
  healthCredit,
  nurseryK1,
} from "../../../scenarios/synthetic/jaim/facts.js";
import { jaimScenario as jaim } from "../../../scenarios/synthetic/jaim/index.js";
import { kenlyScenario as kenly } from "../../../scenarios/synthetic/kenly/index.js";
import type { Scenario } from "../../../types.js";

const decision = (base: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
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
    filing: { id: "form-8941-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8941", id);
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const LINES = {
  aYes: "0.header.a_shop_marketplace_premiums_yes",
  aNo: "0.header.a_shop_marketplace_premiums_no",
  cYes: "0.header.c_prior_credit_claimed_yes",
  cNo: "0.header.c_prior_credit_claimed_no",
  l1: "0.line.1_number_of_employees",
  l2: "0.line.2_full_time_equivalent_employees",
  l3: "0.line.3_average_annual_wages",
  l9: "0.line.9_wage_phaseout_amount",
  l12: "0.line.12_smaller_of_9_or_11",
  l13: "0.line.13_employees_with_premiums_paid",
  l15: "0.line.15_credit_from_pass_through_entities",
  l16: "0.line.16_add_lines_12_and_15",
  l17: "0.line.17_allocated_to_patrons_or_beneficiaries",
  l20: "0.line.20_smaller_of_16_or_19",
};
const COL_E = "3.part3.4h_form_8941_col_e";
const LINE_14 = "0.line.14";
const CA_LINE_3_B = "0.line.b3_subtractions";
const STATED_LINE_14 = company.expenses!.employeeBenefitPrograms!;

const credit = (value: Partial<SmallEmployerHealthCreditFactValue>) => ({
  [SMALL_EMPLOYER_HEALTH_CREDIT_KEY]: { ...healthCredit, ...value },
});

describe("the jaim return: both phaseouts and a K-1", () => {
  const out = evaluate(jaim, jaim.facts);

  it("fills the header and lines 1 to 16", () => {
    expect(out.files("form-8941")).toBe(true);
    expect(out.line(LINES.aYes)).toBe(true);
    expect(out.line(LINES.aNo)).toBe(false);
    expect(out.line(LINES.cNo)).toBe(true);
    expect(out.line(LINES.cYes)).toBe(false);
    expect(out.line("0.header.a_marketplace_identifier")).toBe("TX-SHOP-48453-0192");
    expect(out.line("0.header.b_employment_tax_ein")).toBe("00-0008941");
    expect(out.line(LINES.l1)).toBe(14);
    expect(out.line(LINES.l2)).toBe(12);
    expect(out.line(LINES.l3)).toBe(37_000);
    expect(out.line(LINES.l12)).toBe(19_711);
    expect(out.line(LINES.l15)).toBe(1_850);
    expect(out.line(LINES.l16)).toBe(21_561);
    expect(out.missing("form-8941")).toEqual([]);
  });

  it("an individual leaves lines 17 to 20 blank", () => {
    expect(out.line(LINES.l17)).toBeUndefined();
    expect(out.line(LINES.l20)).toBeUndefined();
  });

  it("Schedule C line 14 is the stated premiums less line 12 (line-14::b01)", () => {
    expect(out.value("schedule-c", LINE_14)).toBe(STATED_LINE_14 - 19_711);
  });

  it("Form 3800 line 4h takes line 12 and the K-1, the total of line 16", () => {
    expect(out.value("form-3800", COL_E)).toBe(21_561);
    expect(out.value("schedule-3", "0.line.6a")).toBe(21_561);
  });
});

describe("who files", () => {
  it("no fact and no K-1 credit: no Form 8941, and Schedule C line 14 as stated", () => {
    const nursery = makePartnershipK1FactKey(NURSERY_ID);
    const k1 = { ...nurseryK1, boxes: nurseryK1.boxes.filter((box) => box.code !== "BA") };
    const out = evaluate(
      jaim,
      factsWith(jaim, { [SMALL_EMPLOYER_HEALTH_CREDIT_KEY]: undefined, [nursery]: k1 }),
    );
    expect(out.files("form-8941")).toBe(false);
    expect(out.value("schedule-c", LINE_14)).toBe(STATED_LINE_14);
    expect(out.files("form-3800")).toBe(false);
  });

  it("a K-1 credit alone files no Form 8941 and goes to Form 3800 line 4h (general-instructions::b02)", () => {
    const out = evaluate(jaim, factsWith(jaim, { [SMALL_EMPLOYER_HEALTH_CREDIT_KEY]: undefined }));
    expect(out.files("form-8941")).toBe(false);
    expect(out.value("form-3800", COL_E)).toBe(1_850);
  });

  it("line A No: Stop, no credit, and no lowered deduction", () => {
    const out = evaluate(jaim, factsWith(jaim, credit({ shopCoverage: false })));
    expect(out.files("form-8941")).toBe(false);
    expect(out.value("schedule-c", LINE_14)).toBe(STATED_LINE_14);
    expect(out.value("form-3800", COL_E)).toBe(1_850);
  });

  it("line C Yes: the 2-year credit period is over, no credit and no lowered deduction", () => {
    const out = evaluate(jaim, factsWith(jaim, credit({ creditClaimedBefore2024: true })));
    expect(out.files("form-8941")).toBe(false);
    expect(out.value("schedule-c", LINE_14)).toBe(STATED_LINE_14);
  });

  it("the decision true with line A No prints the box and leaves lines 1 to 14 blank", () => {
    const decisions = [...jaim.decisions, decision(jaim, "decisions.scope.must_file_8941", true)];
    const out = evaluate(jaim, factsWith(jaim, credit({ shopCoverage: false })), decisions);
    expect(out.files("form-8941")).toBe(true);
    expect(out.line(LINES.aNo)).toBe(true);
    expect(out.line(LINES.cYes)).toBeUndefined();
    expect(out.line(LINES.l1)).toBeUndefined();
    expect(out.line(LINES.l16)).toBe(1_850);
  });

  it("the decision false with a claimed credit is a gap on line 4h, never a lost deduction and credit", () => {
    const decisions = [...jaim.decisions, decision(jaim, "decisions.scope.must_file_8941", false)];
    const out = evaluate(jaim, jaim.facts, decisions);
    expect(out.files("form-8941")).toBe(false);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("a malformed fact files the form and lists the fact", () => {
    const out = evaluate(
      jaim,
      factsWith(jaim, { [SMALL_EMPLOYER_HEALTH_CREDIT_KEY]: { activityKey: COMPANY_KEY } }),
    );
    expect(out.files("form-8941")).toBe(true);
    expect(out.missing("form-8941")).toEqual([SMALL_EMPLOYER_HEALTH_CREDIT_KEY]);
  });
});

describe("gaps and answers", () => {
  it("an activity that is not on the return is a gap on the lines and on line 4h", () => {
    const out = evaluate(jaim, factsWith(jaim, credit({ activityKey: "business.missing" })));
    expect(isGap(out.field("form-8941", LINES.l12))).toBe(true);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
    expect(out.value("schedule-c", LINE_14)).toBe(STATED_LINE_14);
  });

  it("a credit above the stated line 14 is a gap", () => {
    const small = {
      ...company,
      expenses: { ...company.expenses, employeeBenefitPrograms: 10_000 },
    };
    const out = evaluate(jaim, factsWith(jaim, { [COMPANY_KEY]: small }));
    expect(isGap(out.field("form-8941", LINES.l12))).toBe(true);
    expect(out.value("schedule-c", LINE_14)).toBe(10_000);
  });

  it("a business the owner did not materially participate in is a passive gap on line 4h", () => {
    const passive = { ...company, materiallyParticipated: false };
    const out = evaluate(jaim, factsWith(jaim, { [COMPANY_KEY]: passive }));
    expect(out.line(LINES.l12)).toBe(19_711);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("an unknown material participation waits on the business", () => {
    const { materiallyParticipated: _, ...unknown } = company;
    const out = evaluate(jaim, factsWith(jaim, { [COMPANY_KEY]: unknown }));
    expect(out.missing("form-3800")).toContain(COMPANY_KEY);
  });

  it("25 FTEs: line 3 is skipped, line 12 is 0, lines 13 and 14 are skipped, and no deduction is lowered", () => {
    const many = Array.from({ length: 25 }, (_, index) => ({
      name: `Crew ${index + 1}`,
      hoursOfService: 2_080,
      wages: 30_000,
      coverage: [
        { tier: "employee_only" as const, employerPremiumsPaid: 2_000, annualPremium: 4_000 },
      ],
    }));
    const out = evaluate(jaim, factsWith(jaim, credit({ employees: many })));
    expect(out.line(LINES.l2)).toBe(25);
    expect(out.line(LINES.l3)).toBeUndefined();
    expect(out.line(LINES.l12)).toBe(0);
    expect(out.line(LINES.l13)).toBeUndefined();
    expect(out.line(LINES.l16)).toBe(1_850);
    expect(out.value("schedule-c", LINE_14)).toBe(STATED_LINE_14);
  });
});

describe("the kenly return: no phaseout, California", () => {
  const out = evaluate(kenly, kenly.facts);

  it("lines 8 and 9 equal line 7, and line 6 is line 4", () => {
    expect(out.line("0.line.6_smaller_of_4_or_5")).toBe(31_838);
    expect(out.line(LINES.l9)).toBe(15_919);
    expect(out.line(LINES.l12)).toBe(15_919);
    expect(out.line(LINES.l15)).toBeUndefined();
    expect(out.line(LINES.l16)).toBe(15_919);
  });

  it("California gives the premiums back on Schedule CA line 3 column B (small-employer-health::b01)", () => {
    expect(out.value("schedule-ca", CA_LINE_3_B)).toBe(15_919);
    const none = evaluate(
      kenly,
      factsWith(kenly, { [SMALL_EMPLOYER_HEALTH_CREDIT_KEY]: undefined }),
    );
    expect(none.value("schedule-ca", CA_LINE_3_B)).toBeUndefined();
  });
});

describe("a farm", () => {
  const FARM_KEY = makeFarmFactKey(FARM_ID);
  const farmCredit = {
    ...healthCredit,
    activityKey: FARM_KEY,
    stateSubsidiesAndCredits: 0,
    employees: healthCredit.employees.slice(0, 3),
  };
  const withRanch = (fields: Partial<FarmFactValue>, extra: TaxFactRow[]) =>
    factsWith(daise, { [FARM_KEY]: { ...ranch, ...fields } }, extra);
  const healthRow = (value: unknown): TaxFactRow => ({
    ...daise.facts[0]!,
    id: "f-health",
    category: "self_employment",
    key: SMALL_EMPLOYER_HEALTH_CREDIT_KEY,
    value,
  });
  const benefits = { ...ranch.expenses, employeeBenefitPrograms: 40_000 };

  it("Schedule F line 15 is the stated benefits less line 12 (irs-1040sf-inst-2025::sec::line-15::b01)", () => {
    const out = evaluate(daise, withRanch({ expenses: benefits }, [healthRow(farmCredit)]));
    const line12 = out.line(LINES.l12) as number;
    expect(line12).toBeGreaterThan(0);
    expect(out.value("schedule-f", "0.line.15_employee_benefit_programs")).toBe(40_000 - line12);
    expect(out.value("form-3800", COL_E)).toBe(line12);
  });

  it("a farm that also states the credit is a gap, and line 15 takes only the stated one", () => {
    const out = evaluate(
      daise,
      withRanch({ expenses: benefits, smallEmployerHealthCredit: 900 }, [healthRow(farmCredit)]),
    );
    expect(isGap(out.field("form-8941", LINES.l12))).toBe(true);
    expect(out.value("schedule-f", "0.line.15_employee_benefit_programs")).toBe(39_100);
  });
});

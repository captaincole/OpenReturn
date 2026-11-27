/*
 * Form 8844 on a whole return: who files, each line, the gaps, Form 3800 Part
 * III line 3, and the wage deduction it lowers (Schedule C line 26, Schedule F
 * line 22). The synthetic jaret (a business) and marin (a farm) scenarios are
 * the bases.
 */

import { describe, expect, it } from "vitest";
import {
  empowermentZoneFigures,
  makeEmpowermentZoneEmployeeFactKey,
  makeGeneralBusinessCreditFactKey,
  type EmpowermentZoneEmployeeFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { resolve3800Info } from "../../../../src/federal/3800/resolveInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { BUSINESS_KEY, EMPLOYEES } from "../../../scenarios/synthetic/jaret/facts.js";
import { jaretScenario as base } from "../../../scenarios/synthetic/jaret/index.js";
import { FARM_KEY } from "../../../scenarios/synthetic/marin/facts.js";
import { marinScenario as farmBase } from "../../../scenarios/synthetic/marin/index.js";
import type { Scenario } from "../../../types.js";

const EMPLOYEE_KEYS = Object.keys(EMPLOYEES).map(makeEmpowermentZoneEmployeeFactKey);
const ROSA = makeEmpowermentZoneEmployeeFactKey("rosa-ibarra");

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

/* The scenario's facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(
  scenario: Scenario,
  changes: Record<string, unknown>,
  extra: TaxFactRow[] = [],
): TaxFactRow[] {
  const kept = scenario.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const withoutEmployees = (scenario: Scenario) =>
  scenario.facts.filter((fact) => !fact.key.startsWith("empowerment_zone_employee."));

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8844-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8844", id);
  return { files, field, value, line };
}

const LINE_1 = "0.line.1_qualified_empowerment_zone_wages";
const LINE_2 = "0.line.2_multiply_1_by_20_percent";
const LINE_3 = "0.line.3_credit_from_pass_through_entities";
const LINE_4 = "0.line.4_add_lines";
const PART_III_3E = "3.part3.3_form_8844_col_e";

describe("Form 8844 who files (general-instructions::b01)", () => {
  it("files for the wages of the taxpayer's own employees, with Form 3800", () => {
    const run = evaluate(base.facts);
    expect([run.files("form-8844"), run.files("form-3800")]).toEqual([true, true]);
  });

  it("does not file for a K-1 credit alone: Form 3800 takes it directly", () => {
    const run = evaluate(withoutEmployees(base));
    expect(run.files("form-8844")).toBe(false);
    expect(run.value("form-3800", PART_III_3E)).toBe(1200);
  });

  it("does not file when no employee qualifies (line 1 is 0)", () => {
    const run = evaluate(
      factsWith(
        base,
        Object.fromEntries(
          EMPLOYEE_KEYS.map((key, index) => [
            key,
            { ...Object.values(EMPLOYEES)[index], livesAndWorksInZone: false },
          ]),
        ),
      ),
    );
    expect(run.files("form-8844")).toBe(false);
    expect(run.value("schedule-c", "0.line.26")).toBe(98000);
  });

  it("an explicit decision false still wins, and Form 3800 keeps the K-1 credit", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8844", false),
    ]);
    expect(run.files("form-8844")).toBe(false);
    expect(run.value("form-3800", PART_III_3E)).toBe(1200);
  });
});

describe("Form 8844 lines", () => {
  it("fills lines 1 to 4 and leaves the cooperative and trust lines 5 and 6 blank", () => {
    const run = evaluate(base.facts);
    expect([LINE_1, LINE_2, LINE_3, LINE_4].map(run.line)).toEqual([28201, 5640, 1200, 6840]);
    expect(run.line("0.line.5_allocated_to_patrons_beneficiaries")).toBeUndefined();
    expect(run.line("0.line.6_subtract_5_from_4")).toBeUndefined();
    expect(isGap(run.field("form-8844", "0.line.5_allocated_to_patrons_beneficiaries"))).toBe(
      false,
    );
  });

  it("leaves line 3 blank with no pass-through credit; line 4 is then line 2", () => {
    const run = evaluate(farmBase.facts, farmBase.decisions);
    expect([LINE_1, LINE_2, LINE_3, LINE_4].map(run.line)).toEqual([21500, 4300, undefined, 4300]);
  });

  it("line 3 takes a stated pass-through credit that names its entity (Form 1041 K-1 box 13 code K)", () => {
    const trust = row("other", makeGeneralBusinessCreditFactKey("trust-zone"), {
      sourceForm: "8844",
      line: "3",
      amount: 300,
      passive: false,
      passThroughEin: "00-0009999",
    });
    const run = evaluate([...base.facts, trust]);
    expect([run.line(LINE_3), run.line(LINE_4)]).toEqual([1500, 7140]);
    expect(run.value("form-3800", PART_III_3E)).toBe(7140);
  });

  it("is a gap when an employee names no business or farm of the return", () => {
    const run = evaluate(
      factsWith(base, { [ROSA]: { ...EMPLOYEES["rosa-ibarra"], employerKey: "business.unknown" } }),
    );
    for (const id of [LINE_1, LINE_2, LINE_4]) expect(isGap(run.field("form-8844", id))).toBe(true);
    expect(isGap(run.field("form-3800", PART_III_3E))).toBe(true);
  });

  it("is a gap when the zone wages are more than the wages the business deducts", () => {
    const business = base.facts.find((fact) => fact.key === BUSINESS_KEY)!.value as {
      expenses: Record<string, number>;
    };
    const run = evaluate(
      factsWith(base, {
        [BUSINESS_KEY]: { ...business, expenses: { ...business.expenses, wages: 20000 } },
      }),
    );
    expect(isGap(run.field("form-8844", LINE_1))).toBe(true);
  });
});

describe("Form 3800 Part III line 3 (face, line 4: report on Form 3800, Part III, line 3)", () => {
  it("adds to Form 8844 line 4, with Section B and Schedule 3 line 6a", () => {
    const run = evaluate(base.facts);
    expect(run.value("form-3800", PART_III_3E)).toBe(run.line(LINE_4));
    expect(run.value("form-3800", "1.line.22_empowerment_zone_credit_combined")).toBe(6840);
    expect(run.value("schedule-3", "0.line.6a")).toBe(6840);
  });

  it("marks the credit of a passive business passive, for column (d) and Form 8582-CR", () => {
    const business = base.facts.find((fact) => fact.key === BUSINESS_KEY)!.value as object;
    const facts = factsWith(base, {
      [BUSINESS_KEY]: { ...business, materiallyParticipated: false },
    });
    const sources = resolve3800Info(makeResolverInputs({ facts, decisions: base.decisions }))
      .form3800Sources!.current.filter((source) => source.credit.line === "3")
      .map(({ credit }) => [credit.key, credit.amount, credit.passive, credit.activity?.name]);
    expect(sources).toEqual([
      ["k1.partnership.franklin-ridge-outfitters", 1200, false, undefined],
      [BUSINESS_KEY, 5640, true, "Sunset Heights Cleaning Co."],
    ]);
  });

  it("makes a stated own line 3 credit a gap while Form 8844 figures the employees", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("own-zone"), {
      sourceForm: "8844",
      line: "3",
      amount: 900,
      passive: false,
    });
    const run = evaluate([...base.facts, stated]);
    expect(isGap(run.field("form-3800", PART_III_3E))).toBe(true);
    expect(run.line(LINE_4)).toBe(6840);
  });

  it("keeps a stated own line 3 credit when Form 8844 does not file (no employee facts)", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("own-zone"), {
      sourceForm: "8844",
      line: "3",
      amount: 900,
      passive: false,
    });
    const run = evaluate([...withoutEmployees(base), stated]);
    expect(run.value("form-3800", PART_III_3E)).toBe(2100);
  });
});

describe("the wage deduction goes down by line 2 (line-2::b01)", () => {
  it("Schedule C line 26: the wages less the business's line 2 credit, not the K-1 credit", () => {
    expect(evaluate(base.facts).value("schedule-c", "0.line.26")).toBe(98000 - 5640);
  });

  it("Schedule F line 22: labor hired less the stated credits and the farm's line 2 credit", () => {
    const run = evaluate(farmBase.facts, farmBase.decisions);
    expect(run.value("schedule-f", "0.line.22_labor_hired")).toBe(48000 - 2400 - 4300);
  });

  it("splits line 2 between a business and a farm by their counted wages", () => {
    const farmRow = farmBase.facts.find((fact) => fact.key === FARM_KEY)!;
    const hand: EmpowermentZoneEmployeeFactValue = {
      ...EMPLOYEES["rosa-ibarra"],
      name: "Farm Hand",
      employerKey: FARM_KEY,
    };
    const facts = [
      ...base.facts,
      farmRow,
      row("self_employment", makeEmpowermentZoneEmployeeFactKey("farm-hand"), hand),
    ];
    const figures = empowermentZoneFigures(facts, false);
    expect(figures.line1).toBe(43201);
    expect(figures.line2).toBe(8640);
    expect([...figures.creditByEmployer.entries()]).toEqual([
      [BUSINESS_KEY, 5640],
      [FARM_KEY, 3000],
    ]);
  });

  it("leaves out a spouse's business on a return filed apart", () => {
    const business = base.facts.find((fact) => fact.key === BUSINESS_KEY)!;
    const spouseBusiness = {
      ...business,
      value: { ...(business.value as object), owner: "spouse" },
    };
    const facts = factsWith(base, { [BUSINESS_KEY]: undefined }, [spouseBusiness]);
    expect(empowermentZoneFigures(facts, false).line1).toBe(0);
    expect(empowermentZoneFigures(facts, true).line1).toBe(28201);
  });
});

describe("California gives the wages back (ca-rtc-2025::sec::s17270::b)", () => {
  const CA_KEYS = ["decisions.scope.must_file_ca_540", "decisions.scope.ca_residency"];
  const californiaDecisions = [
    ...base.decisions.filter((each) => !CA_KEYS.includes(each.decisionKey)),
    decision("decisions.scope.must_file_ca_540", true),
    decision("decisions.scope.ca_residency", "full_year"),
  ];
  const inCalifornia = (facts: TaxFactRow[]) =>
    facts.map((fact) => (fact.key === "identity.address.state" ? { ...fact, value: "CA" } : fact));
  const B3 = "0.line.b3_subtractions";

  it("Schedule CA line 3 column B is the Schedule C wages the federal credit took off", () => {
    const run = evaluate(inCalifornia(base.facts), californiaDecisions);
    expect(run.value("schedule-c", "0.line.26")).toBe(98000 - 5640);
    expect(run.value("schedule-ca", B3)).toBe(5640);
    expect(run.value("form-540", "line.14_ca_adjustments_subtractions")).toBe(5640);
    expect(run.value("form-540", "line.15_ca_agi_before_additions")).toBe(117224);
  });

  it("is blank without the employee facts", () => {
    const run = evaluate(inCalifornia(withoutEmployees(base)), californiaDecisions);
    expect(run.value("schedule-ca", B3)).toBeUndefined();
  });
});

describe("no Form 8844 facts, nothing changes", () => {
  it("Schedule C line 26 is the stated wages", () => {
    expect(evaluate(withoutEmployees(base)).value("schedule-c", "0.line.26")).toBe(98000);
  });

  it("Schedule F line 22 is labor hired less the stated credits only", () => {
    const run = evaluate(withoutEmployees(farmBase), farmBase.decisions);
    expect(run.value("schedule-f", "0.line.22_labor_hired")).toBe(48000 - 2400);
    expect(run.files("form-8844")).toBe(false);
  });

  it("finds no figures without employee facts", () => {
    const figures = empowermentZoneFigures(withoutEmployees(base), false);
    expect([figures.line1, figures.line2, figures.creditByEmployer.size]).toEqual([0, 0, 0]);
  });
});

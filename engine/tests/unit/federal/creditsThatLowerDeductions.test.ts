/*
 * Credits on one business: the work opportunity credit (Form 5884) and the
 * empowerment zone employment credit (Form 8844) lower Schedule C line 26,
 * wages, and the tip credit (Form 8846) lowers line 23, taxes. On a farm the
 * two wage credits lower Schedule F line 22, labor hired. Each form was written
 * without the others; this test holds them together. The salon is the
 * synthetic natti scenario's; the certified employees are the synthetic daved
 * scenario's, moved to the salon; the zone employees are the synthetic jaret
 * scenario's, moved to the salon. The farm is the synthetic byar scenario's,
 * with the synthetic marin scenario's zone hands.
 */

import { describe, expect, it } from "vitest";
import {
  makeEmpowermentZoneEmployeeFactKey,
  makeWorkOpportunityEmployeeFactKey,
  type EmpowermentZoneEmployeeFactValue,
} from "../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../src/facts/rows.js";
import { evaluateScenario } from "../../../src/index.js";
import { decisionRow } from "../../helpers/fixtureBuilders.js";
import { PECANS_KEY, pecans } from "../../scenarios/synthetic/byar/facts.js";
import { byarScenario as byar } from "../../scenarios/synthetic/byar/index.js";
import { EMPLOYEES } from "../../scenarios/synthetic/daved/facts.js";
import { EMPLOYEES as ZONE_EMPLOYEES } from "../../scenarios/synthetic/jaret/facts.js";
import { EMPLOYEES as ZONE_HANDS } from "../../scenarios/synthetic/marin/facts.js";
import { SALON_KEY, salon } from "../../scenarios/synthetic/natti/facts.js";
import { nattiScenario as natti } from "../../scenarios/synthetic/natti/index.js";
import type { Scenario } from "../../types.js";

const TIP_CREDIT = 12_686;
const TIP_CREDIT_WITH_K1 = 15_036;

const row = (scenario: Scenario, category: string, key: string, value: unknown): TaxFactRow => ({
  ...scenario.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const employeesOfTheSalon: TaxFactRow[] = Object.entries(EMPLOYEES).map(([slug, value]) =>
  row(natti, "self_employment", makeWorkOpportunityEmployeeFactKey(slug), {
    ...value,
    activityKey: SALON_KEY,
  }),
);

/* Zone employee facts of one employer, with the work opportunity wages each states. */
const zoneFacts = (
  scenario: Scenario,
  employerKey: string,
  employees: Record<string, EmpowermentZoneEmployeeFactValue>,
  workOpportunityWages: Record<string, number | undefined>,
): TaxFactRow[] =>
  Object.entries(employees).map(([slug, value]) =>
    row(scenario, "self_employment", makeEmpowermentZoneEmployeeFactKey(slug), {
      ...value,
      employerKey,
      workOpportunityCreditWages: workOpportunityWages[slug],
    }),
  );

/*
 * Ilyena Sarrow is also a zone employee of the salon: $7,500 of zone wages,
 * $6,000 of them the qualified first-year wages of her work opportunity
 * credit. The other zone employees are not certified: 0.
 */
const ILYENA: EmpowermentZoneEmployeeFactValue = {
  ...ZONE_EMPLOYEES["rosa-ibarra"]!,
  name: "Ilyena Sarrow",
  zoneWages: 7500,
};
const SALON_ZONE = { ...ZONE_EMPLOYEES, "ilyena-sarrow": ILYENA };
const NOT_CERTIFIED = Object.fromEntries(Object.keys(ZONE_EMPLOYEES).map((slug) => [slug, 0]));
const zoneOfTheSalon = zoneFacts(natti, SALON_KEY, SALON_ZONE, {
  ...NOT_CERTIFIED,
  "ilyena-sarrow": 6000,
});

const decision = (scenario: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: scenario.userId,
    taxYear: scenario.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

/* The scenario as a full-year California resident. */
function inCalifornia(scenario: Scenario, facts: TaxFactRow[]) {
  const CA_KEYS = ["decisions.scope.must_file_ca_540", "decisions.scope.ca_residency"];
  const decisions = [
    ...scenario.decisions.filter((each) => !CA_KEYS.includes(each.decisionKey)),
    decision(scenario, "decisions.scope.must_file_ca_540", true),
    decision(scenario, "decisions.scope.ca_residency", "full_year"),
  ];
  const moved = facts.map((fact) =>
    fact.key === "identity.address.state" ? { ...fact, value: "CA" } : fact,
  );
  return { facts: moved, decisions };
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = natti.decisions) {
  const result = evaluateScenario({
    filing: { id: "credits-that-lower-deductions-test", taxYear: natti.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const value = (formId: string, id: string) => {
    const found = result.forms
      .get(formId)
      ?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
    return found?.ok ? found.value : undefined;
  };
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { value, missing };
}

describe("a business with the work opportunity credit and the tip credit", () => {
  const { value } = evaluate([...natti.facts, ...employeesOfTheSalon]);
  const workOpportunityCredit = value("form-5884", "0.line.2_add_lines");

  it("figures both credits", () => {
    expect(typeof workOpportunityCredit).toBe("number");
    expect(workOpportunityCredit as number).toBeGreaterThan(0);
    expect(value("form-8846", "0.line.4_multiply_3_by_7_65_percent")).toBe(TIP_CREDIT);
  });

  it("each credit lowers its own Schedule C line, and only that line", () => {
    const wages = salon.expenses?.wages ?? 0;
    const taxes = salon.expenses?.taxesAndLicenses ?? 0;
    expect(value("schedule-c", "0.line.26")).toBe(wages - (workOpportunityCredit as number));
    expect(value("schedule-c", "0.line.23")).toBe(taxes - TIP_CREDIT);
  });

  it("each credit has its own row on Form 3800 Part III", () => {
    expect(value("form-3800", "3.part3.4b_form_5884_col_g")).toBe(workOpportunityCredit);
    expect(value("form-3800", "3.part3.4f_form_8846_col_g")).toBe(TIP_CREDIT_WITH_K1);
  });
});

/*
 * The three credits on the salon, worked by hand:
 * - Form 5884: Ilyena 820 hours, $7,500 limited to $6,000 × 40% = $2,400 (line
 *   1b); Tomas Verrin 360 hours, $6,400 × 25% = $1,600 (line 1a); line 2 $4,000.
 * - Form 8844 line 1: Rosa $32,000 limited to $15,000; Tomas Garay $9,800.50;
 *   Lena (fewer than 90 days) 0; Marco (a relative) 0; Dalia (misconduct)
 *   $3,400; Ilyena $7,500 − $6,000 = $1,500, under her limit of $15,000 −
 *   $6,000. Total $29,700.50, rounded $29,701; line 2 20% = $5,940.
 * - Schedule C line 26: $452,000 − $4,000 − $5,940 = $442,060.
 * - Form 8846 line 4: $12,686; Schedule C line 23: $56,200 − $12,686 = $43,514.
 * - Schedule CA line 3 column B, a California return: $4,000 + $5,940 = $9,940.
 */
const ALL_THREE = [...natti.facts, ...employeesOfTheSalon, ...zoneOfTheSalon];

describe("a business with the work opportunity, empowerment zone and tip credits", () => {
  const { value, missing } = evaluate(ALL_THREE);

  it("figures each credit", () => {
    expect(value("form-5884", "0.line.2_add_lines")).toBe(4000);
    expect(value("form-8844", "0.line.1_qualified_empowerment_zone_wages")).toBe(29701);
    expect(value("form-8844", "0.line.2_multiply_1_by_20_percent")).toBe(5940);
    expect(value("form-8844", "0.line.4_add_lines")).toBe(5940);
    expect(value("form-8846", "0.line.4_multiply_3_by_7_65_percent")).toBe(TIP_CREDIT);
    expect(missing("form-8844")).toEqual([]);
  });

  it("line 26 is the wages less both wage credits; line 23 the taxes less the tip credit", () => {
    expect(value("schedule-c", "0.line.26")).toBe(442060);
    expect(value("schedule-c", "0.line.23")).toBe(43514);
  });

  it("each credit has its own row on Form 3800 Part III", () => {
    expect(value("form-3800", "3.part3.3_form_8844_col_g")).toBe(5940);
    expect(value("form-3800", "3.part3.4b_form_5884_col_g")).toBe(4000);
    expect(value("form-3800", "3.part3.4f_form_8846_col_g")).toBe(TIP_CREDIT_WITH_K1);
  });

  it("California gives both wage credits back once, on Schedule CA line 3 column B", () => {
    const california = inCalifornia(natti, ALL_THREE);
    const run = evaluate(california.facts, california.decisions);
    expect(run.value("schedule-c", "0.line.26")).toBe(442060);
    expect(run.value("schedule-ca", "0.line.b3_subtractions")).toBe(9940);
  });
});

describe("a zone employee of a business with work opportunity employees states those wages", () => {
  const rosa = makeEmpowermentZoneEmployeeFactKey("rosa-ibarra");
  const unstated = zoneFacts(natti, SALON_KEY, SALON_ZONE, {
    ...NOT_CERTIFIED,
    "rosa-ibarra": undefined,
    "ilyena-sarrow": 6000,
  });
  const { value, missing } = evaluate([...natti.facts, ...employeesOfTheSalon, ...unstated]);

  it("Form 8844 asks for the answer and its lines wait", () => {
    expect(missing("form-8844")).toEqual([rosa]);
    expect(value("form-8844", "0.line.1_qualified_empowerment_zone_wages")).toBeUndefined();
    expect(value("form-8844", "0.line.4_add_lines")).toBeUndefined();
    expect(missing("form-3800")).toContain(rosa);
  });

  it("Schedule C line 26 takes off only the work opportunity credit while it waits", () => {
    expect(value("schedule-c", "0.line.26")).toBe(452000 - 4000);
  });

  it("an employee who is not qualified is not asked", () => {
    const lena = makeEmpowermentZoneEmployeeFactKey("lena-ortiz");
    const facts = zoneFacts(natti, SALON_KEY, SALON_ZONE, {
      ...NOT_CERTIFIED,
      "lena-ortiz": undefined,
      "ilyena-sarrow": 6000,
    });
    const run = evaluate([...natti.facts, ...employeesOfTheSalon, ...facts]);
    expect(run.missing("form-8844")).not.toContain(lena);
    expect(run.value("form-8844", "0.line.2_multiply_1_by_20_percent")).toBe(5940);
  });
});

/*
 * The farm, worked by hand:
 * - Form 5884 line 2 of the orchard's own crews: $17,618 (the byar scenario).
 * - Form 8844 line 1: Tamsin Ardell $9,200 of zone wages, $6,000 of them her
 *   work opportunity wages: $3,200, under her limit of $9,000; Nora $12,500;
 *   Hector (lives outside the zone) 0. Total $15,700; line 2 20% = $3,140.
 * - Schedule F line 22: $128,000 − $17,618 − $3,140 = $107,242.
 * - Schedule CA line 6 column B, a California return: $17,618 + $3,140 = $20,758.
 */
const TAMSIN: EmpowermentZoneEmployeeFactValue = {
  ...ZONE_HANDS["nora-salinas"]!,
  name: "Tamsin Ardell",
  zoneWages: 9200,
};
const zoneOfTheOrchard = zoneFacts(
  byar,
  PECANS_KEY,
  {
    "nora-salinas": ZONE_HANDS["nora-salinas"]!,
    "hector-pena": ZONE_HANDS["hector-pena"]!,
    "tamsin-ardell": TAMSIN,
  },
  { "nora-salinas": 0, "hector-pena": 0, "tamsin-ardell": 6000 },
);
const FARM_FACTS = [...byar.facts, ...zoneOfTheOrchard];

describe("a farm with the work opportunity and empowerment zone credits", () => {
  const { value } = evaluate(FARM_FACTS, byar.decisions);

  it("figures each credit and its Form 3800 row", () => {
    expect(value("form-5884", "0.line.2_add_lines")).toBe(17618);
    expect(value("form-8844", "0.line.1_qualified_empowerment_zone_wages")).toBe(15700);
    expect(value("form-8844", "0.line.2_multiply_1_by_20_percent")).toBe(3140);
    expect(value("form-3800", "3.part3.3_form_8844_col_g")).toBe(3140);
  });

  it("Schedule F line 22 is labor hired less both wage credits", () => {
    expect(pecans.expenses?.laborHired).toBe(128000);
    expect(value("schedule-f", "0.line.22_labor_hired")).toBe(107242);
  });

  it("California gives both credits back once, on Schedule CA line 6 column B", () => {
    const california = inCalifornia(byar, FARM_FACTS);
    const run = evaluate(california.facts, california.decisions);
    expect(run.value("schedule-ca", "0.line.b6_subtractions")).toBe(20758);
  });
});

describe("the tip credit alone is unchanged by the join", () => {
  const { value } = evaluate(natti.facts);

  it("Schedule C line 26 is the stated wages", () => {
    expect(value("schedule-c", "0.line.26")).toBe(salon.expenses?.wages);
    expect(value("schedule-c", "0.line.23")).toBe(
      (salon.expenses?.taxesAndLicenses ?? 0) - TIP_CREDIT,
    );
  });
});

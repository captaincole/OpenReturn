/*
 * Credits on one business: the work opportunity credit (Form 5884) and the
 * empowerment zone employment credit (Form 8844) lower Schedule C line 26,
 * wages, and the tip credit (Form 8846) lowers line 23, taxes. The disabled
 * access (Form 8826), retirement plan (Form 8881), childcare (Form 8882) and
 * research (Form 6765) credits lower the lines their facts hold. On a farm the
 * two wage credits lower Schedule F line 22, labor hired. Each form was written
 * without the others; this test holds them together. The salon is the
 * synthetic natti scenario's; the certified employees are the synthetic daved
 * scenario's, moved to the salon; the zone employees are the synthetic jaret
 * scenario's, moved to the salon. The farm is the synthetic byar scenario's,
 * with the synthetic marin scenario's zone hands.
 */

import { describe, expect, it } from "vitest";
import {
  businessCreditAddBack,
  DISABLED_ACCESS_KEYS,
  makeChildcareExpenditureFactKey,
  makeDisabledAccessFactKey,
  makeEmpowermentZoneEmployeeFactKey,
  makeSmallEmployerPlanFactKey,
  makeWorkOpportunityEmployeeFactKey,
  RESEARCH_CREDIT_KEY,
  type ChildcareExpenditureFactValue,
  type DisabledAccessFactValue,
  type EmpowermentZoneEmployeeFactValue,
  type ResearchCreditFactValue,
  type SmallEmployerPlanFactValue,
} from "../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../src/facts/rows.js";
import { evaluateScenario } from "../../../src/index.js";
import { CA_RESEARCH_GAP } from "../../../src/state/ca/schedule-ca/answerLines.js";
import { decisionRow } from "../../helpers/fixtureBuilders.js";
import { pecans, PECANS_KEY } from "../../scenarios/synthetic/byar/facts.js";
import { byarScenario as byar } from "../../scenarios/synthetic/byar/index.js";
import { EMPLOYEES } from "../../scenarios/synthetic/daved/facts.js";
import { EMPLOYEES as ZONE_EMPLOYEES } from "../../scenarios/synthetic/jaret/facts.js";
import { EMPLOYEES as ZONE_HANDS } from "../../scenarios/synthetic/marin/facts.js";
import { salon, SALON_KEY } from "../../scenarios/synthetic/natti/facts.js";
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

/*
 * The salon also pays a sign-language interpreter $4,250 for its deaf clients,
 * in its wages: eligible access expenditures (Form 8826 line 1). Its 2024
 * gross receipts were $950,000, so it is an eligible small business.
 * - Form 8826: line 1 $4,250; line 3 $4,250 − $250 = $4,000; line 5 $4,000
 *   (under $10,000); line 6 50% = $2,000.
 * - Schedule C line 26: $452,000 − $4,000 − $5,940 − $2,000 = $440,060, three
 *   credits on one line, each dollar once.
 * - Schedule CA line 3 column B: $4,000 + $5,940 + $2,000 = $11,940.
 */
const interpreter = row(natti, "self_employment", makeDisabledAccessFactKey("interpreter"), {
  businessKey: SALON_KEY,
  expenditures: 4250,
  deductedOn: "wages",
} satisfies DisabledAccessFactValue);
const receipts = row(natti, "self_employment", DISABLED_ACCESS_KEYS.priorYearGrossReceipts, 950000);
const ALL_FOUR = [...ALL_THREE, interpreter, receipts];

describe("a business with the work opportunity, zone, tip and disabled access credits", () => {
  const { value } = evaluate(ALL_FOUR);

  it("figures the disabled access credit and its Form 3800 row", () => {
    expect(value("form-8826", "0.line.6_multiply_5_by_50_percent_dollars")).toBe(2000);
    expect(value("form-3800", "2.part3.1e_form_8826_col_g")).toBe(2000);
    expect(value("form-3800", "3.part3.4b_form_5884_col_g")).toBe(4000);
    expect(value("form-3800", "3.part3.3_form_8844_col_g")).toBe(5940);
  });

  it("line 26 is the wages less the three credits on it; line 23 is unchanged", () => {
    expect(value("schedule-c", "0.line.26")).toBe(440060);
    expect(value("schedule-c", "0.line.23")).toBe(43514);
  });

  it("California gives the three credits back once, on Schedule CA line 3 column B", () => {
    const california = inCalifornia(natti, ALL_FOUR);
    const run = evaluate(california.facts, california.decisions);
    expect(run.value("schedule-ca", "0.line.b3_subtractions")).toBe(11940);
  });
});

/*
 * Two credits on one small line: the interpreter's $4,250 is the business's
 * only wages, and the Form 5884 employees ($4,000 of credit) are on them too.
 * Line 26 is $4,250 − $4,000 − $2,000, not below 0: $0. California gives back
 * only the $4,250 taken off.
 */
describe("credits larger than the line they lower", () => {
  const small = { ...salon, expenses: { ...salon.expenses, wages: 4250 } };
  const facts = ALL_FOUR.filter((each) => !zoneOfTheSalon.includes(each)).map((each) =>
    each.key === SALON_KEY ? { ...each, value: small } : each,
  );

  it("the line does not go below 0, and no dollar is given back twice", () => {
    expect(evaluate(facts).value("schedule-c", "0.line.26")).toBe(0);
    const california = inCalifornia(natti, facts);
    const run = evaluate(california.facts, california.decisions);
    expect(run.value("schedule-ca", "0.line.b3_subtractions")).toBe(4250);
  });
});

/*
 * The salon with every credit that lowers a Schedule C expense. Besides the
 * four credits above:
 * - Form 8881: a new 401(k) plan, in its first credit year, with 12 employees
 *   the year before and 6 who can join. Line 1 $2,000 of the administrator's
 *   fees, in line 17; line 2 $2,000 (50 or fewer employees); line 3 6 × $250 =
 *   $1,500; line 4 $1,500 (between $500 and $5,000); line 5 $1,500, the
 *   smaller. Line 8 $1,500 (no contributions, no K-1).
 * - Form 8882: $8,000 of the salon's childcare center staff, in its wages.
 *   Line 1 $8,000; line 2 25% = $2,000; line 7 $2,000.
 * - Form 6765, the alternative simplified credit with no reduced credit
 *   election: line 48 $30,000 of wages + $4,000 of supplies = $34,000; line 21
 *   ($20,000 + $22,000 + $24,000) ÷ 6 = $11,000; line 22 $23,000; line 24 14% =
 *   $3,220; lines 26 and 28 $3,220. The reduction comes off line 26 first,
 *   which holds it all.
 * Schedule C, worked by hand:
 * - Line 26: $452,000 − $4,000 (5884) − $5,940 (8844) − $2,000 (8826) −
 *   $2,000 (8882) − $3,220 (6765) = $434,840. Five credits on one line, each
 *   dollar once.
 * - Line 17: $6,200 − $1,500 (8881) = $4,700. Line 23: $56,200 − $12,686
 *   (8846) = $43,514. Line 22, supplies, stays $168,000.
 * - California: Forms 5884, 8844 and 8826 come back, $11,940; Forms 8846,
 *   8881 and 8882 do not. The federal research reduction makes line 3 the
 *   named gap of Form 6765 (CA_RESEARCH_GAP), so the add-back is asserted
 *   where it is figured.
 */
const plan = row(natti, "self_employment", makeSmallEmployerPlanFactKey("salon-401k"), {
  name: "Varrow Studio 401(k) Plan",
  activityKey: SALON_KEY,
  startupCosts: {
    creditYear: 1,
    employeesBeforeFirstCreditYear: 12,
    qualifiedCosts: 2000,
    eligibleNonHighlyCompensated: 6,
    deductedOn: "legalAndProfessional",
  },
} satisfies SmallEmployerPlanFactValue);
const childcare = row(natti, "self_employment", makeChildcareExpenditureFactKey("center-staff"), {
  businessKey: SALON_KEY,
  kind: "facility_operating",
  description: "Childcare center staff wages",
  amount: 8000,
  deductedOn: "wages",
} satisfies ChildcareExpenditureFactValue);
const research = row(natti, "self_employment", RESEARCH_CREDIT_KEY, {
  businessKey: SALON_KEY,
  reducedCreditElection: false,
  controlledGroup: false,
  method: "alternative_simplified",
  expenses: { wages: 30000, supplies: 4000 },
  businessComponentCount: 1,
  grossReceiptsPriorYears: [900000, 940000, 970000],
  priorThreeYearsQres: [20000, 22000, 24000],
  acquiredOrDisposed: false,
  newExpenseCategories: false,
  attributableTaxableIncome: 100000,
} satisfies ResearchCreditFactValue);
const ALL_SEVEN = [...ALL_FOUR, plan, childcare, research];

describe("a business with every credit that lowers a Schedule C expense", () => {
  const { value, missing } = evaluate(ALL_SEVEN);

  it("figures each credit", () => {
    expect(value("form-5884", "0.line.2_add_lines")).toBe(4000);
    expect(value("form-8844", "0.line.2_multiply_1_by_20_percent")).toBe(5940);
    expect(value("form-8846", "0.line.4_multiply_3_by_7_65_percent")).toBe(TIP_CREDIT);
    expect(value("form-8826", "0.line.6_multiply_5_by_50_percent_dollars")).toBe(2000);
    expect(value("form-8881", "0.line.5_smaller_of_2_or_4")).toBe(1500);
    expect(value("form-8881", "0.line.8_total_part_i_credits")).toBe(1500);
    expect(value("form-8882", "0.line.2_multiply_1_by_25_percent_dollars")).toBe(2000);
    expect(value("form-8882", "0.line.7_smaller_of_6_or_150000_dollars")).toBe(2000);
    expect(value("form-6765", "0.line.24_multiply_23_by_14")).toBe(3220);
    expect(value("form-6765", "1.line.28_subtract_27_from_13_or_26")).toBe(3220);
    expect(missing("form-3800")).toEqual([]);
  });

  it("each credit has its own row on Form 3800 Part III", () => {
    expect(value("form-3800", "2.part3.1e_form_8826_col_g")).toBe(2000);
    expect(value("form-3800", "2.part3.1j_form_8881_part_i_col_g")).toBe(1500);
    expect(value("form-3800", "2.part3.1k_form_8882_col_g")).toBe(2000);
    expect(value("form-3800", "3.part3.3_form_8844_col_g")).toBe(5940);
    expect(value("form-3800", "3.part3.4b_form_5884_col_g")).toBe(4000);
    expect(value("form-3800", "3.part3.4f_form_8846_col_g")).toBe(TIP_CREDIT_WITH_K1);
    expect(value("form-3800", "3.part3.4i_form_6765_esb_col_g")).toBe(3220);
  });

  it("each expense line is lowered once by each of its credits, and no other line moves", () => {
    expect(value("schedule-c", "0.line.26")).toBe(434840);
    expect(value("schedule-c", "0.line.17")).toBe(4700);
    expect(value("schedule-c", "0.line.23")).toBe(43514);
    expect(value("schedule-c", "0.line.22")).toBe(168000);
  });

  it("California adds back Forms 5884, 8844 and 8826, and line 3 is Form 6765's named gap", () => {
    const california = inCalifornia(natti, ALL_SEVEN);
    const run = evaluateScenario({
      filing: { id: "credits-that-lower-deductions-test", taxYear: natti.taxYear },
      facts: california.facts,
      decisions: california.decisions,
      authEmail: null,
    });
    const line3 = run.forms
      .get("schedule-ca")
      ?.fields.find((each) => each.fieldId === "schedule-ca.0.line.b3_subtractions")?.result;
    expect(line3?.ok).toBe(false);
    expect(JSON.stringify(line3)).toContain(CA_RESEARCH_GAP);
    expect(businessCreditAddBack(california.facts, false)).toBe(11940);
  });
});

/*
 * The same business with the reduced credit election: Form 6765 lowers no
 * deduction, so line 26 is $452,000 − $4,000 − $5,940 − $2,000 − $2,000 =
 * $438,060, and California line 3 column B prints the $11,940.
 */
describe("the same business with the reduced research credit election", () => {
  const elected = ALL_SEVEN.map((each) =>
    each === research
      ? {
          ...each,
          value: { ...(each.value as ResearchCreditFactValue), reducedCreditElection: true },
        }
      : each,
  );

  it("line 26 keeps the research expenses, and California adds back $11,940", () => {
    expect(evaluate(elected).value("schedule-c", "0.line.26")).toBe(438060);
    const california = inCalifornia(natti, elected);
    const run = evaluate(california.facts, california.decisions);
    expect(run.value("schedule-ca", "0.line.b3_subtractions")).toBe(11940);
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

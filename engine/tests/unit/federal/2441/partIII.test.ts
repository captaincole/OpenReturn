/* Source: 2025 Form 2441 and instructions, Part III (lines 12 to 31). */

import { describe, expect, it } from "vitest";
import type {
  DependentCarePersonRow,
  Form2441FilingInfo,
} from "../../../../src/federal/2441/filingInfo.js";
import { partIIIBindings } from "../../../../src/federal/2441/partIII.js";

type Binding = (form: Record<string, unknown>, info: Form2441FilingInfo) => unknown;

const person = (expensesPaid: number): DependentCarePersonRow => ({
  factKey: `dependent_care.qualifying_person.p${expensesPaid}`,
  expensesPaid,
});

/* A single filer with $80,000 of wages and $5,000 in W-2 box 10. */
const BASE: Form2441FilingInfo = {
  filingStatus: "single",
  dependentCareBenefits: 5000,
  dependentCareBenefitsByW2: [5000],
  dependentCareGracePeriodCarryover: 0,
  dependentCareBenefitsForfeited: 0,
  dependentCareExpensesIncurred: 6000,
  dependentCarePlanExclusionLimit: 5000,
  dependentCarePersons: [person(1000)],
};

/* Line 1e is in line 1z; lines 18 and 19 leave it out. */
const FORM_1040 = {
  "form-1040.line.1a": 80000,
  "form-1040.line.1e": 2000,
  "form-1040.line.1z": 82000,
};

/* Evaluates the Part III bindings against each other and the federal lines given (the 1040 lines above). */
function evaluate(
  info: Form2441FilingInfo,
  federal: Record<string, unknown> = FORM_1040,
): Record<string, unknown> {
  const bindings = partIIIBindings() as Record<string, Binding>;
  const form: Record<string, unknown> = new Proxy(federal, {
    get: (values: Record<string, unknown>, key: string) =>
      key in bindings ? bindings[key](form, info) : values[key],
  });
  return Object.fromEntries(Object.keys(bindings).map((key) => [key.slice(7), form[key]]));
}

const pick = (lines: Record<string, unknown>, prefixes: string[]) =>
  prefixes.map(
    (prefix) => Object.entries(lines).find(([key]) => key.startsWith(`${prefix}_`))?.[1],
  );

describe("Form 2441 Part III", () => {
  it("excludes $5,000 and leaves nothing for the credit", () => {
    const lines = evaluate(BASE);
    expect(pick(lines, ["12", "15", "17", "18", "19", "20", "21", "24", "25", "26"])).toEqual([
      5000, 5000, 5000, 80000, 80000, 5000, 5000, 0, 5000, 0,
    ]);
    expect([lines["22_no"], lines["22_yes"], lines["22_amount"]]).toEqual([true, false, 0]);
    expect(pick(lines, ["27", "28", "29", "30", "31"])).toEqual([
      3000,
      5000,
      0,
      undefined,
      undefined,
    ]);
  });

  it("keeps $1,000 of the $6,000 limit with two qualifying persons", () => {
    const lines = evaluate({ ...BASE, dependentCarePersons: [person(4000), person(0)] });
    expect(pick(lines, ["27", "28", "29", "30", "31"])).toEqual([6000, 5000, 1000, 4000, 1000]);
  });

  it("taxes the benefits over the expenses incurred", () => {
    const lines = evaluate({ ...BASE, dependentCareExpensesIncurred: 3000 });
    expect(pick(lines, ["17", "20", "25", "26"])).toEqual([3000, 3000, 3000, 2000]);
  });

  it("caps line 21 at a lower plan limit", () => {
    const lines = evaluate({
      ...BASE,
      dependentCareBenefits: 4000,
      dependentCareBenefitsByW2: [4000],
      dependentCarePlanExclusionLimit: 4000,
    });
    expect(pick(lines, ["21", "25"])).toEqual([4000, 4000]);
  });

  it("totals box 10 from both spouses' W-2s and taxes the amount over $5,000", () => {
    const lines = evaluate({
      ...BASE,
      filingStatus: "married_filing_jointly",
      dependentCareBenefits: 8000,
      dependentCareBenefitsByW2: [5000, 3000],
      dependentCareExpensesIncurred: 10000,
      dependentCareStudentOrDisabledSpouse: false,
      dependentCareTaxpayerW2Wages: 50000,
      dependentCareSpouseW2Wages: 30000,
      dependentCareTaxpayerDisabilityWages: 0,
      dependentCareSpouseDisabilityWages: 0,
    });
    expect(pick(lines, ["12", "15", "17", "18", "19", "20", "21", "25", "26"])).toEqual([
      8000, 8000, 8000, 50000, 30000, 8000, 5000, 5000, 3000,
    ]);
  });

  it("takes the taxpayer's business loss off his own earned income on a joint return", () => {
    const info: Form2441FilingInfo = {
      ...BASE,
      filingStatus: "married_filing_jointly",
      hasBusiness: true,
      qbiScheduleSEFiled: false,
      dependentCareSpouseHasBusiness: false,
      dependentCareBenefits: 6000,
      dependentCareBenefitsByW2: [3000, 3000],
      dependentCareExpensesIncurred: 5000,
      dependentCareStudentOrDisabledSpouse: false,
      dependentCareTaxpayerW2Wages: 19500,
      dependentCareSpouseW2Wages: 22000,
      dependentCareTaxpayerDisabilityWages: 0,
      dependentCareSpouseDisabilityWages: 0,
    };
    const federal = {
      "form-1040.line.1a": 41500,
      "form-1040.line.1e": 6000,
      "form-1040.line.1z": 47500,
      "schedule-1.0.line.3": -31000,
    };
    expect(pick(evaluate(info, federal), ["18", "19", "20", "25", "26"])).toEqual([
      -11500, 22000, 0, 0, 6000,
    ]);
    const spouseBusiness = evaluate({ ...info, dependentCareSpouseHasBusiness: true }, federal);
    expect(spouseBusiness["18_earned_income"]).toHaveProperty("unsupported");
  });

  it("names the gaps: box 10 over the plan limit, two plans' limit, MFS spouse's earned income", () => {
    expect(
      evaluate({ ...BASE, dependentCareBenefits: 5500, dependentCareBenefitsByW2: [5500] })[
        "12_benefits_received"
      ],
    ).toHaveProperty("unsupported");
    const twoPlans = evaluate({
      ...BASE,
      dependentCareBenefits: 6000,
      dependentCareBenefitsByW2: [3000, 3000],
      dependentCarePlanExclusionLimit: 4000,
    });
    expect(twoPlans["12_benefits_received"]).toHaveProperty("unsupported");
    expect(twoPlans["21_maximum_exclusion"]).toHaveProperty("unsupported");
    const mfs = evaluate({
      ...BASE,
      filingStatus: "married_filing_separately",
      dependentCareMfsTreatedAsUnmarried: false,
    });
    expect(mfs["19_spouse_earned_income"]).toHaveProperty("unsupported");
    expect(mfs["21_maximum_exclusion"]).toBe(2500);
  });

  it("stays blank with no benefits", () => {
    const lines = evaluate({ ...BASE, dependentCareBenefits: 0, dependentCareBenefitsByW2: [] });
    expect(Object.values(lines).every((value) => value === undefined)).toBe(true);
  });
});

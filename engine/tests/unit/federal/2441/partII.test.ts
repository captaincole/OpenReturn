/* Source: 2025 Form 2441 and instructions, Parts I and II (lines 1 to 11). */

import { describe, expect, it } from "vitest";
import { form2441Bindings } from "../../../../src/federal/2441/bindings.js";
import type {
  DependentCarePersonRow,
  Form2441FilingInfo,
} from "../../../../src/federal/2441/filingInfo.js";
import { resolve2441Info } from "../../../../src/federal/2441/resolveInfo.js";
import type { Form2555Filer } from "../../../../src/federal/2555/person.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

type Binding = (form: Record<string, unknown>, info: Form2441FilingInfo) => unknown;

const person = (expensesPaid: number): DependentCarePersonRow => ({
  factKey: `dependent_care.qualifying_person.p${expensesPaid}`,
  firstName: "Kid",
  lastName: "Doe",
  ssn: "400000001",
  ageAtYearEnd: 5,
  expensesPaid,
});

const PROVIDER = {
  name: "ABC Care",
  address: { line1: "1 Main St", city: "Town", state: "CA", zip: "90000" },
  tin: "12-3456789",
  householdEmployee: false,
  amountPaid: 2000,
};

/* A single filer, one child, $2,000 of care, no Schedule C. */
const BASE: Form2441FilingInfo = {
  filingStatus: "single",
  dependentCareProviders: [PROVIDER],
  dependentCarePersons: [person(2000)],
  dependentCarePriorYearExpensesPaid: 0,
  hasBusiness: false,
};

/* W-2 wages of $5,000. */
const OTHER_FORMS = {
  "form-1040.line.1a": 5000,
  "form-1040.line.1z": 5000,
  "form-1040.line.11a": 5000,
  "form-1040.line.18": 0,
};

const PART_II_LINES = [
  "0.line.3_qualified_expenses_total",
  "0.line.4_earned_income",
  "0.line.5_spouse_earned_income",
  "0.line.6_smallest_of_3_4_5",
  "0.line.7_agi",
  "0.line.8_decimal_amount",
  "0.line.9a_line_6_times_line_8",
  "0.line.9b_prior_year_expenses",
  "0.line.9c_add_9a_9b",
  "0.line.10_tax_liability_limit",
  "0.line.11_dependent_care_credit",
];

/* Evaluates every binding against each other and the other forms' lines. */
function evaluate(
  info: Form2441FilingInfo,
  otherForms: Record<string, unknown> = OTHER_FORMS,
): Record<string, unknown> {
  const bindings = form2441Bindings() as Record<string, Binding>;
  const form: Record<string, unknown> = new Proxy(otherForms, {
    get: (values: Record<string, unknown>, key: string) =>
      key in bindings ? bindings[key](form, info) : values[key],
  });
  return Object.fromEntries(Object.keys(bindings).map((key) => [key, form[key]]));
}

describe("Form 2441 lines 4 and 5", () => {
  it("reduces earned income by a Schedule C loss with no Schedule SE", () => {
    const lines = evaluate(
      { ...BASE, hasBusiness: true, qbiScheduleSEFiled: false },
      { ...OTHER_FORMS, "schedule-1.0.line.3": -3000 },
    );
    expect([lines["0.line.4_earned_income"], lines["0.line.5_spouse_earned_income"]]).toEqual([
      2000, 2000,
    ]);
  });

  // A farm's Schedule F line 34 is on Schedule 1 line 6 (irs-2441-inst-2025, lines 4 and 5).
  it("adds a farm's profit with no Schedule SE, and waits while line 6 is blank", () => {
    const farm = { ...BASE, hasFarm: true, qbiScheduleSEFiled: false };
    const lines = evaluate(farm, { ...OTHER_FORMS, "schedule-1.0.line.6": 350 });
    expect(lines["0.line.4_earned_income"]).toBe(5350);
    expect(evaluate(farm)["0.line.4_earned_income"]).toBeUndefined();
  });

  it("adds a business and a farm together", () => {
    const both = { ...BASE, hasBusiness: true, hasFarm: true, qbiScheduleSEFiled: false };
    const federal = { ...OTHER_FORMS, "schedule-1.0.line.3": 300, "schedule-1.0.line.6": -1000 };
    expect(evaluate(both, federal)["0.line.4_earned_income"]).toBe(4300);
  });

  it("waits while a business's Schedule SE is undecided", () => {
    const lines = evaluate(
      { ...BASE, hasBusiness: true },
      { ...OTHER_FORMS, "schedule-1.0.line.3": 300 },
    );
    expect(lines["0.line.4_earned_income"]).toBeUndefined();
  });

  it("adds the taxpayer's business to his earned income on a joint return with no Schedule SE", () => {
    const joint: Form2441FilingInfo = {
      ...BASE,
      filingStatus: "married_filing_jointly",
      dependentCareStudentOrDisabledSpouse: false,
      hasBusiness: true,
      qbiScheduleSEFiled: false,
      dependentCareSpouseHasBusiness: false,
      dependentCareTaxpayerW2Wages: 3000,
      dependentCareSpouseW2Wages: 2000,
      dependentCareTaxpayerDisabilityWages: 0,
      dependentCareSpouseDisabilityWages: 0,
    };
    const federal = { ...OTHER_FORMS, "schedule-1.0.line.3": 300 };
    const lines = evaluate(joint, federal);
    expect([lines["0.line.4_earned_income"], lines["0.line.5_spouse_earned_income"]]).toEqual([
      3300, 2000,
    ]);
    const spouseBusiness = evaluate({ ...joint, dependentCareSpouseHasBusiness: true }, federal);
    expect(spouseBusiness["0.line.4_earned_income"]).toHaveProperty("unsupported");
  });
});

describe("Form 2441 lines 4 and 5 with Schedule SE on a joint return", () => {
  /*
   * irs-2441-inst-2025::sec::lines-4-and-5::b01: each spouse's earned income
   * separately; the taxpayer's is his part of line 1z plus Schedule SE line 3
   * less Schedule 1 line 15.
   */
  it("adds the taxpayer's Schedule SE line 3 less Schedule 1 line 15 to his wages", () => {
    const lines = evaluate(
      {
        ...BASE,
        filingStatus: "married_filing_jointly",
        dependentCareStudentOrDisabledSpouse: false,
        hasBusiness: true,
        qbiScheduleSEFiled: true,
        dependentCareSpouseHasBusiness: false,
        dependentCareTaxpayerW2Wages: 3000,
        dependentCareSpouseW2Wages: 2000,
        dependentCareTaxpayerDisabilityWages: 0,
        dependentCareSpouseDisabilityWages: 0,
      },
      { ...OTHER_FORMS, "schedule-se.0.line.3": 20000, "schedule-1.1.line.15": 1413 },
    );
    expect([lines["0.line.4_earned_income"], lines["0.line.5_spouse_earned_income"]]).toEqual([
      3000 + 20000 - 1413,
      2000,
    ]);
  });
});

describe("Form 2441 lines 4 and 5 with Form 2555", () => {
  /*
   * irs-2441-inst-2025::sec::lines-4-and-5::b01: line 1z "minus any amount ...
   * Excluded as foreign earned income (including any housing exclusion) on Form
   * 2555, line 43", each spouse's own form.
   */
  const filer = (owner: "taxpayer" | "spouse", line43: number) =>
    ({
      key: `foreign_earned_income.${owner}`,
      owner,
      answers: {},
      usBusinessIncome: [],
      days: 365,
      exclusion: { line27: line43, claimsHousing: false, line43, relatedDeductions: 0 },
    }) as unknown as Form2555Filer;
  const with2555 = (filers: Form2555Filer[]) =>
    ({
      mustFile: { "form-2555": { ok: true, value: true } },
      form2555Filers: filers,
    }) as unknown as Partial<Form2441FilingInfo>;
  const joint: Form2441FilingInfo = {
    ...BASE,
    dependentCarePersons: [person(3000), person(3001)],
    filingStatus: "married_filing_jointly",
    dependentCareStudentOrDisabledSpouse: false,
    dependentCareSpouseHasBusiness: false,
    dependentCareTaxpayerW2Wages: 120000,
    dependentCareSpouseW2Wages: 40000,
    dependentCareTaxpayerDisabilityWages: 0,
    dependentCareSpouseDisabilityWages: 0,
  };
  const federal = {
    ...OTHER_FORMS,
    "form-1040.line.1a": 160000,
    "form-1040.line.1z": 160000,
    "form-1040.line.11a": 40000,
  };

  it("the taxpayer's excluded wages leave his earned income at 0, and the credit with it", () => {
    const lines = evaluate({ ...joint, ...with2555([filer("taxpayer", 120000)]) }, federal);
    expect([lines["0.line.4_earned_income"], lines["0.line.5_spouse_earned_income"]]).toEqual([
      0, 40000,
    ]);
    expect(lines["0.line.6_smallest_of_3_4_5"]).toBe(0);
  });

  it("a single filer's line 4 is line 1z less line 43", () => {
    const lines = evaluate({ ...BASE, ...with2555([filer("taxpayer", 3000)]) });
    expect(lines["0.line.4_earned_income"]).toBe(2000);
  });

  it("no Form 2555: the wages count in full", () => {
    const lines = evaluate(joint, federal);
    expect(lines["0.line.4_earned_income"]).toBe(120000);
  });
});

describe("Form 2441 Part II gates", () => {
  it("figures the credit with a provider and a qualifying person", () => {
    const lines = evaluate(BASE);
    expect([lines["0.line.3_qualified_expenses_total"], lines["0.line.4_earned_income"]]).toEqual([
      2000, 5000,
    ]);
  });

  it("names the gap on line 1 and leaves Part II blank with no provider", () => {
    const lines = evaluate({ ...BASE, dependentCareProviders: [] });
    expect(lines["0.line.1_row_1_provider_name"]).toHaveProperty("unsupported");
    expect(lines["0.line.3_qualified_expenses_total"]).toBeUndefined();
    expect(lines["0.line.4_earned_income"]).toBeUndefined();
  });

  it("stops when Part III line 29 is zero", () => {
    const lines = evaluate({
      ...BASE,
      dependentCareBenefits: 5000,
      dependentCareGracePeriodCarryover: 0,
      dependentCareBenefitsForfeited: 0,
      dependentCareExpensesIncurred: 7000,
      dependentCarePlanExclusionLimit: 5000,
    });
    expect(lines["1.line.29_line_27_minus_28"]).toBe(0);
    expect(PART_II_LINES.map((key) => lines[key])).toEqual(PART_II_LINES.map(() => undefined));
  });
});

describe("Form 2441 line 2 qualifying persons", () => {
  const resolve = (age: number, unableToCareForSelf: boolean) => {
    const birthYear = 2025 - age;
    const info = resolve2441Info(
      makeResolverInputs({
        facts: [
          {
            key: "dependent_care.qualifying_person.kid",
            category: "dependents",
            value: {
              firstName: "Kid",
              lastName: "Doe",
              ssn: "400-00-0001",
              dob: `06/15/${birthYear}`,
              unableToCareForSelf,
              expensesPaid: 2000,
            },
          },
        ],
        decisions: [{ decisionKey: "decisions.scope.filing_status", decision: "single" }],
      }),
    );
    return {
      listed: (info.dependentCarePersons ?? []).length,
      mustFile: info.mustFile?.["form-2441"]?.value,
    };
  };

  it("leaves off a person 14 or older who can care for themselves", () => {
    expect(resolve(14, false)).toEqual({ listed: 0, mustFile: false });
  });

  it("keeps a child who turned 13 in the year, for the part under 13", () => {
    expect(resolve(13, false)).toEqual({ listed: 1, mustFile: true });
  });

  it("keeps a disabled person over 12", () => {
    expect(resolve(30, true)).toEqual({ listed: 1, mustFile: true });
  });
});

describe("Form 2441 businesses on a joint return", () => {
  const spouseHasBusiness = (owner: "taxpayer" | "spouse", status: string) =>
    resolve2441Info(
      makeResolverInputs({
        facts: [
          {
            key: "business.shop",
            category: "self_employment",
            value: { owner, activity: "Shop", grossReceipts: 1000 },
          },
        ],
        decisions: [{ decisionKey: "decisions.scope.filing_status", decision: status }],
      }),
    ).dependentCareSpouseHasBusiness;

  it("says whether a business is the spouse's", () => {
    expect(spouseHasBusiness("taxpayer", "married_filing_jointly")).toBe(false);
    expect(spouseHasBusiness("spouse", "married_filing_jointly")).toBe(true);
    expect(spouseHasBusiness("spouse", "single")).toBeUndefined();
  });
});

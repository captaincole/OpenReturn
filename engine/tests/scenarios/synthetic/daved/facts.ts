/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * business and its targeted group employees are what Daved states from the
 * company's books, the payroll records and the state workforce agency's
 * certifications; no official form holds them.
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeWorkOpportunityEmployeeFactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type WorkOpportunityEmployeeFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const DAVED_USER_ID = "daved-synthetic";
export const DAVED_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: DAVED_USER_ID,
  taxYear: DAVED_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const DAVED = {
  firstName: "Daved",
  lastName: "Corrowind",
  ssn: "400-00-5886",
  street: "1180 Alhambra Boulevard",
  city: "Sacramento",
  state: "CA",
  zip: "95816",
};

export const LANDSCAPING_ID = "corrowind-landscaping";
export const LANDSCAPING_KEY = makeBusinessFactKey(LANDSCAPING_ID);

/* His landscape maintenance company (Schedule C), with two crews. */
export const landscaping: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Landscape maintenance",
  code: "561730",
  name: "Corrowind Landscaping",
  address: { street: "2400 Del Paso Road", city: "Sacramento", state: "CA", zip: "95834" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 240000,
  expenses: {
    insurance: 7400,
    rentVehiclesMachinery: 9600,
    repairs: 4800,
    supplies: 16200,
    taxesAndLicenses: 7300,
    // Line 26 before the work opportunity credit: every wage paid to the crews.
    wages: 82000,
  },
  specifiedService: false,
  w2WagesPaid: 82000,
  qualifiedPropertyUbia: 0,
};

const employee = (value: Omit<WorkOpportunityEmployeeFactValue, "activityKey">) => ({
  ...value,
  activityKey: LANDSCAPING_KEY,
});

/* The certified targeted group employees, by slug. */
export const EMPLOYEES: Record<string, WorkOpportunityEmployeeFactValue> = {
  // Line 1b: $7,500 paid, limited to $6,000.
  "ilyena-sarrow": employee({
    name: "Ilyena Sarrow",
    targetedGroup: "veteran_snap",
    hoursWorked: 820,
    firstYearWages: 7500,
  }),
  // Line 1a: fewer than 400 hours, $24,000 limit not reached.
  "tomas-verrin": employee({
    name: "Tomas Verrin",
    targetedGroup: "veteran_disabled_unemployed_6_months",
    hoursWorked: 360,
    firstYearWages: 6400,
  }),
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 6000 }],
  ["2025-06", { date: "2025-06-16", amount: 6000 }],
  ["2025-09", { date: "2025-09-15", amount: 6000 }],
  ["2026-01", { date: "2026-01-15", amount: 6000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: DAVED_USER_ID, taxYear: DAVED_TAX_YEAR, suffix, value });

export const davedFacts: TaxFactRow[] = [
  idFact("name.first", DAVED.firstName),
  idFact("name.last", DAVED.lastName),
  idFact("ssn", DAVED.ssn),
  idFact("dob", "02/03/1981"),
  idFact("address.street", DAVED.street),
  idFact("address.city", DAVED.city),
  idFact("address.state", DAVED.state),
  idFact("address.zip", DAVED.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Landscaping contractor"),
  idFact("phone", "916-555-0177"),
  fact(
    "self_employment",
    LANDSCAPING_KEY,
    landscaping,
    `${VERBAL}: the company's books and payroll.`,
  ),
  ...Object.entries(EMPLOYEES).map(([slug, value]) =>
    fact(
      "self_employment",
      makeWorkOpportunityEmployeeFactKey(slug),
      value,
      `${VERBAL}: payroll records and the California EDD certification.`,
    ),
  ),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    `${VERBAL}: self-employed for California too.`,
  ),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, `${VERBAL}: covered all year.`),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
];

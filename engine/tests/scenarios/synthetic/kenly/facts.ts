/*
 * A made-up single bicycle shop owner in Sacramento, California (README.md):
 * every name and amount is invented. The Form 8941 amounts come from the shop's
 * payroll and its SHOP premium invoices: no information return reports them, so
 * they are stated answers. The average premiums are the Sacramento County row of
 * the instructions' 2025 tables (irs-8941-inst-2025::sec::line-19::b08).
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  SMALL_EMPLOYER_HEALTH_CREDIT_KEY,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type EmployeeHealthCoverage,
  type HealthCreditEmployee,
  type SmallEmployerHealthCreditFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const KENLY_USER_ID = "kenly-integration";
export const KENLY_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: KENLY_USER_ID,
  taxYear: KENLY_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const KENLY = {
  firstName: "Kenly",
  lastName: "Marwood",
  ssn: "400-00-1894",
  street: "2240 Riverbend Avenue",
  city: "Sacramento",
  state: "CA",
  zip: "95818",
};

export const SHOP_ID = "marwood-cycle-works";
export const SHOP_KEY = makeBusinessFactKey(SHOP_ID);

/* The shop: bicycle repair and tune-ups, no goods sold. Line 14 holds the employer health premiums before the credit. */
export const shop: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Bicycle repair",
  code: "811490",
  name: "Marwood Cycle Works",
  address: { street: "1517 J Street", city: "Sacramento", state: "CA", zip: "95814" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 480_000,
  expenses: {
    employeeBenefitPrograms: 31_837.5,
    insurance: 6_000,
    rentOtherProperty: 36_000,
    supplies: 70_000,
    taxesAndLicenses: 12_000,
    utilities: 4_800,
    wages: 138_000,
  },
  specifiedService: false,
  w2WagesPaid: 138_000,
  qualifiedPropertyUbia: 0,
};

/* The SHOP plans: 75% of each plan's premium, for each tier; both plans cost less than the county average. */
const employeeOnly = (paid: number): EmployeeHealthCoverage[] => [
  { tier: "employee_only", employerPremiumsPaid: paid, annualPremium: 7_800 },
];

/* Worksheet 1: six employees; the owner is not one (column-a-individuals-considered::b02). */
export const employees: HealthCreditEmployee[] = [
  { name: "Talia Brennock", hoursOfService: 2_080, wages: 34_000, coverage: employeeOnly(5_850) },
  {
    name: "Wes Odum",
    hoursOfService: 2_080,
    wages: 31_000,
    coverage: [{ tier: "family", employerPremiumsPaid: 15_750, annualPremium: 21_000 }],
  },
  { name: "Nora Pell", hoursOfService: 2_080, wages: 28_000, coverage: employeeOnly(5_850) },
  // Enrolled for the second half of the year.
  { name: "Arlo Vance", hoursOfService: 1_560, wages: 22_000, coverage: employeeOnly(2_925) },
  { name: "Sima Rourke", hoursOfService: 1_040, wages: 14_000 },
  // A spring rush mechanic for 100 days, enrolled for three months: seasonal, so no hours and no wages, but the premiums count.
  {
    name: "Bram Toller",
    hoursOfService: 800,
    wages: 9_000,
    seasonal: true,
    coverage: employeeOnly(1_462.5),
  },
];

export const healthCredit: SmallEmployerHealthCreditFactValue = {
  activityKey: SHOP_KEY,
  shopCoverage: true,
  creditClaimedBefore2024: false,
  employees,
  // Sacramento County, California (irs-8941-inst-2025::sec::line-19::b08).
  averagePremium: { employeeOnly: 8_406, family: 27_555 },
  stateSubsidiesAndCredits: 0,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 9_000 }],
  ["2025-06", { date: "2025-06-16", amount: 9_000 }],
  ["2025-09", { date: "2025-09-15", amount: 9_000 }],
  ["2026-01", { date: "2026-01-15", amount: 9_000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: KENLY_USER_ID, taxYear: KENLY_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";

export const kenlyFacts: TaxFactRow[] = [
  idFact("name.first", KENLY.firstName),
  idFact("name.last", KENLY.lastName),
  idFact("ssn", KENLY.ssn),
  idFact("dob", "09/30/1984"),
  idFact("address.street", KENLY.street),
  idFact("address.city", KENLY.city),
  idFact("address.state", KENLY.state),
  idFact("address.zip", KENLY.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Bicycle shop owner"),
  idFact("phone", "916-555-0118"),
  fact("self_employment", SHOP_KEY, shop, `${VERBAL}: the shop's 2025 books.`),
  fact(
    "self_employment",
    SMALL_EMPLOYER_HEALTH_CREDIT_KEY,
    healthCredit,
    `${VERBAL}: the 2025 payroll register, the SHOP premium invoices and the Sacramento County row of the Form 8941 average premium table.`,
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

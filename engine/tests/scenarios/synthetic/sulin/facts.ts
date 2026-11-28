/*
 * A made-up single sugar beet farmer in Wyoming (README.md): every name and
 * amount is invented. The farm amounts are what she states from the farm's
 * books. The Form 8941 amounts come from the farm's payroll and its SHOP
 * premium invoices: no information return reports them, so they are stated
 * answers. The average premiums are the Goshen County, Wyoming row of the
 * instructions' 2025 tables (irs-8941-inst-2025::sec::line-19::b76).
 */

import {
  SMALL_EMPLOYER_HEALTH_CREDIT_KEY,
  makeEstimatedTaxPaymentFactKey,
  makeFarmFactKey,
  type DatedAmountFactValue,
  type EmployeeHealthCoverage,
  type FarmFactValue,
  type HealthCreditEmployee,
  type SmallEmployerHealthCreditFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const SULIN_USER_ID = "sulin-integration";
export const SULIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: SULIN_USER_ID,
  taxYear: SULIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const SULIN = {
  firstName: "Sulin",
  lastName: "Korrow",
  ssn: "400-00-8945",
  street: "4410 County Road 27",
  city: "Torrington",
  state: "WY",
  zip: "82240",
};

export const FARM_ID = "korrow-beet-farm";
export const FARM_KEY = makeFarmFactKey(FARM_ID);

/*
 * Her sugar beet and corn farm (cash method, material participation). Line 15
 * holds the employee health premiums the farm paid ($24,800), before the
 * Form 8941 credit.
 */
export const farm: FarmFactValue = {
  owner: "taxpayer",
  activity: "Sugar beets and corn",
  code: "111991",
  ein: "00-0008945",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: true,
  filedRequired1099: true,
  productSales: 480_000,
  expenses: {
    chemicals: 18_000,
    depreciation: 22_000,
    employeeBenefitPrograms: 24_800,
    fertilizersAndLime: 46_000,
    gasolineFuelAndOil: 21_000,
    insurance: 9_000,
    laborHired: 98_000,
    repairs: 14_000,
    seedsAndPlants: 38_000,
    taxes: 7_500,
    utilities: 4_200,
  },
  newDepreciableProperty: false,
  w2WagesPaid: 98_000,
  qualifiedPropertyUbia: 640_000,
};

/* The SHOP plans: the farm pays 50% of each plan's premium (a qualifying arrangement). */
const employeeOnly: EmployeeHealthCoverage[] = [
  { tier: "employee_only", employerPremiumsPaid: 5_400, annualPremium: 10_800 },
];
const family: EmployeeHealthCoverage[] = [
  { tier: "family", employerPremiumsPaid: 14_000, annualPremium: 28_000 },
];

/* Worksheet 1: four farm hands; Sulin is the owner, not an employee (column-a-individuals-considered::b02). */
export const employees: HealthCreditEmployee[] = [
  { name: "Corin Bratt", hoursOfService: 2_080, wages: 32_000, coverage: family },
  { name: "Lida Senn", hoursOfService: 2_080, wages: 30_000, coverage: employeeOnly },
  { name: "Hugo Dahlberg", hoursOfService: 2_080, wages: 26_000, coverage: employeeOnly },
  { name: "Pell Varick", hoursOfService: 1_040, wages: 10_000 },
];

export const healthCredit: SmallEmployerHealthCreditFactValue = {
  activityKey: FARM_KEY,
  shopCoverage: true,
  marketplaceIdentifier: "WY-SHOP-56015-0417",
  // Line B: the farm reports its employment taxes under its EIN, not Sulin's SSN.
  employmentTaxEin: "00-0008945",
  creditClaimedBefore2024: false,
  employees,
  // Goshen County, Wyoming (irs-8941-inst-2025::sec::line-19::b76).
  averagePremium: { employeeOnly: 9_933, family: 26_086 },
  stateSubsidiesAndCredits: 0,
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 9_000 }],
  ["2025-06", { date: "2025-06-16", amount: 9_000 }],
  ["2025-09", { date: "2025-09-15", amount: 9_000 }],
  ["2026-01", { date: "2026-01-15", amount: 9_000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: SULIN_USER_ID, taxYear: SULIN_TAX_YEAR, suffix, value });

export const sulinFacts: TaxFactRow[] = [
  idFact("name.first", SULIN.firstName),
  idFact("name.last", SULIN.lastName),
  idFact("ssn", SULIN.ssn),
  idFact("dob", "07/22/1974"),
  idFact("address.street", SULIN.street),
  idFact("address.city", SULIN.city),
  idFact("address.state", SULIN.state),
  idFact("address.zip", SULIN.zip),
  idFact("occupation", "Farmer"),
  idFact("phone", "307-555-0188"),
  fact("self_employment", FARM_KEY, farm, `${VERBAL}: the farm's 2025 books.`),
  fact(
    "self_employment",
    SMALL_EMPLOYER_HEALTH_CREDIT_KEY,
    healthCredit,
    "Stated by Sulin: the 2025 payroll register, the SHOP premium invoices and the Goshen County row of the Form 8941 average premium table.",
  ),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];

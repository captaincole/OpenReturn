/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * farm and its retirement plan are what Hari states from the farm's books, the
 * payroll and the plan's records; no official form holds them.
 */

import {
  makeEstimatedTaxPaymentFactKey,
  makeFarmFactKey,
  makeSmallEmployerPlanFactKey,
  type DatedAmountFactValue,
  type FarmFactValue,
  type SmallEmployerPlanFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const HARI_USER_ID = "hari-synthetic";
export const HARI_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: HARI_USER_ID,
  taxYear: HARI_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const HARI = {
  firstName: "Hari",
  lastName: "Tallowfield",
  ssn: "400-00-8882",
  street: "1630 County Road 210",
  city: "Lubbock",
  state: "TX",
  zip: "79423",
};

export const COTTON_ID = "tallowfield-cotton";
export const COTTON_KEY = makeFarmFactKey(COTTON_ID);
export const PLAN_KEY = makeSmallEmployerPlanFactKey("tallowfield-farms-simple-401k");

/* His cotton farm (Schedule F, cash method), with a year-round crew. */
export const cotton: FarmFactValue = {
  owner: "taxpayer",
  activity: "Cotton farming",
  code: "111920",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: false,
  productSales: 610_000,
  expenses: {
    chemicals: 48_000,
    fertilizersAndLime: 61_000,
    gasolineFuelAndOil: 39_500,
    insurance: 14_200,
    laborHired: 236_000,
    // Line 23 before the Form 8881 credits: the contributions and the plan's setup fees.
    pensionAndProfitSharing: 6_150,
    repairs: 22_800,
    seedsAndPlants: 33_400,
    taxes: 18_600,
    utilities: 7_300,
  },
  newDepreciableProperty: false,
  w2WagesPaid: 236_000,
  qualifiedPropertyUbia: 0,
};

/* The farm's 401(k) plan, first effective in 2025: the first year of both Part I credits. */
export const plan: SmallEmployerPlanFactValue = {
  name: "Tallowfield Farms 401(k) Plan",
  activityKey: COTTON_KEY,
  precedingYearEmployees: 12,
  startupCosts: {
    creditYear: 1,
    employeesBeforeFirstCreditYear: 12,
    qualifiedCosts: 1_250,
    eligibleNonHighlyCompensated: 1,
    // The setup fees are in line 23 with the contributions.
    deductedOn: "pensionAndProfitSharing",
  },
  contributions: {
    planYear: 1,
    employees: [
      { contributions: 900, wages: 41_000 },
      { contributions: 1_400, wages: 47_500 },
      { contributions: 1_000, wages: 39_000 },
      { contributions: 1_600, wages: 52_000 },
    ],
  },
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 7_000 }],
  ["2025-06", { date: "2025-06-16", amount: 7_000 }],
  ["2025-09", { date: "2025-09-15", amount: 7_000 }],
  ["2026-01", { date: "2026-01-15", amount: 7_000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: HARI_USER_ID, taxYear: HARI_TAX_YEAR, suffix, value });

export const hariFacts: TaxFactRow[] = [
  idFact("name.first", HARI.firstName),
  idFact("name.last", HARI.lastName),
  idFact("ssn", HARI.ssn),
  idFact("dob", "04/22/1979"),
  idFact("address.street", HARI.street),
  idFact("address.city", HARI.city),
  idFact("address.state", HARI.state),
  idFact("address.zip", HARI.zip),
  idFact("occupation", "Cotton farmer"),
  idFact("phone", "806-555-0193"),
  fact("self_employment", COTTON_KEY, cotton, `${VERBAL}: the farm's books and payroll.`),
  fact("self_employment", PLAN_KEY, plan, `${VERBAL}: the plan's records and the payroll.`),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];

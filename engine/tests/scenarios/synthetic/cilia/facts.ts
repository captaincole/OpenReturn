/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * farm and the hired hands' differential wage payments are what Cilia states
 * from the farm's books and payroll records; no official form holds them per
 * employee.
 */

import {
  DIFFERENTIAL_WAGE_CREDIT_KEYS,
  makeDifferentialWageEmployeeFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeFarmFactKey,
  type DatedAmountFactValue,
  type DifferentialWageEmployeeFactValue,
  type FarmFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const CILIA_USER_ID = "cilia-synthetic";
export const CILIA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: CILIA_USER_ID,
  taxYear: CILIA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const CILIA = {
  firstName: "Cilia",
  lastName: "Fenmarsh",
  ssn: "400-00-8933",
  street: "1207 Fourth Avenue",
  city: "Brookings",
  state: "SD",
  zip: "57006",
};

export const WHEAT_ID = "fenmarsh-grain";
export const WHEAT_KEY = makeFarmFactKey(WHEAT_ID);

/* Her wheat and sorghum farm (Schedule F, cash method), with two hired hands. */
export const grain: FarmFactValue = {
  owner: "taxpayer",
  activity: "Wheat and sorghum farm",
  code: "111140",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: false,
  productSales: 236000,
  expenses: {
    chemicals: 14800,
    fertilizersAndLime: 31500,
    gasolineFuelAndOil: 18200,
    insurance: 7600,
    // Line 22 before the credit: every wage paid to the hands, the differential wage payments among them.
    laborHired: 64000,
    repairs: 9300,
    seedsAndPlants: 12700,
    taxes: 6100,
  },
  newDepreciableProperty: false,
  w2WagesPaid: 64000,
  qualifiedPropertyUbia: 0,
};

const employee = (value: Omit<DifferentialWageEmployeeFactValue, "activityKey">) => ({
  ...value,
  activityKey: WHEAT_KEY,
});

/* The hired hands who served on active duty for more than 30 days in 2025, by slug. */
export const EMPLOYEES: Record<string, DifferentialWageEmployeeFactValue> = {
  // An Army National Guard sergeant on federal orders from March to September.
  "brenn-hollis": employee({
    name: "Brenn Hollis",
    differentialWagePayments: 14300.8,
    employedPrior91Days: true,
  }),
  // A Marine Corps reservist on a 45-day call-up in the fall.
  "orla-dunmore": employee({
    name: "Orla Dunmore",
    differentialWagePayments: 3950,
    employedPrior91Days: true,
  }),
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 2500 }],
  ["2025-06", { date: "2025-06-16", amount: 2500 }],
  ["2025-09", { date: "2025-09-15", amount: 2500 }],
  ["2026-01", { date: "2026-01-15", amount: 2500 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: CILIA_USER_ID, taxYear: CILIA_TAX_YEAR, suffix, value });

export const ciliaFacts: TaxFactRow[] = [
  idFact("name.first", CILIA.firstName),
  idFact("name.last", CILIA.lastName),
  idFact("ssn", CILIA.ssn),
  idFact("dob", "10/09/1983"),
  idFact("address.street", CILIA.street),
  idFact("address.city", CILIA.city),
  idFact("address.state", CILIA.state),
  idFact("address.zip", CILIA.zip),
  idFact("occupation", "Grain farmer"),
  idFact("phone", "605-555-0164"),
  fact("self_employment", WHEAT_KEY, grain, `${VERBAL}: the farm's books and payroll.`),
  ...Object.entries(EMPLOYEES).map(([slug, value]) =>
    fact(
      "self_employment",
      makeDifferentialWageEmployeeFactKey(slug),
      value,
      `${VERBAL}: payroll records of differential wage payments and the employees' military orders.`,
    ),
  ),
  fact(
    "self_employment",
    DIFFERENTIAL_WAGE_CREDIT_KEYS.underReemploymentOrder,
    false,
    `${VERBAL}: no court order under the reemployment rights law in 2023 to 2025.`,
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

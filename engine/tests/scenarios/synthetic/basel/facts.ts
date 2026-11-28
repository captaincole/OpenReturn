/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * freight business and the employees' differential wage payments are what
 * Basel states from the books and the payroll records; no official form holds
 * them per employee. The Schedule K-1 (Form 1065) is a made PDF in docs/
 * (generate-docs.ts).
 */

import {
  DIFFERENTIAL_WAGE_CREDIT_KEYS,
  makeBusinessFactKey,
  makeDifferentialWageEmployeeFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type DifferentialWageEmployeeFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BASEL_USER_ID = "basel-synthetic";
export const BASEL_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BASEL_USER_ID,
  taxYear: BASEL_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BASEL = {
  firstName: "Basel",
  lastName: "Thornwick",
  ssn: "400-00-8932",
  street: "418 Brazos Street",
  city: "Waco",
  state: "TX",
  zip: "76701",
};

export const FREIGHT_ID = "thornwick-freight";
export const FREIGHT_KEY = makeBusinessFactKey(FREIGHT_ID);
export const DEPOT_ID = "brazos-valley-depot";
export const DEPOT_EIN = "00-0008932";

/* His regional freight company (Schedule C), with drivers and dispatchers. */
export const freight: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Regional freight trucking",
  code: "484120",
  name: "Thornwick Freight",
  address: { street: "2900 Franklin Avenue", city: "Waco", state: "TX", zip: "76710" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 470000,
  expenses: {
    rentVehiclesMachinery: 48000,
    insurance: 26500,
    repairs: 31200,
    supplies: 9800,
    taxesAndLicenses: 18400,
    // Line 26 before the credit: every wage paid, the differential wage payments among them.
    wages: 214000,
  },
  specifiedService: false,
  w2WagesPaid: 214000,
  qualifiedPropertyUbia: 0,
};

/* A truck stop partnership he helps run. Its only K-1 item is box 15 code AV, his share of its own employees' credit. */
export const depotK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Brazos Valley Depot LLC",
  entityEin: DEPOT_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 20,
  lossPercent: 20,
  capitalPercent: 20,
  boxes: [{ box: "15", code: "AV", amount: 1840 }],
};

const depotHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 40000,
};

const employee = (value: Omit<DifferentialWageEmployeeFactValue, "activityKey">) => ({
  ...value,
  activityKey: FREIGHT_KEY,
});

/* The employees who served on active duty for more than 30 days in 2025, by slug. */
export const EMPLOYEES: Record<string, DifferentialWageEmployeeFactValue> = {
  // A driver in the Army Reserve, deployed for most of the year: $26,400 paid, limited to $20,000.
  "joran-velde": employee({
    name: "Joran Velde",
    differentialWagePayments: 26400,
    employedPrior91Days: true,
  }),
  // A dispatcher in the Texas Army National Guard, on federal active duty for four months.
  "marith-sone": employee({
    name: "Marith Sone",
    differentialWagePayments: 8450.5,
    employedPrior91Days: true,
  }),
  // A driver hired 60 days before his orders: not a qualified employee, so no credit for his payments.
  "tavin-orrel": employee({
    name: "Tavin Orrel",
    differentialWagePayments: 5200,
    employedPrior91Days: false,
  }),
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 9000 }],
  ["2025-06", { date: "2025-06-16", amount: 9000 }],
  ["2025-09", { date: "2025-09-15", amount: 9000 }],
  ["2026-01", { date: "2026-01-15", amount: 9000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BASEL_USER_ID, taxYear: BASEL_TAX_YEAR, suffix, value });

export const baselFacts: TaxFactRow[] = [
  idFact("name.first", BASEL.firstName),
  idFact("name.last", BASEL.lastName),
  idFact("ssn", BASEL.ssn),
  idFact("dob", "05/22/1974"),
  idFact("address.street", BASEL.street),
  idFact("address.city", BASEL.city),
  idFact("address.state", BASEL.state),
  idFact("address.zip", BASEL.zip),
  idFact("occupation", "Freight company owner"),
  idFact("phone", "254-555-0193"),
  fact("self_employment", FREIGHT_KEY, freight, `${VERBAL}: the company's books and payroll.`),
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
  fact(
    "k1",
    makePartnershipK1FactKey(DEPOT_ID),
    depotK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-brazos-valley-depot.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(DEPOT_ID), depotHolding, VERBAL),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];

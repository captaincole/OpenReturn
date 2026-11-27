/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * farm and the targeted group employees are what Byar states from the farm's
 * books, his payroll records and the state workforce agency's certifications;
 * no official form holds them. The Schedule K-1 (Form 1065) is a made PDF in
 * docs/ (generate-docs.ts).
 */

import {
  makeEstimatedTaxPaymentFactKey,
  makeFarmFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeWorkOpportunityEmployeeFactKey,
  type DatedAmountFactValue,
  type FarmFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type WorkOpportunityEmployeeFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BYAR_USER_ID = "byar-synthetic";
export const BYAR_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BYAR_USER_ID,
  taxYear: BYAR_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BYAR = {
  firstName: "Byar",
  lastName: "Hollowmede",
  ssn: "400-00-5884",
  street: "2210 Mesa Verde Drive",
  city: "Amarillo",
  state: "TX",
  zip: "79109",
};

export const PECANS_ID = "hollowmede-pecans";
export const PECANS_KEY = makeFarmFactKey(PECANS_ID);
export const SUPPLY_ID = "panhandle-orchard-supply";
export const SUPPLY_EIN = "00-0005885";

/* His pecan orchard and packing shed (Schedule F, cash method), with hired crews. */
export const pecans: FarmFactValue = {
  owner: "taxpayer",
  activity: "Pecan orchard",
  code: "111335",
  accountingMethod: "cash",
  materiallyParticipated: true,
  paymentsRequire1099: false,
  productSales: 420000,
  expenses: {
    chemicals: 11200,
    fertilizersAndLime: 22000,
    gasolineFuelAndOil: 14500,
    insurance: 9800,
    // Line 22 before the work opportunity credit: every wage paid to the crews.
    laborHired: 128000,
    repairs: 12400,
    supplies: 8600,
    taxes: 10400,
    utilities: 4300,
  },
  newDepreciableProperty: false,
  w2WagesPaid: 128000,
  qualifiedPropertyUbia: 0,
};

/*
 * The orchard supply partnership he invested in and helps run. Its only K-1
 * item is box 15 code J, his share of the work opportunity credit of its own
 * crews.
 */
export const supplyK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Panhandle Orchard Supply LLC",
  entityEin: SUPPLY_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 15,
  lossPercent: 15,
  capitalPercent: 15,
  boxes: [{ box: "15", code: "J", amount: 1200 }],
};

const supplyHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 25000,
};

const employee = (value: Omit<WorkOpportunityEmployeeFactValue, "activityKey">) => ({
  ...value,
  activityKey: PECANS_KEY,
});

/* The certified targeted group employees of the orchard, by slug. */
export const EMPLOYEES: Record<string, WorkOpportunityEmployeeFactValue> = {
  // Line 1b: $9,200 paid, limited to $6,000.
  "tamsin-ardell": employee({
    name: "Tamsin Ardell",
    targetedGroup: "tanf",
    hoursWorked: 620,
    firstYearWages: 9200,
  }),
  // Line 1b: $18,500 paid, limited to $14,000.
  "rourke-penhale": employee({
    name: "Rourke Penhale",
    targetedGroup: "veteran_unemployed_6_months",
    hoursWorked: 1540,
    firstYearWages: 18500,
  }),
  // Line 1a: under the $3,000 limit, fewer than 400 hours.
  "lio-marchetti": employee({
    name: "Lio Marchetti",
    targetedGroup: "summer_youth",
    hoursWorked: 300,
    firstYearWages: 2850,
  }),
  // Line 1a: fewer than 400 hours.
  "dessa-quill": employee({
    name: "Dessa Quill",
    targetedGroup: "snap",
    hoursWorked: 250,
    firstYearWages: 4100,
  }),
  // Line 1b: $2,000 of the $10,000 left after 2024; line 1c: $12,400 limited to $10,000.
  "hanne-oakridge": employee({
    name: "Hanne Oakridge",
    targetedGroup: "long_term_family_assistance",
    hoursWorked: 1820,
    firstYearWages: 3000,
    firstYearWagesEarlierYears: 8000,
    secondYearWages: 12400,
  }),
  // Fewer than 120 hours: no qualified wages.
  "corvin-ashby": employee({
    name: "Corvin Ashby",
    targetedGroup: "ex_felon",
    hoursWorked: 90,
    firstYearWages: 1500,
  }),
  // Line 1b.
  "mirela-tovar": employee({
    name: "Mirela Tovar",
    targetedGroup: "vocational_rehabilitation",
    hoursWorked: 700,
    firstYearWages: 5200,
  }),
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 9500 }],
  ["2025-06", { date: "2025-06-16", amount: 9500 }],
  ["2025-09", { date: "2025-09-15", amount: 9500 }],
  ["2026-01", { date: "2026-01-15", amount: 9500 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BYAR_USER_ID, taxYear: BYAR_TAX_YEAR, suffix, value });

export const byarFacts: TaxFactRow[] = [
  idFact("name.first", BYAR.firstName),
  idFact("name.last", BYAR.lastName),
  idFact("ssn", BYAR.ssn),
  idFact("dob", "07/19/1976"),
  idFact("address.street", BYAR.street),
  idFact("address.city", BYAR.city),
  idFact("address.state", BYAR.state),
  idFact("address.zip", BYAR.zip),
  idFact("occupation", "Pecan farmer"),
  idFact("phone", "806-555-0158"),
  fact("self_employment", PECANS_KEY, pecans, `${VERBAL}: the orchard's books and payroll.`),
  ...Object.entries(EMPLOYEES).map(([slug, value]) =>
    fact(
      "self_employment",
      makeWorkOpportunityEmployeeFactKey(slug),
      value,
      `${VERBAL}: payroll records and the Texas Workforce Commission certification.`,
    ),
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(SUPPLY_ID),
    supplyK1,
    "Schedule K-1 (Form 1065) (docs/01-schedule-k1-panhandle-orchard-supply.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(SUPPLY_ID), supplyHolding, VERBAL),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: Form 1040-ES payment.`,
    ),
  ),
];

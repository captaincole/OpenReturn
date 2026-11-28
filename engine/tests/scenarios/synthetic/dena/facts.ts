/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * business and its research are what Dena states from the company's books
 * and its research records; no official form holds them.
 */

import {
  RESEARCH_CREDIT_KEY,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  type BusinessFactValue,
  type DatedAmountFactValue,
  type ResearchCreditFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const DENA_USER_ID = "dena-synthetic";
export const DENA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";
const VERBAL = "Verbal, 2026-11-27";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: DENA_USER_ID,
  taxYear: DENA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const DENA = {
  firstName: "Dena",
  lastName: "Tarrowfield",
  ssn: "400-00-6766",
  street: "715 Riverside Drive",
  city: "Reno",
  state: "NV",
  zip: "89503",
};

export const BATTERY_ID = "tarrowfield-battery-works";
export const BATTERY_KEY = makeBusinessFactKey(BATTERY_ID);

/* Her battery company (Schedule C), first open in 2022. */
export const battery: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Battery cell design and assembly",
  code: "335910",
  name: "Tarrowfield Battery Works",
  ein: "00-0006767",
  address: { street: "1250 Kleppe Lane", city: "Sparks", state: "NV", zip: "89431" },
  accountingMethod: "accrual",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: true,
  sellsGoods: false,
  grossReceipts: 3900000,
  expenses: {
    advertising: 30000,
    contractLabor: 180000,
    insurance: 60000,
    legalAndProfessional: 30000,
    office: 40000,
    rentVehiclesMachinery: 60000,
    rentOtherProperty: 240000,
    supplies: 300000,
    taxesAndLicenses: 190000,
    utilities: 50000,
    wages: 2340000,
  },
  specifiedService: false,
  w2WagesPaid: 2340000,
  qualifiedPropertyUbia: 0,
};

/*
 * The research of 2025 (Form 6765): the alternative simplified credit, with
 * the reduced credit election (Item A), so the company's deduction stays as
 * stated. A qualified small business, she elects to take $20,000 of the
 * credit against the company's payroll tax, her third election.
 */
export const research: ResearchCreditFactValue = {
  businessKey: BATTERY_KEY,
  reducedCreditElection: true,
  controlledGroup: false,
  method: "alternative_simplified",
  energyConsortiaPayments: 4000,
  expenses: {
    wages: 640000,
    supplies: 70000,
    computerRental: 12000,
    contractResearch: { other: 100000 },
  },
  businessComponentCount: 4,
  grossReceiptsPriorYears: [1200000, 2100000, 3000000],
  priorThreeYearsQres: [250000, 420000, 560000],
  acquiredOrDisposed: false,
  newExpenseCategories: false,
  attributableTaxableIncome: 275000,
  payrollTaxElection: {
    amount: 20000,
    differentEin: false,
    grossReceipts: 3900000,
    firstYearWithGrossReceipts: 2022,
    priorElections: 2,
  },
};

const PAYMENTS: Array<[string, DatedAmountFactValue]> = [
  ["2025-04", { date: "2025-04-15", amount: 22000 }],
  ["2025-06", { date: "2025-06-16", amount: 22000 }],
  ["2025-09", { date: "2025-09-15", amount: 22000 }],
  ["2026-01", { date: "2026-01-15", amount: 22000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: DENA_USER_ID, taxYear: DENA_TAX_YEAR, suffix, value });

export const denaFacts: TaxFactRow[] = [
  idFact("name.first", DENA.firstName),
  idFact("name.last", DENA.lastName),
  idFact("ssn", DENA.ssn),
  idFact("dob", "03/27/1984"),
  idFact("address.street", DENA.street),
  idFact("address.city", DENA.city),
  idFact("address.state", DENA.state),
  idFact("address.zip", DENA.zip),
  idFact("occupation", "Battery engineer"),
  idFact("phone", "775-555-0182"),
  fact("self_employment", BATTERY_KEY, battery, `${VERBAL}: the company's books and payroll.`),
  fact(
    "self_employment",
    RESEARCH_CREDIT_KEY,
    research,
    `${VERBAL}: the company's research records and gross receipts by year.`,
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

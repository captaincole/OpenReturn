/*
 * A made-up taxpayer (README.md): every name, number and address is invented.
 * Tarna Wexley repairs marine engines, alone, from a shop at Mare Island (the
 * former Mare Island Naval Base LAMBRA) and a yard in Vallejo outside it. Her
 * business lost money in 2011 and 2012 and she elected the LAMBRA NOL for
 * those years; part of the carryover is left. No input documents: the facts
 * are her books, her fixed asset ledger, her 2024 FTB 3807 and her answers.
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  CA_LAMBRA_CATEGORY,
  CA_LAMBRA_KEYS,
  CA_PAYMENT_KEYS,
  ESTIMATED_TAX_KEYS,
  PRIOR_YEAR_KEYS,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  type BusinessFactValue,
  type CaLambraBusinessFactValue,
  type CaLambraIncomeRow,
  type CaLambraNolCarryover,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TARNA_USER_ID = "tarna-synthetic";
export const TARNA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Tarna, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TARNA_USER_ID,
  taxYear: TARNA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const HOME = { street: "618 Sereno Ridge Drive", city: "Vallejo", state: "CA", zip: "94589" };

/* Her marine engine repair business (Schedule C): $90,000 of net profit, no employees. */
const repairs: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Marine engine repair",
  code: "811310",
  name: "Wexley Marine Engines",
  address: {
    street: "1100 Railroad Avenue Building 386",
    city: "Vallejo",
    state: "CA",
    zip: "94592",
  },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 160000,
  expenses: {
    rentOtherProperty: 30000,
    supplies: 28000,
    utilities: 6000,
    insurance: 4000,
    taxesAndLicenses: 2000,
  },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/*
 * Items B to H and Worksheet I, Section A: three fifths of the property is at
 * Mare Island. She has no employees, so the payroll factor is left out and
 * the property factor alone is the average ("dividing line 3 by one").
 */
const lambraBusiness: CaLambraBusinessFactValue = {
  businessName: "Wexley Marine Engines",
  businessAddress: "1100 Railroad Avenue Building 386, Vallejo, CA 94592",
  lambraName: "Mare Island",
  operatesBusiness: true,
  principalBusinessActivityCode: "811310",
  employees: 0,
  grossReceipts: 160000,
  totalAssets: 260000,
  property: { california: 250000, lambra: 150000 },
  payroll: { california: 0, lambra: 0 },
};

/* Worksheet I, Section B line 6: all of the profit is California income. */
const lambraIncome: CaLambraIncomeRow[] = [
  { line: "schedule_c", description: "Wexley Marine Engines", amount: 90000 },
];

/* Worksheet II, lines 8k and 8l: last year's column (e). */
const nols: CaLambraNolCarryover[] = [
  { yearOfLoss: 2012, carryover: 50000 },
  { yearOfLoss: 2011, carryover: 20000 },
];

const PAYMENTS: Array<[string, { date: string; amount: number }]> = [
  ["2025-q1", { date: "2025-04-15", amount: 4000 }],
  ["2025-q2", { date: "2025-06-16", amount: 4000 }],
  ["2025-q3", { date: "2025-09-15", amount: 4000 }],
  ["2025-q4", { date: "2026-01-15", amount: 4000 }],
];

const LAST_YEAR = "Her filed 2024 FTB 3807";

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TARNA_USER_ID, taxYear: TARNA_TAX_YEAR, suffix, value });

export const tarnaFacts: TaxFactRow[] = [
  idFact("name.first", "Tarna"),
  idFact("name.last", "Wexley"),
  idFact("ssn", "400-00-3870"),
  idFact("dob", "02/14/1968"),
  idFact("address.street", HOME.street),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Solano"),
  idFact("occupation", "Marine engine mechanic"),
  idFact("phone", "707-555-0142"),
  fact(
    "self_employment",
    makeBusinessFactKey("wexley-marine"),
    repairs,
    `${VERBAL}: her books for Wexley Marine Engines.`,
  ),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    `${VERBAL}: she owns the business; no one classifies her as an employee.`,
  ),
  fact(
    CA_LAMBRA_CATEGORY,
    CA_LAMBRA_KEYS.business,
    lambraBusiness,
    `${VERBAL}: her fixed asset ledger by site (Worksheet I, Section A).`,
  ),
  fact(
    CA_LAMBRA_CATEGORY,
    CA_LAMBRA_KEYS.businessIncome,
    lambraIncome,
    `${VERBAL}: her books (Worksheet I, Section B).`,
  ),
  fact(
    CA_LAMBRA_CATEGORY,
    CA_LAMBRA_KEYS.hiringCreditCarryover,
    0,
    `${LAST_YEAR}: no Schedule Z; she never had LAMBRA credits.`,
  ),
  fact(
    CA_LAMBRA_CATEGORY,
    CA_LAMBRA_KEYS.salesUseTaxCreditCarryover,
    0,
    `${LAST_YEAR}: no Schedule Z; she never had LAMBRA credits.`,
  ),
  fact(
    CA_LAMBRA_CATEGORY,
    CA_LAMBRA_KEYS.nolCarryovers,
    nols,
    `${LAST_YEAR}, Worksheet II, column (e).`,
  ),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: IRS Direct Pay confirmation.`,
    ),
  ),
  fact(
    "estimated_payments",
    ESTIMATED_TAX_KEYS.priorYearOverpaymentApplied,
    0,
    `${VERBAL}: no 2024 overpayment applied.`,
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalTax, 14000, `${VERBAL}: 2024 return.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalAgi, 82000, `${VERBAL}: 2024 Form 1040.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.filedJointReturn, false, `${VERBAL}: single in 2024.`),
  fact(
    "estimated_payments",
    CA_PAYMENT_KEYS.estimatedTax,
    600,
    `${VERBAL}: FTB Web Pay confirmations.`,
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, `${VERBAL}: covered all year.`),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
];

/*
 * A made-up taxpayer (README.md): every name, number and address is invented.
 * Shemerin Calloway runs a machine shop with one site at Tustin Legacy (the
 * former Tustin Marine Corps Air Station LAMBRA) and one in Irvine. Her 2024
 * FTB 3807 carried a LAMBRA hiring credit and a sales or use tax credit to
 * 2025. No input documents: the facts are her shop's books, her property and
 * payroll records for Worksheet I, her 2024 return and her answers.
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
  makeOtherStateTaxFactKey,
  type BusinessFactValue,
  type CaLambraBusinessFactValue,
  type CaLambraIncomeRow,
  type OtherStateTaxFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const SHEMERIN_USER_ID = "shemerin-synthetic";
export const SHEMERIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Shemerin, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: SHEMERIN_USER_ID,
  taxYear: SHEMERIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const HOME = { street: "1408 Valencia Grove Court", city: "Tustin", state: "CA", zip: "92782" };

/* Her machine shop (Schedule C): $180,000 of net profit, $20,000 of it from jobs in Utah. */
const shop: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Precision machining",
  code: "332710",
  name: "Calloway Precision Machining",
  address: { street: "2950 Warner Avenue Bay 4", city: "Tustin", state: "CA", zip: "92780" },
  accountingMethod: "accrual",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 620000,
  expenses: {
    wages: 200000,
    rentOtherProperty: 60000,
    supplies: 110000,
    utilities: 24000,
    insurance: 18000,
    taxesAndLicenses: 12000,
    repairs: 16000,
  },
  specifiedService: false,
  w2WagesPaid: 200000,
  qualifiedPropertyUbia: 0,
};

/*
 * Items B to H and Worksheet I, Section A: three quarters of the shop's
 * property and four fifths of its payroll are at the Tustin Legacy site.
 */
const lambraBusiness: CaLambraBusinessFactValue = {
  businessName: "Calloway Precision Machining",
  businessAddress: "2950 Warner Avenue Bay 4, Tustin, CA 92780",
  lambraName: "Tustin Legacy",
  operatesBusiness: true,
  principalBusinessActivityCode: "332710",
  employees: 4,
  grossReceipts: 620000,
  totalAssets: 410000,
  property: { california: 400000, lambra: 300000 },
  payroll: { california: 200000, lambra: 160000 },
};

/*
 * Worksheet I, Section B line 6: the shop's California source business income
 * (Schedule R): the $180,000 profit less the $20,000 Utah jobs.
 */
const lambraIncome: CaLambraIncomeRow[] = [
  { line: "schedule_c", description: "Calloway Precision Machining", amount: 160000 },
];

/* The Utah jobs: Utah taxed $20,000 of the shop's profit. */
const utah: OtherStateTaxFactValue = {
  state: "UT",
  items: [
    {
      description: "Schedule C profit, Utah machining jobs",
      californiaAmount: 20000,
      otherStateAmount: 20000,
    },
  ],
  taxPaid: 900,
  otherStateAdjustedGrossIncome: 20000,
};

const PAYMENTS: Array<[string, { date: string; amount: number }]> = [
  ["2025-q1", { date: "2025-04-15", amount: 9000 }],
  ["2025-q2", { date: "2025-06-16", amount: 9000 }],
  ["2025-q3", { date: "2025-09-15", amount: 9000 }],
  ["2025-q4", { date: "2026-01-15", amount: 9000 }],
];

const LAST_YEAR = "Her filed 2024 FTB 3807, Schedule Z";

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: SHEMERIN_USER_ID, taxYear: SHEMERIN_TAX_YEAR, suffix, value });

export const shemerinFacts: TaxFactRow[] = [
  idFact("name.first", "Shemerin"),
  idFact("name.last", "Calloway"),
  idFact("ssn", "400-00-3807"),
  idFact("dob", "08/22/1972"),
  idFact("address.street", HOME.street),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Orange"),
  idFact("occupation", "Machine shop owner"),
  idFact("phone", "714-555-0183"),
  fact(
    "self_employment",
    makeBusinessFactKey("calloway-machining"),
    shop,
    `${VERBAL}: her books for Calloway Precision Machining.`,
  ),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    `${VERBAL}: she owns the shop; no one classifies her as an employee.`,
  ),
  fact(
    CA_LAMBRA_CATEGORY,
    CA_LAMBRA_KEYS.business,
    lambraBusiness,
    `${VERBAL}: her fixed asset ledger and payroll register by site (Worksheet I, Section A).`,
  ),
  fact(
    CA_LAMBRA_CATEGORY,
    CA_LAMBRA_KEYS.businessIncome,
    lambraIncome,
    `${VERBAL}: her books, the Utah jobs taken out (Worksheet I, Section B).`,
  ),
  fact(
    CA_LAMBRA_CATEGORY,
    CA_LAMBRA_KEYS.hiringCreditCarryover,
    2000,
    `${LAST_YEAR}, line 8B, column (g).`,
  ),
  fact(
    CA_LAMBRA_CATEGORY,
    CA_LAMBRA_KEYS.salesUseTaxCreditCarryover,
    9000,
    `${LAST_YEAR}, line 9B, column (g).`,
  ),
  fact(
    CA_LAMBRA_CATEGORY,
    CA_LAMBRA_KEYS.nolCarryovers,
    [],
    `${VERBAL}: no LAMBRA NOL carryover; her 2024 FTB 3807 Part III is blank.`,
  ),
  fact(
    "state_local_tax",
    makeOtherStateTaxFactKey("ut"),
    utah,
    `${VERBAL}: her 2025 Utah TC-40 and TC-40B.`,
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
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalTax, 33000, `${VERBAL}: 2024 return.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalAgi, 160000, `${VERBAL}: 2024 Form 1040.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.filedJointReturn, false, `${VERBAL}: single in 2024.`),
  fact(
    "estimated_payments",
    CA_PAYMENT_KEYS.estimatedTax,
    5000,
    `${VERBAL}: FTB Web Pay confirmations.`,
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, `${VERBAL}: covered all year.`),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
];

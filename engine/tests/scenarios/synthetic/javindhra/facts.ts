/*
 * A made-up taxpayer (README.md): every name, number and address is invented.
 * Javindhra Selmarre runs a records scanning business in Stockton that employs
 * inmates under an approved joint venture with the California Department of
 * Corrections. No input documents: the facts are her business's books and
 * payroll records, the K-1 statement as she reads it, her 2024 return and her
 * answers. The K-1 partnership's income is left out: the engine has no
 * California K-1, so this scenario tests the credits alone.
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  CA_PAYMENT_KEYS,
  CA_PRISON_INMATE_LABOR_KEYS,
  CA_PTE_CREDIT_CARRYOVER_KEY,
  ESTIMATED_TAX_KEYS,
  PRIOR_YEAR_KEYS,
  makeBusinessFactKey,
  makeCaPrisonInmateLaborPassThroughFactKey,
  makeCaPteElectiveCreditFactKey,
  makeEstimatedTaxPaymentFactKey,
  type BusinessFactValue,
  type CaPrisonInmateLaborPassThroughFactValue,
  type CaPrisonInmateWagesFactValue,
  type CaPteElectiveCreditFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const JAVINDHRA_USER_ID = "javindhra-synthetic";
export const JAVINDHRA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Javindhra, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: JAVINDHRA_USER_ID,
  taxYear: JAVINDHRA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const HOME = { street: "2741 Weberstown Lane", city: "Stockton", state: "CA", zip: "95207" };

/* Her records scanning business (Schedule C). Line 26 wages include the inmates' wages. */
const scanning: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Records scanning and data entry",
  code: "518210",
  name: "Selmarre Records Imaging",
  address: { street: "40 Industrial Way Unit 6", city: "Stockton", state: "CA", zip: "95206" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 300000,
  expenses: {
    wages: 90000,
    rentOtherProperty: 24000,
    supplies: 8000,
    utilities: 6000,
    insurance: 4000,
    taxesAndLicenses: 7000,
    office: 3000,
  },
  specifiedService: false,
  w2WagesPaid: 90000,
  qualifiedPropertyUbia: 0,
};

/* Line 1: the wages paid to inmates under the joint venture agreement, from her payroll register. */
const inmateWages: CaPrisonInmateWagesFactValue = { wages: 40000 };

/* Line 3: a partnership she owns part of also runs a joint venture crew and passed its credit through. */
const passThrough: CaPrisonInmateLaborPassThroughFactValue = {
  entityName: "Delta Pallet Recovery LP",
  entityId: "202011409321",
  credit: 650,
};

/* The same partnership elected to pay California's pass-through entity elective tax. */
const pteCredit: CaPteElectiveCreditFactValue = {
  entityName: "Delta Pallet Recovery LP",
  entityId: "202011409321",
  credit: 1500,
};

const PAYMENTS: Array<[string, { date: string; amount: number }]> = [
  ["2025-q1", { date: "2025-04-15", amount: 9500 }],
  ["2025-q2", { date: "2025-06-16", amount: 9500 }],
  ["2025-q3", { date: "2025-09-15", amount: 9500 }],
  ["2025-q4", { date: "2026-01-15", amount: 9500 }],
];

const K1 = "Schedule K-1 (565) from Delta Pallet Recovery LP and its statement";

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: JAVINDHRA_USER_ID, taxYear: JAVINDHRA_TAX_YEAR, suffix, value });

export const javindhraFacts: TaxFactRow[] = [
  idFact("name.first", "Javindhra"),
  idFact("name.last", "Selmarre"),
  idFact("ssn", "400-00-3507"),
  idFact("dob", "03/11/1979"),
  idFact("address.street", HOME.street),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "San Joaquin"),
  idFact("occupation", "Records imaging owner"),
  idFact("phone", "209-555-0135"),
  fact(
    "self_employment",
    makeBusinessFactKey("selmarre-imaging"),
    scanning,
    `${VERBAL}: her books for Selmarre Records Imaging.`,
  ),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    `${VERBAL}: she owns the business; no one classifies her as an employee.`,
  ),
  fact(
    "self_employment",
    CA_PRISON_INMATE_LABOR_KEYS.qualifyingWages,
    inmateWages,
    `${VERBAL}: her payroll register for the joint venture crew; the agreement was signed before the crew began work.`,
  ),
  fact(
    "state_local_tax",
    makeCaPrisonInmateLaborPassThroughFactKey("delta-pallet"),
    passThrough,
    `${K1}.`,
  ),
  fact("other", CA_PRISON_INMATE_LABOR_KEYS.carryover, 300, "Her filed 2024 FTB 3507, line 7."),
  fact("state_local_tax", makeCaPteElectiveCreditFactKey("delta-pallet"), pteCredit, `${K1}.`),
  fact("other", CA_PTE_CREDIT_CARRYOVER_KEY, 0, "Verbal: no FTB 3804-CR carryover from 2024."),
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
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalTax, 31000, `${VERBAL}: 2024 return.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalAgi, 141000, `${VERBAL}: 2024 Form 1040.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.filedJointReturn, false, `${VERBAL}: single in 2024.`),
  fact(
    "estimated_payments",
    CA_PAYMENT_KEYS.estimatedTax,
    4000,
    `${VERBAL}: FTB Web Pay confirmations.`,
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, `${VERBAL}: covered all year.`),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
];

/*
 * A made-up taxpayer (README.md): every name, number and address is invented.
 * Toveine Arandell runs a machine shop in Porterville, inside the former
 * Tulare County Targeted Tax Area, with a second job site outside it. She
 * carries a TTA hiring credit and a TTA sales or use tax credit from last
 * year's FTB 3809, and she owns parts of two LLCs: one passes through a prison
 * inmate labor credit, the other a PTE elective tax credit. No input
 * documents: the facts are her shop's books, last year's FTB 3809, the K-1
 * statements as she reads them and her answers. The K-1 income is left out:
 * the engine has no California K-1, so this scenario tests the credits alone.
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  CA_PAYMENT_KEYS,
  CA_PRISON_INMATE_LABOR_KEYS,
  CA_PTE_CREDIT_CARRYOVER_KEY,
  CA_TTA_KEYS,
  ESTIMATED_TAX_KEYS,
  PRIOR_YEAR_KEYS,
  makeBusinessFactKey,
  makeCaPrisonInmateLaborPassThroughFactKey,
  makeCaPteElectiveCreditFactKey,
  makeEstimatedTaxPaymentFactKey,
  type BusinessFactValue,
  type CaPrisonInmateLaborPassThroughFactValue,
  type CaPteElectiveCreditFactValue,
  type CaTtaApportionmentFactValue,
  type CaTtaBusinessFactValue,
  type CaTtaBusinessIncomeFactValue,
  type CaTtaNolCarryoversFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TOVEINE_USER_ID = "toveine-synthetic";
export const TOVEINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Toveine, 2026-11-26";
const LAST_3809 = "Her filed 2024 FTB 3809";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TOVEINE_USER_ID,
  taxYear: TOVEINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const HOME = { street: "2210 W Morton Ave", city: "Porterville", state: "CA", zip: "93257" };
const SHOP = { street: "1180 W Olive Ave", city: "Porterville", state: "CA", zip: "93257" };

/* Her machine shop (Schedule C). She rents a second bay in Tulare, outside the former TTA. */
const shop: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Precision machining job shop",
  code: "332710",
  name: "Arandell Precision Machining",
  address: SHOP,
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 480000,
  expenses: {
    wages: 150000,
    rentOtherProperty: 30000,
    supplies: 36000,
    utilities: 14000,
    insurance: 9000,
    taxesAndLicenses: 12000,
    office: 3000,
  },
  specifiedService: false,
  w2WagesPaid: 150000,
  qualifiedPropertyUbia: 0,
};

/* FTB 3809 items B to H for the shop. */
const ttaBusiness: CaTtaBusinessFactValue = {
  role: "operator",
  sicCode: "3599",
  businessName: "Arandell Precision Machining",
  businessAddress: `${SHOP.street}, ${SHOP.city}, ${SHOP.state} ${SHOP.zip}`,
  areaName: "Tulare County TTA, City of Porterville",
  principalBusinessActivityCode: "332710",
  employeesInTta: 4,
  grossAnnualReceipts: 480000,
  totalAssetValue: 660000,
};

/*
 * Worksheet I, Section A from her books: property at original cost (the
 * rented Tulare bay at eight times its $30,000 rent) and the payroll by job site.
 */
const apportionment: CaTtaApportionmentFactValue = {
  whollyWithinTta: false,
  propertyCalifornia: 900000,
  propertyTta: 600000,
  payrollCalifornia: 150000,
  payrollTta: 120000,
};

/* Worksheet I, Section B: the shop's Schedule C profit; its percentage is Section A's. */
const businessIncome: CaTtaBusinessIncomeFactValue = {
  items: [
    {
      line: "schedule_c",
      description: "Arandell Precision Machining, Schedule C line 31",
      amount: 226000,
    },
  ],
};

const noNol: CaTtaNolCarryoversFactValue = { rows: [] };

/* A partnership she owns part of runs a joint venture crew and passed its credit through. */
const prisonLabor: CaPrisonInmateLaborPassThroughFactValue = {
  entityName: "Tule River Pallet Works LLC",
  entityId: "201714205588",
  credit: 900,
};

/* An LLC she owns part of elected to pay California's PTE elective tax. */
const pteCredit: CaPteElectiveCreditFactValue = {
  entityName: "Sierra Foothill Packing LLC",
  entityId: "201509310742",
  credit: 2800,
};

const PAYMENTS: Array<[string, { date: string; amount: number }]> = [
  ["2025-q1", { date: "2025-04-15", amount: 14000 }],
  ["2025-q2", { date: "2025-06-16", amount: 14000 }],
  ["2025-q3", { date: "2025-09-15", amount: 14000 }],
  ["2025-q4", { date: "2026-01-15", amount: 14000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TOVEINE_USER_ID, taxYear: TOVEINE_TAX_YEAR, suffix, value });

export const toveineFacts: TaxFactRow[] = [
  idFact("name.first", "Toveine"),
  idFact("name.last", "Arandell"),
  idFact("ssn", "400-00-3809"),
  idFact("dob", "08/14/1971"),
  idFact("address.street", HOME.street),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Tulare"),
  idFact("occupation", "Machine shop owner"),
  idFact("phone", "559-555-0138"),
  fact(
    "self_employment",
    makeBusinessFactKey("arandell-machining"),
    shop,
    `${VERBAL}: her books for Arandell Precision Machining.`,
  ),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    `${VERBAL}: she owns the shop; no one classifies her as an employee.`,
  ),
  fact("state_local_tax", CA_TTA_KEYS.business, ttaBusiness, `${LAST_3809}, items A to H.`),
  fact(
    "state_local_tax",
    CA_TTA_KEYS.apportionment,
    apportionment,
    `${VERBAL}: her fixed asset ledger, lease and payroll register by job site.`,
  ),
  fact(
    "state_local_tax",
    CA_TTA_KEYS.businessIncome,
    businessIncome,
    `${VERBAL}: the shop is her only business; she has no wages.`,
  ),
  fact(
    "other",
    CA_TTA_KEYS.hiringCreditCarryover,
    4000,
    `${LAST_3809}, Schedule Z line 8B column (g).`,
  ),
  fact(
    "other",
    CA_TTA_KEYS.salesUseTaxCreditCarryover,
    16000,
    `${LAST_3809}, Schedule Z line 9B column (g).`,
  ),
  fact("other", CA_TTA_KEYS.nolCarryovers, noNol, `${LAST_3809}: no TTA NOL carryover.`),
  fact(
    "self_employment",
    CA_PRISON_INMATE_LABOR_KEYS.qualifyingWages,
    { wages: 0 },
    `${VERBAL}: she pays no wages under a joint venture agreement.`,
  ),
  fact(
    "state_local_tax",
    makeCaPrisonInmateLaborPassThroughFactKey("tule-river-pallet"),
    prisonLabor,
    "Schedule K-1 (568) from Tule River Pallet Works LLC and its statement.",
  ),
  fact("other", CA_PRISON_INMATE_LABOR_KEYS.carryover, 0, "Verbal: no FTB 3507 in 2024."),
  fact(
    "state_local_tax",
    makeCaPteElectiveCreditFactKey("sierra-foothill"),
    pteCredit,
    "Schedule K-1 (568) from Sierra Foothill Packing LLC and its statement.",
  ),
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
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalTax, 49000, `${VERBAL}: 2024 return.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalAgi, 205000, `${VERBAL}: 2024 Form 1040.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.filedJointReturn, false, `${VERBAL}: single in 2024.`),
  fact(
    "estimated_payments",
    CA_PAYMENT_KEYS.estimatedTax,
    11000,
    `${VERBAL}: FTB Web Pay confirmations.`,
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, `${VERBAL}: covered all year.`),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
];

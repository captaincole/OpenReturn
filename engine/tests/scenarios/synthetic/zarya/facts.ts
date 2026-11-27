/*
 * A made-up taxpayer (README.md): every name, number and address is invented.
 * Zarya Oskeld is an engineer for a Visalia firm and owns a bakery in Visalia,
 * both inside the former Tulare County Targeted Tax Area. She carries a TTA
 * hiring credit and two TTA NOLs from last year's FTB 3809. Some weeks of her
 * job were on a Salt Lake City project, and she paid Utah tax on them. No
 * input documents: the facts are her bakery's books, last year's FTB 3809,
 * her travel log, the Utah return and her answers. The W-2 has no PDF.
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  CA_PAYMENT_KEYS,
  CA_TTA_KEYS,
  ESTIMATED_TAX_KEYS,
  PRIOR_YEAR_KEYS,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeOtherStateTaxFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type CaTtaApportionmentFactValue,
  type CaTtaBusinessFactValue,
  type CaTtaBusinessIncomeFactValue,
  type CaTtaNolCarryoversFactValue,
  type OtherStateTaxFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ZARYA_USER_ID = "zarya-synthetic";
export const ZARYA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Zarya, 2026-11-26";
const LAST_3809 = "Her filed 2024 FTB 3809";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ZARYA_USER_ID,
  taxYear: ZARYA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const HOME = { line1: "418 N Encina St", city: "Visalia", state: "CA", zip: "93291" };
const BAKERY = { street: "205 E Main St", city: "Visalia", state: "CA", zip: "93291" };
const TAXPAYER = { firstName: "Zarya", lastName: "Oskeld", ssn: "400-00-3810" };

/* Her W-2 from a Visalia engineering firm; her weeks on a Salt Lake City project are part of box 1. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Kaweah Valley Engineering Inc",
  employerEin: "12-3803809",
  employerAddress: { line1: "300 S Mooney Blvd", city: "Visalia", state: "CA", zip: "93277" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 180000,
  box2: 36000,
  box3: 176100,
  box4: 10918.2,
  box5: 180000,
  box6: 2610,
  box14: [{ label: "CA SDI", amount: 2160 }],
  box15: "CA",
  box16: 180000,
  box17: 12500,
};

/* Utah nonresident return (TC-40 with TC-40B): wages for weeks worked in Salt Lake City. */
const utah: OtherStateTaxFactValue = {
  state: "UT",
  items: [
    {
      description: "Wages, Salt Lake City project",
      californiaAmount: 40000,
      otherStateAmount: 40000,
    },
  ],
  taxPaid: 1800,
  otherStateAdjustedGrossIncome: 40000,
};

/* Her bakery (Schedule C), all of it in the former TTA. */
const bakery: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Retail bakery",
  code: "311810",
  name: "Oskeld Hearth Bakery",
  address: BAKERY,
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 210000,
  expenses: {
    wages: 70000,
    rentOtherProperty: 24000,
    supplies: 38000,
    utilities: 9000,
    insurance: 3000,
    taxesAndLicenses: 4000,
    office: 2000,
  },
  specifiedService: false,
  w2WagesPaid: 70000,
  qualifiedPropertyUbia: 0,
};

/* FTB 3809 items B to H for the bakery. */
const ttaBusiness: CaTtaBusinessFactValue = {
  role: "operator",
  sicCode: "2051",
  businessName: "Oskeld Hearth Bakery",
  businessAddress: `${BAKERY.street}, ${BAKERY.city}, ${BAKERY.state} ${BAKERY.zip}`,
  areaName: "Tulare County TTA, City of Visalia",
  principalBusinessActivityCode: "311810",
  employeesInTta: 5,
  grossAnnualReceipts: 210000,
  totalAssetValue: 140000,
};

const apportionment: CaTtaApportionmentFactValue = { whollyWithinTta: true };

/*
 * Worksheet I, Section B. Wages: her travel log puts 75% of her working days
 * at the firm's Visalia office. The bakery takes Section A's 100%.
 */
const businessIncome: CaTtaBusinessIncomeFactValue = {
  items: [
    {
      line: "wages",
      description: "Kaweah Valley Engineering Inc, W-2 box 1",
      amount: 180000,
      ttaPercentage: 0.75,
    },
    { line: "schedule_c", description: "Oskeld Hearth Bakery, Schedule C line 31", amount: 60000 },
  ],
};

/* Last year's Worksheet II column (e): the bakery's losses of 2009 and 2011. */
const nol: CaTtaNolCarryoversFactValue = {
  rows: [
    { lossYear: 2009, carryover: 9000 },
    { lossYear: 2011, carryover: 14000 },
  ],
};

const PAYMENTS: Array<[string, { date: string; amount: number }]> = [
  ["2025-q1", { date: "2025-04-15", amount: 4500 }],
  ["2025-q2", { date: "2025-06-16", amount: 4500 }],
  ["2025-q3", { date: "2025-09-15", amount: 4500 }],
  ["2025-q4", { date: "2026-01-15", amount: 4500 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ZARYA_USER_ID, taxYear: ZARYA_TAX_YEAR, suffix, value });

export const zaryaFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "02/27/1976"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Tulare"),
  idFact("occupation", "Civil engineer"),
  idFact("phone", "559-555-0164"),
  fact("wages", makeW2FactKey("kaweah"), w2, "W-2 from Kaweah Valley Engineering Inc."),
  fact(
    "state_local_tax",
    makeOtherStateTaxFactKey("ut"),
    utah,
    "Verbal, from her 2025 Utah TC-40 and TC-40B.",
  ),
  fact(
    "self_employment",
    makeBusinessFactKey("oskeld-bakery"),
    bakery,
    `${VERBAL}: her books for Oskeld Hearth Bakery.`,
  ),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    `${VERBAL}: she owns the bakery; no one classifies her as its employee.`,
  ),
  fact("state_local_tax", CA_TTA_KEYS.business, ttaBusiness, `${LAST_3809}, items A to H.`),
  fact(
    "state_local_tax",
    CA_TTA_KEYS.apportionment,
    apportionment,
    `${VERBAL}: the bakery has no property or payroll outside Visalia.`,
  ),
  fact(
    "state_local_tax",
    CA_TTA_KEYS.businessIncome,
    businessIncome,
    `${VERBAL}: her travel log and the bakery's books.`,
  ),
  fact(
    "other",
    CA_TTA_KEYS.hiringCreditCarryover,
    2500,
    `${LAST_3809}, Schedule Z line 8B column (g).`,
  ),
  fact(
    "other",
    CA_TTA_KEYS.salesUseTaxCreditCarryover,
    0,
    `${LAST_3809}: no sales or use tax credit.`,
  ),
  fact("other", CA_TTA_KEYS.nolCarryovers, nol, `${LAST_3809}, Worksheet II column (e).`),
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
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalTax, 50000, `${VERBAL}: 2024 return.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalAgi, 225000, `${VERBAL}: 2024 Form 1040.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.filedJointReturn, false, `${VERBAL}: single in 2024.`),
  fact(
    "estimated_payments",
    CA_PAYMENT_KEYS.estimatedTax,
    0,
    `${VERBAL}: no California estimates.`,
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, `${VERBAL}: covered all year.`),
  fact("use_tax", "use_tax.owed_amount", 0, `${VERBAL}: no out-of-state purchases.`),
];

/*
 * A made-up taxpayer (README.md): every name, number and address is invented.
 * Sarene Valdecasas runs a machine shop in Fresno, part of it inside the
 * former Fresno City enterprise zone. She still carries an enterprise zone
 * hiring credit, a sales or use tax credit and two EZ net operating losses
 * from before the zone was repealed. No input documents: the facts are her
 * shop's books, her 2024 return and her answers.
 */

import {
  CA_EMPLOYEE_CLASSIFICATION_KEYS,
  CA_ENTERPRISE_ZONE_KEYS,
  CA_PAYMENT_KEYS,
  ESTIMATED_TAX_KEYS,
  PRIOR_YEAR_KEYS,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  type BusinessFactValue,
  type CaEnterpriseZoneBusinessFactValue,
  type CaEnterpriseZoneNolCarryover,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const SARENE_USER_ID = "sarene-synthetic";
export const SARENE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Sarene, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: SARENE_USER_ID,
  taxYear: SARENE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const HOME = { street: "5318 N Wishon Ave", city: "Fresno", state: "CA", zip: "93704" };
const SHOP = { street: "2150 E Belgravia Ave", city: "Fresno", state: "CA", zip: "93706" };

/* Her machine shop (Schedule C): the main floor in the former zone, a second bay outside it. */
const shop: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Machine shop",
  code: "332710",
  name: "Kestrel Machine Works",
  address: SHOP,
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 260000,
  expenses: {
    wages: 60000,
    supplies: 40000,
    rentOtherProperty: 24000,
    utilities: 6000,
    insurance: 5000,
  },
  specifiedService: false,
  w2WagesPaid: 60000,
  qualifiedPropertyUbia: 0,
};

/*
 * The FTB 3805Z business: items B to H and both sections of Worksheet I.
 * Owned equipment at original cost, the yearly rent of the two bays, and the
 * payroll, in California and in the former zone.
 */
const zoneBusiness: CaEnterpriseZoneBusinessFactValue = {
  businessName: "Kestrel Machine Works",
  businessAddress: `${SHOP.street}, ${SHOP.city}, ${SHOP.state} ${SHOP.zip}`,
  zoneName: "Fresno – City",
  role: "operator",
  activityCode: "332710",
  employeesInZone: 2,
  grossReceipts: 260000,
  totalAssetValue: 200000,
  apportionment: {
    entirelyWithinZone: false,
    ownedPropertyCalifornia: 200000,
    ownedPropertyZone: 160000,
    netAnnualRentCalifornia: 24000,
    netAnnualRentZone: 12000,
    payrollCalifornia: 60000,
    payrollZone: 45000,
  },
  incomeItems: [{ line: "schedule_c", description: "Kestrel Machine Works", amount: 125000 }],
};

/* Worksheet II column (b): last year's column (e) for the two loss years. */
const nolCarryovers: CaEnterpriseZoneNolCarryover[] = [
  { yearOfLoss: 2011, amount: 6000 },
  { yearOfLoss: 2013, amount: 9000 },
];

const PAYMENTS: Array<[string, { date: string; amount: number }]> = [
  ["2025-q1", { date: "2025-04-15", amount: 7000 }],
  ["2025-q2", { date: "2025-06-16", amount: 7000 }],
  ["2025-q3", { date: "2025-09-15", amount: 7000 }],
  ["2025-q4", { date: "2026-01-15", amount: 7000 }],
];

const LAST_YEAR = "Her filed 2024 FTB 3805Z";

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: SARENE_USER_ID, taxYear: SARENE_TAX_YEAR, suffix, value });

export const sareneFacts: TaxFactRow[] = [
  idFact("name.first", "Sarene"),
  idFact("name.last", "Valdecasas"),
  idFact("ssn", "400-00-3805"),
  idFact("dob", "07/22/1972"),
  idFact("address.street", HOME.street),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Fresno"),
  idFact("occupation", "Machine shop owner"),
  idFact("phone", "559-555-0182"),
  fact(
    "self_employment",
    makeBusinessFactKey("kestrel-machine"),
    shop,
    `${VERBAL}: her books for Kestrel Machine Works.`,
  ),
  fact(
    "self_employment",
    CA_EMPLOYEE_CLASSIFICATION_KEYS.classifiedAsEmployee,
    false,
    `${VERBAL}: she owns the business; no one classifies her as an employee.`,
  ),
  fact(
    "self_employment",
    CA_ENTERPRISE_ZONE_KEYS.business,
    zoneBusiness,
    `${VERBAL}: her fixed asset list, the two leases and the payroll register by location.`,
  ),
  fact(
    "other",
    CA_ENTERPRISE_ZONE_KEYS.hiringCreditCarryover,
    1400,
    `${LAST_YEAR}, Schedule Z line 8B column (g).`,
  ),
  fact(
    "other",
    CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover,
    2600,
    `${LAST_YEAR}, Schedule Z line 9B column (g).`,
  ),
  fact(
    "other",
    CA_ENTERPRISE_ZONE_KEYS.nolCarryovers,
    nolCarryovers,
    `${LAST_YEAR}, Worksheet II column (e).`,
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
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalTax, 24000, `${VERBAL}: 2024 return.`),
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalAgi, 118000, `${VERBAL}: 2024 Form 1040.`),
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

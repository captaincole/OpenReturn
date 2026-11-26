/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are her business's books, her fuel records (gallons and
 * cost by use) and her answers. No information return reports fuel use.
 */

import {
  ESTIMATED_TAX_KEYS,
  FUEL_TAX_REGISTRATION_NUMBERS_KEY,
  PRIOR_YEAR_KEYS,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeFuelTaxActivityFactKey,
  type BusinessFactValue,
  type FuelRegistrationNumbersValue,
  type FuelTaxActivityFactValue,
  type FuelTaxClaim,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const MEILYN_USER_ID = "meilyn-integration";
export const MEILYN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Meilyn, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: MEILYN_USER_ID,
  taxYear: MEILYN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const MEILYN = {
  firstName: "Meilyn",
  lastName: "Ashvane",
  ssn: "400-00-4136",
  street: "2716 Prairie Falcon Road",
  city: "Casper",
  state: "WY",
  zip: "82604",
};

const BUSINESS_KEY = makeBusinessFactKey("ashvane-field-air");

/*
 * Her business (Schedule C): crop dusting, farm and site work, a fuel depot
 * that sells to the county and to bus lines, and a small fuel export trade.
 * Line 6 holds $2,150, the fuel tax credit she claimed on her 2024 return
 * (irs-1040sc-inst-2025::sec::line-6::b01).
 */
const business: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Aerial application and fuel distribution",
  code: "115110",
  name: "Ashvane Field & Air Services",
  ein: "00-0041360",
  address: { street: "88 Airport Parkway", city: "Casper", state: "WY", zip: "82604" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 412000,
  otherIncome: 2150,
  expenses: { insurance: 22600, repairs: 31800, supplies: 265900 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

const claim = (
  line: FuelTaxClaim["line"],
  gallons: number,
  actualFuelCost: number,
  more: Partial<FuelTaxClaim> = {},
): FuelTaxClaim => ({ line, gallons, actualFuelCost, ...more });

/* Her fuel records for 2025: one claim on every Part II row but line 4a (her home's kerosene, below). */
const CLAIMS: FuelTaxClaim[] = [
  claim("1a", 1200, 4140),
  claim("1b", 800, 2760),
  claim("1c", 300, 1035.5, { typeOfUse: 4 }),
  claim("1d", 500, 1690),
  claim("2a", 2000, 9800),
  claim("2b", 400, 2240, { typeOfUse: 1 }),
  claim("2c", 250, 1350),
  claim("2d", 1000, 5300),
  claim("3a", 1500, 5400, { typeOfUse: 2 }),
  claim("3b", 2500, 9000),
  claim("3c", 600, 2100, { visibleDye: true }),
  claim("3d", 900, 3240),
  claim("3e", 700, 2450),
  claim("4b", 300, 1260),
  claim("4c", 200, 840, { visibleDye: true }),
  claim("4d", 100, 420),
  claim("4e", 400, 1600, { typeOfUse: 2 }),
  claim("4f", 350, 1470, { typeOfUse: 2 }),
  claim("5a", 3000, 13500),
  claim("5b", 1000, 4500),
  claim("5c", 800, 3600, { typeOfUse: 1 }),
  claim("5d", 600, 2700, { typeOfUse: 10 }),
  claim("5e", 500, 2250),
  claim("6a", 2000, 7000, { visibleDye: true }),
  claim("6b", 1500, 5250),
  claim("7a", 400, 1600),
  claim("7b", 600, 2400, { visibleDye: true }),
  claim("7c", 300, 1200),
  claim("8a", 1200, 5400),
  claim("8b", 1000, 4500),
  claim("8c", 2000, 9000),
  claim("8d", 700, 3150, { typeOfUse: 1 }),
  claim("8e", 500, 2250, { typeOfUse: 10 }),
  claim("8f", 300, 1350),
  // 10,000 gallons of LPG in her shuttle buses (type of use 5): the instructions' example.
  claim("11a", 10000, 25000, { typeOfUse: 5, measuredIn: "gallons" }),
  claim("11b", 500, 1500, { typeOfUse: 2 }),
  claim("11c", 123570, 2500, { typeOfUse: 2, measuredIn: "cubic_feet" }),
  claim("11d", 200, 1000, { typeOfUse: 2 }),
  claim("11e", 300, 1200, { typeOfUse: 1 }),
  claim("11f", 400, 1600, { typeOfUse: 2 }),
  claim("11g", 1710, 3000, { typeOfUse: 1, measuredIn: "gallons" }),
  claim("11h", 250, 900, { typeOfUse: 2 }),
  claim("13a", 1000, 3500),
  claim("13b", 800, 2800),
  claim("13c", 600, 2700, { taxedAt244: true }),
  claim("14a", 1000, 3400, { typeOfUse: 5 }),
  claim("14b", 500, 1700),
  claim("15a", 10000, 34000),
  claim("16a", 5000, 17000),
  claim("16b", 2000, 7000),
];

const fieldAndAir: FuelTaxActivityFactValue = {
  kind: "business",
  businessKey: BUSINESS_KEY,
  equipment: { make: "Air Tractor", model: "AT-502B", type: "Agricultural aircraft" },
  claims: CLAIMS,
};

// Undyed kerosene from a dealer (not a blocked pump) for her home's space heater.
const homeKerosene: FuelTaxActivityFactValue = {
  kind: "home_kerosene",
  claims: [{ line: "4a", gallons: 150, actualFuelCost: 690.25, typeOfUse: 8 }],
};

const REGISTRATION: FuelRegistrationNumbersValue = {
  "6": "UV-000041361",
  "7": "UV-000041361",
  "8": "UA-000041362",
  "13": "CC-000041363",
  "15": "M-000041364",
};

/* Four estimated tax payments, each on time. */
const PAYMENTS: Array<[string, { date: string; amount: number }]> = [
  ["2025-q1", { date: "2025-04-15", amount: 4000 }],
  ["2025-q2", { date: "2025-06-16", amount: 4000 }],
  ["2025-q3", { date: "2025-09-15", amount: 4000 }],
  ["2025-q4", { date: "2026-01-15", amount: 4000 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: MEILYN_USER_ID, taxYear: MEILYN_TAX_YEAR, suffix, value });

export const meilynFacts: TaxFactRow[] = [
  idFact("name.first", MEILYN.firstName),
  idFact("name.last", MEILYN.lastName),
  idFact("ssn", MEILYN.ssn),
  idFact("dob", "08/02/1979"),
  idFact("address.street", MEILYN.street),
  idFact("address.city", MEILYN.city),
  idFact("address.state", MEILYN.state),
  idFact("address.zip", MEILYN.zip),
  idFact("occupation", "Agricultural pilot"),
  idFact("phone", "307-555-0141"),
  fact("self_employment", BUSINESS_KEY, business, `${VERBAL}: her books for the business.`),
  fact(
    "other",
    makeFuelTaxActivityFactKey("ashvane-field-air"),
    fieldAndAir,
    `${VERBAL}: her 2025 fuel log, gallons and cost by use.`,
  ),
  fact(
    "other",
    makeFuelTaxActivityFactKey("home-kerosene"),
    homeKerosene,
    `${VERBAL}: kerosene invoices for her home heater.`,
  ),
  fact(
    "other",
    FUEL_TAX_REGISTRATION_NUMBERS_KEY,
    REGISTRATION,
    `${VERBAL}: her Form 637 letters.`,
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
  fact("estimated_payments", PRIOR_YEAR_KEYS.federalTax, 15200, `${VERBAL}: 2024 return.`),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.federalAgi,
    84000,
    `${VERBAL}: 2024 Form 1040 line 11.`,
  ),
  fact("estimated_payments", PRIOR_YEAR_KEYS.filedJointReturn, false, `${VERBAL}: single in 2024.`),
];

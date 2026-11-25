/*
 * A made-up married couple (README.md): every name and amount is invented. No
 * input documents: the W-2s and the 1099-INT are the boxes as the documents
 * would print them. The rest are the couple's answers: the estimated tax
 * payment, the withholding by date from pay stubs, the 2024 returns and a
 * request to waive part of the penalty.
 */

import {
  ESTIMATED_TAX_KEYS,
  PRIOR_YEAR_KEYS,
  SPOUSE_KEYS,
  makeDatedWithholdingFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeInterestFactKey,
  makeW2FactKey,
  type DatedAmountFactValue,
  type InterestFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TALMANES_USER_ID = "talmanes-integration";
export const TALMANES_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";
const VERBAL = "Verbal, 2026-11-23";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TALMANES_USER_ID,
  taxYear: TALMANES_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const TALMANES = {
  firstName: "Talmanes",
  lastName: "Ostrander",
  ssn: "400-00-2213",
  street: "915 Cedar Hollow Court",
  city: "Nashville",
  state: "TN",
  zip: "37215",
};

export const SEREN = { firstName: "Seren", lastName: "Ostrander", ssn: "400-00-2214" };

const address = {
  line1: TALMANES.street,
  city: TALMANES.city,
  state: TALMANES.state,
  zip: TALMANES.zip,
};

// Talmanes's W-2: salary and a February stock vest withheld at 22%.
const talmanesW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Harpeth Data Systems Inc.",
  employerEin: "00-0002213",
  employerAddress: { line1: "200 Broadway", city: "Nashville", state: "TN", zip: "37201" },
  employee: {
    firstName: TALMANES.firstName,
    lastName: TALMANES.lastName,
    ssn: TALMANES.ssn,
    address,
  },
  box1: 300000,
  box2: 50000,
  box3: 176100,
  box4: 10918.2,
  box5: 300000,
  box6: 5250,
};

// Seren's W-2.
const serenW2: W2FactValue = {
  owner: "spouse",
  employerName: "Belle Meade Pediatric Clinic PLLC",
  employerEin: "00-0002214",
  employerAddress: { line1: "4400 Harding Pike", city: "Nashville", state: "TN", zip: "37205" },
  employee: { firstName: SEREN.firstName, lastName: SEREN.lastName, ssn: SEREN.ssn, address },
  box1: 60000,
  box2: 6000,
  box3: 60000,
  box4: 3720,
  box5: 60000,
  box6: 870,
};

const savingsInterest: InterestFactValue = {
  payerName: "Cumberland Federal Credit Union",
  payerTin: "00-0002215",
  box1: 40000,
};

/*
 * Federal income tax withheld by date (pay stubs): the stock vest, then the
 * regular withholding of both jobs ($3,200 a month) through each due date, and
 * the Additional Medicare Tax withheld in December. They add up to line 25d.
 */
export const WITHHOLDING_BY_DATE: Array<[string, DatedAmountFactValue]> = [
  ["2025-02-vest", { date: "2025-02-14", amount: 17600 }],
  ["2025-04", { date: "2025-04-15", amount: 11200 }],
  ["2025-06", { date: "2025-06-13", amount: 6400 }],
  ["2025-09", { date: "2025-09-15", amount: 9600 }],
  ["2025-12", { date: "2025-12-31", amount: 12100 }],
];

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TALMANES_USER_ID, taxYear: TALMANES_TAX_YEAR, suffix, value });

const estimatedTaxFacts: TaxFactRow[] = [
  fact(
    "estimated_payments",
    makeEstimatedTaxPaymentFactKey("2026-01"),
    { date: "2026-01-15", amount: 22000 },
    `${VERBAL}: IRS Direct Pay confirmation.`,
  ),
  ...WITHHOLDING_BY_DATE.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeDatedWithholdingFactKey(slug),
      value,
      `${VERBAL}: pay stubs of both jobs.`,
    ),
  ),
  fact(
    "estimated_payments",
    ESTIMATED_TAX_KEYS.waiverRequest,
    "part",
    `${VERBAL}: Seren became disabled in May 2025; the statement and the doctor's letter go with the return.`,
  ),
  fact("estimated_payments", ESTIMATED_TAX_KEYS.waiverAmount, 40, `${VERBAL}: the part to waive.`),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.federalTax,
    60000,
    `${VERBAL}: both 2024 returns (single), tax added.`,
  ),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.federalAgi,
    330000,
    `${VERBAL}: both 2024 Forms 1040 line 11, added.`,
  ),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.filedJointReturn,
    false,
    `${VERBAL}: married in March 2025; each filed single for 2024.`,
  ),
];

export const talmanesFacts: TaxFactRow[] = [
  idFact("name.first", TALMANES.firstName),
  idFact("name.last", TALMANES.lastName),
  idFact("ssn", TALMANES.ssn),
  idFact("dob", "02/11/1979"),
  idFact("address.street", TALMANES.street),
  idFact("address.city", TALMANES.city),
  idFact("address.state", TALMANES.state),
  idFact("address.zip", TALMANES.zip),
  idFact("occupation", "Software architect"),
  idFact("phone", "615-555-0144"),
  fact("identity", SPOUSE_KEYS.firstName, SEREN.firstName, VERBAL),
  fact("identity", SPOUSE_KEYS.lastName, SEREN.lastName, VERBAL),
  fact("identity", SPOUSE_KEYS.ssn, SEREN.ssn, "Seren's W-2, box a."),
  fact("identity", SPOUSE_KEYS.dob, "09/03/1982", VERBAL),
  fact("identity", SPOUSE_KEYS.occupation, "Physical therapist", VERBAL),
  fact("wages", makeW2FactKey("harpeth-data"), talmanesW2, "W-2 from Harpeth Data Systems."),
  fact("wages", makeW2FactKey("belle-meade"), serenW2, "W-2 from Belle Meade Pediatric Clinic."),
  fact(
    "investment_income",
    makeInterestFactKey("cumberland-fcu"),
    savingsInterest,
    "Form 1099-INT from Cumberland Federal Credit Union.",
  ),
  ...estimatedTaxFacts,
];

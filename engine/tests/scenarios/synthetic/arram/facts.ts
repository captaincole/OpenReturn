/*
 * A made-up single filer (README.md): every name and amount is invented. The
 * W-2 has no PDF: its facts are the boxes as it would print them. The rental,
 * the credits and last year's unallowed credits are the taxpayer's answers:
 * the credit source forms (Forms 8826, 8844, 3468 and 8586) are not forms the
 * engine figures, and the product does not read last year's return yet (#79).
 */

import {
  makeCreditCarryoverFactKey,
  makeGeneralBusinessCreditFactKey,
  makeRentalFactKey,
  makeW2FactKey,
  RENTAL_KEYS,
  type CreditCarryoverFactValue,
  type GeneralBusinessCreditFactValue,
  type PassiveCreditActivity,
  type RentalFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ARRAM_USER_ID = "arram-synthetic";
export const ARRAM_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const HOME = { line1: "2207 Caprock Trail", city: "Lubbock", state: "TX", zip: "79407" };
const TAXPAYER = { firstName: "Arram", lastName: "Thornwell", ssn: "400-00-8582" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ARRAM_USER_ID,
  taxYear: ARRAM_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ARRAM_USER_ID, taxYear: ARRAM_TAX_YEAR, suffix, value });

/* Arram's W-2 as a hospital pharmacist. */
const pharmacistW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "South Plains Regional Hospital",
  employerEin: "00-0858201",
  employerAddress: { line1: "4100 Indiana Ave", city: "Lubbock", state: "TX", zip: "79413" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 118000,
  box2: 13200,
  box3: 118000,
  box4: 7316,
  box5: 118000,
  box6: 1711,
};

/*
 * The duplex on Cedar Lane that Arram rents out and manages: he approves the
 * tenants and the repairs (active participation). A $6,000 loss.
 */
const cedarLane: RentalFactValue = {
  owner: "taxpayer",
  propertyType: "multi_family",
  address: { street: "618 Cedar Ln", city: "Lubbock", state: "TX", zip: "79415" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 24000,
  expenses: {
    insurance: 1800,
    mortgageInterest: 14000,
    repairs: 2700,
    taxes: 4500,
    depreciationOrDepletion: 7000,
  },
  activeParticipation: true,
  allInvestmentAtRisk: true,
  qualifiedBusiness: false,
  tradeOrBusiness: false,
};

/* The three passive activities the credits come from (Form 8582-CR worksheets). */
const CEDAR_LANE: PassiveCreditActivity = {
  name: "Cedar Lane duplex",
  rentalRealEstate: true,
  activelyParticipated: true,
};
const OLD_MILL: PassiveCreditActivity = { name: "Old Mill Lofts", rentalRealEstate: true };
const PRAIRIE_COMMONS: PassiveCreditActivity = {
  name: "Prairie Commons Apartments",
  rentalRealEstate: true,
  before1990: false,
};

/* This year's credits, each from its source form (Form 3800 Part III). */
export const CREDITS: Record<string, GeneralBusinessCreditFactValue> = {
  // Worksheet 1: ramps and a wider door at the duplex.
  "cedar-lane-disabled-access": {
    sourceForm: "8826",
    line: "1e",
    amount: 2500,
    passive: true,
    passiveActivity: CEDAR_LANE,
  },
  // Worksheet 1: the duplex's maintenance worker lives and works in the empowerment zone.
  "cedar-lane-empowerment-zone": {
    sourceForm: "8844",
    line: "3",
    amount: 1200,
    passive: true,
    passiveActivity: CEDAR_LANE,
  },
  // Worksheet 2: a certified historic building Arram owns a share of and rents out.
  "old-mill-rehabilitation": {
    sourceForm: "3468 Part VII",
    line: "4k",
    amount: 1000,
    passive: true,
    passiveActivity: OLD_MILL,
  },
  // Worksheet 3: a low-income housing building placed in service in 2019.
  "prairie-commons-low-income-housing": {
    sourceForm: "8586",
    line: "4d",
    amount: 4000,
    passive: true,
    passiveActivity: PRAIRIE_COMMONS,
  },
};

/* Last year's unallowed passive credits (2024 Form 8582-CR Worksheet 9 column (b)). */
export const CARRYOVERS: Record<string, CreditCarryoverFactValue> = {
  "cedar-lane-disabled-access-2023": {
    sourceForm: "8826",
    line: "1e",
    originYear: 2023,
    amount: 700,
    passive: true,
    passiveActivity: CEDAR_LANE,
  },
  "old-mill-rehabilitation-2024": {
    sourceForm: "3468 Part VII",
    line: "4k",
    originYear: 2024,
    amount: 400,
    passive: true,
    passiveActivity: OLD_MILL,
  },
  "prairie-commons-low-income-housing-2024": {
    sourceForm: "8586 post-2007",
    line: "4d",
    originYear: 2024,
    amount: 1000,
    passive: true,
    passiveActivity: PRAIRIE_COMMONS,
  },
};

const VERBAL = "Verbal, 2026-11-26";
const LAST_YEAR =
  "2024 Form 8582-CR Worksheet 9 column (b), from last year's return (stated; #79).";

export const arramFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "03/22/1984"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("occupation", "Hospital pharmacist"),
  idFact("phone", "806-555-0182"),
  fact(
    "wages",
    makeW2FactKey("south-plains-regional"),
    pharmacistW2,
    "W-2 from South Plains Regional Hospital.",
  ),
  fact("rental", makeRentalFactKey("cedar-lane-duplex"), cedarLane, "Verbal: rents and expenses."),
  fact(
    "rental",
    RENTAL_KEYS.realEstateProfessional,
    false,
    "Verbal: works full time at the hospital.",
  ),
  fact("rental", RENTAL_KEYS.paymentsRequire1099, false, "Verbal: no payments needing a 1099."),
  ...Object.entries(CREDITS).map(([slug, value]) =>
    fact(
      "other",
      makeGeneralBusinessCreditFactKey(slug),
      value,
      `${VERBAL}: Form ${value.sourceForm}.`,
    ),
  ),
  ...Object.entries(CARRYOVERS).map(([slug, value]) =>
    fact("other", makeCreditCarryoverFactKey(slug), value, LAST_YEAR),
  ),
];

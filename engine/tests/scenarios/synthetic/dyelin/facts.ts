/*
 * A made-up commercial fisher in Alaska and her husband (README.md): every
 * name and amount is invented. No input documents: the W-2 holds its boxes as
 * printed, the business fact holds the boat's books, and the rest are answers.
 */

import {
  FARMER_ESTIMATED_TAX_KEYS,
  FARMER_OR_FISHERMAN_KEYS,
  PRIOR_YEAR_KEYS,
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeEstimatedTaxPaymentFactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type FarmerGrossIncomeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const DYELIN_USER_ID = "dyelin-integration";
export const DYELIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const VERBAL = "Stated by Dyelin, 2026-11-26";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: DYELIN_USER_ID,
  taxYear: DYELIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const DYELIN = {
  firstName: "Dyelin",
  lastName: "Tarvanek",
  ssn: "400-00-2211",
  street: "412 Seward Highway",
  city: "Homer",
  state: "AK",
  zip: "99603",
};

const HUSBAND = { firstName: "Elyas", lastName: "Tarvanek", ssn: "400-00-2212" };

/* Her husband's job at the harbor's boatyard (made up). */
const w2: W2FactValue = {
  owner: "spouse",
  employerName: "Kachemak Boatworks Inc",
  employerEin: "00-0002211",
  employerAddress: { line1: "4460 Homer Spit Road", city: "Homer", state: "AK", zip: "99603" },
  employee: {
    firstName: HUSBAND.firstName,
    lastName: HUSBAND.lastName,
    ssn: HUSBAND.ssn,
    address: { line1: DYELIN.street, city: DYELIN.city, state: DYELIN.state, zip: DYELIN.zip },
  },
  box1: 40000,
  box2: 3000,
  box3: 40000,
  box4: 2480,
  box5: 40000,
  box6: 580,
};

/* Her crab and halibut boat (Schedule C, cash method, material participation). */
const boat: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Commercial fishing (crab and halibut)",
  code: "114110",
  name: "F/V Northern Tern",
  address: { street: DYELIN.street, city: DYELIN.city, state: DYELIN.state, zip: DYELIN.zip },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 300000,
  expenses: { insurance: 24000, repairs: 38000, supplies: 108000 },
  specifiedService: false,
  w2WagesPaid: 0,
  qualifiedPropertyUbia: 0,
};

/* The joint return: both spouses' income counts in the total (irs-pub-505-2025::sec::farming-and-fishing::b01). */
const grossIncome2025: FarmerGrossIncomeFactValue = {
  totalGrossIncome: 340000,
  farmingOrFishingGrossIncome: 300000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: DYELIN_USER_ID, taxYear: DYELIN_TAX_YEAR, suffix, value });

/* One payment before January 15, 2026, and one after it that covers the rest. */
const PAYMENTS: Array<[string, { date: string; amount: number }]> = [
  ["2025-january", { date: "2026-01-14", amount: 10000 }],
  ["2025-february", { date: "2026-02-20", amount: 25000 }],
];

export const dyelinFacts: TaxFactRow[] = [
  idFact("name.first", DYELIN.firstName),
  idFact("name.last", DYELIN.lastName),
  idFact("ssn", DYELIN.ssn),
  idFact("dob", "07/19/1983"),
  idFact("address.street", DYELIN.street),
  idFact("address.city", DYELIN.city),
  idFact("address.state", DYELIN.state),
  idFact("address.zip", DYELIN.zip),
  idFact("occupation", "Commercial fisher"),
  idFact("phone", "907-555-0177"),
  fact("identity", SPOUSE_KEYS.firstName, HUSBAND.firstName, `${VERBAL}.`),
  fact("identity", SPOUSE_KEYS.lastName, HUSBAND.lastName, `${VERBAL}.`),
  fact("identity", SPOUSE_KEYS.ssn, HUSBAND.ssn, "Stated by Elyas."),
  fact("identity", SPOUSE_KEYS.dob, "02/03/1981", "Stated by Elyas."),
  fact("identity", SPOUSE_KEYS.occupation, "Boatyard mechanic", "Stated by Elyas."),
  fact("wages", makeW2FactKey("kachemak-boatworks"), w2, "W-2 from Kachemak Boatworks Inc."),
  fact(
    "self_employment",
    makeBusinessFactKey("northern-tern"),
    boat,
    `${VERBAL}: the boat's books and fish tickets.`,
  ),
  fact(
    "self_employment",
    FARMER_OR_FISHERMAN_KEYS.grossIncome2025,
    grossIncome2025,
    `${VERBAL}: Schedule C line 7 $300,000 and Elyas's wages $40,000.`,
  ),
  ...PAYMENTS.map(([slug, value]) =>
    fact(
      "estimated_payments",
      makeEstimatedTaxPaymentFactKey(slug),
      value,
      `${VERBAL}: EFTPS confirmation.`,
    ),
  ),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.federalTax,
    18500,
    `${VERBAL}: her 2024 single return $15,000 and Elyas's $3,500.`,
  ),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.federalAgi,
    150000,
    `${VERBAL}: both 2024 returns, line 11.`,
  ),
  fact(
    "estimated_payments",
    PRIOR_YEAR_KEYS.filedJointReturn,
    false,
    `${VERBAL}: they married in June 2025; each filed single for 2024.`,
  ),
  fact(
    "estimated_payments",
    FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2,
    false,
    `${VERBAL}: they file on March 30, 2026.`,
  ),
];

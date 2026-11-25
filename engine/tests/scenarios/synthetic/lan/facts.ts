/*
 * A made-up couple (README.md): every name and amount is invented. The
 * Schedule K-1 (Form 1120-S) is a made PDF in docs/ (generate-docs.ts); the W-2
 * has none: its facts are the boxes as it would print them. The rest are the
 * couple's answers.
 */

import {
  EIC_KEYS,
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeDependentFactKey,
  makeK1HoldingFactKey,
  makeSCorporationK1FactKey,
  makeW2FactKey,
  type BusinessFactValue,
  type DependentFactValue,
  type K1HoldingFactValue,
  type SCorporationK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LAN_USER_ID = "lan-integration";
export const LAN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LAN_USER_ID,
  taxYear: LAN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const LAN = {
  taxpayer: { firstName: "Nysa", lastName: "Mandragoran", ssn: "400-00-2071" },
  spouse: { firstName: "Lan", lastName: "Mandragoran", ssn: "400-00-2072" },
  street: "1407 Seven Towers Lane",
  city: "Austin",
  state: "TX",
  zip: "78704",
};

const address = { line1: LAN.street, city: LAN.city, state: LAN.state, zip: LAN.zip };

const FENCING_EIN = "00-0001120";
const FENCING_ID = "malkier-fencing";

/* Lan's W-2 from the S corporation he owns and works in: a small salary. */
const lanW2: W2FactValue = {
  owner: "spouse",
  employerName: "Malkier Fencing Academy, Inc.",
  employerEin: FENCING_EIN,
  employerAddress: address,
  employee: { ...LAN.spouse, address },
  box1: 6000,
  box2: 0,
  box3: 6000,
  box4: 372,
  box5: 6000,
  box6: 87,
};

/* Nysa's own business: herbal tea blends sold at markets (Schedule C). */
const teaBusiness: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Herbal tea blends",
  code: "445298",
  name: "Two Rivers Herbal Teas",
  address: { street: LAN.street, city: LAN.city, state: LAN.state, zip: LAN.zip },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: false,
  sellsGoods: false,
  grossReceipts: 7400,
  expenses: { advertising: 500, supplies: 1900 },
  specifiedService: false,
};

/* The K-1 the corporation issued to Lan: box 1 only, no section 199A statement. */
export const fencingK1: SCorporationK1FactValue = {
  form: "1120-S",
  entityName: "Malkier Fencing Academy, Inc.",
  entityEin: FENCING_EIN,
  finalK1: false,
  amendedK1: false,
  allocationPercent: 100,
  sharesAtStart: 1000,
  sharesAtEnd: 1000,
  boxes: [{ box: "1", amount: 15000 }],
};

/* Lan's answers about the corporation: he runs the academy and teaches every day. */
const fencingHolding: K1HoldingFactValue = {
  owner: "spouse",
  materiallyParticipated: true,
};

const son: DependentFactValue = {
  firstName: "Isam",
  lastName: "Mandragoran",
  ssn: "400-00-2073",
  relationship: "Son",
  dob: "04/18/2007",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LAN_USER_ID, taxYear: LAN_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-22";

export const lanFacts: TaxFactRow[] = [
  idFact("name.first", LAN.taxpayer.firstName),
  idFact("name.last", LAN.taxpayer.lastName),
  idFact("ssn", LAN.taxpayer.ssn),
  idFact("dob", "02/09/1990"),
  idFact("address.street", LAN.street),
  idFact("address.city", LAN.city),
  idFact("address.state", LAN.state),
  idFact("address.zip", LAN.zip),
  idFact("occupation", "Tea blender"),
  idFact("phone", "512-555-0172"),
  fact("identity", SPOUSE_KEYS.firstName, LAN.spouse.firstName, VERBAL),
  fact("identity", SPOUSE_KEYS.lastName, LAN.spouse.lastName, VERBAL),
  fact("identity", SPOUSE_KEYS.occupation, "Fencing instructor", VERBAL),
  fact("identity", SPOUSE_KEYS.ssn, LAN.spouse.ssn, VERBAL),
  fact("identity", SPOUSE_KEYS.dob, "11/30/1986", VERBAL),
  fact(
    "wages",
    makeW2FactKey("malkier-fencing"),
    lanW2,
    "W-2 from Malkier Fencing Academy, Inc. (Lan's).",
  ),
  fact(
    "self_employment",
    makeBusinessFactKey("two-rivers-teas"),
    teaBusiness,
    `${VERBAL}: Nysa's tea business, receipts and expenses from her ledger.`,
  ),
  fact(
    "k1",
    makeSCorporationK1FactKey(FENCING_ID),
    fencingK1,
    "Schedule K-1 (Form 1120-S) from Malkier Fencing Academy, Inc. (Lan's) (docs/01-schedule-k1-malkier-fencing.pdf).",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(FENCING_ID),
    fencingHolding,
    `${VERBAL}: Lan runs the academy full time (material participation).`,
  ),
  fact("dependents", makeDependentFactKey("isam-mandragoran"), son, VERBAL),
  fact("other", EIC_KEYS.nonresidentAlien, false, VERBAL),
  fact("other", EIC_KEYS.deniedInEarlierYear, false, VERBAL),
  fact("other", EIC_KEYS.barredByIrs, false, VERBAL),
];

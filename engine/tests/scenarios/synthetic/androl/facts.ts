/*
 * A made-up couple (README.md): every name and amount is invented. The
 * documents have no PDFs: their facts are the boxes as they would print them.
 * The rest are their answers.
 */

import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  SPOUSE_KEYS,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ANDROL_USER_ID = "androl-integration";
export const ANDROL_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ANDROL_USER_ID,
  taxYear: ANDROL_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ANDROL = {
  taxpayer: { firstName: "Androl", lastName: "Tarnwick", ssn: "400-00-4621" },
  spouse: { firstName: "Pevara", lastName: "Tarnwick", ssn: "400-00-4622" },
  street: "461 Ferry Landing Road",
  city: "Galveston",
  state: "TX",
  zip: "77550",
};

const address = { line1: ANDROL.street, city: ANDROL.city, state: ANDROL.state, zip: ANDROL.zip };

/* Androl's W-2: over $200,000 of Medicare wages, so his employer withheld 0.9% more. */
const androlW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Gulf Ward Shipwrights, Inc.",
  employerEin: "00-0004621",
  employerAddress: address,
  employee: { ...ANDROL.taxpayer, address },
  box1: 380000,
  box2: 70000,
  box3: 176100,
  box4: 10918.2,
  box5: 380000,
  box6: 7130,
};

/* Pevara's W-2. */
const pevaraW2: W2FactValue = {
  owner: "spouse",
  employerName: "Tower Point Harbor Authority",
  employerEin: "00-0004622",
  employerAddress: address,
  employee: { ...ANDROL.spouse, address },
  box1: 190000,
  box2: 30000,
  box3: 176100,
  box4: 10918.2,
  box5: 190000,
  box6: 2755,
};

/*
 * The K-1 of a ferry partnership Androl invested in as a limited partner and
 * works in more than 500 hours a year: a large ordinary loss from a new
 * ferry. A limited partner has no self-employment earnings (box 14 blank).
 * No section 199A statement came with it.
 */
const FERRY_ID = "black-tower-ferry";
const ferryK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Black Tower Ferry Partners LP",
  entityEin: "00-0004623",
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 40,
  lossPercent: 40,
  capitalPercent: 40,
  boxes: [{ box: "1", amount: -400000 }],
};

/* He works in the ferry business more than 500 hours a year (material participation test 1). */
const ferryHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 700000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ANDROL_USER_ID, taxYear: ANDROL_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-24";

export const androlFacts: TaxFactRow[] = [
  idFact("name.first", ANDROL.taxpayer.firstName),
  idFact("name.last", ANDROL.taxpayer.lastName),
  idFact("ssn", ANDROL.taxpayer.ssn),
  idFact("dob", "03/14/1978"),
  idFact("address.street", ANDROL.street),
  idFact("address.city", ANDROL.city),
  idFact("address.state", ANDROL.state),
  idFact("address.zip", ANDROL.zip),
  idFact("occupation", "Shipwright"),
  idFact("phone", "409-555-0462"),
  fact("identity", SPOUSE_KEYS.firstName, ANDROL.spouse.firstName, VERBAL),
  fact("identity", SPOUSE_KEYS.lastName, ANDROL.spouse.lastName, VERBAL),
  fact("identity", SPOUSE_KEYS.ssn, ANDROL.spouse.ssn, VERBAL),
  fact("identity", SPOUSE_KEYS.dob, "09/02/1979", VERBAL),
  fact(
    "wages",
    makeW2FactKey("gulf-ward-shipwrights"),
    androlW2,
    "W-2 from Gulf Ward Shipwrights, Inc.",
  ),
  fact(
    "wages",
    makeW2FactKey("tower-point-harbor"),
    pevaraW2,
    "W-2 from Tower Point Harbor Authority (Pevara's).",
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(FERRY_ID),
    ferryK1,
    "Schedule K-1 (Form 1065) from Black Tower Ferry Partners LP (Androl's).",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(FERRY_ID),
    ferryHolding,
    `${VERBAL}: Androl's basis from his 2024 partner's basis worksheet.`,
  ),
  fact(
    "capital_gains",
    CAPITAL_LOSS_CARRYOVER_KEYS.longTerm,
    20000,
    `${VERBAL}: 2024 Capital Loss Carryover Worksheet line 13, from stock sold in 2023.`,
  ),
];

/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2 and the Schedule K-1 (Form
 * 1041) would print them, the trustee's foreign income statement, and the
 * taxpayer's answers.
 */

import {
  PRIOR_YEAR_KEYS,
  makeK1HoldingFactKey,
  makeTrustK1FactKey,
  makeW2FactKey,
  type K1HoldingFactValue,
  type TrustK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const THOM_USER_ID = "thom-synthetic";
export const THOM_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: THOM_USER_ID,
  taxYear: THOM_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const THOM = {
  firstName: "Thom",
  lastName: "Merrilin",
  ssn: "400-00-1041",
  street: "418 Gleeman Court",
  city: "Reno",
  state: "NV",
  zip: "89501",
};

const address = { line1: THOM.street, city: THOM.city, state: THOM.state, zip: THOM.zip };

const TRUST_ID = "owyn-family-trust";

/* Thom's W-2 from the theater where he works. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Truth Street Playhouse Inc.",
  employerEin: "00-0001041",
  employerAddress: { line1: "75 Virginia Street", city: "Reno", state: "NV", zip: "89501" },
  employee: { firstName: THOM.firstName, lastName: THOM.lastName, ssn: THOM.ssn, address },
  box1: 152000,
  box2: 27500,
  box3: 160000,
  box4: 9920,
  box5: 160000,
  box6: 2320,
  box12: [{ code: "D", amount: 8000 }],
  box13: { retirementPlan: true },
};

/*
 * The K-1 the trustee issued to Thom, a beneficiary of his late nephew's
 * trust: interest, ordinary dividends of which part is qualified, and box 14
 * code B foreign taxes on the trust's Canadian shares. The trustee's
 * statement gives the foreign-source dividends and their qualified part.
 */
const trustK1: TrustK1FactValue = {
  form: "1041",
  entityName: "Owyn Family Trust",
  entityEin: "00-0004104",
  finalK1: false,
  amendedK1: false,
  isEstate: false,
  boxes: [
    { box: "1", amount: 1600 },
    { box: "2a", amount: 8400 },
    { box: "2b", amount: 6300 },
    { box: "14", code: "B", amount: 640 },
  ],
  foreignIncome: {
    grossIncome: 5200,
    qualifiedDividends: 4100,
    country: "Canada",
    incomeKind: "dividends",
  },
};

const trustHolding: K1HoldingFactValue = { owner: "taxpayer" };

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: THOM_USER_ID, taxYear: THOM_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-22";

export const thomFacts: TaxFactRow[] = [
  idFact("name.first", THOM.firstName),
  idFact("name.last", THOM.lastName),
  idFact("ssn", THOM.ssn),
  idFact("dob", "06/14/1971"),
  idFact("address.street", THOM.street),
  idFact("address.city", THOM.city),
  idFact("address.state", THOM.state),
  idFact("address.zip", THOM.zip),
  idFact("occupation", "Stage director"),
  idFact("phone", "775-555-0141"),
  fact("wages", makeW2FactKey("truth-street-playhouse"), w2, "W-2 from Truth Street Playhouse."),
  fact(
    "k1",
    makeTrustK1FactKey(TRUST_ID),
    trustK1,
    "Schedule K-1 (Form 1041) from the Owyn Family Trust, with the trustee's foreign income statement.",
  ),
  fact("k1", makeK1HoldingFactKey(TRUST_ID), trustHolding, `${VERBAL}: Thom's own K-1.`),
  fact("other", PRIOR_YEAR_KEYS.foreignTaxCarryoverPassive, 0, `${VERBAL}: none.`),
  fact("other", PRIOR_YEAR_KEYS.foreignTaxCarryoverGeneral, 0, `${VERBAL}: none.`),
  fact("other", PRIOR_YEAR_KEYS.foreignLossAccounts, false, `${VERBAL}: none.`),
];

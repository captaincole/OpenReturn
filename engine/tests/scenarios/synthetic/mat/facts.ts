/*
 * A made-up couple (README.md): every name and amount is invented. The
 * Schedule K-1 (Form 1041) with its box 14 code I statement is a made PDF in
 * docs/ (generate-docs.ts); the two W-2s and the 1099-INT have none: their
 * facts are the boxes as they would print them. The rest are the couple's
 * answers.
 */

import {
  SPOUSE_KEYS,
  makeInterestFactKey,
  makeK1HoldingFactKey,
  makeTrustK1FactKey,
  makeW2FactKey,
  type InterestFactValue,
  type K1HoldingFactValue,
  type TrustK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const MAT_USER_ID = "mat-integration";
export const MAT_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: MAT_USER_ID,
  taxYear: MAT_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const MAT = {
  taxpayer: { firstName: "Mat", lastName: "Damodred", ssn: "400-00-2091" },
  spouse: { firstName: "Leilwin", lastName: "Damodred", ssn: "400-00-2092" },
  street: "27 Maerone Lane",
  city: "Austin",
  state: "TX",
  zip: "78704",
};

const address = { line1: MAT.street, city: MAT.city, state: MAT.state, zip: MAT.zip };

const TRUST_ID = "shandalle-family-trust";

/* Mat's W-2 from his job. */
const matW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Ebou Dar Logistics LLC",
  employerEin: "00-0002091",
  employerAddress: { line1: "900 Congress Avenue", city: "Austin", state: "TX", zip: "78701" },
  employee: { ...MAT.taxpayer, address },
  box1: 118000,
  box2: 17500,
  box3: 124000,
  box4: 7688,
  box5: 124000,
  box6: 1798,
  box12: [{ code: "D", amount: 6000 }],
  box13: { retirementPlan: true },
};

/* Leilwin's W-2 from her job. */
const leilwinW2: W2FactValue = {
  owner: "spouse",
  employerName: "Tanchico Harbor Engineering Inc.",
  employerEin: "00-0002092",
  employerAddress: { line1: "300 Lamar Boulevard", city: "Austin", state: "TX", zip: "78703" },
  employee: { ...MAT.spouse, address },
  box1: 92000,
  box2: 12800,
  box3: 96000,
  box4: 5952,
  box5: 96000,
  box6: 1392,
  box12: [{ code: "D", amount: 4000 }],
  box13: { retirementPlan: true },
};

/* The couple's joint savings account. */
const bankInterest: InterestFactValue = {
  payerName: "Hinderstap Savings Bank",
  payerTin: "00-0002093",
  box1: 420,
};

/*
 * The K-1 the trustee issued to Leilwin, a beneficiary of her family's trust:
 * interest, ordinary dividends of which part is qualified, a net long-term
 * capital gain, and the box 14 code I statement with section 199A dividends
 * (part of the ordinary dividends that are not qualified).
 */
export const trustK1: TrustK1FactValue = {
  form: "1041",
  entityName: "Shandalle Family Trust",
  entityEin: "00-0004141",
  finalK1: false,
  amendedK1: false,
  isEstate: false,
  boxes: [
    { box: "1", amount: 1850 },
    { box: "2a", amount: 3600 },
    { box: "2b", amount: 2900 },
    { box: "4a", amount: 5400 },
    { box: "14", code: "I" },
  ],
  section199A: { section199ADividends: 480 },
};

const trustHolding: K1HoldingFactValue = { owner: "spouse" };

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: MAT_USER_ID, taxYear: MAT_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-22";

export const matFacts: TaxFactRow[] = [
  idFact("name.first", MAT.taxpayer.firstName),
  idFact("name.last", MAT.taxpayer.lastName),
  idFact("ssn", MAT.taxpayer.ssn),
  idFact("dob", "04/12/1986"),
  idFact("address.street", MAT.street),
  idFact("address.city", MAT.city),
  idFact("address.state", MAT.state),
  idFact("address.zip", MAT.zip),
  idFact("occupation", "Logistics manager"),
  idFact("phone", "512-555-0191"),
  fact("identity", SPOUSE_KEYS.firstName, MAT.spouse.firstName, VERBAL),
  fact("identity", SPOUSE_KEYS.lastName, MAT.spouse.lastName, VERBAL),
  fact("identity", SPOUSE_KEYS.occupation, "Marine engineer", VERBAL),
  fact("identity", SPOUSE_KEYS.ssn, MAT.spouse.ssn, VERBAL),
  fact("identity", SPOUSE_KEYS.dob, "09/30/1987", VERBAL),
  fact("wages", makeW2FactKey("ebou-dar-logistics"), matW2, "W-2 from Ebou Dar Logistics LLC."),
  fact(
    "wages",
    makeW2FactKey("tanchico-harbor"),
    leilwinW2,
    "W-2 from Tanchico Harbor Engineering Inc. (Leilwin).",
  ),
  fact(
    "investment_income",
    makeInterestFactKey("hinderstap-savings"),
    bankInterest,
    "1099-INT from Hinderstap Savings Bank.",
  ),
  fact(
    "k1",
    makeTrustK1FactKey(TRUST_ID),
    trustK1,
    "Schedule K-1 (Form 1041) from the Shandalle Family Trust, with its box 14 code I statement (docs/01-schedule-k1-shandalle-family-trust.pdf).",
  ),
  fact(
    "k1",
    makeK1HoldingFactKey(TRUST_ID),
    trustHolding,
    `${VERBAL}: Leilwin is the trust's beneficiary.`,
  ),
];

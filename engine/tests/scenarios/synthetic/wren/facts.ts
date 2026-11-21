/*
 * A made-up married couple (README.md): every name and amount is invented. No
 * input documents: the facts are the boxes as the documents would print them,
 * and the answers the couple states.
 */

import {
  SPOUSE_KEYS,
  makeRetirementDistributionFactKey,
  makeSaversCreditFactKey,
  makeW2FactKey,
  type RetirementDistributionFactValue,
  type SaversCreditFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const WREN_USER_ID = "wren-integration";
export const WREN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: WREN_USER_ID,
  taxYear: WREN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const WREN = {
  firstName: "Wren",
  lastName: "Ashby",
  ssn: "400-00-8880",
  street: "1417 Mesquite Bend Drive",
  city: "Lubbock",
  state: "TX",
  zip: "79416",
};

export const DORIAN = { firstName: "Dorian", lastName: "Ashby", ssn: "400-00-8881" };

const address = { line1: WREN.street, city: WREN.city, state: WREN.state, zip: WREN.zip };

// Wren's W-2 from Caprock Dental Group (made up): a 401(k) deferral, code D.
const wrenW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Caprock Dental Group PLLC",
  employerEin: "00-0008880",
  employerAddress: { line1: "620 Slide Road", city: "Lubbock", state: "TX", zip: "79414" },
  employee: { firstName: WREN.firstName, lastName: WREN.lastName, ssn: WREN.ssn, address },
  box1: 29000,
  box2: 850,
  box3: 30800,
  box4: 1909.6,
  box5: 30800,
  box6: 446.6,
  box12: [{ code: "D", amount: 1800 }],
  box13: { retirementPlan: true },
};

// Dorian's W-2 from Llano Estacado Freight (made up): a designated Roth 401(k) deferral, code AA.
const dorianW2: W2FactValue = {
  owner: "spouse",
  employerName: "Llano Estacado Freight Co",
  employerEin: "00-0008881",
  employerAddress: { line1: "3300 Avenue Q", city: "Lubbock", state: "TX", zip: "79411" },
  employee: { firstName: DORIAN.firstName, lastName: DORIAN.lastName, ssn: DORIAN.ssn, address },
  box1: 18500,
  box2: 400,
  box3: 18500,
  box4: 1147,
  box5: 18500,
  box6: 268.25,
  box12: [{ code: "AA", amount: 900 }],
  box13: { retirementPlan: true },
};

/*
 * 1099-R from Plainsman Retirement Services (made up): Dorian's old 401(k) went
 * straight to an IRA, a direct rollover (code G). It stays off Form 8880 line 4.
 */
const dorianRollover: RetirementDistributionFactValue = {
  payerName: "Plainsman Retirement Services",
  planName: "Llano Estacado Freight 401(k) Plan",
  owner: "spouse",
  box1: 4000,
  box2a: 0,
  box7: "G",
  box7IraSepSimple: false,
};

// Wren: $1,000 to a Roth IRA for 2025; no distribution in the testing period.
const wrenSaver: SaversCreditFactValue = {
  fullTimeStudent: false,
  claimedAsDependent: false,
  rothIraContributions: 1000,
  otherDistributions: 0,
};

// Dorian: $1,500 to a Roth IRA for 2025; took $300 out of a Roth IRA in 2024 (a joint year).
const dorianSaver: SaversCreditFactValue = {
  fullTimeStudent: false,
  claimedAsDependent: false,
  rothIraContributions: 1500,
  otherDistributions: 300,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: WREN_USER_ID, taxYear: WREN_TAX_YEAR, suffix, value });

export const wrenFacts: TaxFactRow[] = [
  idFact("name.first", WREN.firstName),
  idFact("name.last", WREN.lastName),
  idFact("ssn", WREN.ssn),
  idFact("dob", "03/22/1994"),
  idFact("address.street", WREN.street),
  idFact("address.city", WREN.city),
  idFact("address.state", WREN.state),
  idFact("address.zip", WREN.zip),
  idFact("occupation", "Dental assistant"),
  idFact("phone", "806-555-0188"),
  fact("identity", SPOUSE_KEYS.firstName, DORIAN.firstName, "Stated by Wren."),
  fact("identity", SPOUSE_KEYS.lastName, DORIAN.lastName, "Stated by Wren."),
  fact("identity", SPOUSE_KEYS.ssn, DORIAN.ssn, "Dorian's W-2, box a."),
  fact("identity", SPOUSE_KEYS.dob, "11/05/1992", "Stated by Dorian."),
  fact("wages", makeW2FactKey("caprock-dental"), wrenW2, "W-2 from Caprock Dental Group."),
  fact(
    "wages",
    makeW2FactKey("llano-estacado-freight"),
    dorianW2,
    "W-2 from Llano Estacado Freight.",
  ),
  fact(
    "retirement",
    makeRetirementDistributionFactKey("plainsman-retirement", "code-g"),
    dorianRollover,
    "1099-R from Plainsman Retirement Services, a direct rollover.",
  ),
  fact(
    "retirement",
    makeSaversCreditFactKey("taxpayer"),
    wrenSaver,
    "Stated by Wren: not a student, nobody claims her, $1,000 Roth IRA for 2025, no withdrawals 2023–2026.",
  ),
  fact(
    "retirement",
    makeSaversCreditFactKey("spouse"),
    dorianSaver,
    "Stated by Dorian: not a student, nobody claims him, $1,500 Roth IRA for 2025, $300 Roth IRA withdrawal in 2024.",
  ),
];

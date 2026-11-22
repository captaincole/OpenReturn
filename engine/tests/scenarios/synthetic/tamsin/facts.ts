/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the documents would print them.
 */

import {
  makeArmedForcesMoveFactKey,
  makeW2FactKey,
  type ArmedForcesMoveFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const TAMSIN_USER_ID = "tamsin-integration";
export const TAMSIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: TAMSIN_USER_ID,
  taxYear: TAMSIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const TAMSIN = {
  firstName: "Tamsin",
  lastName: "Halloway",
  ssn: "400-00-3903",
  street: "418 Juniper Ridge Drive",
  city: "Killeen",
  state: "TX",
  zip: "76542",
};

const address = { line1: TAMSIN.street, city: TAMSIN.city, state: TAMSIN.state, zip: TAMSIN.zip };

/*
 * W-2 from a made-up military payroll office. Box 12 code P: moving expense
 * reimbursements paid for the move, not in box 1.
 */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Frontier Garrison Payroll Office",
  employerEin: "00-0003903",
  employerAddress: { line1: "100 Muster Road", city: "Killeen", state: "TX", zip: "76544" },
  employee: { firstName: TAMSIN.firstName, lastName: TAMSIN.lastName, ssn: TAMSIN.ssn, address },
  box1: 58400,
  box2: 4100,
  box3: 58400,
  box4: 3620.8,
  box5: 58400,
  box6: 846.8,
  box12: [{ code: "P", amount: 3150 }],
};

/*
 * The move, by a military order for a permanent change of station (made up).
 * Line 4 is not stated: the form takes the W-2 code P amount.
 */
const move: ArmedForcesMoveFactValue = {
  description: "Permanent change of station, Colorado Springs, CO to Killeen, TX",
  certifiesRequirements: true,
  householdGoods: 2860.45,
  travel: { lodging: 612.4, vehicleMiles: 820, parkingAndTolls: 18.5 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: TAMSIN_USER_ID, taxYear: TAMSIN_TAX_YEAR, suffix, value });

export const tamsinFacts: TaxFactRow[] = [
  idFact("name.first", TAMSIN.firstName),
  idFact("name.last", TAMSIN.lastName),
  idFact("ssn", TAMSIN.ssn),
  idFact("dob", "03/22/1994"),
  idFact("address.street", TAMSIN.street),
  idFact("address.city", TAMSIN.city),
  idFact("address.state", TAMSIN.state),
  idFact("address.zip", TAMSIN.zip),
  idFact("occupation", "Army Staff Sergeant"),
  idFact("phone", "254-555-0139"),
  fact(
    "wages",
    makeW2FactKey("frontier-garrison"),
    w2,
    "W-2 from Frontier Garrison Payroll Office.",
  ),
  fact(
    "other",
    makeArmedForcesMoveFactKey("pcs-2025"),
    move,
    "Verbal, 2026-11-21: PCS move under a military order; receipts for movers, lodging and mileage.",
  ),
];

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

export const CORWIN_USER_ID = "corwin-integration";
export const CORWIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-21T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: CORWIN_USER_ID,
  taxYear: CORWIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const CORWIN = {
  firstName: "Corwin",
  lastName: "Marchetti",
  ssn: "400-00-3904",
  street: "2271 Saltmarsh Lane",
  city: "Jacksonville",
  state: "FL",
  zip: "32233",
};

const address = { line1: CORWIN.street, city: CORWIN.city, state: CORWIN.state, zip: CORWIN.zip };

/*
 * W-2 from a made-up military payroll office. Box 12 code P: moving expense
 * reimbursements paid for the move, not in box 1. They are more than the
 * move cost, and box 1 does not hold the excess.
 */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Coastal Fleet Payroll Office",
  employerEin: "00-0003904",
  employerAddress: { line1: "40 Anchorage Way", city: "Jacksonville", state: "FL", zip: "32228" },
  employee: { firstName: CORWIN.firstName, lastName: CORWIN.lastName, ssn: CORWIN.ssn, address },
  box1: 52300,
  box2: 4000,
  box3: 52300,
  box4: 3242.6,
  box5: 52300,
  box6: 758.35,
  box12: [{ code: "P", amount: 4200 }],
};

/*
 * The move, by a military order for a permanent change of station (made up).
 * Line 4 is not stated: the form takes the W-2 code P amount.
 */
const move: ArmedForcesMoveFactValue = {
  description: "Permanent change of station, Pensacola, FL to Jacksonville, FL",
  certifiesRequirements: true,
  householdGoods: 2789.65,
  travel: { lodging: 128.4, vehicleMiles: 360, parkingAndTolls: 5.75 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: CORWIN_USER_ID, taxYear: CORWIN_TAX_YEAR, suffix, value });

export const corwinFacts: TaxFactRow[] = [
  idFact("name.first", CORWIN.firstName),
  idFact("name.last", CORWIN.lastName),
  idFact("ssn", CORWIN.ssn),
  idFact("dob", "08/14/1996"),
  idFact("address.street", CORWIN.street),
  idFact("address.city", CORWIN.city),
  idFact("address.state", CORWIN.state),
  idFact("address.zip", CORWIN.zip),
  idFact("occupation", "Navy Petty Officer"),
  idFact("phone", "904-555-0172"),
  fact("wages", makeW2FactKey("coastal-fleet"), w2, "W-2 from Coastal Fleet Payroll Office."),
  fact(
    "other",
    makeArmedForcesMoveFactKey("pcs-2025"),
    move,
    "Verbal, 2026-11-21: PCS move under a military order; receipts for movers, lodging and mileage.",
  ),
];

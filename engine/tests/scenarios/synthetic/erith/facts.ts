/*
 * A made-up taxpayer (README.md): a single filer who moved inside California,
 * Fresno to Oakland, for a new job, and whose employer paid a flat relocation
 * allowance outside W-2 box 1 that is more than the move cost. Every name,
 * number and address is invented. No input documents: the facts are the boxes
 * as the documents would print them, and the move is the taxpayer's receipts.
 */

import {
  makeCaWorkMoveFactKey,
  makeW2FactKey,
  type CaWorkMoveFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ERITH_USER_ID = "erith-synthetic";
export const ERITH_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";
const HOME = { line1: "618 Lakeshore Terrace", city: "Oakland", state: "CA", zip: "94610" };
const TAXPAYER = { firstName: "Erith", lastName: "Calloway", ssn: "400-00-3914" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ERITH_USER_ID,
  taxYear: ERITH_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ERITH_USER_ID, taxYear: ERITH_TAX_YEAR, suffix, value });

const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Bayline Transit Analytics",
  employerEin: "12-3913002",
  employerAddress: { line1: "1450 Broadway Plaza", city: "Oakland", state: "CA", zip: "94612" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 61250,
  box2: 5100,
  box3: 61250,
  box4: 3797.5,
  box5: 61250,
  box6: 888.13,
  box14: [{ label: "CA SDI", amount: 735 }],
  box15: "CA",
  box16: 61250,
  box17: 1450,
};

/*
 * The move (made up). Old home in Fresno: 8 miles to the old workplace, 186
 * miles to the new one. Movers $1,940.30. One drive of 190 miles, tolls $7.
 * The employer paid a flat $3,000 relocation allowance that is not in W-2 box 1.
 */
const move: CaWorkMoveFactValue = {
  description: "New job, Fresno to Oakland, June 2025",
  milesOldHomeToNewWorkplace: 186,
  milesOldHomeToOldWorkplace: 8,
  meetsTimeTest: true,
  householdGoods: 1940.3,
  travel: { vehicleMiles: 190, parkingAndTolls: 7 },
  employerPaidNotInWages: 3000,
};

export const erithFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "01/30/1996"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Alameda"),
  idFact("occupation", "Transit data analyst"),
  idFact("phone", "510-555-0177"),
  fact("wages", makeW2FactKey("bayline"), w2, "W-2 from Bayline Transit Analytics."),
  fact(
    "other",
    makeCaWorkMoveFactKey("oakland-2025"),
    move,
    "Verbal, 2026-11-22: moved for the new job; mover's invoice, mileage log, the employer's allowance letter ($3,000, not in W-2 box 1). Full time in Oakland since June.",
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];

/*
 * A made-up taxpayer (README.md): a single filer who moved inside California,
 * Sacramento to San Diego, for a new job. Every name, number and address is
 * invented. No input documents: the facts are the boxes as the documents would
 * print them, and the move is the taxpayer's receipts.
 */

import {
  makeCaWorkMoveFactKey,
  makeW2FactKey,
  type CaWorkMoveFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LOIAL_USER_ID = "loial-synthetic";
export const LOIAL_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";
const HOME = { line1: "4410 Coronado Bluff Ct", city: "San Diego", state: "CA", zip: "92109" };
const TAXPAYER = { firstName: "Loial", lastName: "Fennimore", ssn: "400-00-3913" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LOIAL_USER_ID,
  taxYear: LOIAL_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LOIAL_USER_ID, taxYear: LOIAL_TAX_YEAR, suffix, value });

/* The new employer's W-2. Box 1 includes a $5,000 relocation bonus, so FTB 3913 line 4 is 0. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Harborlight Marine Instruments",
  employerEin: "12-3913001",
  employerAddress: { line1: "2200 Shelter Cove Way", city: "San Diego", state: "CA", zip: "92106" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 96400,
  box2: 9800,
  box3: 96400,
  box4: 5976.8,
  box5: 96400,
  box6: 1397.8,
  box14: [{ label: "CA SDI", amount: 1156.8 }],
  box15: "CA",
  box16: 96400,
  box17: 3900,
};

/*
 * The move (made up). Old home in Sacramento: 12 miles to the old workplace,
 * 503 miles to the new one. Movers $6,842.50 and 30 days of storage $415.25.
 * One drive of 505 miles, a motel night $189.40, tolls and parking $23.75.
 */
const move: CaWorkMoveFactValue = {
  description: "New job, Sacramento to San Diego, March 2025",
  milesOldHomeToNewWorkplace: 503,
  milesOldHomeToOldWorkplace: 12,
  meetsTimeTest: true,
  householdGoods: 7257.75,
  travel: { lodging: 189.4, vehicleMiles: 505, parkingAndTolls: 23.75 },
  employerPaidNotInWages: 0,
};

export const loialFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "08/14/1990"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "San Diego"),
  idFact("occupation", "Electrical engineer"),
  idFact("phone", "619-555-0142"),
  fact("wages", makeW2FactKey("harborlight"), w2, "W-2 from Harborlight Marine Instruments."),
  fact(
    "other",
    makeCaWorkMoveFactKey("san-diego-2025"),
    move,
    "Verbal, 2026-11-22: moved for the new job; mover's invoice, storage receipt, motel receipt, mileage log. Full time in San Diego since March.",
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];

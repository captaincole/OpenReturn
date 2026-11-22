/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2s would print them, and the
 * expenses as his drill records would total them.
 */

import {
  makeEmployeeBusinessExpensesFactKey,
  makeW2FactKey,
  type EmployeeBusinessExpensesFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const RHUARC_USER_ID = "rhuarc-synthetic";
export const RHUARC_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

export const RHUARC = {
  firstName: "Rhuarc",
  lastName: "Delacorte",
  ssn: "400-00-2107",
  street: "77 Shade Oak Court",
  city: "Redding",
  state: "CA",
  zip: "96001",
};

const address = { line1: RHUARC.street, city: RHUARC.city, state: RHUARC.state, zip: RHUARC.zip };
const employee = {
  firstName: RHUARC.firstName,
  lastName: RHUARC.lastName,
  ssn: RHUARC.ssn,
  address,
};

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: RHUARC_USER_ID,
  taxYear: RHUARC_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/* His civilian job (a made-up utility). */
const civilianW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Shasta Ridge Water Utility",
  employerEin: "00-0002107",
  employerAddress: { line1: "1200 Reservoir Way", city: "Redding", state: "CA", zip: "96002" },
  employee,
  box1: 58000,
  box2: 4300,
  box3: 58000,
  box4: 3596,
  box5: 58000,
  box6: 841,
  box14: [{ label: "CA SDI", amount: 696 }],
  box15: "CA",
  box16: 58000,
  box17: 1900,
};

/* His reserve drill pay (a made-up payroll office). */
const reserveW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Reserve Component Pay Center",
  employerEin: "00-0002108",
  employerAddress: { line1: "8 Muster Drive", city: "Sacramento", state: "CA", zip: "95814" },
  employee,
  box1: 7400,
  box2: 300,
  box3: 7400,
  box4: 458.8,
  box5: 7400,
  box6: 107.3,
  box15: "CA",
  box16: 7400,
  box17: 150,
};

/*
 * Form 2106 for reserve travel more than 100 miles from home: twelve drill
 * weekends at a post 160 miles away, in his own car on the standard mileage
 * rate. The unit paid a travel allowance for the mileage and lodging, not in
 * box 1, that was more than those costs; it paid nothing toward meals.
 */
const expenses: EmployeeBusinessExpensesFactValue = {
  owner: "taxpayer",
  occupation: "Army Reserve sergeant",
  qualification: "armed_forces_reservist",
  parkingTollsTransportation: 96,
  overnightTravel: 1320,
  lodging: 1320,
  meals: 1680,
  reimbursements: { otherThanMeals: 4400 },
  federalPerDiemLodging: 1560,
  federalPerDiemMeals: 1476,
  vehicles: [
    {
      placedInService: "2022-05-10",
      totalMiles: 14000,
      businessMiles: 3840,
      averageDailyCommute: 22,
      commutingDays: 230,
      ownership: "owned",
      method: "standard_mileage",
    },
  ],
  vehicleAvailableOffDuty: true,
  anotherVehicleAvailable: false,
  hasEvidence: true,
  evidenceIsWritten: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: RHUARC_USER_ID, taxYear: RHUARC_TAX_YEAR, suffix, value });

export const rhuarcFacts: TaxFactRow[] = [
  idFact("name.first", RHUARC.firstName),
  idFact("name.last", RHUARC.lastName),
  idFact("ssn", RHUARC.ssn),
  idFact("dob", "11/03/1985"),
  idFact("address.street", RHUARC.street),
  idFact("address.city", RHUARC.city),
  idFact("address.state", RHUARC.state),
  idFact("address.zip", RHUARC.zip),
  idFact("address.county", "Shasta"),
  idFact("occupation", "Water systems operator"),
  idFact("phone", "530-555-0133"),
  fact("wages", makeW2FactKey("shasta-ridge"), civilianW2, "W-2 from Shasta Ridge Water Utility."),
  fact("wages", makeW2FactKey("reserve-pay"), reserveW2, "W-2 from Reserve Component Pay Center."),
  fact(
    "other",
    makeEmployeeBusinessExpensesFactKey("reserve-2025"),
    expenses,
    "Verbal, 2026-11-22: drill orders, mileage log, hotel folios and the unit's travel voucher.",
  ),
];

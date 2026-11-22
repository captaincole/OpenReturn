/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the facts are the boxes as the W-2 and the Form 1098 would print
 * them, and the expenses as her records would total them.
 */

import {
  MORTGAGE_KEYS,
  makeEmployeeBusinessExpensesFactKey,
  makeW2FactKey,
  type EmployeeBusinessExpensesFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const AVIENDHA_USER_ID = "aviendha-synthetic";
export const AVIENDHA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

export const AVIENDHA = {
  firstName: "Aviendha",
  lastName: "Thornwell",
  ssn: "400-00-2106",
  street: "418 Basalt Ridge Road",
  city: "Ellensburg",
  state: "WA",
  zip: "98926",
};

const address = {
  line1: AVIENDHA.street,
  city: AVIENDHA.city,
  state: AVIENDHA.state,
  zip: AVIENDHA.zip,
};

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: AVIENDHA_USER_ID,
  taxYear: AVIENDHA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

/*
 * W-2 from a made-up county. She is paid in part by the fees of her office.
 * Box 12 code L: the per diem the county paid for a state training trip, at
 * the federal rate and not in box 1.
 */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Coldwater Basin County",
  employerEin: "00-0002106",
  employerAddress: {
    line1: "100 Courthouse Square",
    city: "Ellensburg",
    state: "WA",
    zip: "98926",
  },
  employee: {
    firstName: AVIENDHA.firstName,
    lastName: AVIENDHA.lastName,
    ssn: AVIENDHA.ssn,
    address,
  },
  box1: 64000,
  box2: 6800,
  box3: 64000,
  box4: 3968,
  box5: 64000,
  box6: 928,
  box12: [{ code: "L", amount: 1200 }],
};

/*
 * Form 2106 for her fee-basis office. She is deaf: the sign language
 * interpreter she pays for meetings is an impairment-related work expense,
 * inside line 4. Vehicle 1 is a car she bought in March 2025; vehicle 2 is a
 * car she has leased since June 2024.
 */
const expenses: EmployeeBusinessExpensesFactValue = {
  owner: "taxpayer",
  occupation: "County constable (fee basis)",
  qualification: "fee_basis_official",
  parkingTollsTransportation: 386.4,
  overnightTravel: 2940.75,
  otherExpenses: 5610,
  impairmentRelatedWorkExpenses: 4800,
  meals: 1150,
  reimbursements: {
    singlePayment: { amount: 1200, coveredExpenses: 4090.75, coveredMeals: 1150 },
  },
  vehicles: [
    {
      placedInService: "2025-03-14",
      totalMiles: 18000,
      businessMiles: 13500,
      averageDailyCommute: 12,
      commutingDays: 220,
      ownership: "owned",
      method: "actual_expenses",
      operatingExpenses: 4850,
      depreciation: {
        basis: 34000,
        method: "200_db",
        subjectToPassengerAutomobileLimits: true,
        section179Cost: 8000,
        specialAllowance: "claimed",
        acquiredDate: "2025-03-14",
      },
    },
    {
      placedInService: "2024-06-01",
      totalMiles: 9000,
      businessMiles: 4500,
      averageDailyCommute: 8,
      commutingMiles: 1200,
      ownership: "leased",
      method: "actual_expenses",
      operatingExpenses: 2100,
      rentalCost: 5400,
      inclusionAmount: 15,
    },
  ],
  vehicleAvailableOffDuty: true,
  anotherVehicleAvailable: true,
  hasEvidence: true,
  evidenceIsWritten: true,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: AVIENDHA_USER_ID, taxYear: AVIENDHA_TAX_YEAR, suffix, value });

export const aviendhaFacts: TaxFactRow[] = [
  idFact("name.first", AVIENDHA.firstName),
  idFact("name.last", AVIENDHA.lastName),
  idFact("ssn", AVIENDHA.ssn),
  idFact("dob", "05/22/1988"),
  idFact("address.street", AVIENDHA.street),
  idFact("address.city", AVIENDHA.city),
  idFact("address.state", AVIENDHA.state),
  idFact("address.zip", AVIENDHA.zip),
  idFact("occupation", "County constable"),
  idFact("phone", "509-555-0121"),
  fact("wages", makeW2FactKey("coldwater-basin"), w2, "W-2 from Coldwater Basin County."),
  fact(
    "other",
    makeEmployeeBusinessExpensesFactKey("constable-2025"),
    expenses,
    "Verbal, 2026-11-22: her mileage log, receipts, the car's bill of sale and the lease.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.interestForm1098,
    11200,
    "Form 1098 from Basalt Range Savings, box 1; no points.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.outstandingPrincipalForm1098,
    268000,
    "Form 1098 from Basalt Range Savings, box 2.",
  ),
  fact(
    "mortgage",
    MORTGAGE_KEYS.originationDateForm1098,
    "04/09/2021",
    "Form 1098 from Basalt Range Savings, box 3.",
  ),
  fact(
    "state_local_tax",
    "state_local_tax.real_estate",
    3900,
    "Coldwater Basin County property tax bill, 2025.",
  ),
];

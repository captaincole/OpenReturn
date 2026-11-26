/*
 * A made-up landowner (README.md): every name and amount is invented. No input
 * documents: the W-2 holds its boxes as printed, and the farm rental fact holds
 * the amounts Jasin states from the farm's records and its Forms 1099.
 */

import {
  makeFarmRentalFactKey,
  makeW2FactKey,
  type FarmRentalFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const JASIN_USER_ID = "jasin-integration";
export const JASIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: JASIN_USER_ID,
  taxYear: JASIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const JASIN = {
  firstName: "Jasin",
  lastName: "Thornbury",
  ssn: "400-00-4835",
  street: "908 Palo Duro Trail",
  city: "Canyon",
  state: "TX",
  zip: "79015",
};

const address = { line1: JASIN.street, city: JASIN.city, state: JASIN.state, zip: JASIN.zip };

// W-2 from High Plains Animal Clinic (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "High Plains Animal Clinic PC",
  employerEin: "00-0004835",
  employerAddress: { line1: "1400 Fourth Avenue", city: "Canyon", state: "TX", zip: "79015" },
  employee: { firstName: JASIN.firstName, lastName: JASIN.lastName, ssn: JASIN.ssn, address },
  box1: 78000,
  box2: 13900,
  box3: 78000,
  box4: 4836,
  box5: 78000,
  box6: 1131,
};

/*
 * The Thornbury section in Deaf Smith County, rented to a tenant for a third of
 * the crop. Jasin made the management decisions and owns all of it.
 */
const farm: FarmRentalFactValue = {
  farmName: "Thornbury section, Deaf Smith County, TX",
  ein: "00-0484835",
  activelyParticipated: true,
  productionIncome: 48000,
  cooperativeDistributions: 2400,
  cooperativeDistributionsNotTaxable: 300,
  agriculturalProgramPayments: 9000,
  marketGain: 800,
  cccLoanElection: true,
  cccLoansReportedUnderElection: 5000,
  cccLoansForfeited: 6000,
  forfeitedCommodityBasis: 5400,
  cropInsuranceReceived: 7500,
  cropInsuranceDeferredTo2026: 3000,
  cropInsuranceDeferredFrom2024: 2000,
  otherIncome: 1150,
  expenses: {
    carAndTruck: 1200,
    chemicals: 2300,
    conservation: 20000,
    customHire: 1500,
    depreciation: 4200,
    employeeBenefits: 300,
    feed: 900,
    fertilizersAndLime: 3100,
    freightAndTrucking: 450,
    gasolineFuelAndOil: 650,
    insurance: 1800,
    mortgageInterest: 3600,
    otherInterest: 400,
    laborHired: 1000,
    pensionAndProfitSharing: 200,
    rentVehiclesMachineryEquipment: 700,
    rentOther: 500,
    repairsAndMaintenance: 1250,
    seedsAndPlants: 2000,
    storageAndWarehousing: 350,
    supplies: 275,
    taxes: 2900,
    utilities: 600,
    veterinaryBreedingMedicine: 425,
  },
  otherExpenses: [
    { description: "Accounting", amount: 650 },
    { description: "Legal fees", amount: 400 },
    { description: "Association dues", amount: 120 },
    { description: "Telephone", amount: 180 },
    { description: "Bank charges", amount: 60 },
    { description: "Travel to farm", amount: 340 },
  ],
  capitalizedCosts263A: 500,
  priorYearUnallowedLoss: 0,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: JASIN_USER_ID, taxYear: JASIN_TAX_YEAR, suffix, value });

export const jasinFacts: TaxFactRow[] = [
  idFact("name.first", JASIN.firstName),
  idFact("name.last", JASIN.lastName),
  idFact("ssn", JASIN.ssn),
  idFact("dob", "06/02/1979"),
  idFact("address.street", JASIN.street),
  idFact("address.city", JASIN.city),
  idFact("address.state", JASIN.state),
  idFact("address.zip", JASIN.zip),
  idFact("occupation", "Veterinary technician"),
  idFact("phone", "806-555-0148"),
  fact(
    "wages",
    makeW2FactKey("high-plains-animal-clinic"),
    w2,
    "W-2 from High Plains Animal Clinic.",
  ),
  fact(
    "rental",
    makeFarmRentalFactKey("thornbury-section"),
    farm,
    "Stated by Jasin from the farm's records: crop share sales, Form 1099-PATR, Forms 1099-G and CCC-1099-G, Form 1099-A, Form 1099-MISC box 9, and the expenses.",
  ),
];

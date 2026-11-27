/*
 * A made-up taxpayer (README.md): every name and amount is invented. The W-2
 * fact holds the boxes as the form would print them. The building fact holds
 * the amounts of the rehabilitation allocation's Form 8609
 * (docs/01-form-8609-marrow-court.pdf) and Haral's answers about 2025.
 */

import {
  makeLowIncomeHousingBuildingFactKey,
  makeW2FactKey,
  RENTAL_KEYS,
  type LowIncomeHousingBuildingFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const HARAL_USER_ID = "haral-integration";
export const HARAL_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: HARAL_USER_ID,
  taxYear: HARAL_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const HARAL = {
  firstName: "Haral",
  lastName: "Brightwater",
  ssn: "400-00-8610",
  street: "37 Pelican Shoal Drive",
  city: "Sarasota",
  state: "FL",
  zip: "34236",
};

const address = { line1: HARAL.street, city: HARAL.city, state: HARAL.state, zip: HARAL.zip };

// W-2 from a made-up engineering firm.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Gulfline Structural Partners",
  employerEin: "00-0008610",
  employerAddress: { line1: "1500 Main Street", city: "Sarasota", state: "FL", zip: "34236" },
  employee: { firstName: HARAL.firstName, lastName: HARAL.lastName, ssn: HARAL.ssn, address },
  box1: 168000,
  box2: 31000,
  box3: 168000,
  box4: 10416,
  box5: 168000,
  box6: 2436,
};

/*
 * Marrow Court (made up), a 30-unit building Haral owns alone. Its section
 * 42(e) rehabilitation was placed in service in 2015 with its own Form 8609;
 * 2015 is the first credit year, so 2025 is year 11. The rehabilitated units
 * filled up over 2015: the first-year modified percentage was .3750 and the
 * portion at the close of 2015 .9000. 27 of 30 units are low-income at the end
 * of 2025, the same as at the close of 2015.
 */
export const MARROW_COURT: LowIncomeHousingBuildingFactValue = {
  form8609: {
    buildingIdentificationNumber: "FL-15-01126",
    maximumCreditAmount: 97200,
    creditPercentage: 0.09,
    maximumQualifiedBasis: 1080000,
    eligibleBasis: 1200000,
    originalQualifiedBasis: 1080000,
    firstCreditYear: 2015,
  },
  allocation: "rehabilitation",
  hasSignedForm8609: true,
  qualifiedAtYearEnd: true,
  qualifiedBasisDecreased: false,
  yearEnd: {
    lowIncomeUnits: 27,
    residentialUnits: 30,
    lowIncomeFloorSpace: 23400,
    residentialFloorSpace: 25500,
  },
  limitedToMaximumQualifiedBasis: false,
  deepRentSkewed: "not_elected",
  atRiskFinancing: false,
  ownership: { share: 1 },
  minimumCreditPercentage: "nine_percent",
  firstYear: { modifiedPortion: 0.375, yearEndPortion: 0.9 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: HARAL_USER_ID, taxYear: HARAL_TAX_YEAR, suffix, value });

export const haralFacts: TaxFactRow[] = [
  idFact("name.first", HARAL.firstName),
  idFact("name.last", HARAL.lastName),
  idFact("ssn", HARAL.ssn),
  idFact("dob", "12/03/1968"),
  idFact("address.street", HARAL.street),
  idFact("address.city", HARAL.city),
  idFact("address.state", HARAL.state),
  idFact("address.zip", HARAL.zip),
  idFact("occupation", "Structural engineer"),
  idFact("phone", "941-555-0177"),
  fact("wages", makeW2FactKey("gulfline"), w2, "W-2 from Gulfline Structural Partners."),
  fact(
    "rental",
    makeLowIncomeHousingBuildingFactKey("marrow-court-rehab"),
    MARROW_COURT,
    "Form 8609 for the Marrow Court rehabilitation (docs/01-form-8609-marrow-court.pdf); Haral's 2015 Form 8609-A; the 2025 rent roll.",
  ),
  // A full-time engineer: not a real estate professional, so the building's credit is passive (Form 8582-CR).
  fact(
    "rental",
    RENTAL_KEYS.realEstateProfessional,
    false,
    "Verbal: he works full time as an engineer.",
  ),
];

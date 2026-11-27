/*
 * A made-up taxpayer (README.md): every name and amount is invented. The W-2
 * fact holds the boxes as the form would print them. The building fact holds
 * the amounts of the building's Form 8609 (docs/01-form-8609-larkspur-commons.pdf)
 * and Ewin's answers about 2025.
 */

import {
  makeLowIncomeHousingBuildingFactKey,
  makeW2FactKey,
  RENTAL_KEYS,
  type LowIncomeFractions,
  type LowIncomeHousingBuildingFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const EWIN_USER_ID = "ewin-integration";
export const EWIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: EWIN_USER_ID,
  taxYear: EWIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const EWIN = {
  firstName: "Ewin",
  lastName: "Coldbrook",
  ssn: "400-00-8609",
  street: "2215 Alder Crest Lane",
  city: "Spokane",
  state: "WA",
  zip: "99203",
};

const address = { line1: EWIN.street, city: EWIN.city, state: EWIN.state, zip: EWIN.zip };

// W-2 from a made-up hospital.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Inland Basin Medical Group",
  employerEin: "00-0008609",
  employerAddress: { line1: "740 Division Street", city: "Spokane", state: "WA", zip: "99202" },
  employee: { firstName: EWIN.firstName, lastName: EWIN.lastName, ssn: EWIN.ssn, address },
  box1: 185000,
  box2: 36000,
  box3: 176100,
  box4: 10918.2,
  box5: 185000,
  box6: 2682.5,
};

/* 40 units, 32 low-income; 36,000 square feet, 28,440 low-income: 0.8000 and 0.7900. */
const LARKSPUR_COUNT: LowIncomeFractions = {
  lowIncomeUnits: 32,
  residentialUnits: 40,
  lowIncomeFloorSpace: 28440,
  residentialFloorSpace: 36000,
};

/*
 * Larkspur Commons (made up), a 40-unit building placed in service in 2021 and
 * partly financed with tax-exempt bonds; 2021 is the first credit year, so 2025
 * is year 5. Ewin bought a 60% interest from the developer on June 10, 2025;
 * he owned none of it before. The agency allocated a maximum qualified basis
 * (line 3a, $1,975,000 = $2,500,000 × .7900) for the low-income share the owner
 * planned, but the building was only .7000 low-income at the close of 2021
 * (line 8a, $1,750,000); line 1b is $1,975,000 × 4% = $79,000. Units added after the first year make
 * line 3 larger than Form 8609 line 8a, within line 3a, so the allocation
 * covers the additions (irs-8609a-inst-2025::sec::line-6::b02). 2025 is not the first year of that
 * increase (the end of 2024 had the same count). A federal grant of $50,000
 * received in 2024 never reduced the eligible basis.
 */
export const LARKSPUR: LowIncomeHousingBuildingFactValue = {
  form8609: {
    buildingIdentificationNumber: "WA-21-00377",
    maximumCreditAmount: 79000,
    creditPercentage: 0.04,
    maximumQualifiedBasis: 1975000,
    highCostBasisPercentage: 1.3,
    eligibleBasis: 2500000,
    originalQualifiedBasis: 1750000,
    firstCreditYear: 2021,
  },
  allocation: "building",
  hasSignedForm8609: true,
  qualifiedAtYearEnd: true,
  qualifiedBasisDecreased: false,
  yearEnd: LARKSPUR_COUNT,
  limitedToMaximumQualifiedBasis: false,
  deepRentSkewed: "met",
  atRiskFinancing: false,
  ownership: { share: 0.6, acquiredOn: "2025-06-10" },
  minimumCreditPercentage: "four_percent",
  federalGrants: 50000,
  increase: {
    priorYearEligibleBasis: 2500000,
    priorYearLowIncomePortion: 0.79,
    monthEnds: Array.from({ length: 12 }, () => LARKSPUR_COUNT),
  },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: EWIN_USER_ID, taxYear: EWIN_TAX_YEAR, suffix, value });

export const ewinFacts: TaxFactRow[] = [
  idFact("name.first", EWIN.firstName),
  idFact("name.last", EWIN.lastName),
  idFact("ssn", EWIN.ssn),
  idFact("dob", "07/14/1976"),
  idFact("address.street", EWIN.street),
  idFact("address.city", EWIN.city),
  idFact("address.state", EWIN.state),
  idFact("address.zip", EWIN.zip),
  idFact("occupation", "Anesthesiologist"),
  idFact("phone", "509-555-0142"),
  fact("wages", makeW2FactKey("inland-basin"), w2, "W-2 from Inland Basin Medical Group."),
  fact(
    "rental",
    makeLowIncomeHousingBuildingFactKey("larkspur-commons"),
    LARKSPUR,
    "Form 8609 for Larkspur Commons (docs/01-form-8609-larkspur-commons.pdf); the 2024 Form 8609-A from the seller; Ewin's purchase papers, rent roll and grant records.",
  ),
  // A full-time physician: not a real estate professional, so the building's credit is passive (Form 8582-CR).
  fact(
    "rental",
    RENTAL_KEYS.realEstateProfessional,
    false,
    "Verbal: he works full time as a physician.",
  ),
];

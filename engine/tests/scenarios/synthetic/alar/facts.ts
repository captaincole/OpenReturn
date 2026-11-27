/*
 * A made-up taxpayer (README.md): every name and amount is invented. The W-2
 * fact holds the boxes as the form would print them. The building fact holds
 * the amounts of the building's Form 8609 (docs/01-form-8609-sagebrush-terrace.pdf)
 * and Alar's answers about 2025. The Schedule K-1 (Form 1065) is a made PDF
 * (docs/02-schedule-k1-juniper-flats-housing.pdf).
 */

import {
  makeK1HoldingFactKey,
  makeLowIncomeHousingBuildingFactKey,
  makePartnershipK1FactKey,
  makeW2FactKey,
  RENTAL_KEYS,
  type K1HoldingFactValue,
  type LowIncomeFractions,
  type LowIncomeHousingBuildingFactValue,
  type PartnershipK1FactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ALAR_USER_ID = "alar-synthetic";
export const ALAR_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ALAR_USER_ID,
  taxYear: ALAR_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ALAR = {
  firstName: "Alar",
  lastName: "Quillfeather",
  ssn: "400-00-8586",
  street: "3307 Sagecrest Drive",
  city: "Reno",
  state: "NV",
  zip: "89509",
};

const address = { line1: ALAR.street, city: ALAR.city, state: ALAR.state, zip: ALAR.zip };

// W-2 from a made-up engineering firm.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Truckee Basin Hydrology Inc.",
  employerEin: "00-0008586",
  employerAddress: { line1: "1 East Liberty Street", city: "Reno", state: "NV", zip: "89501" },
  employee: { firstName: ALAR.firstName, lastName: ALAR.lastName, ssn: ALAR.ssn, address },
  box1: 230000,
  box2: 46000,
  box3: 176100,
  box4: 10918.2,
  box5: 230000,
  // 1.45% of wages plus the 0.9% Additional Medicare Tax on wages over $200,000.
  box6: 3605,
};

/* 30 units, 24 low-income; 25,000 square feet, 21,000 low-income: 0.8000 and 0.8400. */
const SAGEBRUSH_COUNT: LowIncomeFractions = {
  lowIncomeUnits: 24,
  residentialUnits: 30,
  lowIncomeFloorSpace: 21000,
  residentialFloorSpace: 25000,
};

/*
 * Sagebrush Terrace (made up), a new 30-unit building Alar built and owns by
 * himself, placed in service in 2019 with a 9% allocation; 2019 is the first
 * credit year, so 2025 is year 7. It was .8000 low-income at the close of 2019
 * (line 8a, $720,000), and the agency allocated that basis (line 3a; line 1b
 * $720,000 × 9% = $64,800). Two more units were low-income at the end of 2024
 * (26 of 30); at the end of 2025 they rent at market again, so the qualified
 * basis decreased since 2024 (item E "Yes", Form 8586 line 2) but is not below
 * the first year's, so nothing is recaptured (irs-8586-form-2025::sec::line-2::b01).
 */
export const SAGEBRUSH: LowIncomeHousingBuildingFactValue = {
  form8609: {
    buildingIdentificationNumber: "NV-19-00412",
    maximumCreditAmount: 64800,
    creditPercentage: 0.09,
    maximumQualifiedBasis: 720000,
    eligibleBasis: 900000,
    originalQualifiedBasis: 720000,
    firstCreditYear: 2019,
  },
  allocation: "building",
  hasSignedForm8609: true,
  qualifiedAtYearEnd: true,
  qualifiedBasisDecreased: true,
  yearEnd: SAGEBRUSH_COUNT,
  limitedToMaximumQualifiedBasis: false,
  deepRentSkewed: "not_elected",
  atRiskFinancing: false,
  ownership: { share: 1 },
  minimumCreditPercentage: "nine_percent",
};

export const JUNIPER_ID = "juniper-flats-housing";
export const JUNIPER_EIN = "00-0008587";

/*
 * A low-income housing partnership Alar invested in as a limited partner. Its
 * only K-1 item is box 15 code D, his share of the low-income housing credit
 * (section 42(j)(5) does not apply).
 */
export const juniperK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Juniper Flats Housing Partners LP",
  entityEin: JUNIPER_EIN,
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 4,
  lossPercent: 4,
  capitalPercent: 4,
  boxes: [{ box: "15", code: "D", amount: 4350 }],
};

const juniperHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: false,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 60000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ALAR_USER_ID, taxYear: ALAR_TAX_YEAR, suffix, value });

const VERBAL = "Verbal, 2026-11-27";

export const alarFacts: TaxFactRow[] = [
  idFact("name.first", ALAR.firstName),
  idFact("name.last", ALAR.lastName),
  idFact("ssn", ALAR.ssn),
  idFact("dob", "04/22/1979"),
  idFact("address.street", ALAR.street),
  idFact("address.city", ALAR.city),
  idFact("address.state", ALAR.state),
  idFact("address.zip", ALAR.zip),
  idFact("occupation", "Hydrologist"),
  idFact("phone", "775-555-0186"),
  fact("wages", makeW2FactKey("truckee-basin"), w2, "W-2 from Truckee Basin Hydrology Inc."),
  fact(
    "rental",
    makeLowIncomeHousingBuildingFactKey("sagebrush-terrace"),
    SAGEBRUSH,
    "Form 8609 for Sagebrush Terrace (docs/01-form-8609-sagebrush-terrace.pdf); Alar's rent rolls for 2024 and 2025.",
  ),
  fact(
    "k1",
    makePartnershipK1FactKey(JUNIPER_ID),
    juniperK1,
    "Schedule K-1 (Form 1065) (docs/02-schedule-k1-juniper-flats-housing.pdf).",
  ),
  fact("k1", makeK1HoldingFactKey(JUNIPER_ID), juniperHolding, VERBAL),
  // A full-time hydrologist: not a real estate professional, so both credits are passive (Form 8582-CR).
  fact("rental", RENTAL_KEYS.realEstateProfessional, false, `${VERBAL}: he works full time.`),
];

/*
 * A made-up single filer in Texas (README.md): every name and amount is
 * invented. No input documents: the business's amounts and the two
 * properties are the filer's answers from the business's books, its fixed
 * asset records, the low-income allocation letter and the National Park
 * Service certification.
 */

import {
  makeBusinessFactKey,
  makeInvestmentCreditPropertyFactKey,
  type BusinessFactValue,
  type InvestmentCreditPropertyFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const ARAM_USER_ID = "aram-integration";
export const ARAM_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: ARAM_USER_ID,
  taxYear: ARAM_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const ARAM = {
  firstName: "Aram",
  lastName: "Pellingham",
  ssn: "400-00-3468",
  street: "812 Brazos Mill Road",
  city: "Waco",
  state: "TX",
  zip: "76706",
};

const SHOP_ADDRESS = "1400 Old Mill Street, Waco, TX 76704";

// The furniture shop, in a historic mill building Aram owns and uses (made up).
const joinery: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Custom furniture and cabinet making",
  code: "337110",
  name: "Pellingham Joinery",
  address: { street: "1400 Old Mill Street", city: "Waco", state: "TX", zip: "76704" },
  accountingMethod: "cash",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: true,
  sellsGoods: false,
  grossReceipts: 610000,
  expenses: {
    supplies: 96000,
    wages: 118000,
    utilities: 8400,
    depreciation: 41000,
    insurance: 7200,
    repairs: 5600,
    taxesAndLicenses: 11800,
  },
  specifiedService: false,
  w2WagesPaid: 118000,
  qualifiedPropertyUbia: 940000,
};

/*
 * Copy 1, Part VI section B: a 60 kW dc rooftop solar array on the mill,
 * begun in 2024 and in service in 2025. Under 1 MW (line 7a), so the 30% rate
 * and the 10% bonuses; a low-income community allocation of 45 kW, less than
 * the array (lines 3g to 3j); a city green-energy loan from tax-exempt bonds
 * (line 28a).
 */
export const SOLAR: InvestmentCreditPropertyFactValue = {
  facility: {
    propertyType: "Solar",
    address: SHOP_ADDRESS,
    coordinates: { latitude: 31.556712, longitude: -97.128344 },
    interconnectionProperty: false,
    constructionBegan: "2024-11-04",
    placedInService: "2025-04-22",
    expansionOfExistingFacility: false,
    netOutputUnder1Mw: "yes",
    prevailingWage: "no",
    domesticContent: "ten_percent",
    energyCommunity: "ten_percent",
    lowIncome: { category: "low_income_community", controlNumber: "48E-TEST-2024-0346" },
    capacity: { solar: { dcKw: 60, acKw: 50 } },
  },
  credit: {
    part: "energy",
    investment: {
      property: {
        section: "solar",
        basis: 120000,
        kind: "electricity_or_heat",
        allocatedCapacityKwDc: 45,
      },
      financing: { proceeds: 15000, capitalAccountAdditions: 120000 },
    },
  },
  passive: false,
};

/*
 * Copy 2, Part VII: the mill's certified rehabilitation, in service in March
 * 2024, so 2025 is the second of the five years (line 1j). The expenditures in
 * the 24-month period are more than the building's adjusted basis.
 */
export const MILL: InvestmentCreditPropertyFactValue = {
  facility: {
    propertyType: "Rehabilitation",
    address: SHOP_ADDRESS,
    coordinates: { latitude: 31.556712, longitude: -97.128344 },
    constructionBegan: "2022-04-01",
    placedInService: "2024-03-01",
  },
  credit: {
    part: "rehabilitation",
    investment: {
      priorConservationDeduction: false,
      measuringPeriod: { begin: "2022-04-01", end: "2024-03-31" },
      adjustedBasis: 180000,
      expendituresInMeasuringPeriod: 250000,
      qualifiedExpenditures: 250000,
      npsProjectNumber: "TEST-34680",
      certificationDate: "2024-06-20",
    },
  },
  passive: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: ARAM_USER_ID, taxYear: ARAM_TAX_YEAR, suffix, value });

export const aramFacts: TaxFactRow[] = [
  idFact("name.first", ARAM.firstName),
  idFact("name.last", ARAM.lastName),
  idFact("ssn", ARAM.ssn),
  idFact("dob", "02/11/1978"),
  idFact("address.street", ARAM.street),
  idFact("address.city", ARAM.city),
  idFact("address.state", ARAM.state),
  idFact("address.zip", ARAM.zip),
  idFact("occupation", "Furniture maker"),
  idFact("phone", "254-555-0134"),
  fact(
    "self_employment",
    makeBusinessFactKey("joinery"),
    joinery,
    "Stated by Aram, from the books.",
  ),
  fact(
    "other",
    makeInvestmentCreditPropertyFactKey("mill-solar"),
    SOLAR,
    "Stated by Aram: fixed asset record, the 2024 allocation letter, the city loan statement.",
  ),
  fact(
    "other",
    makeInvestmentCreditPropertyFactKey("mill-rehabilitation"),
    MILL,
    "Stated by Aram: fixed asset record and the NPS certification of completed work.",
  ),
];

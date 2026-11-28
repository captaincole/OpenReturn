/*
 * A made-up single filer in Texas (README.md): every name and amount is
 * invented. No input documents: the business's amounts and the two
 * facilities are the filer's answers from the business's books, the meter
 * statements of the utility that buys the power, and the bond loan statement.
 */

import {
  makeBusinessFactKey,
  makeRenewableElectricityFacilityFactKey,
  type BusinessFactValue,
  type RenewableElectricityFacilityFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const WIT_USER_ID = "wit-integration";
export const WIT_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-27T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: WIT_USER_ID,
  taxYear: WIT_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const WIT = {
  firstName: "Wit",
  lastName: "Harrowgate",
  ssn: "400-00-8835",
  street: "77 Caprock Lane",
  city: "Post",
  state: "TX",
  zip: "79356",
};

// The power business: two wind sites whose electricity Wit sells to a utility, and turbine service work (made up).
const windWorks: BusinessFactValue = {
  owner: "taxpayer",
  activity: "Wind electricity generation and turbine service",
  code: "221115",
  name: "Harrowgate Wind Works",
  address: { street: "77 Caprock Lane", city: "Post", state: "TX", zip: "79356" },
  accountingMethod: "accrual",
  materiallyParticipated: true,
  startedThisYear: false,
  paymentsRequire1099: true,
  sellsGoods: false,
  grossReceipts: 468000,
  expenses: {
    supplies: 22000,
    wages: 64000,
    utilities: 3600,
    depreciation: 58000,
    insurance: 14200,
    repairs: 18400,
    taxesAndLicenses: 9800,
  },
  specifiedService: false,
  w2WagesPaid: 64000,
  qualifiedPropertyUbia: 1450000,
};

/*
 * Copy 1: Caprock Ridge, two turbines (900 kW ac), construction begun in
 * September 2022 and in service in May 2023. Line 8b (begun before January
 * 29, 2023) makes line 9 five times line 8; the turbines meet the domestic
 * content rule and the site is in an energy community. A county
 * development bond loan (tax-exempt) paid 40,000 of the 500,000 cost (line 5a).
 * All of 2025 is inside the first four years: Form 3800 line 4e.
 */
export const CAPROCK: RenewableElectricityFacilityFactValue = {
  resource: "wind",
  description: "Wind, two 450 kW turbines",
  address: "County Road 312, Post, TX 79356",
  coordinates: { latitude: 33.18734, longitude: -101.40215 },
  constructionBegan: "2022-09-12",
  placedInService: "2023-05-01",
  domesticContent: true,
  energyCommunity: "yes",
  capacity: { windAcKw: 900 },
  kilowattHoursSold: 500000,
  taxExemptBondFinancing: { proceeds: 40000, capitalAccountAdditions: 500000 },
  passive: false,
};

/*
 * Copy 2: Garza Flats, one 250 kW turbine begun in June 2018 and in service
 * in October 2019. The 3.0-cent rate of a pre-2022 facility; the 40% wind
 * phase-down of line 7d. Past its first four years: Form 3800 line 1f.
 */
export const GARZA: RenewableElectricityFacilityFactValue = {
  resource: "wind",
  description: "Wind, one 250 kW turbine",
  address: "FM 651, Post, TX 79356",
  coordinates: { latitude: 33.10422, longitude: -101.33871 },
  constructionBegan: "2018-06-15",
  placedInService: "2019-10-01",
  capacity: { windAcKw: 250 },
  kilowattHoursSold: 200000,
  passive: false,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: WIT_USER_ID, taxYear: WIT_TAX_YEAR, suffix, value });

export const witFacts: TaxFactRow[] = [
  idFact("name.first", WIT.firstName),
  idFact("name.last", WIT.lastName),
  idFact("ssn", WIT.ssn),
  idFact("dob", "07/19/1974"),
  idFact("address.street", WIT.street),
  idFact("address.city", WIT.city),
  idFact("address.state", WIT.state),
  idFact("address.zip", WIT.zip),
  idFact("occupation", "Wind power producer"),
  idFact("phone", "806-555-0188"),
  fact(
    "self_employment",
    makeBusinessFactKey("wind-works"),
    windWorks,
    "Stated by Wit, from the books.",
  ),
  fact(
    "other",
    makeRenewableElectricityFacilityFactKey("caprock-ridge"),
    CAPROCK,
    "Stated by Wit: utility meter statements, the turbine supplier's domestic content certificate, the county bond loan statement.",
  ),
  fact(
    "other",
    makeRenewableElectricityFacilityFactKey("garza-flats"),
    GARZA,
    "Stated by Wit: utility meter statements and the fixed asset record.",
  ),
];

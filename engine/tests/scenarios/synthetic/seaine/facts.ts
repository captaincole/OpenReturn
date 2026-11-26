/*
 * A made-up taxpayer (README.md): every name and amount is invented. The
 * trust's Schedule J (Form 1041) Part IV is docs/01-schedule-j-part-iv.pdf; the
 * W-2 is the boxes as it would print them; the earlier years' amounts are her
 * answers from her own 2020 to 2024 returns.
 */

import {
  makeEarlierYearReturnFactKey,
  makeTrustAccumulationDistributionFactKey,
  makeW2FactKey,
  type EarlierYearReturnFactValue,
  type TrustAccumulationDistributionFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const SEAINE_USER_ID = "seaine-integration";
export const SEAINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: SEAINE_USER_ID,
  taxYear: SEAINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const SEAINE = {
  firstName: "Seaine",
  lastName: "Corvell",
  ssn: "400-00-4970",
  dob: "03/10/1995",
  street: "1822 West Larkspur Avenue",
  city: "Spokane",
  state: "WA",
  zip: "99203",
};

const address = { line1: SEAINE.street, city: SEAINE.city, state: SEAINE.state, zip: SEAINE.zip };

// W-2 from a made-up employer.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Riverpoint Test Labs LLC",
  employerEin: "00-0004970",
  employerAddress: {
    line1: "410 East Spokane Falls Blvd",
    city: "Spokane",
    state: "WA",
    zip: "99202",
  },
  employee: { firstName: SEAINE.firstName, lastName: SEAINE.lastName, ssn: SEAINE.ssn, address },
  box1: 96000,
  box2: 13800,
  box3: 96000,
  box4: 5952,
  box5: 96000,
  box6: 1392,
};

/*
 * The Corvell Family Trust, set up by her grandfather in 1979 (made up). Its
 * 2025 accumulation distribution is thrown back to five years (Part IV, lines
 * 32 to 36). She was under 21 all of 2014, so that year's amount goes on line
 * 2. She has no other trust.
 */
export const SEAINE_TRUST: TrustAccumulationDistributionFactValue = {
  trustName: "Corvell Family Trust u/a dtd 6/12/1979",
  trustAddress: "c/o Larkspur Example Trust Services, 4970 Throwback Lane, Spokane, WA 99201",
  trustEin: "00-0001979",
  trustType: "domestic",
  createdBeforeMarch1984: true,
  estateOrGenerationSkippingTax: false,
  throwbackYears: [
    { year: 2014, amount: 6000, taxes: 1500, taxExemptInterest: 400 },
    { year: 2017, amount: 18000, taxes: 4200, taxExemptInterest: 900 },
    { year: 2018, amount: 22000, taxes: 5100, taxExemptInterest: 1100 },
    { year: 2019, amount: 20000, taxes: 4800 },
    { year: 2020, amount: 3000, taxes: 600, taxExemptInterest: 200 },
  ],
};

/* Her 2020 to 2024 returns, as she states them (single every year). */
const EARLIER_YEARS: Record<number, EarlierYearReturnFactValue> = {
  2024: { taxableIncome: 88000, filingStatus: "single", taxBeforeCredits: 14385 },
  // 2023: $4,000 of qualified dividends; a $250 education credit was limited by her tax.
  2023: {
    taxableIncome: 82000,
    filingStatus: "single",
    preferentialIncome: 4000,
    taxBeforeCredits: 13070,
    creditIncrease: 250,
  },
  // 2022: an incentive stock option exercise; her 2022 Form 6251 refigured shows $300 less AMT.
  2022: {
    taxableIncome: 61000,
    filingStatus: "single",
    taxBeforeCredits: 9038,
    minimumTaxChange: -300,
  },
  2021: { taxableIncome: 54000, filingStatus: "single", taxBeforeCredits: 7629 },
  2020: { taxableIncome: 47000, filingStatus: "single", taxBeforeCredits: 6163 },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: SEAINE_USER_ID, taxYear: SEAINE_TAX_YEAR, suffix, value });

export const seaineFacts: TaxFactRow[] = [
  idFact("name.first", SEAINE.firstName),
  idFact("name.last", SEAINE.lastName),
  idFact("ssn", SEAINE.ssn),
  idFact("dob", SEAINE.dob),
  idFact("address.street", SEAINE.street),
  idFact("address.city", SEAINE.city),
  idFact("address.state", SEAINE.state),
  idFact("address.zip", SEAINE.zip),
  idFact("occupation", "Software tester"),
  idFact("phone", "509-555-0149"),
  fact("wages", makeW2FactKey("riverpoint-test-labs"), w2, "W-2 from Riverpoint Test Labs."),
  fact(
    "trust_estate",
    makeTrustAccumulationDistributionFactKey("corvell-family-trust"),
    SEAINE_TRUST,
    "Schedule J (Form 1041) Part IV (docs/01-schedule-j-part-iv.pdf); trust date and no other trusts stated by Seaine.",
  ),
  ...Object.entries(EARLIER_YEARS).map(([year, value]) =>
    fact(
      "other",
      makeEarlierYearReturnFactKey(Number(year)),
      value,
      `Stated by Seaine from her ${year} Form 1040.`,
    ),
  ),
];

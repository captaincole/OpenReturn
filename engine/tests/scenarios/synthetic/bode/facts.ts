/*
 * A made-up taxpayer (README.md): every name and amount is invented. The W-2
 * is the boxes as it would print them. The trust's amounts are what its
 * trustee wrote to Bode (no official form; README.md); the earlier years'
 * amounts are her answers from her own 2020 to 2024 California returns.
 */

import {
  makeCaEarlierYearReturnFactKey,
  makeTrustAccumulationDistributionFactKey,
  makeW2FactKey,
  type CaEarlierYearReturnFactValue,
  type TrustAccumulationDistributionFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const BODE_USER_ID = "bode-integration";
export const BODE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: BODE_USER_ID,
  taxYear: BODE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const BODE = {
  firstName: "Bode",
  lastName: "Harrowgate",
  ssn: "400-00-5870",
  dob: "08/19/1984",
  street: "2210 Juniper Hollow Road",
  city: "San Diego",
  state: "CA",
  zip: "92103",
};

const address = { line1: BODE.street, city: BODE.city, state: BODE.state, zip: BODE.zip };

// W-2 from a made-up employer: wages over $1,000,000, so the 2025 return owes the BHST too.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Juniper Hollow Robotics Inc",
  employerEin: "00-0005870",
  employerAddress: {
    line1: "800 Harbor Example Way",
    city: "San Diego",
    state: "CA",
    zip: "92101",
  },
  employee: { firstName: BODE.firstName, lastName: BODE.lastName, ssn: BODE.ssn, address },
  box1: 1150000,
  box2: 372000,
  box3: 176100,
  box4: 10918.2,
  box5: 1150000,
  box6: 25225,
  box14: [{ label: "CA SDI", amount: 13800 }],
  box15: "CA",
  box16: 1150000,
  box17: 118000,
};

/*
 * The Harrowgate Education Trust, set up by her aunt (made up). Bode's
 * interest was contingent until 2025, so the trust paid no California tax on
 * the income it kept for seven years; the trustee wrote her the total and the
 * number of years (Part II).
 */
export const BODE_TRUST: TrustAccumulationDistributionFactValue = {
  trustName: "Harrowgate Education Trust",
  trustAddress: "c/o Mesa Example Trust Company, 5870 Accumulation Court, Sacramento, CA 95814",
  trustEin: "00-0002017",
  trustType: "domestic",
  createdBeforeMarch1984: false,
  estateOrGenerationSkippingTax: false,
  throwbackYears: [],
  california: {
    beneficiaryInterest: "contingent",
    trustStreet: "c/o Mesa Example Trust Company, 5870 Accumulation Court",
    trustCity: "Sacramento",
    trustState: "CA",
    trustZip: "95814",
    accumulationDistribution: 300000,
    accumulationYears: 7,
  },
};

/* Her 2020 to 2024 California returns, as she states them (single every year). */
const EARLIER_YEARS: Record<number, CaEarlierYearReturnFactValue> = {
  2024: {
    residency: "resident",
    taxableIncome: 985000,
    filingStatus: "single",
    taxBeforeCredits: 102550,
  },
  // 2023: taxable income over $1,000,000, so she paid $600 of Mental Health Services Tax.
  2023: {
    residency: "resident",
    taxableIncome: 1060000,
    filingStatus: "single",
    taxBeforeCredits: 112369,
    behavioralHealthTaxPaid: 600,
  },
  // 2022: an incentive stock option exercise; her refigured 2022 Schedule P (540) shows $350 less AMT.
  2022: {
    residency: "resident",
    taxableIncome: 640000,
    filingStatus: "single",
    taxBeforeCredits: 61623,
    minimumTaxChange: -350,
  },
  // 2021: she moved to California from Oregon in March (Form 540NR); her other-state credit grows by $300.
  2021: {
    residency: "part_year",
    taxableIncome: 410000,
    filingStatus: "single",
    taxBeforeCredits: 36453,
    creditChange: 300,
  },
  // 2020: an Oregon resident all year.
  2020: { residency: "nonresident" },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: BODE_USER_ID, taxYear: BODE_TAX_YEAR, suffix, value });

export const bodeFacts: TaxFactRow[] = [
  idFact("name.first", BODE.firstName),
  idFact("name.last", BODE.lastName),
  idFact("ssn", BODE.ssn),
  idFact("dob", BODE.dob),
  idFact("address.street", BODE.street),
  idFact("address.city", BODE.city),
  idFact("address.state", BODE.state),
  idFact("address.zip", BODE.zip),
  idFact("address.county", "San Diego"),
  idFact("occupation", "Robotics engineer"),
  idFact("phone", "619-555-0158"),
  fact("wages", makeW2FactKey("juniper-hollow-robotics"), w2, "W-2 from Juniper Hollow Robotics."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact(
    "trust_estate",
    makeTrustAccumulationDistributionFactKey("harrowgate-education-trust"),
    BODE_TRUST,
    "Trustee's letter to Bode: the 2025 distribution, the seven years accumulated, her contingent interest; address from the letter.",
  ),
  ...Object.entries(EARLIER_YEARS).map(([year, value]) =>
    fact(
      "other",
      makeCaEarlierYearReturnFactKey(Number(year)),
      value,
      `Stated by Bode from her ${year} California return.`,
    ),
  ),
];

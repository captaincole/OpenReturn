/*
 * A made-up taxpayer (README.md): every name and amount is invented. The
 * trust's Schedule J (541) Part IV is docs/01-schedule-j-541-part-iv.pdf; the
 * W-2 is the boxes as it would print them; the earlier years' amounts are his
 * answers from his own 2020 to 2024 California returns.
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

export const CENN_USER_ID = "cenn-integration";
export const CENN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: CENN_USER_ID,
  taxYear: CENN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const CENN = {
  firstName: "Cenn",
  lastName: "Tallowmere",
  ssn: "400-00-5871",
  dob: "11/30/1996",
  street: "614 East Almond Grove Lane",
  city: "Fresno",
  state: "CA",
  zip: "93704",
};

const address = { line1: CENN.street, city: CENN.city, state: CENN.state, zip: CENN.zip };

// W-2 from a made-up employer.
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Almond Grove Irrigation Supply LLC",
  employerEin: "00-0005871",
  employerAddress: { line1: "2900 Example Canal Road", city: "Fresno", state: "CA", zip: "93706" },
  employee: { firstName: CENN.firstName, lastName: CENN.lastName, ssn: CENN.ssn, address },
  box1: 140000,
  box2: 22400,
  box3: 140000,
  box4: 8680,
  box5: 140000,
  box6: 2030,
  box14: [{ label: "CA SDI", amount: 1680 }],
  box15: "CA",
  box16: 140000,
  box17: 8900,
};

/*
 * The Tallowmere Family Trust, set up by his grandmother (made up). It filed
 * Form 541 and paid the California tax each year it kept income, so the
 * trustee gave Cenn Part IV of Schedule J (541) (Part I). He was under 21 all
 * of 2015 (that year leaves every line, decision A33). In 2018 two other
 * trusts' distributions to him are considered made in the same year
 * (the multiple trust rule: that year's tax leaves line 2).
 */
export const CENN_TRUST: TrustAccumulationDistributionFactValue = {
  trustName: "Tallowmere Family Trust",
  trustAddress: "c/o Kestrel Example Fiduciary Services, 1500 Throwback Plaza, Fresno, CA 93721",
  trustEin: "00-0001991",
  trustType: "domestic",
  createdBeforeMarch1984: false,
  estateOrGenerationSkippingTax: false,
  throwbackYears: [],
  california: {
    beneficiaryInterest: "schedule_j",
    trustStreet: "c/o Kestrel Example Fiduciary Services, 1500 Throwback Plaza",
    trustCity: "Fresno",
    trustState: "CA",
    trustZip: "93721",
    throwbackYears: [
      { year: 2015, amount: 6000, taxes: 300 },
      { year: 2018, amount: 14000, taxes: 700, otherTrustsCounted: 2 },
      { year: 2019, amount: 12000, taxes: 650, taxExemptInterest: 200 },
      { year: 2020, amount: 9000, taxes: 400, taxExemptInterest: 300 },
      { year: 2022, amount: 2000, taxes: 90 },
    ],
  },
};

/* His 2020 to 2024 California returns, as he states them (single every year). */
const EARLIER_YEARS: Record<number, CaEarlierYearReturnFactValue> = {
  2024: {
    residency: "resident",
    taxableIncome: 118000,
    filingStatus: "single",
    taxBeforeCredits: 7516,
  },
  2023: {
    residency: "resident",
    taxableIncome: 104000,
    filingStatus: "single",
    taxBeforeCredits: 6325,
  },
  // 2022: a $200 credit carryover that his 2022 tax was too small to use in full.
  2022: {
    residency: "resident",
    taxableIncome: 96000,
    filingStatus: "single",
    taxBeforeCredits: 5681,
    creditChange: 200,
  },
  // 2021: his refigured 2021 Schedule P (540) shows $150 more AMT.
  2021: {
    residency: "resident",
    taxableIncome: 84000,
    filingStatus: "single",
    taxBeforeCredits: 4814,
    minimumTaxChange: 150,
  },
  2020: {
    residency: "resident",
    taxableIncome: 79000,
    filingStatus: "single",
    taxBeforeCredits: 4476,
  },
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: CENN_USER_ID, taxYear: CENN_TAX_YEAR, suffix, value });

export const cennFacts: TaxFactRow[] = [
  idFact("name.first", CENN.firstName),
  idFact("name.last", CENN.lastName),
  idFact("ssn", CENN.ssn),
  idFact("dob", CENN.dob),
  idFact("address.street", CENN.street),
  idFact("address.city", CENN.city),
  idFact("address.state", CENN.state),
  idFact("address.zip", CENN.zip),
  idFact("address.county", "Fresno"),
  idFact("occupation", "Irrigation designer"),
  idFact("phone", "559-555-0187"),
  fact("wages", makeW2FactKey("almond-grove-irrigation"), w2, "W-2 from Almond Grove Irrigation."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact(
    "trust_estate",
    makeTrustAccumulationDistributionFactKey("tallowmere-family-trust"),
    CENN_TRUST,
    "Schedule J (541) Part IV (docs/01-schedule-j-541-part-iv.pdf); the other trusts in 2018 stated by Cenn.",
  ),
  ...Object.entries(EARLIER_YEARS).map(([year, value]) =>
    fact(
      "other",
      makeCaEarlierYearReturnFactKey(Number(year)),
      value,
      `Stated by Cenn from his ${year} California return.`,
    ),
  ),
];

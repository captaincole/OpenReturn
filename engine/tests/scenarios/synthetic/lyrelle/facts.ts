/*
 * Made-up taxpayer (README.md): a single full-year California resident in
 * Burbank, a producer with five California Film Commission credit
 * certificates: a program 4.0 credit for her own independent film (with the
 * refundable election), a program 3.0 and a soundstage filming credit from
 * production partnerships, and carryovers of an original and a new credit.
 * Every name, number and address is invented. The certificates and the K-1
 * statements are not in the engine: their amounts are her answers. Her K-1
 * income is left out on purpose, so the scenario tests the credits alone.
 */

import {
  makeCaFilmCreditFactKey,
  makeW2FactKey,
  type CaFilmCreditFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LYRELLE_USER_ID = "lyrelle-synthetic";
export const LYRELLE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const HOME = { line1: "2214 Verdugo Crest Lane", city: "Burbank", state: "CA", zip: "91504" };
const TAXPAYER = { firstName: "Lyrelle", lastName: "Damarra", ssn: "400-00-3541" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LYRELLE_USER_ID,
  taxYear: LYRELLE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LYRELLE_USER_ID, taxYear: LYRELLE_TAX_YEAR, suffix, value });

/* One W-2 from a Burbank studio. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Magnolia Reel Studios Inc",
  employerEin: "12-3803541",
  employerAddress: { line1: "4400 Riverside Way", city: "Burbank", state: "CA", zip: "91505" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 900000,
  box2: 250000,
  box3: 176100,
  box4: 10918.2,
  box5: 900000,
  box6: 19350,
  box14: [{ label: "CA SDI", amount: 10800 }],
  box15: "CA",
  box16: 900000,
  box17: 85000,
};

const partnership = (name: string, idNumber: string, sosFileNumber: string) => ({
  name,
  idType: "fein" as const,
  idNumber,
  sosFileNumber,
});

/* The certificates, the program 4.0 one first: the first FTB 3541 the goldens check line by line. */
const certificates: Array<[string, CaFilmCreditFactValue, string]> = [
  [
    "lantern-season",
    {
      certificateNumber: 8214,
      yearIssued: 2025,
      copyrightRegistrationNumber: "PA0009412755",
      source: "generated",
      credit: 60000,
      carryoverFromPriorYear: 0,
      appliedToSalesAndUseTax: 5000,
      refundableElection: true,
    },
    "CFC Tax Credit Certificate 8214 (her own film, Lantern Season); $5,000 applied against sales and use tax with the CDTFA",
  ],
  [
    "harbor-light",
    {
      certificateNumber: 3127,
      yearIssued: 2020,
      copyrightRegistrationNumber: "PA0002093318",
      source: "pass_through",
      credit: 0,
      carryoverFromPriorYear: 12000,
      owner: partnership("Harbor Light Pictures LP", "000003127", "201600311127"),
    },
    "Her filed 2024 FTB 3541 for certificate 3127, line 13",
  ],
  [
    "foxglove",
    {
      certificateNumber: 5408,
      yearIssued: 2019,
      copyrightRegistrationNumber: "PA0002204561",
      source: "pass_through",
      credit: 0,
      carryoverFromPriorYear: 25000,
      owner: partnership("Foxglove Road Productions LLC", "000005408", "201810115408"),
    },
    "Her filed 2024 FTB 3541 for certificate 5408, line 13",
  ],
  [
    "tidewater",
    {
      certificateNumber: 7311,
      yearIssued: 2025,
      copyrightRegistrationNumber: "PA0009388102",
      source: "pass_through",
      credit: 20000,
      carryoverFromPriorYear: 0,
      owner: partnership("Tidewater Series Partners LP", "000007311", "202300417311"),
    },
    "Schedule K-1 (565) line 15f statement from Tidewater Series Partners LP",
  ],
  [
    "stage-nine",
    {
      certificateNumber: 8106,
      yearIssued: 2025,
      copyrightRegistrationNumber: "PA0009401276",
      source: "pass_through",
      credit: 15000,
      carryoverFromPriorYear: 0,
      owner: partnership("Stage Nine Glendale LLC", "000008106", "202400518106"),
    },
    "Schedule K-1 (568) line 15f statement from Stage Nine Glendale LLC",
  ],
];

export const lyrelleFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "03/14/1979"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Los Angeles"),
  idFact("occupation", "Film producer"),
  idFact("phone", "818-555-0141"),
  fact("wages", makeW2FactKey("magnolia"), w2, "W-2 from Magnolia Reel Studios Inc."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  ...certificates.map(([slug, value, source]) =>
    fact("other", makeCaFilmCreditFactKey(slug), value, `Verbal, from ${source}.`),
  ),
];

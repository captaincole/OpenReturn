/*
 * Made-up taxpayer (README.md): a single full-year California resident in
 * Santa Monica, a cinematographer with a program 3.0 motion picture credit
 * from a production partnership (this year's share and last year's unused
 * part) and tax paid to Utah on wages. Every name, number and address is
 * invented. The K-1 statement and the Utah return are not in the engine:
 * their amounts are her answers. Her K-1 income is left out on purpose.
 */

import {
  makeCaFilmCreditFactKey,
  makeOtherStateTaxFactKey,
  makeW2FactKey,
  type CaFilmCreditFactValue,
  type OtherStateTaxFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const MORIA_USER_ID = "moria-synthetic";
export const MORIA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const HOME = {
  line1: "1207 Palisade Bluff Court",
  city: "Santa Monica",
  state: "CA",
  zip: "90402",
};
const TAXPAYER = { firstName: "Moria", lastName: "Veltane", ssn: "400-00-3542" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: MORIA_USER_ID,
  taxYear: MORIA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: MORIA_USER_ID, taxYear: MORIA_TAX_YEAR, suffix, value });

/* One W-2 from a Santa Monica production company; her weeks filming near Moab are part of box 1. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Ocean Park Camera Works Inc",
  employerEin: "12-3803542",
  employerAddress: { line1: "300 Ocean Park Way", city: "Santa Monica", state: "CA", zip: "90405" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 240000,
  box2: 46000,
  box3: 176100,
  box4: 10918.2,
  box5: 240000,
  box6: 3840,
  box14: [{ label: "CA SDI", amount: 2880 }],
  box15: "CA",
  box16: 240000,
  box17: 18500,
};

/* Utah nonresident return (TC-40 with TC-40B): wages for weeks filmed near Moab. */
const utah: OtherStateTaxFactValue = {
  state: "UT",
  items: [
    {
      description: "Wages, Moab location shoot",
      californiaAmount: 30000,
      otherStateAmount: 30000,
    },
  ],
  taxPaid: 1350,
  otherStateAdjustedGrossIncome: 30000,
};

/* Program 3.0 certificate of the partnership: this year's share and last year's unused credit. */
const certificate: CaFilmCreditFactValue = {
  certificateNumber: 7488,
  yearIssued: 2024,
  copyrightRegistrationNumber: "PA0009355840",
  source: "pass_through",
  credit: 3000,
  carryoverFromPriorYear: 1500,
  owner: {
    name: "Long Shadow Features LP",
    idType: "fein",
    idNumber: "000007488",
    sosFileNumber: "202200617488",
  },
};

export const moriaFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "09/21/1984"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Los Angeles"),
  idFact("occupation", "Cinematographer"),
  idFact("phone", "310-555-0188"),
  fact("wages", makeW2FactKey("ocean-park"), w2, "W-2 from Ocean Park Camera Works Inc."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact(
    "state_local_tax",
    makeOtherStateTaxFactKey("ut"),
    utah,
    "Verbal, from her 2025 Utah TC-40 and TC-40B.",
  ),
  fact(
    "other",
    makeCaFilmCreditFactKey("long-shadow"),
    certificate,
    "Verbal, from the Schedule K-1 (565) line 15f statement of Long Shadow Features LP and her filed 2024 FTB 3541 line 13.",
  ),
];

/*
 * Made-up taxpayer (README.md): a single full-year California resident in
 * Sacramento with three other credits: a prison inmate labor credit an S
 * corporation passed through to her, tax paid to Utah on wages, and a share
 * of an LLC that elected to pay California's pass-through entity elective
 * tax. Every name, number and address is invented. The K-1s and the Utah
 * return are not in the engine: their amounts are her answers, and the
 * K-1 income is left out, so this scenario tests the credits alone.
 */

import {
  CA_PRISON_INMATE_LABOR_KEYS,
  CA_PTE_CREDIT_CARRYOVER_KEY,
  makeCaPrisonInmateLaborPassThroughFactKey,
  makeCaPteElectiveCreditFactKey,
  makeOtherStateTaxFactKey,
  makeW2FactKey,
  type CaPrisonInmateLaborPassThroughFactValue,
  type CaPteElectiveCreditFactValue,
  type OtherStateTaxFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const KATERINE_USER_ID = "katerine-synthetic";
export const KATERINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const HOME = { line1: "1610 Capitol Oaks Drive", city: "Sacramento", state: "CA", zip: "95816" };
const TAXPAYER = { firstName: "Katerine", lastName: "Vossbeck", ssn: "400-00-3517" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: KATERINE_USER_ID,
  taxYear: KATERINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: KATERINE_USER_ID, taxYear: KATERINE_TAX_YEAR, suffix, value });

/* One W-2 from a Sacramento employer; her weeks on a Salt Lake City project are part of box 1. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Valley Freight Systems Inc",
  employerEin: "12-3803507",
  employerAddress: { line1: "800 J Street", city: "Sacramento", state: "CA", zip: "95814" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 300000,
  box2: 61000,
  box3: 176100,
  box4: 10918.2,
  box5: 300000,
  box6: 5250,
  box14: [{ label: "CA SDI", amount: 3600 }],
  box15: "CA",
  box16: 300000,
  box17: 24800,
};

/* Her Utah nonresident return (TC-40 with TC-40B) for the weeks worked in Salt Lake City. */
const utah: OtherStateTaxFactValue = {
  state: "UT",
  items: [
    {
      description: "Wages, Salt Lake City project",
      californiaAmount: 40000,
      otherStateAmount: 40000,
    },
  ],
  taxPaid: 1800,
  otherStateAdjustedGrossIncome: 40000,
};

/* Line 3: the S corporation runs a joint venture crew and passed its credit through. */
const prisonLabor: CaPrisonInmateLaborPassThroughFactValue = {
  entityName: "Folsom Lake Components, Inc.",
  entityId: "4417350",
  credit: 12000,
};

const pteCredit: CaPteElectiveCreditFactValue = {
  entityName: "American River Storage LLC",
  entityId: "202110713507",
  credit: 4000,
};

export const katerineFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "09/14/1981"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Logistics manager"),
  idFact("phone", "916-555-0142"),
  fact("wages", makeW2FactKey("valley-freight"), w2, "W-2 from Valley Freight Systems Inc."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact(
    "state_local_tax",
    makeOtherStateTaxFactKey("ut"),
    utah,
    "Verbal, from her 2025 Utah TC-40 and TC-40B.",
  ),
  fact(
    "state_local_tax",
    makeCaPrisonInmateLaborPassThroughFactKey("folsom-lake"),
    prisonLabor,
    "Schedule K-1 (100S) from Folsom Lake Components, Inc., credits line and its statement.",
  ),
  fact(
    "self_employment",
    CA_PRISON_INMATE_LABOR_KEYS.qualifyingWages,
    { wages: 0 },
    "Verbal: she pays no wages herself.",
  ),
  fact("other", CA_PRISON_INMATE_LABOR_KEYS.carryover, 0, "Verbal: no FTB 3507 in 2024."),
  fact(
    "state_local_tax",
    makeCaPteElectiveCreditFactKey("american-river"),
    pteCredit,
    "Schedule K-1 (568) from American River Storage LLC, other credits line and its statement.",
  ),
  fact("other", CA_PTE_CREDIT_CARRYOVER_KEY, 0, "Verbal: no FTB 3804-CR carryover from 2024."),
];

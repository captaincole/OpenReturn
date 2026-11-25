/*
 * Made-up taxpayer (README.md): a single full-year California resident in San
 * Diego with a W-2, tax paid to Colorado on wages, and a share of ten
 * entities that elected to pay California's pass-through entity elective tax.
 * Every name, number and address is invented. The K-1s are not in the engine:
 * each credit is his answer as the K-1 statement prints it.
 */

import {
  CA_MISC_DEDUCTION_KEYS,
  CA_PTE_CREDIT_CARRYOVER_KEY,
  makeCaPteElectiveCreditFactKey,
  makeOtherStateTaxFactKey,
  makeW2FactKey,
  type CaPteElectiveCreditFactValue,
  type OtherStateTaxFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const DOMON_USER_ID = "domon-synthetic";
export const DOMON_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";
const HOME = { line1: "1410 Ketch Harbor Way", city: "San Diego", state: "CA", zip: "92106" };
const TAXPAYER = { firstName: "Domon", lastName: "Tallvane", ssn: "400-00-3804" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: DOMON_USER_ID,
  taxYear: DOMON_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: DOMON_USER_ID, taxYear: DOMON_TAX_YEAR, suffix, value });

/* One W-2 from a San Diego employer; his weeks on a Denver contract are part of box 1. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Coronado Marine Systems Inc",
  employerEin: "12-3803804",
  employerAddress: { line1: "2600 Harbor Drive", city: "San Diego", state: "CA", zip: "92101" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 260000,
  box2: 55000,
  box3: 176100,
  box4: 10918.2,
  box5: 260000,
  box6: 4310,
  box14: [{ label: "CA SDI", amount: 3120 }],
  box15: "CA",
  box16: 260000,
  box17: 21000,
};

/* Colorado nonresident return (Form 104 with 104PN): wages for weeks worked in Denver. */
const colorado: OtherStateTaxFactValue = {
  state: "CO",
  items: [
    { description: "Wages, Denver contract", californiaAmount: 35000, otherStateAmount: 35000 },
  ],
  taxPaid: 1540,
  otherStateAdjustedGrossIncome: 35000,
};

/* The ten electing entities, as each K-1 statement prints the credit. */
const credits: Array<[string, CaPteElectiveCreditFactValue, string]> = [
  [
    "pacific-tidewater",
    { entityName: "Pacific Tidewater Holdings, Inc.", entityId: "4821937", credit: 9300 },
    "Schedule K-1 (100S) line 13d and its statement",
  ],
  [
    "harbor-kiln",
    { entityName: "Harbor Kiln Partners LP", entityId: "202110019876", credit: 6975 },
    "Schedule K-1 (565) other credits line and its statement",
  ],
  [
    "mesa-verde",
    { entityName: "Mesa Verde Orchards LLC", entityId: "201934510022", credit: 1116 },
    "Schedule K-1 (568) other credits line and its statement",
  ],
  [
    "cabrillo-point",
    { entityName: "Cabrillo Point Storage LLC", entityId: "202015530418", credit: 2325 },
    "Schedule K-1 (568) other credits line and its statement",
  ],
  [
    "torrey-ridge",
    { entityName: "Torrey Ridge Medical Partners LP", entityId: "201811207734", credit: 1860 },
    "Schedule K-1 (565) other credits line and its statement",
  ],
  [
    "old-town-ferry",
    { entityName: "Old Town Ferry Co., Inc.", entityId: "3910255", credit: 930 },
    "Schedule K-1 (100S) line 13d and its statement",
  ],
  [
    "laguna-seca",
    { entityName: "Laguna Seca Vineyards LP", entityId: "202204418851", credit: 1395 },
    "Schedule K-1 (565) other credits line and its statement",
  ],
  [
    "point-loma",
    { entityName: "Point Loma Fisheries LLC", entityId: "201733019902", credit: 744 },
    "Schedule K-1 (568) other credits line and its statement",
  ],
  [
    "sorrento-valley",
    { entityName: "Sorrento Valley Labs, Inc.", entityId: "4502286", credit: 3720 },
    "Schedule K-1 (100S) line 13d and its statement",
  ],
  [
    "balboa-freight",
    { entityName: "Balboa Freight Partners", entityId: "33-4417820", credit: 465 },
    "Schedule K-1 (565) other credits line and its statement; a general partnership with no Secretary of State number, so its FEIN",
  ],
];

export const domonFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "02/19/1979"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "San Diego"),
  idFact("occupation", "Marine engineer"),
  idFact("phone", "619-555-0142"),
  fact("wages", makeW2FactKey("coronado"), w2, "W-2 from Coronado Marine Systems Inc."),
  fact("other", CA_MISC_DEDUCTION_KEYS.investmentFees, 0, "Verbal: no investment fees."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("other", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  fact(
    "state_local_tax",
    makeOtherStateTaxFactKey("co"),
    colorado,
    "Verbal, from his 2025 Colorado Form 104 and 104PN.",
  ),
  ...credits.map(([slug, value, source]) =>
    fact(
      "state_local_tax",
      makeCaPteElectiveCreditFactKey(slug),
      value,
      `${value.entityName}: ${source}.`,
    ),
  ),
  fact("other", CA_PTE_CREDIT_CARRYOVER_KEY, 2140, "His filed 2024 FTB 3804-CR, line 5."),
];

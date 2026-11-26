/*
 * A made-up taxpayer (README.md): a single full-year California resident in
 * Fresno with one rental (net income) and two California credits from
 * passive activities. Every name, number and address is invented. The W-2 has
 * no PDF; the rental, the credits (as FTB 3521 and FTB 3523 figure them) and
 * last year's unallowed credit are his answers.
 */

import {
  makeCaPassiveCarryoverKey,
  makeCaPassiveCreditFactKey,
  makeRentalFactKey,
  makeW2FactKey,
  RENTAL_KEYS,
  type CaPassiveCreditFactValue,
  type PassiveCreditActivity,
  type RentalFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LEONIN_USER_ID = "leonin-synthetic";
export const LEONIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const HOME = { line1: "3310 N Van Ness Blvd", city: "Fresno", state: "CA", zip: "93704" };
const TAXPAYER = { firstName: "Leonin", lastName: "Castellane", ssn: "400-00-3803" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LEONIN_USER_ID,
  taxYear: LEONIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LEONIN_USER_ID, taxYear: LEONIN_TAX_YEAR, suffix, value });

/* Box 4 is 6.2% and box 6 1.45% of wages; CA SDI is 1.2%. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "San Joaquin Irrigation District",
  employerEin: "12-3803803",
  employerAddress: { line1: "2440 Tulare St", city: "Fresno", state: "CA", zip: "93721" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 82000,
  box2: 8900,
  box3: 82000,
  box4: 5084,
  box5: 82000,
  box6: 1189,
  box14: [{ label: "CA SDI", amount: 984 }],
  box15: "CA",
  box16: 82000,
  box17: 3600,
};

/* A house he manages, with net income of $14,000. */
const oliveHouse: RentalFactValue = {
  owner: "taxpayer",
  propertyType: "single_family",
  address: { street: "1642 E Olive Ave", city: "Fresno", state: "CA", zip: "93728" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 26400,
  expenses: { insurance: 1400, mortgageInterest: 6200, repairs: 1200, taxes: 3600 },
  activeParticipation: true,
  allInvestmentAtRisk: true,
  qualifiedBusiness: false,
  tradeOrBusiness: false,
};

/* The passive activities of the credits (federal Form 8582-CR Worksheets 2 and 4). */
const FULTON_HOUSING: PassiveCreditActivity = {
  name: "Fulton Housing Partners",
  rentalRealEstate: true,
  // He bought his partnership interest in 1988 (ca-3801cr-inst-2025::sec::line-2a-through-line-2c::b01).
  before1990: true,
};
const KINGS_RIVER: PassiveCreditActivity = {
  name: "Kings River Ag Analytics LP",
  rentalRealEstate: false,
};

export const CREDITS: Array<[slug: string, value: CaPassiveCreditFactValue, source: string]> = [
  [
    "fulton-housing",
    { creditCode: "172", column: "current", amount: 600, activity: FULTON_HOUSING },
    "Verbal, 2026-11-26: the FTB 3521 amount.",
  ],
  [
    "fulton-housing-2024",
    { creditCode: "172", column: "prior_year_unallowed", amount: 1800, activity: FULTON_HOUSING },
    "Verbal, 2026-11-26: 2024 FTB 3801-CR, Worksheet 9 column (b).",
  ],
  [
    "kings-river-research",
    { creditCode: "183", column: "current", amount: 1200, activity: KINGS_RIVER },
    "Verbal, 2026-11-26: the FTB 3523 amount.",
  ],
];

const HOUSE = makeRentalFactKey("olive-house");

export const leoninFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "09/21/1962"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Fresno"),
  idFact("occupation", "Hydrologist"),
  idFact("phone", "559-555-0164"),
  fact("wages", makeW2FactKey("san-joaquin"), w2, "W-2 from San Joaquin Irrigation District."),
  fact("rental", HOUSE, oliveHouse, "Verbal: rents and expenses."),
  fact("rental", RENTAL_KEYS.realEstateProfessional, false, "Verbal: he works full time."),
  fact("rental", RENTAL_KEYS.paymentsRequire1099, false, "Verbal: no payments needing a 1099."),
  fact("rental", makeCaPassiveCarryoverKey(HOUSE), 0, "Verbal: no 2024 FTB 3801 carryover."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  ...CREDITS.map(([slug, value, source]) =>
    fact("other", makeCaPassiveCreditFactKey(slug), value, source),
  ),
];

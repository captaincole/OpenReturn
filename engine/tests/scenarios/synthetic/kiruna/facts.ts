/*
 * A made-up taxpayer (README.md): a single full-year California resident in
 * San Jose with two rentals and California credits from passive activities.
 * Every name, number and address is invented. The W-2 has no PDF; the rentals,
 * the credits (as FTB 3521, FTB 3523 and FTB 3540 figure them) and last year's
 * unallowed credits are her answers.
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

export const KIRUNA_USER_ID = "kiruna-synthetic";
export const KIRUNA_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";
const HOME = { line1: "742 Minnesota Ave", city: "San Jose", state: "CA", zip: "95125" };
const TAXPAYER = { firstName: "Kiruna", lastName: "Vashelle", ssn: "400-00-3802" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: KIRUNA_USER_ID,
  taxYear: KIRUNA_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: KIRUNA_USER_ID, taxYear: KIRUNA_TAX_YEAR, suffix, value });

/* Box 4 is 6.2% and box 6 1.45% of wages; CA SDI is 1.2%. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Guadalupe Valley Instruments Inc",
  employerEin: "12-3803801",
  employerAddress: { line1: "50 W San Fernando St", city: "San Jose", state: "CA", zip: "95113" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 118000,
  box2: 15200,
  box3: 118000,
  box4: 7316,
  box5: 118000,
  box6: 1711,
  box14: [{ label: "CA SDI", amount: 1416 }],
  box15: "CA",
  box16: 118000,
  box17: 7400,
};

const managed = {
  owner: "taxpayer",
  fairRentalDays: 365,
  personalUseDays: 0,
  activeParticipation: true,
  allInvestmentAtRisk: true,
  qualifiedBusiness: false,
  tradeOrBusiness: false,
} as const;

/* Property A: a duplex she manages, with net income of $28,000. */
const almadenDuplex: RentalFactValue = {
  ...managed,
  propertyType: "multi_family",
  address: { street: "1880 Almaden Rd", city: "San Jose", state: "CA", zip: "95125" },
  rentsReceived: 42000,
  expenses: { insurance: 1800, mortgageInterest: 6000, repairs: 1400, taxes: 4800 },
};

/* Property B: a house she manages, with a net loss of $6,000. */
const willowHouse: RentalFactValue = {
  ...managed,
  propertyType: "single_family",
  address: { street: "1215 Lincoln Ave", city: "San Jose", state: "CA", zip: "95125" },
  rentsReceived: 18000,
  expenses: { insurance: 1500, mortgageInterest: 14000, repairs: 2500, taxes: 6000 },
};

/* The passive activities of the credits (federal Form 8582-CR Worksheets 1, 3 and 4). */
const DUPLEX_ACTIVITY: PassiveCreditActivity = {
  name: "Almaden Rd duplex",
  rentalRealEstate: true,
  activelyParticipated: true,
};
const COYOTE_CREEK: PassiveCreditActivity = {
  name: "Coyote Creek Family Apartments LP",
  rentalRealEstate: true,
  before1990: false,
};
const ALVISO_ROBOTICS: PassiveCreditActivity = {
  name: "Alviso Robotics Partners LP",
  rentalRealEstate: false,
};
const SARATOGA_BIOLOGICS: PassiveCreditActivity = {
  name: "Saratoga Biologics LLC",
  rentalRealEstate: false,
};

const CURRENT = "Verbal, 2026-11-26: the credit form's amount";
const LAST_YEAR = "Verbal, 2026-11-26: 2024 FTB 3801-CR, Worksheet 9 column (b)";

export const CREDITS: Array<[slug: string, value: CaPassiveCreditFactValue, source: string]> = [
  [
    "almaden-research",
    { creditCode: "183", column: "current", amount: 1200, activity: DUPLEX_ACTIVITY },
    `${CURRENT} (FTB 3523).`,
  ],
  [
    "almaden-research-2024",
    { creditCode: "183", column: "prior_year_unallowed", amount: 300, activity: DUPLEX_ACTIVITY },
    `${LAST_YEAR}.`,
  ],
  [
    "coyote-creek-housing",
    { creditCode: "172", column: "current", amount: 4000, activity: COYOTE_CREEK },
    `${CURRENT} (FTB 3521).`,
  ],
  [
    "coyote-creek-housing-2024",
    { creditCode: "172", column: "prior_year_unallowed", amount: 1500, activity: COYOTE_CREEK },
    `${LAST_YEAR}.`,
  ],
  [
    "alviso-research",
    { creditCode: "183", column: "current", amount: 2500, activity: ALVISO_ROBOTICS },
    `${CURRENT} (FTB 3523).`,
  ],
  [
    "saratoga-orphan-drug-2024",
    {
      creditCode: "185",
      column: "prior_year_unallowed",
      amount: 800,
      activity: SARATOGA_BIOLOGICS,
    },
    `${LAST_YEAR} (FTB 3540).`,
  ],
];

const DUPLEX = makeRentalFactKey("almaden-duplex");
const HOUSE = makeRentalFactKey("lincoln-house");

export const kirunaFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "03/14/1979"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Santa Clara"),
  idFact("occupation", "Test engineer"),
  idFact("phone", "408-555-0138"),
  fact("wages", makeW2FactKey("guadalupe"), w2, "W-2 from Guadalupe Valley Instruments Inc."),
  fact("rental", DUPLEX, almadenDuplex, "Verbal: rents and expenses."),
  fact("rental", HOUSE, willowHouse, "Verbal: rents and expenses."),
  fact("rental", RENTAL_KEYS.realEstateProfessional, false, "Verbal: she works full time."),
  fact("rental", RENTAL_KEYS.paymentsRequire1099, false, "Verbal: no payments needing a 1099."),
  fact("rental", makeCaPassiveCarryoverKey(DUPLEX), 0, "Verbal: no 2024 FTB 3801 carryover."),
  fact("rental", makeCaPassiveCarryoverKey(HOUSE), 0, "Verbal: no 2024 FTB 3801 carryover."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
  ...CREDITS.map(([slug, value, source]) =>
    fact("other", makeCaPassiveCreditFactKey(slug), value, source),
  ),
];

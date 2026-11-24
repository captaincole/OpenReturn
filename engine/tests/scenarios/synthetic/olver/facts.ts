/*
 * A made-up taxpayer (README.md): a single real estate professional in
 * Oakland, California, with a commercial building, a rental house and a
 * self-rental. Every name, number and address is invented. The 1099-INT has no
 * PDF; the rentals and last year's California carryovers are his answers.
 */

import {
  makeCaPassiveCarryoverKey,
  makeInterestFactKey,
  makeRentalFactKey,
  RENTAL_KEYS,
  type InterestFactValue,
  type RentalFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const OLVER_USER_ID = "olver-synthetic";
export const OLVER_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-23T00:00:00Z";
const HOME = { line1: "88 Tidewater Ave", city: "Oakland", state: "CA", zip: "94610" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: OLVER_USER_ID,
  taxYear: OLVER_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: OLVER_USER_ID, taxYear: OLVER_TAX_YEAR, suffix, value });

/* Each property: Olver materially participates, as a real estate professional. */
const professional = {
  owner: "taxpayer",
  fairRentalDays: 365,
  personalUseDays: 0,
  activeParticipation: true,
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  qualifiedBusiness: false,
  tradeOrBusiness: true,
} as const;

/*
 * Property D: a shop building with net income. Its California carryover arose
 * while he actively participated, so it stays in Part IV.
 */
const shopBuilding: RentalFactValue = {
  ...professional,
  activeParticipationWhenLossArose: true,
  propertyType: "commercial",
  address: { street: "1500 Foothill Blvd", city: "Oakland", state: "CA", zip: "94606" },
  rentsReceived: 30000,
  expenses: {
    insurance: 1500,
    mortgageInterest: 9000,
    repairs: 1000,
    taxes: 4500,
    depreciationOrDepletion: 2000,
  },
};

/* Property E: a rental house with a loss; California depreciation is $700 less than federal. */
const maplewoodHouse: RentalFactValue = {
  ...professional,
  propertyType: "single_family",
  address: { street: "61 Maplewood Dr", city: "Hayward", state: "CA", zip: "94541" },
  rentsReceived: 9600,
  expenses: { insurance: 900, mortgageInterest: 6000, taxes: 2400 },
  depreciation: { priorYearMacrs: 4000, californiaPriorYearDepreciation: 3300 },
};

/* Property F: an office he rents to his own brokerage, with net income. */
const brokerageOffice: RentalFactValue = {
  ...professional,
  propertyType: "self_rental",
  address: { street: "240 Grand Ave", city: "Oakland", state: "CA", zip: "94610" },
  rentsReceived: 8000,
  expenses: { insurance: 1000, taxes: 1000 },
};

const savings: InterestFactValue = { payerName: "Bayside Savings", box1: 1200 };

const SHOP = makeRentalFactKey("foothill-shop");
const HOUSE = makeRentalFactKey("maplewood-house");
const OFFICE = makeRentalFactKey("grand-office");

export const olverFacts: TaxFactRow[] = [
  idFact("name.first", "Olver"),
  idFact("name.last", "Penhallow"),
  idFact("ssn", "400-00-0431"),
  idFact("dob", "07/30/1976"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Alameda"),
  idFact("occupation", "Real estate broker"),
  idFact("phone", "510-555-0187"),
  fact("investment_income", makeInterestFactKey("bayside"), savings, "1099-INT, Bayside Savings."),
  fact("rental", SHOP, shopBuilding, "Verbal: rents and expenses."),
  fact("rental", HOUSE, maplewoodHouse, "Verbal: rents, expenses and depreciation."),
  fact("rental", OFFICE, brokerageOffice, "Verbal: rent from his brokerage and expenses."),
  fact("rental", RENTAL_KEYS.realEstateProfessional, true, "Verbal: over 750 hours as a broker."),
  fact("rental", RENTAL_KEYS.paymentsRequire1099, false, "Verbal: no payments needing a 1099."),
  fact(
    "rental",
    makeCaPassiveCarryoverKey(SHOP),
    7000,
    "Verbal: 2024 FTB 3801 Part VII column (c), the Foothill shop.",
  ),
  fact("rental", makeCaPassiveCarryoverKey(HOUSE), 0, "Verbal: no 2024 FTB 3801 carryover."),
  fact("rental", makeCaPassiveCarryoverKey(OFFICE), 0, "Verbal: no 2024 FTB 3801 carryover."),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: covered all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];

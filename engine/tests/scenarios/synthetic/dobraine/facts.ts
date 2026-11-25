/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the exchange is amounts from closing statements and the
 * depreciation schedule, which no official form prints.
 */

import {
  SECTION_1231_KEYS,
  makeLikeKindExchangeFactKey,
  makeW2FactKey,
  type LikeKindExchangeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const DOBRAINE_USER_ID = "dobraine-integration";
export const DOBRAINE_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: DOBRAINE_USER_ID,
  taxYear: DOBRAINE_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const DOBRAINE = {
  firstName: "Dobraine",
  lastName: "Halvorsen",
  ssn: "400-00-8826",
  street: "2209 Orchard Bend Rd",
  city: "Walla Walla",
  state: "WA",
  zip: "99362",
};

const address = {
  line1: DOBRAINE.street,
  city: DOBRAINE.city,
  state: DOBRAINE.state,
  zip: DOBRAINE.zip,
};

const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Blue Mountain Grain Cooperative",
  employerEin: "00-0008826",
  employerAddress: { line1: "14 Elevator Row", city: "Walla Walla", state: "WA", zip: "99362" },
  employee: {
    firstName: DOBRAINE.firstName,
    lastName: DOBRAINE.lastName,
    ssn: DOBRAINE.ssn,
    address,
  },
  box1: 76000,
  box2: 8100,
  box3: 76000,
  box4: 4712,
  box5: 76000,
  box6: 1102,
};

/*
 * A grain storage site held for use in a business: land and permanently
 * affixed bins (section 1245 real property). Traded through a qualified
 * intermediary for a light industrial lot with a building, plus cash.
 */
export const DOBRAINE_EXCHANGE: LikeKindExchangeFactValue = {
  givenUp: {
    description: "Grain storage site with permanently affixed bins, 610 Quarry Rd, Walla Walla, WA",
    dateAcquired: "2014-06-02",
    dateTransferred: "2025-03-18",
    use: "business_or_rental",
    adjustedBasis: 60000,
    recapture: { section1245Depreciation: 18000 },
  },
  received: {
    description:
      "Light industrial lot with a building and an access easement, 88 Railspur Way, Spokane, WA",
    dateIdentified: "2025-04-10",
    dateReceived: "2025-07-01",
    fairMarketValue: 260000,
    section1250Value: 180000,
    section1245Value: 50000,
    intangibleValue: 10000,
  },
  cashReceived: 30000,
  exchangeExpenses: 4000,
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: DOBRAINE_USER_ID, taxYear: DOBRAINE_TAX_YEAR, suffix, value });

export const dobraineFacts: TaxFactRow[] = [
  idFact("name.first", DOBRAINE.firstName),
  idFact("name.last", DOBRAINE.lastName),
  idFact("ssn", DOBRAINE.ssn),
  idFact("dob", "10/07/1971"),
  idFact("address.street", DOBRAINE.street),
  idFact("address.city", DOBRAINE.city),
  idFact("address.state", DOBRAINE.state),
  idFact("address.zip", DOBRAINE.zip),
  idFact("occupation", "Grain elevator manager"),
  idFact("phone", "509-555-0133"),
  fact("wages", makeW2FactKey("blue-mountain"), w2, "W-2 from Blue Mountain Grain Cooperative."),
  fact(
    "other",
    makeLikeKindExchangeFactKey("quarry-road-site"),
    DOBRAINE_EXCHANGE,
    "Verbal, 2026-11-24: closing statements, the intermediary's exchange summary and the depreciation schedule.",
  ),
  fact(
    "other",
    SECTION_1231_KEYS.nonrecapturedLosses,
    0,
    "Verbal, 2026-11-24: no net section 1231 loss in 2020 through 2024.",
  ),
];

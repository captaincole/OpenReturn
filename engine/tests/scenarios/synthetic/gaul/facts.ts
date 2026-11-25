/*
 * A made-up taxpayer (README.md): every name and amount is invented. No input
 * documents: the exchange and the Part IV sale are amounts from closing
 * statements and broker records, which no official form prints.
 */

import {
  makeConflictOfInterestSaleFactKey,
  makeLikeKindExchangeFactKey,
  makeW2FactKey,
  type ConflictOfInterestSaleFactValue,
  type LikeKindExchangeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const GAUL_USER_ID = "gaul-integration";
export const GAUL_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-24T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: GAUL_USER_ID,
  taxYear: GAUL_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const GAUL = {
  firstName: "Gaul",
  lastName: "Renner",
  ssn: "400-00-8824",
  street: "1415 Caliche Ridge Dr",
  city: "San Marcos",
  state: "TX",
  zip: "78666",
};

const address = { line1: GAUL.street, city: GAUL.city, state: GAUL.state, zip: GAUL.zip };

/* W-2 from a made-up federal agency: Gaul is an executive branch employee. */
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Bureau of Range Survey",
  employerEin: "00-0008824",
  employerAddress: { line1: "900 Agency Plaza", city: "Austin", state: "TX", zip: "78701" },
  employee: { firstName: GAUL.firstName, lastName: GAUL.lastName, ssn: GAUL.ssn, address },
  box1: 98000,
  box2: 12500,
  box3: 98000,
  box4: 6076,
  box5: 98000,
  box6: 1421,
};

/*
 * Investment land and stock traded with his brother, through a qualified
 * intermediary, for other land and a pickup truck plus cash. Nobody sold or
 * disposed of the property in 2025.
 */
export const GAUL_EXCHANGE: LikeKindExchangeFactValue = {
  givenUp: {
    description: "Vacant land, 40 acres, 1200 County Road 18, Bastrop, TX",
    dateAcquired: "2016-03-14",
    dateTransferred: "2025-05-09",
    use: "investment",
    adjustedBasis: 84000,
    liabilitiesAssumedByOtherParty: 20000,
  },
  received: {
    description: "Vacant land, 25 acres, 300 Pecan Hollow Rd, Fredericksburg, TX",
    dateIdentified: "2025-06-02",
    dateReceived: "2025-08-15",
    fairMarketValue: 150000,
    liabilitiesAssumed: 5000,
  },
  cashReceived: 12000,
  exchangeExpenses: 3500,
  otherPropertyGivenUp: {
    description: "100 shares Lakeshore Grain Co. common stock",
    fairMarketValue: 6000,
    adjustedBasis: 2500,
    dateAcquired: "2019-02-11",
    use: "investment",
  },
  otherPropertyReceived: { description: "Used pickup truck", fairMarketValue: 8000 },
  relatedParty: {
    name: "Davin Renner",
    relationship: "Brother",
    identifyingNumber: "400-00-8825",
    address: "77 Mesquite Trail, Kerrville, TX 78028",
    relatedPartyDisposed: false,
    taxpayerDisposed: false,
  },
};

/* Stock sold under a certificate of divestiture; Treasury notes bought within 60 days. */
export const GAUL_DIVESTITURE: ConflictOfInterestSaleFactValue = {
  certificateNumber: "25-0417",
  divestedDescription: "300 shares Brazos Energy Partners Inc. common stock",
  replacementDescription: "U.S. Treasury notes due 2030",
  dateAcquired: "2024-11-04",
  dateSold: "2025-04-02",
  amountReceived: 48600,
  sellingExpenses: 100,
  basis: 31000,
  replacementCost: 44000,
  use: "investment",
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: GAUL_USER_ID, taxYear: GAUL_TAX_YEAR, suffix, value });

export const gaulFacts: TaxFactRow[] = [
  idFact("name.first", GAUL.firstName),
  idFact("name.last", GAUL.lastName),
  idFact("ssn", GAUL.ssn),
  idFact("dob", "02/19/1979"),
  idFact("address.street", GAUL.street),
  idFact("address.city", GAUL.city),
  idFact("address.state", GAUL.state),
  idFact("address.zip", GAUL.zip),
  idFact("occupation", "Federal land surveyor"),
  idFact("phone", "512-555-0148"),
  fact("wages", makeW2FactKey("range-survey"), w2, "W-2 from Bureau of Range Survey."),
  fact(
    "other",
    makeLikeKindExchangeFactKey("bastrop-land"),
    GAUL_EXCHANGE,
    "Verbal, 2026-11-24: closing statements and the intermediary's exchange summary.",
  ),
  fact(
    "other",
    makeConflictOfInterestSaleFactKey("brazos-stock"),
    GAUL_DIVESTITURE,
    "Verbal, 2026-11-24: certificate of divestiture number and broker records; the deferral is elected.",
  ),
];

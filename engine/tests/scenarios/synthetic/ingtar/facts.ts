/*
 * Made-up taxpayers (README.md): every name, number and address is invented.
 * No input documents: the exchange amounts come from closing statements and
 * the intermediary's summary, and the California answers are the couple's own,
 * which no official form prints. The W-2s have no PDF.
 */

import {
  SPOUSE_KEYS,
  makeCaLikeKindExchangeFactKey,
  makeLikeKindExchangeFactKey,
  makeW2FactKey,
  type CaLikeKindExchangeFactValue,
  type LikeKindExchangeFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const INGTAR_USER_ID = "ingtar-synthetic";
export const INGTAR_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-25T00:00:00Z";
const HOME = { line1: "5120 Laurel Bluff Way", city: "Sacramento", state: "CA", zip: "95831" };
const TAXPAYER = { firstName: "Ingtar", lastName: "Vallemont", ssn: "400-00-3840" };
const SPOUSE = { firstName: "Mairin", lastName: "Vallemont", ssn: "400-00-3841" };

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: INGTAR_USER_ID,
  taxYear: INGTAR_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: INGTAR_USER_ID, taxYear: INGTAR_TAX_YEAR, suffix, value });

const ingtarW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Delta Levee Engineering Group",
  employerEin: "12-3456840",
  employerAddress: { line1: "300 Capitol Mall", city: "Sacramento", state: "CA", zip: "95814" },
  employee: { ...TAXPAYER, address: HOME },
  box1: 112000,
  box2: 14800,
  box3: 112000,
  box4: 6944,
  box5: 112000,
  box6: 1624,
  box14: [{ label: "CA SDI", amount: 1344 }],
  box15: "CA",
  box16: 112000,
  box17: 6900,
};

const mairinW2: W2FactValue = {
  owner: "spouse",
  employerName: "Sacramento Valley Water Authority",
  employerEin: "12-3456841",
  employerAddress: { line1: "1415 River Park Dr", city: "Sacramento", state: "CA", zip: "95815" },
  employee: { ...SPOUSE, address: HOME },
  box1: 64000,
  box2: 6100,
  box3: 64000,
  box4: 3968,
  box5: 64000,
  box6: 928,
  box14: [{ label: "CA SDI", amount: 768 }],
  box15: "CA",
  box16: 64000,
  box17: 2700,
};

const SLUG = "placer-land";

/*
 * Investment land in Placer County, with no street address, traded with
 * Ingtar's sister through a qualified intermediary for land in Reno, Nevada,
 * plus cash; he also gave up stock. The buyer took over the $30,000 loan on the
 * Placer land; Ingtar took over a $10,000 loan on the Reno land. Nobody sold or
 * disposed of either property in 2025.
 */
export const INGTAR_EXCHANGE: LikeKindExchangeFactValue = {
  givenUp: {
    description: "Vacant land, 12 acres, APN 040-210-015, Placer County, CA",
    dateAcquired: "2012-06-18",
    dateTransferred: "2025-04-11",
    use: "investment",
    adjustedBasis: 140000,
    liabilitiesAssumedByOtherParty: 30000,
  },
  received: {
    description: "Vacant land, 10 acres, 4800 Lemmon Valley Dr, Reno, NV",
    dateIdentified: "2025-05-02",
    dateReceived: "2025-07-21",
    fairMarketValue: 260000,
    liabilitiesAssumed: 10000,
  },
  cashReceived: 15000,
  exchangeExpenses: 6000,
  otherPropertyGivenUp: {
    description: "50 shares Sutter Orchard Supply Co. common stock",
    fairMarketValue: 9000,
    adjustedBasis: 4000,
    dateAcquired: "2018-09-05",
    use: "investment",
  },
  relatedParty: {
    name: "Kerene Vallemont",
    relationship: "Sister",
    identifyingNumber: "400-00-3842",
    address: "77 Sagebrush Ct, Reno, NV 89506",
    relatedPartyDisposed: false,
    taxpayerDisposed: false,
  },
};

/*
 * The Placer land came from a 2012 exchange of a rental duplex. California did
 * not allow the duplex's bonus depreciation, so the California basis carried
 * into the land is $10,000 higher than the federal basis.
 */
export const INGTAR_CA_EXCHANGE: CaLikeKindExchangeFactValue = {
  givenUp: {
    inCalifornia: true,
    ownershipPercent: 100,
    address: "APN 040-210-015, Placer County",
    state: "CA",
    priorDeferredExchange: true,
    californiaAdjustedBasis: 150000,
  },
  received: {
    inCalifornia: false,
    ownershipPercent: 100,
    address: "4800 Lemmon Valley Dr",
    city: "Reno",
    state: "NV",
    zip: "89506",
  },
  recognizedIn2025: false,
};

export const ingtarFacts: TaxFactRow[] = [
  idFact("name.first", TAXPAYER.firstName),
  idFact("name.last", TAXPAYER.lastName),
  idFact("ssn", TAXPAYER.ssn),
  idFact("dob", "08/14/1977"),
  idFact("address.street", HOME.line1),
  idFact("address.city", HOME.city),
  idFact("address.state", HOME.state),
  idFact("address.zip", HOME.zip),
  idFact("address.county", "Sacramento"),
  idFact("occupation", "Civil engineer"),
  idFact("phone", "916-555-0384"),
  fact("identity", SPOUSE_KEYS.firstName, SPOUSE.firstName, "Verbal: spouse's name."),
  fact("identity", SPOUSE_KEYS.lastName, SPOUSE.lastName, "Verbal: spouse's name."),
  fact("identity", SPOUSE_KEYS.occupation, "Hydrologist", "Verbal: spouse's occupation."),
  fact("identity", SPOUSE_KEYS.ssn, SPOUSE.ssn, "Verbal: spouse's SSN."),
  fact("identity", SPOUSE_KEYS.dob, "03/02/1980", "Verbal: spouse's date of birth."),
  fact("wages", makeW2FactKey("delta-levee"), ingtarW2, "W-2 from Delta Levee Engineering Group."),
  fact(
    "wages",
    makeW2FactKey("valley-water"),
    mairinW2,
    "W-2 from Sacramento Valley Water Authority.",
  ),
  fact(
    "other",
    makeLikeKindExchangeFactKey(SLUG),
    INGTAR_EXCHANGE,
    "Verbal, 2026-11-25: closing statements and the intermediary's exchange summary.",
  ),
  fact(
    "other",
    makeCaLikeKindExchangeFactKey(SLUG),
    INGTAR_CA_EXCHANGE,
    "Verbal, 2026-11-25: the parcel and Reno addresses, full ownership, and the California basis from the 2012 FTB 3840 records.",
  ),
  fact("health_coverage", "health_coverage.full_year_mec", true, "Verbal: employer plan all year."),
  fact("use_tax", "use_tax.owed_amount", 0, "Verbal: no out-of-state purchases."),
];

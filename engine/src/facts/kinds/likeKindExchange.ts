/*
 * Form 8824: one fact per like-kind exchange of real property held for use in a
 * trade or business or for investment (irs-8824-inst-2025::sec::purpose-of-form::b01),
 * and one fact per section 1043 conflict-of-interest sale (Part IV). The
 * taxpayer states the amounts from the closing statements, the exchange
 * agreement and the depreciation records: no official form prints them.
 *
 * An exchange fact describes one property given up and one received. California
 * reads the same fact for FTB 3840 (an exchange of California property for
 * property in another state), so the descriptions name the place.
 */

import { isIsoDate } from "./depreciation.js";

type FactRow = { key: string; value: unknown; category: string };

/*
 * How the taxpayer held a property: in a trade or business or for rent
 * (section 1231 property: its gain goes on Form 4797), or for investment (a
 * capital asset: its gain goes on Schedule D) (irs-8824-inst-2025::sec::line-22::b01).
 */
export type ExchangePropertyUse = "business_or_rental" | "investment";

/*
 * Line 21: what the depreciation records say about the property given up
 * (irs-8824-inst-2025::sec::line-21::b01). Absent: none.
 */
export interface ExchangeRecapture {
  /* Depreciation or amortization allowed or allowable on its section 1245 real property parts. */
  section1245Depreciation?: number;
  /*
   * The ordinary income for additional depreciation if the section 1250 property
   * had been sold: the Form 4797 line 26g amount (see the Form 4797 line 26 instructions).
   */
  section1250OrdinaryIfSold?: number;
  /* Straight-line depreciation allowed or allowable on its section 1250 parts (a building). */
  section1250Depreciation?: number;
  /* Part of it is section 1252, 1254 or 1255 property (farmland, mineral, cost-sharing property). */
  section1252To1255?: boolean;
}

export interface ExchangePropertyGivenUp {
  /* Line 1: the address and type of property; the country when outside the United States. */
  description: string;
  /* Line 3, YYYY-MM-DD. */
  dateAcquired: string;
  /* Line 4, YYYY-MM-DD: the date the taxpayer transferred it. */
  dateTransferred: string;
  use: ExchangePropertyUse;
  /* Line 18: its adjusted basis. */
  adjustedBasis: number;
  /* Lines 15 and 18: the mortgages and other liabilities on it that the other party assumed. */
  liabilitiesAssumedByOtherParty?: number;
  recapture?: ExchangeRecapture;
  /*
   * The Schedule C business or the rental (rental.ts propertyId) that used it,
   * as a Form 4797 sale names one (businessPropertySale.ts). A business_or_rental
   * property's gain is that activity's on Form 4797.
   */
  businessId?: string;
  rentalId?: string;
}

export interface ExchangePropertyReceived {
  /* Line 2: the address and type of property; the country when outside the United States. */
  description: string;
  /* Line 5, YYYY-MM-DD: the written identification in a deferred exchange. Absent: a simultaneous exchange. */
  dateIdentified?: string;
  /* Line 6, YYYY-MM-DD. */
  dateReceived: string;
  /* Line 16: its fair market value. */
  fairMarketValue: number;
  /* Lines 15 and 18: the liabilities on it that the taxpayer assumed. */
  liabilitiesAssumed?: number;
  /* Lines 21 and 25a–25c: the fair market value of its section 1250, section 1245 (1252, 1254, 1255) and intangible parts. */
  section1250Value?: number;
  section1245Value?: number;
  intangibleValue?: number;
}

/* Other (not like-kind) property given up: lines 12–14. */
export interface ExchangeOtherPropertyGivenUp {
  description: string;
  fairMarketValue: number;
  adjustedBasis: number;
  /* YYYY-MM-DD: its holding period sets where line 14 goes. */
  dateAcquired: string;
  use: ExchangePropertyUse;
}

/* Lines 15a: other (not like-kind) property received, not cash. */
export interface ExchangeOtherPropertyReceived {
  description: string;
  fairMarketValue: number;
}

/* The line 11 exceptions (irs-8824-inst-2025::sec::lines-11a-through-11c::b01). */
export type RelatedPartyException = "death" | "involuntary_conversion" | "no_tax_avoidance";

/* Part II: an exchange made with a related party, directly or indirectly (irs-8824-inst-2025::sec::line-7::b01). */
export interface RelatedPartyExchange {
  /* Line 8. */
  name: string;
  relationship: string;
  identifyingNumber?: string;
  address: string;
  /* Line 9: during 2025 the related party sold or disposed of the property it received. Absent: not answered. */
  relatedPartyDisposed?: boolean;
  /* Line 10: during 2025 the taxpayer sold or disposed of the property received. Absent: not answered. */
  taxpayerDisposed?: boolean;
  /* The note under line 7: the related party sold the replacement property into the exchange. */
  soldIntoExchange?: boolean;
  exception?: RelatedPartyException;
}

export interface LikeKindExchangeFactValue {
  givenUp: ExchangePropertyGivenUp;
  received: ExchangePropertyReceived;
  /* Line 15: cash the other party paid the taxpayer. */
  cashReceived?: number;
  /* Lines 15 and 18: cash the taxpayer paid the other party. */
  cashPaid?: number;
  otherPropertyGivenUp?: ExchangeOtherPropertyGivenUp;
  otherPropertyReceived?: ExchangeOtherPropertyReceived;
  /* Lines 15 and 18: commissions, escrow, title and other costs of the exchange the taxpayer paid. */
  exchangeExpenses?: number;
  /*
   * A main home given up: the section 121 exclusion figured with Pub. 523
   * (irs-8824-inst-2025::sec::property-used-as-home::b01). Absent: none.
   */
  section121Exclusion?: number;
  /* The property was used partly as a main home and partly for business or investment (property-used-as-home::b02). */
  usedPartlyAsHome?: boolean;
  /* The installment method applies to the gain (a note received): Form 6252 (irs-8824-inst-2025::sec::line-22::b01). */
  installmentMethod?: boolean;
  relatedParty?: RelatedPartyExchange;
}

export interface LikeKindExchangeFact {
  key: string;
  value: LikeKindExchangeFactValue;
}

/* Part IV: a sale under a certificate of divestiture (irs-8824-inst-2025::sec::section-1043-conflict-of-interest::b01). */
export interface ConflictOfInterestSaleFactValue {
  /* Line 26: the number in the upper right corner of the certificate, as printed ("12345-678"). */
  certificateNumber: string;
  /* Lines 27 and 28. */
  divestedDescription: string;
  replacementDescription: string;
  /* YYYY-MM-DD: its holding period sets where line 36 goes. */
  dateAcquired: string;
  /* Line 29, YYYY-MM-DD. */
  dateSold: string;
  /* Line 30: the amount received, and the selling expenses taken off it (irs-8824-inst-2025::sec::line-30::b01). */
  amountReceived: number;
  sellingExpenses?: number;
  /* Line 31. */
  basis: number;
  /* Line 33: the cost of the permitted property bought within 60 days after the sale. */
  replacementCost: number;
  use: ExchangePropertyUse;
}

export interface ConflictOfInterestSaleFact {
  key: string;
  value: ConflictOfInterestSaleFactValue;
}

const EXCHANGE_CATEGORY = "other";
const EXCHANGE_PREFIX = "like_kind_exchange.";
const DIVESTITURE_PREFIX = "conflict_of_interest_sale.";

export function makeLikeKindExchangeFactKey(slug: string): string {
  return `${EXCHANGE_PREFIX}${slug}`;
}

export function makeConflictOfInterestSaleFactKey(slug: string): string {
  return `${DIVESTITURE_PREFIX}${slug}`;
}

const hasPrefix = (key: string, prefix: string): boolean => {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === prefix && parts[1] !== "";
};

export const isLikeKindExchangeFactKey = (key: string): boolean => hasPrefix(key, EXCHANGE_PREFIX);

export const isConflictOfInterestSaleFactKey = (key: string): boolean =>
  hasPrefix(key, DIVESTITURE_PREFIX);

const isAmount = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const isOptionalAmount = (value: unknown): boolean => value === undefined || isAmount(value);
const isText = (value: unknown): boolean => typeof value === "string" && value !== "";
const isOptionalText = (value: unknown): boolean => value === undefined || isText(value);
const isOptionalFlag = (value: unknown): boolean =>
  value === undefined || typeof value === "boolean";
const isUse = (value: unknown): boolean => value === "business_or_rental" || value === "investment";
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const RECAPTURE_AMOUNTS = [
  "section1245Depreciation",
  "section1250OrdinaryIfSold",
  "section1250Depreciation",
] as const;

function isGivenUp(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const recapture = value.recapture;
  return (
    isText(value.description) &&
    isIsoDate(value.dateAcquired) &&
    isIsoDate(value.dateTransferred) &&
    isUse(value.use) &&
    isAmount(value.adjustedBasis) &&
    isOptionalAmount(value.liabilitiesAssumedByOtherParty) &&
    (recapture === undefined ||
      (isRecord(recapture) &&
        RECAPTURE_AMOUNTS.every((field) => isOptionalAmount(recapture[field])) &&
        isOptionalFlag(recapture.section1252To1255))) &&
    isOptionalText(value.businessId) &&
    isOptionalText(value.rentalId) &&
    !(value.businessId !== undefined && value.rentalId !== undefined)
  );
}

function isReceived(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isText(value.description) &&
    (value.dateIdentified === undefined || isIsoDate(value.dateIdentified)) &&
    isIsoDate(value.dateReceived) &&
    isAmount(value.fairMarketValue) &&
    ["liabilitiesAssumed", "section1250Value", "section1245Value", "intangibleValue"].every(
      (field) => isOptionalAmount(value[field]),
    )
  );
}

const isOtherGivenUp = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    isText(value.description) &&
    isAmount(value.fairMarketValue) &&
    isAmount(value.adjustedBasis) &&
    isIsoDate(value.dateAcquired) &&
    isUse(value.use));

const isOtherReceived = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) && isText(value.description) && isAmount(value.fairMarketValue));

const EXCEPTIONS: readonly unknown[] = ["death", "involuntary_conversion", "no_tax_avoidance"];

const isRelatedParty = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    isText(value.name) &&
    isText(value.relationship) &&
    isOptionalText(value.identifyingNumber) &&
    isText(value.address) &&
    isOptionalFlag(value.relatedPartyDisposed) &&
    isOptionalFlag(value.taxpayerDisposed) &&
    isOptionalFlag(value.soldIntoExchange) &&
    (value.exception === undefined || EXCEPTIONS.includes(value.exception)));

function isExchange(value: unknown): value is LikeKindExchangeFactValue {
  if (!isRecord(value)) return false;
  return (
    isGivenUp(value.givenUp) &&
    isReceived(value.received) &&
    ["cashReceived", "cashPaid", "exchangeExpenses", "section121Exclusion"].every((field) =>
      isOptionalAmount(value[field]),
    ) &&
    isOtherGivenUp(value.otherPropertyGivenUp) &&
    isOtherReceived(value.otherPropertyReceived) &&
    isOptionalFlag(value.usedPartlyAsHome) &&
    isOptionalFlag(value.installmentMethod) &&
    isRelatedParty(value.relatedParty)
  );
}

function isDivestiture(value: unknown): value is ConflictOfInterestSaleFactValue {
  if (!isRecord(value)) return false;
  return (
    isText(value.certificateNumber) &&
    isText(value.divestedDescription) &&
    isText(value.replacementDescription) &&
    isIsoDate(value.dateAcquired) &&
    isIsoDate(value.dateSold) &&
    isAmount(value.amountReceived) &&
    isOptionalAmount(value.sellingExpenses) &&
    isAmount(value.basis) &&
    isAmount(value.replacementCost) &&
    isUse(value.use)
  );
}

function readFacts<T>(
  facts: ReadonlyArray<FactRow>,
  isKey: (key: string) => boolean,
  isValue: (value: unknown) => value is T,
): { facts: Array<{ key: string; value: T }>; malformedKeys: string[] } {
  const rows = facts.filter((row) => row.category === EXCHANGE_CATEGORY && isKey(row.key));
  return {
    facts: rows
      .filter((row) => isValue(row.value))
      .map((row) => ({ key: row.key, value: row.value as T })),
    malformedKeys: rows.filter((row) => !isValue(row.value)).map((row) => row.key),
  };
}

/* Each exchange fact that is well formed, in the order recorded; a malformed one is listed. */
export function readLikeKindExchangeFacts(facts: ReadonlyArray<FactRow>): {
  facts: LikeKindExchangeFact[];
  malformedKeys: string[];
} {
  return readFacts(facts, isLikeKindExchangeFactKey, isExchange);
}

/* Each Part IV sale fact that is well formed, in the order recorded; a malformed one is listed. */
export function readConflictOfInterestSaleFacts(facts: ReadonlyArray<FactRow>): {
  facts: ConflictOfInterestSaleFact[];
  malformedKeys: string[];
} {
  return readFacts(facts, isConflictOfInterestSaleFactKey, isDivestiture);
}

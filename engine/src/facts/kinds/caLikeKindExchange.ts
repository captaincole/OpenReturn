/*
 * FTB 3840: the California answers for one like-kind exchange that no federal
 * form holds. One fact per exchange, with the slug of its Form 8824 fact
 * (likeKindExchange.ts): ca_like_kind_exchange.<slug> goes with
 * like_kind_exchange.<slug>. The federal fact holds the amounts and the dates;
 * this fact holds where each property is, the taxpayer's share, the California
 * basis, and whether the California deferred gain was recognized this year
 * (ca-3840-inst-2025::sec::part-i-properties-given-up::b01, b02;
 * part-ii-properties-received::b01; general-question-a-through-question-c::b01).
 * The taxpayer states each answer: no official document prints them.
 */

type FactRow = { key: string; value: unknown; category: string };

/* Schedule A line 1 (given up) or line 9 (received): one property. */
export interface CaExchangePropertyPlace {
  /* "Is property in California?" */
  inCalifornia: boolean;
  /* The taxpayer's percentage of ownership: more than 0, up to 100. */
  ownershipPercent: number;
  /*
   * The street address; with no street address, the assessor's parcel number and
   * the county; for a Delaware statutory trust, the trust's name.
   */
  address: string;
  /* Blank for a Delaware statutory trust (part-i-properties-given-up::b01). */
  city?: string;
  /* Two letters. "CA" must agree with inCalifornia. */
  state?: string;
  zip?: string;
}

export interface CaExchangePropertyGivenUp extends CaExchangePropertyPlace {
  /* Schedule A line 2: the property was acquired in an earlier tax-deferred exchange. */
  priorDeferredExchange: boolean;
  /*
   * Schedule A line 6: the adjusted basis under California law, when it is not
   * the federal adjusted basis (depreciation methods, credits, write-offs;
   * part-i-properties-given-up::b02). Absent: the same as the federal basis.
   */
  californiaAdjustedBasis?: number;
}

export interface CaLikeKindExchangeFactValue {
  givenUp: CaExchangePropertyGivenUp;
  received: CaExchangePropertyPlace;
  /*
   * The California sourced deferred gain or loss was recognized in 2025: the
   * property received was sold or disposed of in a taxable transaction. The
   * Final FTB 3840 (general-question-a-through-question-c::b02, b03).
   */
  recognizedIn2025: boolean;
  /*
   * Schedule A line 11: the Schedule R line 18a apportionment percentage for the
   * year of the exchange, for a taxpayer who apportions business income to
   * California (part-iii-allocation-of-california-sourced-deferred-gain::b01).
   * Absent: the taxpayer does not apportion.
   */
  apportionmentPercent?: number;
}

export interface CaLikeKindExchangeFact {
  key: string;
  value: CaLikeKindExchangeFactValue;
}

const CATEGORY = "other";
const PREFIX = "ca_like_kind_exchange";
const CALIFORNIA = "CA";
const FULL_PERCENT = 100;

export function makeCaLikeKindExchangeFactKey(slug: string): string {
  return `${PREFIX}.${slug}`;
}

/* The slug of a two-part key ("like_kind_exchange.<slug>"), or undefined. */
export function exchangeSlugOf(key: string): string | undefined {
  const parts = key.split(".");
  return parts.length === 2 && parts[1] !== "" ? parts[1] : undefined;
}

export const isCaLikeKindExchangeFactKey = (key: string): boolean =>
  key.split(".")[0] === PREFIX && exchangeSlugOf(key) !== undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isText = (value: unknown): boolean => typeof value === "string" && value !== "";
const isOptionalText = (value: unknown): boolean => value === undefined || isText(value);
const isPercent = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value) && value > 0 && value <= FULL_PERCENT;
const isOptionalAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

/* A stated state agrees with the California answer. */
const stateAgrees = (state: unknown, inCalifornia: unknown): boolean =>
  state === undefined || (state === CALIFORNIA) === inCalifornia;

function isPlace(value: unknown): value is CaExchangePropertyPlace {
  if (!isRecord(value)) return false;
  return (
    typeof value.inCalifornia === "boolean" &&
    isPercent(value.ownershipPercent) &&
    isText(value.address) &&
    isOptionalText(value.city) &&
    isOptionalText(value.state) &&
    isOptionalText(value.zip) &&
    stateAgrees(value.state, value.inCalifornia)
  );
}

function isCaExchange(value: unknown): value is CaLikeKindExchangeFactValue {
  if (!isRecord(value)) return false;
  const givenUp = value.givenUp;
  return (
    isPlace(givenUp) &&
    isRecord(givenUp) &&
    typeof givenUp.priorDeferredExchange === "boolean" &&
    isOptionalAmount(givenUp.californiaAdjustedBasis) &&
    isPlace(value.received) &&
    typeof value.recognizedIn2025 === "boolean" &&
    (value.apportionmentPercent === undefined ||
      (isOptionalAmount(value.apportionmentPercent) &&
        (value.apportionmentPercent as number) <= FULL_PERCENT))
  );
}

/* Each California exchange fact that is well formed, in the order recorded; a malformed one is listed. */
export function readCaLikeKindExchangeFacts(facts: ReadonlyArray<FactRow>): {
  facts: CaLikeKindExchangeFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === CATEGORY && isCaLikeKindExchangeFactKey(row.key),
  );
  return {
    facts: rows
      .filter((row) => isCaExchange(row.value))
      .map((row) => ({ key: row.key, value: row.value as CaLikeKindExchangeFactValue })),
    malformedKeys: rows.filter((row) => !isCaExchange(row.value)).map((row) => row.key),
  };
}

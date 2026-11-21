/*
 * Form 8283 answers: one fact per noncash gift to charity, or per group of
 * similar items given on one date to one donee (irs-8283-inst-2025::sec::line-1::b03:
 * "enter each contribution and its date on a separate row"). The taxpayer
 * states each value; a vehicle's gross proceeds come from Form 1098-C.
 *
 * Next to the single total `charitable.noncash` (the deductions conversation's
 * amount for Schedule A line 12): when at least one gift fact exists, the gift
 * facts are the whole list of the year's noncash gifts, and line 12 is their
 * total; the single total is not read. So a gift never counts twice
 * (federal/8283/lines.ts noncashGiftsTotal; schedule-a/resolveInfo.ts).
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * The kind of property, as the instructions sort it for the choice of section
 * (irs-8283-inst-2025::sec::which-sections-to-complete::b04–b05) and for the
 * line 2 boxes. A publicly traded security is one listed on an exchange, traded
 * over the counter with published quotations, or a mutual fund share with daily
 * quotations (::b04, 2.a–2.c); any other security is "other_security".
 */
export type NoncashPropertyType =
  | "publicly_traded_security"
  | "other_security"
  | "vehicle"
  | "clothing_household"
  | "art"
  | "collectible"
  | "real_estate"
  | "equipment"
  | "intellectual_property"
  | "digital_asset"
  | "inventory"
  | "conservation"
  | "other";

export interface NoncashGiftDonee {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

/* A qualified vehicle: a car, boat or airplane (irs-8283-inst-2025::sec::qualified-vehicle-donations::b01). */
export interface NoncashGiftVehicle {
  /* Column (b): printed only when the Form 1098-C (or other acknowledgment) is not attached. */
  vin?: string;
  acknowledgmentAttached: boolean;
  /* Form 1098-C: the gross proceeds of the donee's sale; absent when an exception applies. */
  grossProceeds?: number;
  /* Form 1098-C: an exception lets the donor deduct the FMV (::qualified-vehicle-donations::b03). */
  fmvException: boolean;
}

export interface NoncashGiftFactValue {
  /* Column (a). */
  donee: NoncashGiftDonee;
  propertyType: NoncashPropertyType;
  /* Column (c), as the taxpayer describes it (with the condition; for a vehicle the year, make, model and mileage). */
  description: string;
  /* Column (d): MM/DD/YYYY. */
  contributionDate: string;
  /* Column (e): MM/DD/YYYY, or "Various" for a group of similar items all held at least 12 months. */
  dateAcquired?: string;
  /* Column (f): purchase, gift, inheritance or exchange. */
  howAcquired?: string;
  /* Column (g). */
  costBasis?: number;
  /* The FMV on the date of the gift; column (h) unless a reduction applies. */
  fairMarketValue: number;
  /* Column (i): "Appraisal", "Thrift shop value", "Catalog", "Comparable sales". */
  valuationMethod: string;
  vehicle?: NoncashGiftVehicle;
  /*
   * Gifts with the same group name are similar items (coins, paintings, books,
   * clothing; irs-8283-inst-2025::sec::similar-items-of-property::b01): their
   * deductions add up for the $500 and $5,000 tests. Absent, the gift stands alone.
   */
  similarItemsGroup?: string;
  /* A partial interest or a condition on the donee's use (::which-sections-to-complete::b06). */
  partialInterestOrRestrictedUse?: boolean;
  /* Clothing or a household item: in good used condition or better (::which-sections-to-complete::b05). */
  goodUsedCondition?: boolean;
}

export interface NoncashGiftFact {
  giftSlug: string;
  gift: NoncashGiftFactValue;
  factKey: string;
}

const NONCASH_GIFT_CATEGORY = "charitable";
const NONCASH_GIFT_PREFIX = "charitable.noncash_gift.";

export function makeNoncashGiftFactKey(giftSlug: string): string {
  return `${NONCASH_GIFT_PREFIX}${giftSlug}`;
}

export function isNoncashGiftFactKey(key: string): boolean {
  return key.startsWith(NONCASH_GIFT_PREFIX) && key.length > NONCASH_GIFT_PREFIX.length;
}

/* Every noncash gift fact, in the order recorded: the order of the Form 8283 rows. */
export function getNoncashGiftFacts(facts: ReadonlyArray<FactRow>): NoncashGiftFact[] {
  return facts
    .filter((row) => row.category === NONCASH_GIFT_CATEGORY && isNoncashGiftFactKey(row.key))
    .map((row) => ({
      giftSlug: row.key.slice(NONCASH_GIFT_PREFIX.length),
      gift: row.value as NoncashGiftFactValue,
      factKey: row.key,
    }));
}

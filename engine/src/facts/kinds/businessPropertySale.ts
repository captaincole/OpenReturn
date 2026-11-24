/*
 * Form 4797: one fact per property sold or exchanged in 2025 that was used in a
 * trade or business or held for the production of rents (a rental building and
 * its land, equipment, a vehicle) (irs-4797-inst-2025::sec::general-instructions::b01).
 * The taxpayer states the amounts from the closing statement and the
 * depreciation records; the engine places each property in Part I, II or III
 * (irs-4797-inst-2025::sec::where-to-make-first-entry-for-certain-items::b01).
 *
 * Not in this fact: an installment sale (Form 6252), a like-kind exchange (Form
 * 8824), a casualty or theft (Form 4684), depreciable property held only for
 * investment (Form 8949), a section 121 exclusion on a home used for business,
 * and a gain invested in a qualified opportunity fund.
 *
 * Two answers for the whole return go with it: the nonrecaptured net section
 * 1231 losses of the five prior years (line 8), and a Part IV recapture fact
 * per property whose business use fell to 50% or less (section179Recapture.ts).
 */

import { isIsoDate } from "./depreciation.js";

type FactRow = { key: string; value: unknown; category: string };

/*
 * What the property is, for the recapture rules of Part III
 * (irs-4797-inst-2025::sec::line-25::b01, line-26::b01, line-27::b01, line-28::b01):
 * - section_1245: depreciable personal property (equipment, a vehicle, furniture);
 * - section_1250: depreciable real property (a building, its improvements);
 * - land: real property that is not depreciated, such as the land under a building;
 * - section_1252: farmland on which soil, water or land clearing costs were deducted;
 * - section_1254: oil, gas, geothermal or other mineral property;
 * - section_1255: property bought with cost-sharing payments excluded under section 126;
 * - ordinary: property whose gain or loss is ordinary whatever the holding period, such
 *   as property deducted under the de minimis safe harbor (irs-4797-inst-2025::sec::line-10::b01).
 */
export type BusinessPropertyKind =
  | "section_1245"
  | "section_1250"
  | "land"
  | "section_1252"
  | "section_1254"
  | "section_1255"
  | "ordinary";

/* Column (b): "INHERITED" instead of a date for property from someone who died (specific-instructions::b01). */
export const INHERITED = "INHERITED";

export interface BusinessPropertySaleFactValue {
  /* Column (a) / line 19 (a). An elective partial disposition says "Partial Disposition Election" (the engine adds it). */
  description: string;
  kind: BusinessPropertyKind;
  /* Column (b): YYYY-MM-DD, or INHERITED. */
  dateAcquired: string;
  /* Column (c): YYYY-MM-DD, in 2025. */
  dateSold: string;
  /*
   * Line 20 / column (d): money, the FMV of other property received, and any debt
   * the buyer assumed (irs-4797-inst-2025::sec::line-20::b01). Absent: box 2 of
   * the Form 1099-S the sale names.
   */
  grossSalesPrice?: number;
  /* Cost or other basis, plus improvements; not reduced by depreciation (line-21::b01). */
  costOrOtherBasis: number;
  /* Commissions and other expenses of the sale (line 21, column (f)). */
  expenseOfSale?: number;
  /*
   * Line 22 / column (e): depreciation, amortization, depletion and the section 179
   * deduction allowed or allowable since acquisition, this year's included
   * (irs-4797-inst-2025::sec::line-22::b01). Absent: none (land).
   */
  depreciationAllowed?: number;
  /*
   * Section 1250 property, line 26a: depreciation after 1975 over straight line
   * (a special allowance included) (line-26a::b01). Absent: straight line only, so
   * line 26g is 0 (the form's line 26 note).
   */
  additionalDepreciationAfter1975?: number;
  /* Section 1250 property, line 26d: additional depreciation after 1969 and before 1976 (line-26d::b01). */
  additionalDepreciation1970To1975?: number;
  /* Section 1250 property: residential rental property (lines 26d and 26e are skipped). */
  residentialRental?: boolean;
  /*
   * Section 1250 property: low-income housing under section 1250(a)(1)(B), whose
   * line 26b percentage falls 1% a month after 100 full months
   * (irs-pub-544-2025::sec::applicable-percentage::b02).
   */
  lowIncomeHousing?: boolean;
  /* Low-income housing disposed of by foreclosure: the date the proceedings began, YYYY-MM-DD (::b03). */
  foreclosureBegan?: string;
  /* Section 1252 property, line 27a: soil, water and land clearing expenses deducted (line-27::b01). */
  soilWaterLandClearing?: number;
  /* Section 1254 property, line 28a: intangible drilling, development and mining costs and depletion (line-28a::b01). */
  section1254Costs?: number;
  /* Section 1255 property, line 29a: the payments excluded from income under section 126. */
  section126ExcludedPayments?: number;
  /* Section 1255 property: the date the excluded payments were received, YYYY-MM-DD (line-29a::b01). */
  section126PaymentsReceived?: string;
  /* A partial disposition of a MACRS asset (lines 1b and 1c, partial-dispositions-of-macrs-property::b02). */
  partialDisposition?: "elective" | "required";
  /*
   * The Form 1099-S (form1099S.ts) that reports this sale's gross proceeds: line 1a
   * adds its box 2 (line-1a::b01). Several properties sold together (a building
   * and its land) name the same form; line 1a counts it once.
   */
  form1099SKey?: string;
}

export interface BusinessPropertySaleFact {
  key: string;
  value: BusinessPropertySaleFactValue;
}

const SALE_CATEGORY = "other";
const SALE_PREFIX = "business_property_sale.";

/* Line 8: the nonrecaptured net section 1231 losses of the five prior years, a number (line-8::b01). */
export const SECTION_1231_KEYS = {
  nonrecapturedLosses: "business_property_sale.nonrecaptured_section_1231_losses",
} as const;

const KINDS: readonly string[] = [
  "section_1245",
  "section_1250",
  "land",
  "section_1252",
  "section_1254",
  "section_1255",
  "ordinary",
];

export function makeBusinessPropertySaleFactKey(saleSlug: string): string {
  return `${SALE_PREFIX}${saleSlug}`;
}

export function isBusinessPropertySaleFactKey(key: string): boolean {
  const parts = key.split(".");
  return (
    parts.length === 2 &&
    `${parts[0]}.` === SALE_PREFIX &&
    parts[1] !== "" &&
    key !== SECTION_1231_KEYS.nonrecapturedLosses
  );
}

const isAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isOptionalDate = (value: unknown): boolean => value === undefined || isIsoDate(value);

const AMOUNT_FIELDS = [
  "grossSalesPrice",
  "expenseOfSale",
  "depreciationAllowed",
  "additionalDepreciationAfter1975",
  "additionalDepreciation1970To1975",
  "soilWaterLandClearing",
  "section1254Costs",
  "section126ExcludedPayments",
] as const;

function isSale(value: unknown): value is BusinessPropertySaleFactValue {
  if (typeof value !== "object" || value === null) return false;
  const fields = value as Record<string, unknown>;
  return (
    typeof fields.description === "string" &&
    KINDS.includes(fields.kind as string) &&
    (fields.dateAcquired === INHERITED || isIsoDate(fields.dateAcquired)) &&
    isIsoDate(fields.dateSold) &&
    typeof fields.costOrOtherBasis === "number" &&
    isAmount(fields.costOrOtherBasis) &&
    AMOUNT_FIELDS.every((field) => isAmount(fields[field])) &&
    isOptionalDate(fields.foreclosureBegan) &&
    isOptionalDate(fields.section126PaymentsReceived) &&
    (fields.partialDisposition === undefined ||
      fields.partialDisposition === "elective" ||
      fields.partialDisposition === "required") &&
    (fields.form1099SKey === undefined || typeof fields.form1099SKey === "string")
  );
}

/* Each sale fact whose amounts and dates are well formed, in the order recorded; a malformed one is listed. */
export function readBusinessPropertySaleFacts(facts: ReadonlyArray<FactRow>): {
  sales: BusinessPropertySaleFact[];
  malformedKeys: string[];
} {
  const rows = facts.filter(
    (row) => row.category === SALE_CATEGORY && isBusinessPropertySaleFactKey(row.key),
  );
  return {
    sales: rows
      .filter((row) => isSale(row.value))
      .map((row) => ({ key: row.key, value: row.value as BusinessPropertySaleFactValue })),
    malformedKeys: rows.filter((row) => !isSale(row.value)).map((row) => row.key),
  };
}

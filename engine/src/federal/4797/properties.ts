/*
 * Form 4797, one property at a time: where it goes (Part I, II or III) and its
 * figures there. Each money line is whole dollars; a line the form defines as
 * arithmetic on other lines uses their rounded values.
 */

import { INHERITED, type BusinessPropertySaleFactValue } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { dayAfter, fullMonthsHeld, heldMoreThanOneYear, yearsBetween } from "./dates.js";

/* "Elective partial dispositions ... include the words 'Partial Disposition Election' in the description" (partial-dispositions-of-macrs-property::b02). */
export const PARTIAL_DISPOSITION_ELECTION = "Partial Disposition Election";

/* A row of line 2 (Part I) or line 10 (Part II): columns (a) to (g). */
export interface SaleRow {
  description: string;
  dateAcquired: string;
  dateSold: string;
  grossSalesPrice: number;
  /* Column (e): blank for property with no depreciation stated (land). */
  depreciation?: number;
  costPlusExpense: number;
  /* Column (g): (d) + (e) − (f). */
  gainOrLoss: number;
}

/* One property column of Part III, lines 19 to 29b. A line the property skips is undefined. */
export interface PartIIIColumn {
  description: string;
  dateAcquired: string;
  dateSold: string;
  line20: number;
  line21: number;
  line22: number;
  line23: number;
  line24: number;
  line25a?: number;
  line25b?: number;
  line26a?: number;
  line26b?: number;
  line26c?: number;
  line26d?: number;
  line26e?: number;
  line26g?: number;
  line27a?: number;
  line27b?: number;
  line27c?: number;
  line28a?: number;
  line28b?: number;
  line29a?: number;
  line29b?: number;
}

export type PlacedProperty =
  | { part: "part_i" | "part_ii"; row: SaleRow; partial?: "elective" | "required" }
  | { part: "part_iii"; column: PartIIIColumn; kind: string; partial?: "elective" | "required" };

/* The recapture of a Part III column: lines 25b, 26g, 27c, 28b and 29b (line 31's parts). */
export function recaptureOf(column: PartIIIColumn): number {
  return sum(column.line25b, column.line26g, column.line27c, column.line28b, column.line29b);
}

/*
 * Line 26b: "Generally, use 100% ... However, for low-income rental housing ...
 * see that section" (irs-4797-inst-2025::sec::line-26b::b01). Pub. 544: "100%
 * minus 1% for each full month the property was held over 100 full months";
 * a foreclosure counts the months to the day the proceedings began
 * (irs-pub-544-2025::sec::applicable-percentage::b02, b03).
 */
export const LOW_INCOME_FULL_MONTHS = 100;
const PERCENT = 100;

export function section1250Percentage(sale: BusinessPropertySaleFactValue): number {
  if (!sale.lowIncomeHousing) return 1;
  const end = sale.foreclosureBegan ?? sale.dateSold;
  const over = atLeast(0, fullMonthsHeld(sale.dateAcquired, end) - LOW_INCOME_FULL_MONTHS);
  return atLeast(0, PERCENT - over) / PERCENT;
}

/*
 * Line 27b: 100% of line 27a, "80% if the farmland was disposed of within the
 * 6th year after it was acquired", 60% in the 7th, 40% in the 8th, 20% in the
 * 9th; "Skip line 27 if you dispose of such farmland during the 10th or later
 * year" (irs-4797-inst-2025::sec::line-27::b01). Within the 6th year is 5 full
 * years held, counted from the day after the land was acquired (part-i::b01).
 * Undefined: line 27 is skipped. Pub. 225's 2025 example disagrees by one year
 * (QUESTIONS.md).
 */
const FARMLAND_PERCENT_BY_FULL_YEARS = [1, 1, 1, 1, 1, 0.8, 0.6, 0.4, 0.2];

export function section1252Percentage(dateAcquired: string, dateSold: string): number | undefined {
  return FARMLAND_PERCENT_BY_FULL_YEARS[yearsBetween(dayAfter(dateAcquired), dateSold).full];
}

/*
 * Line 29a: "Use 100% if the property is disposed of less than 10 years after
 * receipt of payments excluded from income. Use 100% minus 10% for each year, or
 * part of a year, that the property was held over 10 years after receipt of the
 * excluded payments. Use zero if 20 years or more" (line-29a::b01).
 */
const SECTION_1255_FULL_YEARS = 10;
const SECTION_1255_STEP = 0.1;

export function section1255Percentage(paymentsReceived: string, dateSold: string): number {
  const held = yearsBetween(paymentsReceived, dateSold);
  if (held.full < SECTION_1255_FULL_YEARS) return 1;
  const yearsOver = held.full - SECTION_1255_FULL_YEARS + (held.partYear ? 1 : 0);
  return atLeast(0, 1 - yearsOver * SECTION_1255_STEP);
}

/* Line 25 (section 1245): line 22, then the smaller of lines 24 and 25a (line-25::b01). */
function section1245Lines(line22: number, line24: number): Partial<PartIIIColumn> {
  return { line25a: line22, line25b: Math.min(line24, line22) };
}

/*
 * Line 26 (section 1250). "If straight line depreciation was used, enter -0- on
 * line 26g" (the form). Else 26a, 26b = percentage × smaller of 24 or 26a, 26c =
 * 24 − 26a; "If residential rental property or line 24 isn't more than line 26a,
 * skip lines 26d and 26e"; 26f is for corporations only; 26g = 26b + 26e + 26f.
 * A 26c below 0 prints 0 (QUESTIONS.md).
 */
function section1250Lines(sale: BusinessPropertySaleFactValue, line24: number) {
  if (sale.additionalDepreciationAfter1975 === undefined) return { line26g: 0 };
  const line26a = roundDollars(sale.additionalDepreciationAfter1975);
  const line26b = roundDollars(Math.min(line24, line26a) * section1250Percentage(sale));
  const line26c = atLeast(0, line24 - line26a);
  if (sale.residentialRental || line24 <= line26a) {
    return { line26a, line26b, line26c, line26g: line26b };
  }
  const line26d = roundDollars(sale.additionalDepreciation1970To1975 ?? 0);
  const line26e = Math.min(line26c, line26d);
  return { line26a, line26b, line26c, line26d, line26e, line26g: line26b + line26e };
}

/* Line 27 (section 1252): blank from the 10th year on, or with no expenses stated. */
function section1252Lines(sale: BusinessPropertySaleFactValue, line24: number) {
  const percentage = section1252Percentage(sale.dateAcquired, sale.dateSold);
  if (percentage === undefined || sale.soilWaterLandClearing === undefined) return {};
  const line27a = roundDollars(sale.soilWaterLandClearing);
  const line27b = roundDollars(line27a * percentage);
  return { line27a, line27b, line27c: Math.min(line24, line27b) };
}

/* Line 28 (section 1254): the costs, then the smaller of lines 24 and 28a. */
function section1254Lines(sale: BusinessPropertySaleFactValue, line24: number) {
  if (sale.section1254Costs === undefined) return {};
  const line28a = roundDollars(sale.section1254Costs);
  return { line28a, line28b: Math.min(line24, line28a) };
}

/*
 * Line 29 (section 1255): the percentage of the excluded payments; 29b is the
 * smaller of 29a and line 24 less the gain the other lines already made ordinary
 * (irs-4797-inst-2025::sec::line-29b::b01).
 */
function section1255Lines(
  sale: BusinessPropertySaleFactValue,
  line24: number,
  ordinarySoFar: number,
) {
  if (sale.section126ExcludedPayments === undefined || !sale.section126PaymentsReceived) return {};
  const percentage = section1255Percentage(sale.section126PaymentsReceived, sale.dateSold);
  const line29a = roundDollars(sale.section126ExcludedPayments * percentage);
  return { line29a, line29b: Math.min(atLeast(0, line24 - ordinarySoFar), line29a) };
}

const KIND_LINES: Record<
  string,
  (sale: BusinessPropertySaleFactValue, line22: number, line24: number) => Partial<PartIIIColumn>
> = {
  section_1245: (_, line22, line24) => section1245Lines(line22, line24),
  section_1250: (sale, _, line24) => section1250Lines(sale, line24),
  section_1252: (sale, _, line24) => section1252Lines(sale, line24),
  section_1254: (sale, _, line24) => section1254Lines(sale, line24),
  section_1255: () => ({}),
};

/* Lines 20–24, then the lines of the property's kind, then line 29 for section 126 payments. */
export function partIIIColumn(
  sale: BusinessPropertySaleFactValue,
  description: string,
  grossSalesPrice: number,
): PartIIIColumn {
  const line20 = roundDollars(grossSalesPrice);
  const line21 = roundDollars(sum(sale.costOrOtherBasis, sale.expenseOfSale));
  const line22 = roundDollars(sale.depreciationAllowed ?? 0);
  const line23 = line21 - line22;
  const line24 = line20 - line23;
  const lines = { line20, line21, line22, line23, line24 };
  const kindLines = KIND_LINES[sale.kind]?.(sale, line22, line24) ?? {};
  const ordinarySoFar = sum(
    kindLines.line25b,
    kindLines.line26g,
    kindLines.line27c,
    kindLines.line28b,
  );
  return {
    description,
    dateAcquired: sale.dateAcquired,
    dateSold: sale.dateSold,
    ...lines,
    ...kindLines,
    ...section1255Lines(sale, line24, ordinarySoFar),
  };
}

/* Columns (d) to (g) of a Part I or Part II row. */
export function saleRow(
  sale: BusinessPropertySaleFactValue,
  description: string,
  grossSalesPrice: number,
): SaleRow {
  const price = roundDollars(grossSalesPrice);
  const depreciation =
    sale.depreciationAllowed === undefined ? undefined : roundDollars(sale.depreciationAllowed);
  const costPlusExpense = roundDollars(sum(sale.costOrOtherBasis, sale.expenseOfSale));
  return {
    description,
    dateAcquired: sale.dateAcquired,
    dateSold: sale.dateSold,
    grossSalesPrice: price,
    depreciation,
    costPlusExpense,
    gainOrLoss: price + (depreciation ?? 0) - costPlusExpense,
  };
}

/* Kinds whose gain Part III figures (the chart, where-to-make-first-entry-for-certain-items::b01, b02). */
const PART_III_KINDS: readonly string[] = [
  "section_1245",
  "section_1250",
  "section_1252",
  "section_1254",
  "section_1255",
];

/*
 * Farmland in its 10th year or later has no section 1252 recapture: with no
 * section 126 payments either, it is "all other farmland", Part I (the chart, item 5).
 */
function farmlandWithNoRecapture(sale: BusinessPropertySaleFactValue): boolean {
  return (
    sale.kind === "section_1252" &&
    section1252Percentage(sale.dateAcquired, sale.dateSold) === undefined &&
    sale.section126ExcludedPayments === undefined
  );
}

/*
 * Where the property goes (the chart): held 1 year or less, ordinary property,
 * or an abandonment (not a sale or exchange: line-10::b01), Part II; held more
 * than 1 year at a gain, Part III for the recapture kinds; land, a loss, and
 * farmland with no recapture, Part I.
 */
export function placeProperty(
  sale: BusinessPropertySaleFactValue,
  grossSalesPrice: number,
): PlacedProperty {
  const description =
    sale.partialDisposition === "elective"
      ? `${sale.description} (${PARTIAL_DISPOSITION_ELECTION})`
      : sale.description;
  const partial = sale.partialDisposition;
  const row = saleRow(sale, description, grossSalesPrice);
  if (
    sale.kind === "ordinary" ||
    sale.abandoned === true ||
    !heldMoreThanOneYear(sale.dateAcquired, sale.dateSold)
  ) {
    return { part: "part_ii", row, partial };
  }
  if (!PART_III_KINDS.includes(sale.kind) || farmlandWithNoRecapture(sale)) {
    return { part: "part_i", row, partial };
  }
  const column = partIIIColumn(sale, description, grossSalesPrice);
  return column.line24 > 0
    ? { part: "part_iii", column, kind: sale.kind, partial }
    : { part: "part_i", row, partial };
}

/* Why a property cannot be figured, or undefined. */
export function saleGap(
  sale: BusinessPropertySaleFactValue,
  grossSalesPrice: number | undefined,
): string | undefined {
  if (grossSalesPrice === undefined) {
    return `${sale.description}: no gross sales price, and no Form 1099-S on the return gives one.`;
  }
  const needsDate =
    sale.kind === "section_1252" || sale.lowIncomeHousing === true || sale.kind === "section_1255";
  if (needsDate && sale.dateAcquired === INHERITED) {
    return `${sale.description}: inherited property whose recapture percentage needs the holding period; the engine does not figure it.`;
  }
  if (sale.section126ExcludedPayments !== undefined && !sale.section126PaymentsReceived) {
    return `${sale.description}: section 126 payments with no date received (line 29a's percentage needs it).`;
  }
  if (sale.abandoned === true && saleRow(sale, sale.description, grossSalesPrice).gainOrLoss > 0) {
    return `${sale.description}: an abandonment with an amount realized above its adjusted basis; the engine does not figure it.`;
  }
  return undefined;
}

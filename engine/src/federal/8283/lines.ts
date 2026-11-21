/*
 * Form 8283 Section A from the noncash gift facts: each gift's deduction
 * (column (h)), which gifts the form lists, which need Section B, the four
 * rows of each copy, and the columns a row may leave blank. Pure functions;
 * the resolver and the bindings read them.
 */

import type {
  NoncashGiftFact,
  NoncashGiftFactValue,
  NoncashPropertyType,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";

/* Section A has rows A–D; more gifts take another Form 8283 (who-must-file::b01: "one or more Forms 8283"). */
export const ROWS_PER_FORM = 4;
/* The form's header: "a total deduction of over $500 for all contributed property". */
export const MUST_FILE_OVER = 500;
/* Section A: $5,000 or less per item or group (which-sections-to-complete::b01). */
export const SECTION_A_LIMIT = 5000;
/* The form's note: a deduction of $500 or less need not complete columns (e), (f) and (g). */
export const SMALL_GIFT_LIMIT = 500;
/* line-1::b01: a VIN is 17 characters; a shorter one is padded with zeros on the left. */
export const VIN_LENGTH = 17;
/* irs-pub-526-2025::sec::cars-boats-and-airplanes::b05: a vehicle sold for $500 or less deducts up to $500. */
const VEHICLE_SMALL_SALE = 500;

const VARIOUS = "various";

export type Column = "b" | "e" | "f" | "g" | "h";

export interface Form8283Row {
  factKey: string;
  gift: NoncashGiftFactValue;
  /* Column (h) before rounding; undefined while an input it needs is missing. */
  deduction: number | undefined;
  /* The deduction of the gift's group of similar items (its own when alone), for the $500 note. */
  groupDeduction: number;
  heldMoreThanOneYear: boolean | undefined;
}

export interface Form8283Plan {
  /* The deductions of every gift, before rounding; undefined while one waits. Schedule A line 12. */
  total: number | undefined;
  /* The total the must-file test reads: a waiting deduction counts at its FMV (the most it can be). */
  mustFileTotal: number;
  /* Section A rows, in the order the gifts were recorded. */
  rows: Form8283Row[];
  /* The gifts that need Section B, which the engine does not fill. */
  sectionBFactKeys: string[];
  /* The rows of each Form 8283, four to a form; one empty form when no row is in Section A. */
  copies: Form8283Row[][];
}

interface DayDate {
  year: number;
  month: number;
  day: number;
}

export const isVarious = (date: string): boolean => date.trim().toLowerCase() === VARIOUS;

/* "MM/DD/YYYY" as the facts hold it; undefined for any other text. */
function parseUsDate(text: string): DayDate | undefined {
  const parts = text.trim().split("/").map(Number);
  if (parts.length !== 3 || !parts.every(Number.isInteger)) return undefined;
  const [month, day, year] = parts;
  return { year, month, day };
}

const dayIndex = (date: DayDate) => (date.year * 100 + date.month) * 100 + date.day;

/*
 * Held more than 1 year: given after the first anniversary of the day acquired,
 * as for a sale (federal/8949/partitionTrades.ts). "Various" is a group held at
 * least 12 months (line-1::b04). Undefined when no date tells.
 */
export function heldMoreThanOneYear(gift: NoncashGiftFactValue): boolean | undefined {
  if (gift.dateAcquired === undefined) return undefined;
  if (isVarious(gift.dateAcquired)) return true;
  const acquired = parseUsDate(gift.dateAcquired);
  const given = parseUsDate(gift.contributionDate);
  if (!acquired || !given) return undefined;
  return dayIndex(given) > dayIndex({ ...acquired, year: acquired.year + 1 });
}

const isPublicSecurity = (gift: NoncashGiftFactValue) =>
  gift.propertyType === "publicly_traded_security";

/*
 * A qualified vehicle with a claimed value over $500 deducts the smaller of
 * its FMV and the gross proceeds of the donee's sale, unless an exception on
 * Form 1098-C allows the FMV (qualified-vehicle-donations::b03); a sale of
 * $500 or less still deducts up to $500 (Pub. 526 cars-boats-and-airplanes::b05).
 */
function vehicleLimit(gift: NoncashGiftFactValue): number | undefined {
  const value = gift.fairMarketValue;
  if (gift.propertyType !== "vehicle" || value <= VEHICLE_SMALL_SALE) return value;
  const vehicle = gift.vehicle;
  if (vehicle === undefined) return undefined;
  if (vehicle.fmvException) return value;
  if (vehicle.grossProceeds === undefined) return undefined;
  return Math.min(value, Math.max(vehicle.grossProceeds, VEHICLE_SMALL_SALE));
}

/*
 * Column (h): the FMV, or the reduced amount when a reduction applies
 * (line-1::b04). Ordinary income property (inventory, or a capital asset held
 * 1 year or less) deducts the FMV minus the gain, which limits it to the basis
 * (fair-market-value-fmv::b01–b02; Pub. 526 ordinary-income-property::b01–b02).
 * Intellectual property deducts the smaller of its basis and its FMV
 * (fair-market-value-fmv::b03; Pub. 526 patents-and-other-intellectual-property::b01).
 * With no basis stated it deducts the FMV, as the TaxCalcBench ty25-us-004
 * answer key does: an open question.
 * The other capital gain property reductions (::b03: a private nonoperating
 * foundation, the 50% limit election, taxidermy, unrelated use) have no facts:
 * the engine does not make them.
 */
export function giftDeduction(gift: NoncashGiftFactValue): number | undefined {
  if (wornItemNotDeductible(gift)) return 0;
  const limited = vehicleLimit(gift);
  if (limited === undefined) return undefined;
  if (gift.propertyType === "intellectual_property") {
    return gift.costBasis === undefined ? limited : Math.min(limited, gift.costBasis);
  }
  const ordinaryIncome = gift.propertyType === "inventory" || heldMoreThanOneYear(gift) === false;
  if (!ordinaryIncome) return limited;
  if (gift.costBasis === undefined) return undefined;
  return Math.min(limited, gift.costBasis);
}

/*
 * Clothing or a household item below good used condition has no deduction,
 * unless its value is over $500 and an appraisal goes with Form 8283: that
 * item is for Section B (irs-1040sa-inst-2025::sec::line-12::b03; Pub. 526
 * clothing-and-household-items::b01).
 */
const wornItemNotDeductible = (gift: NoncashGiftFactValue) =>
  gift.propertyType === "clothing_household" &&
  gift.goodUsedCondition === false &&
  gift.fairMarketValue <= SMALL_GIFT_LIMIT;

/* The amount for the tests: the deduction, or while it waits its FMV (the most it can be). */
const testedAmount = (gift: NoncashGiftFactValue) => giftDeduction(gift) ?? gift.fairMarketValue;

const groupOf = (fact: NoncashGiftFact) => fact.gift.similarItemsGroup ?? fact.factKey;

function groupTotals(facts: NoncashGiftFact[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const fact of facts) {
    totals.set(groupOf(fact), sum(totals.get(groupOf(fact)), testedAmount(fact.gift)));
  }
  return totals;
}

const ALWAYS_SECTION_A: ReadonlySet<NoncashPropertyType> = new Set([
  "publicly_traded_security",
  "intellectual_property",
  "inventory",
]);

/*
 * which-sections-to-complete::b04–b05: Section A takes these even over $5,000:
 * publicly traded securities, intellectual property, inventory, and a vehicle
 * whose deduction is limited to the gross proceeds, with its acknowledgment.
 * A partial interest or restricted use over $5,000 goes to Section B (::b06).
 */
function sectionAAtAnyAmount(gift: NoncashGiftFactValue): boolean {
  if (gift.partialInterestOrRestrictedUse === true) return false;
  if (ALWAYS_SECTION_A.has(gift.propertyType)) return true;
  const vehicle = gift.vehicle;
  return (
    gift.propertyType === "vehicle" &&
    vehicle !== undefined &&
    vehicle.acknowledgmentAttached &&
    !vehicle.fmvException
  );
}

/*
 * Section B: an item or group over $5,000 that Section A does not take
 * (which-sections-to-complete::b05; a group counts every donee, ::b01), and a
 * single article of clothing or household item below good used condition
 * deducted at over $500 (::b05).
 */
export function needsSectionB(gift: NoncashGiftFactValue, groupDeduction: number): boolean {
  const belowGoodUsed =
    gift.propertyType === "clothing_household" &&
    gift.goodUsedCondition === false &&
    testedAmount(gift) > SMALL_GIFT_LIMIT;
  return belowGoodUsed || (groupDeduction > SECTION_A_LIMIT && !sectionAAtAnyAmount(gift));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    out.push(items.slice(start, start + size));
  }
  return out.length > 0 ? out : [[]];
}

export function form8283Plan(facts: NoncashGiftFact[]): Form8283Plan {
  const groups = groupTotals(facts);
  const deductions = facts.map((fact) => giftDeduction(fact.gift));
  const rows: Form8283Row[] = [];
  const sectionBFactKeys: string[] = [];
  facts.forEach((fact, index) => {
    const groupDeduction = groups.get(groupOf(fact)) ?? 0;
    if (needsSectionB(fact.gift, groupDeduction)) {
      sectionBFactKeys.push(fact.factKey);
      return;
    }
    rows.push({
      factKey: fact.factKey,
      gift: fact.gift,
      deduction: deductions[index],
      groupDeduction,
      heldMoreThanOneYear: heldMoreThanOneYear(fact.gift),
    });
  });
  return {
    total: deductions.some((amount) => amount === undefined) ? undefined : sum(...deductions),
    mustFileTotal: sum(...facts.map((fact) => testedAmount(fact.gift))),
    rows,
    sectionBFactKeys,
    copies: chunk(rows, ROWS_PER_FORM),
  };
}

/* Schedule A line 12 from the gift facts: undefined when there are none, or while one waits. */
export function noncashGiftsTotal(facts: NoncashGiftFact[]): number | undefined {
  if (facts.length === 0) return undefined;
  return roundDollars(form8283Plan(facts).total);
}

/* Column (a): the donee's name and address on one line. */
export function doneeNameAndAddress(row: Form8283Row): string {
  const { name, street, city, state, zip } = row.gift.donee;
  return `${name}, ${street}, ${city}, ${state} ${zip}`;
}

/* Column (b): the VIN, unless Form 1098-C is attached; zeros fill it to 17 characters on the left (line-1::b01). */
export function vehicleIdentificationNumber(row: Form8283Row): string | undefined {
  const vehicle = row.gift.vehicle;
  if (row.gift.propertyType !== "vehicle" || !vehicle || vehicle.acknowledgmentAttached) {
    return undefined;
  }
  return vehicle.vin?.trim().padStart(VIN_LENGTH, "0");
}

const twoDigits = (value: number) => String(value).padStart(2, "0");

/*
 * Column (e), month and year (line-1::b03–b04), or "Various". A publicly
 * traded security prints it only when held more than 12 months.
 */
export function dateAcquiredColumn(row: Form8283Row): string | undefined {
  const date = row.gift.dateAcquired;
  if (date === undefined) return undefined;
  if (isPublicSecurity(row.gift) && row.heldMoreThanOneYear !== true) return undefined;
  if (isVarious(date)) return date.trim();
  const parsed = parseUsDate(date);
  return parsed && `${twoDigits(parsed.month)}/${parsed.year}`;
}

/*
 * Column (g) (line-1::b04): not for a publicly traded security held more than
 * 12 months. The section 170(b)(1)(C)(iii) election that would print it has no fact.
 */
export function costBasisColumn(row: Form8283Row): number | undefined {
  if (isPublicSecurity(row.gift) && row.heldMoreThanOneYear === true) return undefined;
  return roundDollars(row.gift.costBasis);
}

/*
 * The columns the row must print and has no value for. Columns (e), (f) and
 * (g) are required only over $500 for the item or its group of similar items
 * (the form's note; line-1::b03), and (e) and (g) not where the security rule
 * leaves them blank. A smaller gift prints what its fact gives.
 */
export function missingColumns(row: Form8283Row): Column[] {
  const missing: Column[] = [];
  const vehicle = row.gift.vehicle;
  const vinNeeded = row.gift.propertyType === "vehicle" && vehicle?.acknowledgmentAttached !== true;
  if (vinNeeded && vehicleIdentificationNumber(row) === undefined) missing.push("b");
  if (row.groupDeduction > SMALL_GIFT_LIMIT) {
    const shortHeldSecurity = isPublicSecurity(row.gift) && row.heldMoreThanOneYear === false;
    const longHeldSecurity = isPublicSecurity(row.gift) && row.heldMoreThanOneYear === true;
    if (!shortHeldSecurity && dateAcquiredColumn(row) === undefined) missing.push("e");
    if (!row.gift.howAcquired?.trim()) missing.push("f");
    if (!longHeldSecurity && costBasisColumn(row) === undefined) missing.push("g");
  }
  if (row.deduction === undefined) missing.push("h");
  return missing;
}

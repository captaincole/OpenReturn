/*
 * Federal net operating loss (NOL) answers: what last year's return carried
 * to 2025, the farming loss carryback election, and the amounts of the two
 * carryback years' returns that Form 172 Part II refigures. No 2025 document
 * prints them: the taxpayer states them from earlier returns. Category
 * "other". Each is optional by design: absent means none.
 */

type FactRow = { key: string; value: unknown; category: string };

export const NOL_CATEGORY = "other";

export const NOL_KEYS = {
  /*
   * The NOLs carried to 2025, one row per year of loss: what is left after
   * the years before 2025 used part of it (last year's Form 172 Part II line
   * 10, or the carryover statement). Schedule 1 line 8a deducts them
   * (irs-172-inst-2025::sec::deducting-a-carryforward::b01). An empty list is
   * an answer (no carryover).
   */
  carryovers: "nol.carryovers",
  /*
   * The election to waive the 2-year carryback of a 2025 farming loss
   * (irs-172-inst-2025::sec::waiving-the-carryback-period::b01; Pub. 225: "you
   * must carry it back two years, unless you elect to forgo the carryback").
   * A boolean. Asked when Form 172 files with a farm loss.
   */
  waiveFarmingCarryback: "nol.waive_farming_carryback",
} as const;

/* A 2025 farming loss carries back 2 years: 2023, then 2024 (irs-172-inst-2025::sec::when-to-use-an-nol::b01). */
export const NOL_CARRYBACK_YEARS = [2023, 2024] as const;
export type NolCarrybackYear = (typeof NOL_CARRYBACK_YEARS)[number];

const CARRYBACK_PREFIX = "nol.carryback_year.";

/* One carryback year's return amounts: "nol.carryback_year.2023". */
export function makeNolCarrybackYearFactKey(year: NolCarrybackYear): string {
  return `${CARRYBACK_PREFIX}${year}`;
}

export interface NolCarryoverRow {
  /* The tax year the loss arose, four digits (2016). */
  yearOfLoss: number;
  /* The part of that loss carried to 2025, a positive amount. */
  carryoverTo2025: number;
}

/*
 * One carryback year's return, as filed or as previously adjusted (Form 172
 * Part II). An absent amount is none (0).
 */
export interface NolCarrybackYearValue {
  /*
   * Line 2: taxable income before the 2025 carryback, with the NOLs of years
   * before 2025 taken into account. Refigured without the floor at zero, so it
   * can be negative (irs-172-inst-2025::sec::line-2-taxable-income-before-the-current-year::b01).
   */
  taxableIncome: number;
  /* Line 3: the capital loss deduction of that year's Schedule D (line 21), positive. */
  netCapitalLossDeduction?: number;
  /* Line 4: gain excluded under section 1202, positive. */
  section1202Exclusion?: number;
  /* Line 5: the QBI deduction claimed (irs-172-inst-2025::sec::line-5-qualified-business-income-deduction::b01). */
  qbiDeduction?: number;
  /*
   * Line 6: the total change to the items figured from AGI (taxable social
   * security, IRA deduction, the passive rental allowance and the others the
   * line names) when AGI rises by lines 3 and 4 (::line-6-adjustment-to-agi::b01).
   * Asked when line 3 or 4 holds an amount; 0 when the year had none of them.
   */
  agiAdjustment?: number;
  /* The year's return itemized deductions (Schedule A). */
  itemized: boolean;
  /* Line 11: AGI before the 2025 carryback. Asked when the year itemized and line 3, 4 or 5 holds an amount. */
  agi?: number;
  /* Line 15: medical and dental expenses before the AGI limit (Schedule A line 1). */
  medicalBeforeLimit?: number;
  /* Line 14: the medical and dental deduction after the limit (Schedule A line 4). */
  medicalAfterLimit?: number;
  /* Line 23: an NOL from another year deducted to figure line 11, positive. */
  nolDeducted?: number;
  /* Line 25: the charitable contributions deducted on Schedule A. */
  charitableContributions?: number;
  /*
   * Line 26's input: the year's cash gifts to 60% limit organizations before
   * the AGI limit. Asked when line 25 holds an amount and otherGifts is not true.
   */
  cashGiftsTo60PercentOrganizations?: number;
  /* The year had other gifts: noncash, to 30% or 20% limit organizations, or a carryover. */
  otherGifts?: boolean;
  /* Line 28: the casualty and theft loss deduction from Form 4684. */
  casualtyDeduction?: number;
  /* Line 29: the casualty and theft losses before the AGI limit, from Form 4684. */
  casualtyBeforeLimit?: number;
}

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isOptionalAmount = (value: unknown) => value === undefined || (isNumber(value) && value >= 0);

function isCarryoverRow(value: unknown): value is NolCarryoverRow {
  const row = value as Partial<NolCarryoverRow> | null;
  return (
    typeof row === "object" &&
    row !== null &&
    isNumber(row.yearOfLoss) &&
    isNumber(row.carryoverTo2025) &&
    row.carryoverTo2025 >= 0
  );
}

const CARRYBACK_AMOUNTS = [
  "netCapitalLossDeduction",
  "section1202Exclusion",
  "qbiDeduction",
  "agi",
  "medicalBeforeLimit",
  "medicalAfterLimit",
  "nolDeducted",
  "charitableContributions",
  "cashGiftsTo60PercentOrganizations",
  "casualtyDeduction",
  "casualtyBeforeLimit",
] as const;

function isCarrybackYear(value: unknown): value is NolCarrybackYearValue {
  const year = value as Record<string, unknown> | null;
  if (typeof year !== "object" || year === null) return false;
  if (!isNumber(year.taxableIncome) || typeof year.itemized !== "boolean") return false;
  if (year.agiAdjustment !== undefined && !isNumber(year.agiAdjustment)) return false;
  if (year.otherGifts !== undefined && typeof year.otherGifts !== "boolean") return false;
  return CARRYBACK_AMOUNTS.every((field) => isOptionalAmount(year[field]));
}

/*
 * The stated carryover rows in the order recorded; undefined when the answer
 * is not recorded. A row that is not well formed makes the whole answer
 * unreadable (null), so no carryover is dropped without a word.
 */
export function getNolCarryoverRows(
  facts: ReadonlyArray<FactRow>,
): NolCarryoverRow[] | null | undefined {
  const row = facts.find((fact) => fact.key === NOL_KEYS.carryovers);
  if (row === undefined) return undefined;
  if (!Array.isArray(row.value) || !row.value.every(isCarryoverRow)) return null;
  return row.value;
}

/* The waiver answer; undefined when not recorded or not a boolean. */
export function getNolCarrybackWaiver(facts: ReadonlyArray<FactRow>): boolean | undefined {
  const value = facts.find((fact) => fact.key === NOL_KEYS.waiveFarmingCarryback)?.value;
  return typeof value === "boolean" ? value : undefined;
}

/* One carryback year's amounts; undefined when not recorded or not well formed. */
export function getNolCarrybackYear(
  facts: ReadonlyArray<FactRow>,
  year: NolCarrybackYear,
): NolCarrybackYearValue | undefined {
  const value = facts.find((fact) => fact.key === makeNolCarrybackYearFactKey(year))?.value;
  return isCarrybackYear(value) ? value : undefined;
}

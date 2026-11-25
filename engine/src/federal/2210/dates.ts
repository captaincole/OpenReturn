/*
 * The calendar of Form 2210 for 2025: the four payment due dates (the column
 * headings of Part III), the penalty rate periods and the day count.
 */

const MS_PER_DAY = 86_400_000;

/* A calendar day as a whole number of days since 1970-01-01 (UTC, so no clock change). */
export type DayNumber = number;

/* "YYYY-MM-DD" → a day number; undefined for any other text. */
export function dayNumber(date: string): DayNumber | undefined {
  const parts = date.split("-");
  if (parts.length !== 3) return undefined;
  const [year, month, day] = parts.map(Number);
  if (![year, month, day].every(Number.isInteger)) return undefined;
  const time = Date.UTC(year, month - 1, day);
  const check = new Date(time);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return undefined;
  return time / MS_PER_DAY;
}

function knownDay(date: string): DayNumber {
  const day = dayNumber(date);
  if (day === undefined) throw new Error(`Form 2210 calendar: bad date ${date}`);
  return day;
}

/* Part III column headings (a)–(d): 4/15/25, 6/15/25, 9/15/25, 1/15/26. */
export const DUE_DATES_2025: readonly DayNumber[] = [
  knownDay("2025-04-15"),
  knownDay("2025-06-15"),
  knownDay("2025-09-15"),
  knownDay("2026-01-15"),
];

/*
 * "If any payment due date ... occurs on a Sunday, Saturday, or legal holiday,
 * and a payment is made on the next day that is not ..., the payment is
 * considered made on the due date" (irs-2210-inst-2025::sec::table-1-estimated-tax-payments::b01).
 * June 15, 2025 is a Sunday: a payment on Monday, June 16 counts on June 15.
 */
const NEXT_BUSINESS_DAY = new Map<DayNumber, DayNumber>([
  [knownDay("2025-06-15"), knownDay("2025-06-16")],
]);

/* The day a payment counts: the due date when it was paid on the next business day after it. */
export function countedDay(paid: DayNumber): DayNumber {
  for (const [due, nextBusinessDay] of NEXT_BUSINESS_DAY) {
    if (paid === nextBusinessDay) return due;
  }
  return paid;
}

/*
 * The column a payment goes in (Part III line 11): (a) through April 15, (b)
 * after April 15 through June 15, (c) through September 15, (d) through
 * January 15, 2026 (table-1-estimated-tax-payments::b01). Later: no column.
 */
export function columnOfPayment(paid: DayNumber): number | undefined {
  const day = countedDay(paid);
  const column = DUE_DATES_2025.findIndex((due) => day <= due);
  return column === -1 ? undefined : column;
}

/*
 * The penalty worksheet's four rate periods and their rates
 * (irs-2210-inst-2025::sec::tax-year-2025::b03–b05): each period counts the
 * days after its starting date through its last day, "× 0.07" a 365-day year.
 */
export interface RatePeriod {
  /* The last day of the period; the next period counts from this day. */
  last: DayNumber;
  rate: number;
}

export const PENALTY_RATE_2025 = 0.07;
export const DAYS_IN_YEAR = 365;

export const RATE_PERIODS_2025: readonly RatePeriod[] = [
  { last: knownDay("2025-06-30"), rate: PENALTY_RATE_2025 },
  { last: knownDay("2025-09-30"), rate: PENALTY_RATE_2025 },
  { last: knownDay("2025-12-31"), rate: PENALTY_RATE_2025 },
  { last: knownDay("2026-04-15"), rate: PENALTY_RATE_2025 },
];

/* The worksheet counts no day after April 15, 2026 (line 12). */
export const PENALTY_END_2025 = knownDay("2026-04-15");

/* The 2024 overpayment applied to 2025: "treat the payment as made on April 15, 2025" (line-11::b01). */
export const OVERPAYMENT_APPLIED_DAY = DUE_DATES_2025[0];

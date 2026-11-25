/*
 * The section 6621 underpayment rate for individuals, by calendar quarter, in
 * percent a year. Form 8621 lines 16f and 24 figure interest "using the rates
 * and methods under section 6621" (irs-8621-inst-2025::sec::line-16f::b01,
 * ::line-24::b01), and name "Revenue Ruling 2024-18, 2024-37 I.R.B. 584 (or
 * successor Revenue Ruling) for a list of historical interest rates"
 * (::line-16f::b02).
 *
 * Sources: Rev. Rul. 2024-18 (IRB 2024-37), the underpayment column of its
 * 1987–1998 table and its 1999–2024 noncorporate table; the IRS quarterly
 * interest rate releases for 2025 (IRB 2024-49, 2025-13, 2025-23, 2025-37) and
 * 2026 (IRB 2025-48; Rev. Rul. 2026-5, IRB 2026-8: "an underpayment rate of 6
 * percent ... for the calendar quarter beginning April 1, 2026").
 *
 * The table ends with the quarter that holds April 15, 2026, the due date of a
 * 2025 return. Interest past its last quarter is not figured.
 *
 * DECISION (2026-11-24): two official texts differ on the rate for April 1 to
 * April 15, 2026.
 * - The Form 2210 instructions: "Rate Period 4: January 1, 2026–April 15,
 *   2026 ... × 0.07" (irs-2210-inst-2025::sec::tax-year-2025::b04).
 * - Rev. Rul. 2026-5: "an underpayment rate of 6 percent ... for the calendar
 *   quarter beginning April 1, 2026".
 * The engine uses 6% for Form 8621: the form points to the general rates of
 * section 6621, and the 7% through April 15 is a special rule for the
 * estimated tax penalty (section 6621(b)(2)(B)).
 */
export const UNDERPAYMENT_RATES_BY_YEAR: Readonly<Record<number, readonly number[]>> = {
  1987: [9, 9, 9, 10],
  1988: [11, 10, 10, 11],
  1989: [11, 12, 12, 11],
  1990: [11, 11, 11, 11],
  1991: [11, 10, 10, 10],
  1992: [9, 8, 8, 7],
  1993: [7, 7, 7, 7],
  1994: [7, 7, 8, 9],
  1995: [9, 10, 9, 9],
  1996: [9, 8, 9, 9],
  1997: [9, 9, 9, 9],
  1998: [9, 8, 8, 8],
  1999: [7, 8, 8, 8],
  2000: [8, 9, 9, 9],
  2001: [9, 8, 7, 7],
  2002: [6, 6, 6, 6],
  2003: [5, 5, 5, 4],
  2004: [4, 5, 4, 5],
  2005: [5, 6, 6, 7],
  2006: [7, 7, 8, 8],
  2007: [8, 8, 8, 8],
  2008: [7, 6, 5, 6],
  2009: [5, 4, 4, 4],
  2010: [4, 4, 4, 4],
  2011: [3, 4, 4, 3],
  2012: [3, 3, 3, 3],
  2013: [3, 3, 3, 3],
  2014: [3, 3, 3, 3],
  2015: [3, 3, 3, 3],
  2016: [3, 4, 4, 4],
  2017: [4, 4, 4, 4],
  2018: [4, 5, 5, 5],
  2019: [6, 6, 5, 5],
  2020: [5, 5, 3, 3],
  2021: [3, 3, 3, 3],
  2022: [3, 4, 5, 6],
  2023: [7, 7, 7, 8],
  2024: [8, 8, 8, 8],
  2025: [7, 7, 7, 7],
  2026: [7, 6],
};

const PERCENT = 100;
const MONTHS_PER_QUARTER = 3;

/* The annual rate (a fraction) for the day, or undefined past the table. */
export function underpaymentRateOn(day: Date): number | undefined {
  const quarters = UNDERPAYMENT_RATES_BY_YEAR[day.getUTCFullYear()];
  const quarterIndex = (day.getUTCMonth() - (day.getUTCMonth() % MONTHS_PER_QUARTER)) / 3;
  const rate = quarters?.[quarterIndex];
  return rate === undefined ? undefined : rate / PERCENT;
}

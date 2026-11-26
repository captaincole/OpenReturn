import { atLeast, roundDollars, sum } from "../../money.js";

/* The tax year of the return this Form 965-A goes with ("Reporting year", irs-965a-inst-2025::sec::general-instructions::b04). */
export const REPORTING_YEAR = 2025;

/*
 * The general installment schedule, in percent of the net 965 tax liability:
 * 8% in each of years 1 to 5, then 15%, 20% and 25%
 * (irs-965a-inst-2025::sec::line-1::b01). Year 1 is the year of the inclusion
 * or of the triggering event.
 */
export const INSTALLMENT_PERCENTS = [8, 8, 8, 8, 8, 15, 20, 25] as const;
export const INSTALLMENT_YEARS = INSTALLMENT_PERCENTS.length;
const WHOLE = 100;

/* Part II columns (b) to (i): the payment for installment year 1 to 8; undefined is blank. */
export type InstallmentPayments = ReadonlyArray<number | undefined>;

/* The installment year that the reporting year is for a liability of `year` (line-1::b02: 2020 is "Year 4" for 2017). */
export function installmentYearOf(year: number, reportingYear: number = REPORTING_YEAR): number {
  return reportingYear - year + 1;
}

/* The percent due through an installment year (0 before year 1, 100 from year 8 on). */
export function percentThrough(installmentYear: number): number {
  return sum(...INSTALLMENT_PERCENTS.slice(0, atLeast(0, installmentYear)));
}

/*
 * Part I column (d), and Part III column (e): "the excess of the taxpayer's
 * 'with calculation' ... over the 'without calculation'"
 * (irs-965a-inst-2025::sec::lines-1-through-8::b07; lines-1-through-4::b02).
 * An excess is never below 0.
 */
export function netLiability(withCalculation: number, withoutCalculation: number): number {
  return atLeast(0, roundDollars(withCalculation) - roundDollars(withoutCalculation));
}

/* Part I column (f): column (d) less column (e), the deferred S corporation part (lines-1-through-8::b07). */
export function eligibleForInstallments(net: number, deferred: number | undefined): number {
  return atLeast(0, net - (deferred ?? 0));
}

/* How the reporting year's installment is figured for one Part I line. */
export interface InstallmentInputs {
  /* "original": the taxpayer's own liability (lines 1 to 4, a triggered liability); "assumed": a transfer in. */
  basis: "original" | "assumed";
  /* Column (g); a liability assumed by transfer is an installment liability by definition. */
  election: boolean;
  /* Column (f) plus column (j) (original), or column (j) alone (assumed). */
  liability: number;
  /* Part II columns (b) to (i) before the reporting year. */
  paidBefore: InstallmentPayments;
  /* The installment year the reporting year is. */
  year: number;
}

export const PAST_SCHEDULE =
  "Part of this net 965 tax liability is still unpaid after its eighth installment year; the instructions give no column for a later payment (irs-965a-inst-2025::sec::line-1::b01).";
export const UNPAID_WITHOUT_ELECTION =
  "This net 965 tax liability had no installment election and is not fully paid after year 1; the instructions give no schedule for the rest (irs-965a-inst-2025::sec::line-1::b03).";
export const BEFORE_YEAR_ONE =
  "The line's year is after 2025, so 2025 is not one of its installment years.";

/*
 * The scheduled payment for the reporting year, whole dollars; undefined when
 * nothing is due; a string when the schedule does not apply.
 *
 * Original liability: "If an adjustment occurs ... the adjustment should
 * generally be prorated over all the installment payments. For the part of the
 * adjustment prorated to installments whose payment date has already arrived,
 * adjust the payment for the reporting year" (line-1::b04, b05). So the
 * payment is the share due through this year of the adjusted liability, less
 * what was paid before: the audit example of lines-1-through-8::b10 ($8 + $20 in
 * year 5, $22.50, $30, $37.50 after it).
 *
 * Assumed liability: the transferee pays "in the same manner as if the taxpayer
 * were the transferor" (lines-1-through-8::b02); the line shows only the
 * remaining amount, so the payment is that amount's share of the installments
 * still to come: the example's $15 of $60 in year 6, $20 in year 7, $25 in year 8.
 */
export function scheduledPayment(inputs: InstallmentInputs): number | string | undefined {
  const paid = sum(...inputs.paidBefore);
  const remaining = inputs.liability - paid;
  if (remaining <= 0) return undefined;
  if (inputs.year < 1) return BEFORE_YEAR_ONE;
  if (inputs.year > INSTALLMENT_YEARS) return PAST_SCHEDULE;
  if (!inputs.election)
    return inputs.year === 1 ? roundDollars(remaining) : UNPAID_WITHOUT_ELECTION;
  const due =
    inputs.basis === "assumed"
      ? roundDollars(
          (remaining * INSTALLMENT_PERCENTS[inputs.year - 1]!) /
            (WHOLE - percentThrough(inputs.year - 1)),
        )
      : roundDollars((inputs.liability * percentThrough(inputs.year)) / WHOLE) - paid;
  const payment = Math.min(remaining, atLeast(0, due));
  return payment > 0 ? payment : undefined;
}

/*
 * Part II column (j): "the amount reported on the corresponding line in Part I,
 * column (f), or column (i), as applicable, plus or minus any amount reported
 * on the corresponding line in Part I, column (j), less any payments reported
 * in Part II, columns (b) through (i)" (irs-965a-inst-2025::sec::line-1::b05).
 */
export function remainingUnpaid(liability: number, payments: InstallmentPayments): number {
  return liability - sum(...payments);
}

/* Part II columns (b) to (i) with the reporting year's payment in its column. */
export function paymentsWithThisYear(
  paidBefore: InstallmentPayments,
  year: number,
  paidThisYear: number | undefined,
): InstallmentPayments {
  return Array.from({ length: INSTALLMENT_YEARS }, (_, index) =>
    index === year - 1 && paidThisYear !== undefined ? paidThisYear : paidBefore[index],
  );
}

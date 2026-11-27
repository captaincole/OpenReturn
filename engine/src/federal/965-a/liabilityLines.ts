import type {
  Section965InclusionValue,
  Section965OtherLiabilityValue,
  Section965Payments,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import {
  eligibleForInstallments,
  INSTALLMENT_YEARS,
  installmentYearOf,
  netLiability,
  PAST_SCHEDULE,
  paymentsWithThisYear,
  remainingUnpaid,
  REPORTING_YEAR,
  scheduledPayment,
  type InstallmentInputs,
  type InstallmentPayments,
} from "./lines.js";

/* One Part I line, columns (a) to (k) (irs-965a-inst-2025::sec::lines-1-through-8::b07 to b09). */
export interface PartILine {
  year: number;
  netTaxWithAll965?: number;
  netTaxWithout965?: number;
  net965?: number;
  deferred?: number;
  eligible?: number;
  election?: boolean;
  paidInFull?: number;
  inInstallments?: number;
  transfersAndAdjustments?: number;
  counterpartyTin?: string;
}

/* The same line of Part II: columns (b) to (i), (j) and (k) (irs-965a-inst-2025::sec::line-1::b02 to b05). */
export interface PartIILine {
  payments: InstallmentPayments;
  remaining: number;
  paidThisYear?: number;
}

/* A line of Parts I and II; with a gap, its Part II line and the Part II totals are unsupported. */
export interface Form965ALine {
  partI: PartILine;
  partII?: PartIILine;
  gap?: string;
}

export const LATER_COLUMN_STATED =
  "Last year's payments name the 2025 installment year or a later one; the 2025 payment is the fact's paidThisYear, so the engine cannot tell which payment is this year's.";
export const TRIGGERED_THIS_YEAR =
  'A triggering event in 2025 makes a deferred S corporation net 965 tax liability payable: Form 1040 line 16 then adds it (box 3, "965INC") and Schedule 3 line 13d takes the deferred installments (irs-1040-inst-2025::sec::single-1::b02; line-13d::b01), which the engine does not do yet.';

/* Part II columns (b) to (i) as last year's form shows them, whole dollars. */
function paymentsOf(paid: Section965Payments | undefined): InstallmentPayments {
  return Array.from({ length: INSTALLMENT_YEARS }, (_, index) =>
    roundDollars(paid?.[(index + 1) as keyof Section965Payments]),
  );
}

/* Part I columns (g), (h) and (i): column (f) goes to (h) on "No", to (i) on "Yes" (lines-1-through-8::b08). */
function electionColumns(eligible: number | undefined, election: boolean | undefined) {
  if (election === undefined) return {};
  return election ? { election, inInstallments: eligible } : { election, paidInFull: eligible };
}

interface PaymentLine {
  value: Section965InclusionValue | Section965OtherLiabilityValue;
  installment: Omit<InstallmentInputs, "paidBefore">;
}

/* Part II of one line: last year's payments, the reporting year's payment, and what is left. */
function partIIOf({ value, installment }: PaymentLine): Pick<Form965ALine, "partII" | "gap"> {
  const paidBefore = paymentsOf(value.paidByInstallmentYear);
  const year = installment.year;
  if (paidBefore.some((paid, index) => paid !== undefined && index + 1 >= year)) {
    return { gap: LATER_COLUMN_STATED };
  }
  const inSchedule = year >= 1 && year <= INSTALLMENT_YEARS;
  const stated = roundDollars(value.paidThisYear);
  if (stated !== undefined && stated !== 0 && !inSchedule) return { gap: PAST_SCHEDULE };
  const figured = stated ?? scheduledPayment({ ...installment, paidBefore });
  if (typeof figured === "string") return { gap: figured };
  const paidThisYear = figured === 0 ? undefined : figured;
  const payments = paymentsWithThisYear(paidBefore, year, paidThisYear);
  return {
    partII: {
      payments,
      remaining: remainingUnpaid(installment.liability, payments),
      paidThisYear,
    },
  };
}

/*
 * DECISION (2026-11-26, by the author): Part I column (j) shows every
 * transfer and adjustment of the line through the reporting year, not only
 * this year's. The Part I instructions: "Report in column (j) any current-year
 * net 965 tax liability transferred out ... or any current tax year subsequent
 * adjustments" (irs-965a-inst-2025::sec::lines-1-through-8::b01). The Part II
 * instructions: column (j) "should equal the amount reported on the
 * corresponding line in Part I, column (f), or column (i), as applicable, plus
 * or minus any amount reported on the corresponding line in Part I, column
 * (j), less any payments reported in Part II, columns (b) through (i)"
 * (line-1::b05), and a transfer in shows its only amount in column (j)
 * (lines-1-through-8::b02). The engine follows the form's arithmetic: with
 * this year's amounts only, Part II column (j) would drop an earlier
 * adjustment, and a transfer in would show a negative balance from its second
 * year on (docs/rule-decisions.md).
 *
 * Part I line 1 to 4 for an inclusion year, and its Part II line. Column (e)
 * is the year's Part III column (g) total; column (f) is (d) less (e).
 */
export function inclusionLine(
  year: number,
  value: Section965InclusionValue,
  deferred: number | undefined,
): Form965ALine {
  const net965 = netLiability(value.netTaxWithAll965, value.netTaxWithout965);
  const eligible = eligibleForInstallments(net965, deferred);
  const transfersAndAdjustments = roundDollars(value.transfersAndAdjustments);
  const partI: PartILine = {
    year,
    netTaxWithAll965: roundDollars(value.netTaxWithAll965),
    netTaxWithout965: roundDollars(value.netTaxWithout965),
    net965,
    deferred,
    eligible,
    ...electionColumns(eligible, value.installmentElection),
    transfersAndAdjustments,
    counterpartyTin: value.counterpartyTin,
  };
  const installment = {
    basis: "original" as const,
    election: value.installmentElection,
    liability: eligible + (transfersAndAdjustments ?? 0),
    year: installmentYearOf(year),
  };
  return { partI, ...partIIOf({ value, installment }) };
}

/*
 * Part I line 5 to 8 (lines-1-through-8::b02, b04 to b06). A transfer in
 * skips columns (b) to (i) and shows the amount assumed in (j); a triggered
 * liability skips (b) to (e) and shows the amount in (f). Undefined while a
 * triggered liability's amount or election is missing.
 */
export function otherLine(value: Section965OtherLiabilityValue): Form965ALine | undefined {
  const transfersAndAdjustments = roundDollars(value.transfersAndAdjustments);
  const common = {
    year: value.year,
    transfersAndAdjustments,
    counterpartyTin: value.counterpartyTin,
  };
  const year = installmentYearOf(value.year);
  if (value.kind === "transfer_in") {
    const installment = {
      basis: "assumed" as const,
      election: true,
      liability: transfersAndAdjustments ?? 0,
      year,
    };
    return { partI: common, ...partIIOf({ value, installment }) };
  }
  const eligible = roundDollars(value.triggeredLiability);
  if (eligible === undefined || value.installmentElection === undefined) return undefined;
  const partI = { ...common, eligible, ...electionColumns(eligible, value.installmentElection) };
  if (value.year >= REPORTING_YEAR) return { partI, gap: TRIGGERED_THIS_YEAR };
  const installment = {
    basis: "original" as const,
    election: value.installmentElection,
    liability: eligible + (transfersAndAdjustments ?? 0),
    year,
  };
  return { partI, ...partIIOf({ value, installment }) };
}

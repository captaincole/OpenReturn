/*
 * One installment sale's Form 6252: which lines can be figured, which wait for
 * an answer, and which are a gap. lines.ts holds the arithmetic.
 */

import type { InstallmentSaleFactValue } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { heldMoreThanOneYear } from "../4797/dates.js";
import {
  grossProfitPercentage,
  partI,
  partII,
  partIII,
  receivedFinalPayment,
  type PartIIILines,
  type PartIILines,
  type PartILines,
} from "./lines.js";
import { partIIIAnswers, type PartIIIAnswers } from "./relatedParty.js";

/* The engine prepares 2025 returns. */
export const TAX_YEAR = 2025;

/*
 * Line 15: "the maximum exclusion of gain ($250,000 or $500,000 if married
 * filing jointly)" (irs-pub-523-2025::sec::eligibility-test::b01).
 */
export const HOME_SALE_EXCLUSION_LIMIT = 250_000;
export const HOME_SALE_EXCLUSION_LIMIT_JOINT = 500_000;

/* A run of lines that are a gap or wait: every money line numbered `from` or later. */
export interface LineStop {
  from: number;
  reason?: string;
}

export interface SaleForm {
  key: string;
  sale: InstallmentSaleFactValue;
  yearOfSale: boolean;
  longTerm: boolean;
  partI?: PartILines;
  line19?: number;
  partII?: PartIILines;
  /* Lines 27–37; undefined when Part III is not completed. */
  partIII?: PartIIIAnswers;
  /* Lines 30–37 when figured. */
  partIIILines?: PartIIILines;
  /* Money lines that are a gap (reason) from a line on. */
  gap?: LineStop;
  /* Money lines that wait for an answer from a line on (blank; the sale's fact is asked again). */
  waits?: LineStop;
}

const yearOf = (date: string): number => Number(date.slice(0, 4));

const CONTINGENT_NO_MAXIMUM =
  "A contingent payment sale with no stated maximum selling price: attach a schedule showing the computation of gain and enter the taxable part on line 24 (irs-6252-form-2025::sec::line-5::b01; Temporary Regulations section 15a.453-1(c)). The engine does not figure it.";
const RECAPTURE_IN_YEAR_OF_SALE =
  "Line 12 is the ordinary income recapture of Form 4797 Part III line 31 for this property (irs-6252-form-2025::sec::line-12::b01). The engine does not yet put an installment sale's property in Form 4797 Part III, so line 12 is not figured for a 2025 sale with depreciation.";
const OTHER_RECAPTURE_IN_YEAR_OF_SALE =
  "Line 25 in the year of sale is Form 4797 Part III line 27c, 28b or 29b for this property (irs-6252-form-2025::sec::line-25::b01); the engine does not put an installment sale's property in Form 4797 Part III.";
const NO_GAIN =
  "Line 14 is zero or less: don't file Form 6252; report the entire sale on Form 4797, Form 8949 or Schedule D (irs-6252-form-2025::sec::line-14::b01). The engine does not move the sale there.";

/* Why the sale cannot be figured from line 5 on, line 12 on, or line 15 on; undefined when it can. */
function partIGap(sale: InstallmentSaleFactValue, yearOfSale: boolean): LineStop | undefined {
  if (yearOf(sale.dateSold) > TAX_YEAR) {
    return { from: 5, reason: `The sale date ${sale.dateSold} is after ${TAX_YEAR}.` };
  }
  if (sale.sellingPrice === undefined) {
    return {
      from: 5,
      reason: sale.sellingPriceDeterminable
        ? "The sale states no selling price (line 5)."
        : CONTINGENT_NO_MAXIMUM,
    };
  }
  if (yearOfSale && (sale.depreciationAllowed ?? 0) > 0) {
    return { from: 12, reason: RECAPTURE_IN_YEAR_OF_SALE };
  }
  return undefined;
}

/* An answer a later year needs: line 12 when there was depreciation, line 23. */
function waitsFor(sale: InstallmentSaleFactValue, yearOfSale: boolean): LineStop | undefined {
  if (yearOfSale) return undefined;
  if ((sale.depreciationAllowed ?? 0) > 0 && sale.recaptureIncome === undefined)
    return { from: 12 };
  if (sale.paymentsPriorYears === undefined) return { from: 23 };
  return undefined;
}

/* The excluded gain over the section 121 limit: a gap from line 15 on. */
function exclusionGap(sale: InstallmentSaleFactValue, joint: boolean): LineStop | undefined {
  const limit = joint ? HOME_SALE_EXCLUSION_LIMIT_JOINT : HOME_SALE_EXCLUSION_LIMIT;
  return (sale.excludedGain ?? 0) > limit
    ? {
        from: 15,
        reason: `The excluded gain on line 15 is more than the maximum exclusion of $${String(limit)} (irs-pub-523-2025::sec::eligibility-test::b01).`,
      }
    : undefined;
}

/* Lines 19–26, and the gap at line 25 for year-of-sale recapture that Form 4797 figures. */
function figurePartII(sale: InstallmentSaleFactValue, yearOfSale: boolean, lines: PartILines) {
  if (lines.line16 === undefined || lines.line17 === undefined || lines.line18 === undefined) {
    return { gap: { from: 15, reason: NO_GAIN } };
  }
  const line19 = grossProfitPercentage(lines.line16, lines.line18);
  const otherRecapture = yearOfSale && (sale.remainingRecapture ?? 0) > 0;
  const lines2 = partII({
    yearOfSale,
    line17: lines.line17,
    line19,
    paymentsThisYear: sale.paymentsThisYear,
    paymentsTreatedAsReceivedEarlier: sale.paymentsTreatedAsReceivedEarlier,
    paymentsPriorYears: sale.paymentsPriorYears,
    remainingRecapture: sale.remainingRecapture,
  });
  return {
    line19,
    partII: lines2,
    gap: otherRecapture ? { from: 25, reason: OTHER_RECAPTURE_IN_YEAR_OF_SALE } : undefined,
  };
}

/* Lines 30–37 when the second disposition accelerates the payments. */
function figurePartIII(sale: InstallmentSaleFactValue, form: SaleForm): PartIIILines | undefined {
  const answers = form.partIII;
  const resale = sale.relatedParty?.secondDisposition;
  if (!answers?.completeLines30To37 || resale === undefined) return undefined;
  if (form.partI?.line18 === undefined || form.line19 === undefined || !form.partII)
    return undefined;
  return partIII({
    amountRealized: resale.amountRealized,
    line18: form.partI.line18,
    line19: form.line19,
    line22: form.partII.line22,
    line23: form.partII.line23,
    recaptureLeft: roundDollars(sale.remainingRecapture ?? 0) - form.partII.line25,
  });
}

/* The first stop of two: the one that starts at the lower line. */
const earlier = (first?: LineStop, second?: LineStop): LineStop | undefined =>
  first === undefined || (second !== undefined && second.from < first.from) ? second : first;

export function saleForm(key: string, sale: InstallmentSaleFactValue, joint: boolean): SaleForm {
  const yearOfSale = yearOf(sale.dateSold) === TAX_YEAR;
  const base: SaleForm = {
    key,
    sale,
    yearOfSale,
    longTerm: heldMoreThanOneYear(sale.dateAcquired, sale.dateSold),
    waits: waitsFor(sale, yearOfSale),
  };
  const stop = partIGap(sale, yearOfSale);
  if (stop?.from === 5 || sale.sellingPrice === undefined) return { ...base, gap: stop };
  const lines = partI({ ...sale, sellingPrice: sale.sellingPrice });
  const second = figurePartII(sale, yearOfSale, lines);
  const form: SaleForm = {
    ...base,
    partI: lines,
    line19: second.line19,
    partII: second.partII,
    gap: earlier(earlier(stop, exclusionGap(sale, joint)), second.gap),
  };
  const finalPayment =
    second.partII !== undefined && lines.line18 !== undefined
      ? receivedFinalPayment(second.partII, lines.line18)
      : false;
  const answers = partIIIAnswers(sale, finalPayment);
  const withPartIII: SaleForm = { ...form, partIII: answers.answers };
  return {
    ...withPartIII,
    partIIILines: figurePartIII(sale, withPartIII),
    gap: earlier(withPartIII.gap, answers.gap),
    waits: earlier(withPartIII.waits, answers.waits),
  };
}

/* A money line of the form: its value, blank while it waits, or the gap's reason. */
export function moneyLine(
  form: SaleForm,
  line: number,
  value: number | undefined,
): number | { reason: string } | undefined {
  if (form.gap !== undefined && line >= form.gap.from) return { reason: form.gap.reason ?? "" };
  if (form.waits !== undefined && line >= form.waits.from) return undefined;
  return value;
}

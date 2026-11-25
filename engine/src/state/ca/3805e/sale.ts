/*
 * One installment sale's FTB 3805E: which lines can be figured, which wait for
 * an answer, and which are a gap. The arithmetic is federal Form 6252's
 * (federal/6252/lines.ts) on California's amounts (lines.ts); Part III's
 * questions are federal/6252/relatedParty.ts, whose two-year window and line
 * 29 conditions the California form repeats word for word.
 */

import type { InstallmentSaleFactValue } from "../../../facts/index.js";
import { heldMoreThanOneYear } from "../../../federal/4797/dates.js";
import {
  grossProfitPercentage,
  partI,
  partII,
  partIII,
  receivedFinalPayment,
  type PartIIILines,
  type PartILines,
} from "../../../federal/6252/lines.js";
import { partIIIAnswers } from "../../../federal/6252/relatedParty.js";
import {
  HOME_SALE_EXCLUSION_LIMIT,
  HOME_SALE_EXCLUSION_LIMIT_JOINT,
  TAX_YEAR,
  type LineStop,
  type SaleForm,
} from "../../../federal/6252/sale.js";
import { roundDollars } from "../../../money.js";
import { californiaPartIAmounts } from "./lines.js";

const yearOf = (date: string): number => Number(date.slice(0, 4));

const CONTINGENT_NO_MAXIMUM =
  "A contingent payment sale with no stated maximum selling price: federal Form 6252's instructions, which FTB 3805E follows for line 5 (ca-3805e-inst-2025::sec::specific-line-instructions::b01), attach a computation of the gain (Temporary Regulations section 15a.453-1(c)). The engine does not figure it.";
const RECAPTURE_IN_YEAR_OF_SALE =
  "Line 12 is the recapture figured on Schedule D-1, Part III and Part IV (ca-3805e-inst-2025::sec::line-12::b01). The engine has no rules for Schedule D-1, so line 12 is not figured for a 2025 sale with California depreciation.";
const OTHER_RECAPTURE_IN_YEAR_OF_SALE =
  "Line 25 in the year of sale is the section 1252, 1254 or 1255 recapture of Schedule D-1, Part IV (ca-3805e-inst-2025::sec::line-25-and-line-36::b01); the engine has no rules for Schedule D-1.";
const NO_GAIN =
  "Line 14 is zero or less: stop here (the form), and report the entire sale on Schedule D (540) or Schedule D-1 (ca-3805e-inst-2025::sec::line-24::b01). The engine does not move the sale there.";

/* Why the sale cannot be figured from line 5 on or line 12 on; undefined when it can. */
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
  const depreciation = californiaPartIAmounts(sale).depreciationAllowed ?? 0;
  if (yearOfSale && depreciation > 0) return { from: 12, reason: RECAPTURE_IN_YEAR_OF_SALE };
  return undefined;
}

/* An answer a later year needs: California's line 12 when there was depreciation, line 23. */
function waitsFor(sale: InstallmentSaleFactValue, yearOfSale: boolean): LineStop | undefined {
  if (yearOfSale) return undefined;
  if (californiaPartIAmounts(sale).recaptureIncome === undefined) return { from: 12 };
  if (sale.paymentsPriorYears === undefined) return { from: 23 };
  return undefined;
}

/* California's excluded gain over the section 121 limit: a gap from line 15 on. */
function exclusionGap(excludedGain: number | undefined, joint: boolean): LineStop | undefined {
  const limit = joint ? HOME_SALE_EXCLUSION_LIMIT_JOINT : HOME_SALE_EXCLUSION_LIMIT;
  return (excludedGain ?? 0) > limit
    ? {
        from: 15,
        reason: `The excluded gain on line 15 is more than the maximum exclusion of $${String(limit)} (irs-pub-523-2025::sec::eligibility-test::b01; ca-3805e-inst-2025::sec::line-15::b01 sends to Pub. 523).`,
      }
    : undefined;
}

/* Lines 19–26 from California's Part I, and the gap at line 25 for year-of-sale recapture. */
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
  const resale = sale.relatedParty?.secondDisposition;
  if (!form.partIII?.completeLines30To37 || resale === undefined) return undefined;
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

/* One sale's FTB 3805E, with California's amounts on lines 8, 9, 12 and 15. */
export function californiaSaleForm(
  key: string,
  sale: InstallmentSaleFactValue,
  joint: boolean,
): SaleForm {
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
  const amounts = californiaPartIAmounts(sale);
  const lines = partI({ ...sale, ...amounts, sellingPrice: sale.sellingPrice });
  const second = figurePartII(sale, yearOfSale, lines);
  const form: SaleForm = {
    ...base,
    partI: lines,
    line19: second.line19,
    partII: second.partII,
    gap: earlier(earlier(stop, exclusionGap(amounts.excludedGain, joint)), second.gap),
  };
  const finalPayment =
    second.partII !== undefined && lines.line18 !== undefined
      ? receivedFinalPayment(second.partII, lines.line18)
      : false;
  /*
   * DECISION (2026-11-24, by the author, not reviewed by a person): a related
   * party's resale of marketable securities more than 2 years after the year
   * of sale still completes Part III, as on federal Form 6252 (rule-decisions
   * row A2). Text A: line 3, "complete Part III for the year of sale and 2
   * years after the year of the sale unless you received the final payment"
   * (the form). Text B: the special rule applies to a second disposition
   * "before making all payments on the first disposition", and "does not apply
   * if any of the exceptions listed in Part III, line 29 are met"
   * (ca-3805e-inst-2025::sec::installment-sales-to-related-party::b01), where
   * line 29a excludes "dispositions of marketable securities". The engine
   * follows Text B, the specific rule, the same way on both returns.
   */
  const answers = partIIIAnswers(sale, finalPayment);
  const withPartIII: SaleForm = { ...form, partIII: answers.answers };
  return {
    ...withPartIII,
    partIIILines: figurePartIII(sale, withPartIII),
    gap: earlier(withPartIII.gap, answers.gap),
    waits: earlier(withPartIII.waits, answers.waits),
  };
}

/*
 * Whether this sale has a form this year. The year of sale: Parts I and II.
 * "For Years After the Year of Sale – Complete Part II for any year you receive
 * a payment" (ca-3805e-inst-2025::sec::other-parts-to-be-completed::b01), and
 * Part III for 2 years after the sale (line 3). A gap from line 5 still files,
 * so the sale is not dropped.
 */
export function filesThisYear(form: SaleForm): boolean {
  return (
    form.yearOfSale ||
    form.sale.paymentsThisYear > 0 ||
    form.partIII !== undefined ||
    form.gap?.from === 5
  );
}

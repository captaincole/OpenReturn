/*
 * What Form 4797 sends to other lines: Schedule 1 line 4 (line 18b), Schedule D
 * line 11 (the section 1231 gain of line 7 or 9) and Schedule D line 19 (the
 * Unrecaptured Section 1250 Gain Worksheet). Each is a gap while the form's
 * summary is one, and blank while the line 8 answer is missing.
 */

import { atLeast, numberOrBlank, roundDollars } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { unrecapturedSection1250Gain } from "../../worksheets/unrecapturedSection1250.js";
import type { Form4797FilingInfo } from "./filingInfo.js";

type Amount = number | Unsupported | undefined;

export const form4797Files = (info: Form4797FilingInfo): boolean =>
  info.mustFile?.["form-4797"]?.value === true;

function summaryGap(info: Form4797FilingInfo): Unsupported | undefined {
  const gap = info.form4797Gap ?? info.form4797SummaryGap;
  return gap === undefined ? undefined : unsupported(`Form 4797: ${gap}`);
}

/* Schedule 1 line 4: Form 4797 line 18b (the form's line 18b text). */
export function scheduleOneLine4(info: Form4797FilingInfo): Amount {
  return summaryGap(info) ?? info.form4797?.line18b;
}

/*
 * Schedule D line 11: line 7's gain with no nonrecaptured losses
 * (irs-4797-inst-2025::sec::line-7::b01), or line 9's (line-9::b01).
 */
export function scheduleDGainFromForm4797(info: Form4797FilingInfo): Amount {
  return summaryGap(info) ?? info.form4797?.scheduleDGain;
}

/* What the Unrecaptured Section 1250 Gain Worksheet reads from the rest of the return. */
export interface WorksheetReturnAmounts {
  /* Schedule D line 7 and line 14 (a positive amount). */
  scheduleDLine7?: number;
  scheduleDLine14?: number;
  /* Form 1099-DIV box 2b, every payer: worksheet line 11. */
  dividendUnrecaptured1250?: number;
  /* A gap for worksheet lines 4, 5, 11, 12 or 14 (a Form 6252 sale, a K-1 amount, a 28% rate gain), or undefined. */
  otherSourceGap?: Unsupported;
  /* Form 6252: worksheet line 4 (trade or business property) and line 12 (no entry in Form 4797 Part I). */
  installmentSales?: number;
  installmentNotInPartI?: number;
  /* A Form 6252 amount for the worksheet waits for an answer: the line is blank. */
  installmentWaits?: boolean;
}

/*
 * Schedule D line 19 = worksheet line 18 when it is more than zero
 * (irs-1040sd-inst-2025::sec::unrecaptured-section-1250-gain-worksheet-line-19::b04).
 * Lines 4 and 12 take Form 6252's unrecaptured section 1250 gain
 * (irs-1040sd-inst-2025::sec::line-4::b01, line-12::b01; 6252/lines.ts). Line 10
 * and the rest of line 12 are 0: no partnership interest sale or other section
 * 1250 sale outside Part I has a fact.
 */
export function scheduleDLine19FromForm4797(
  info: Form4797FilingInfo,
  amounts: WorksheetReturnAmounts,
): Amount {
  const gap = summaryGap(info) ?? amounts.otherSourceGap;
  if (gap) return gap;
  const lines = info.form4797;
  if (lines === undefined || lines.waitsForLine8 || amounts.installmentWaits) return undefined;
  const line7 = numberOrBlank(amounts.scheduleDLine7) ?? 0;
  const result = unrecapturedSection1250Gain({
    form4797Line7Gain: lines.line7,
    form4797Line8: lines.line8,
    section1250Properties: info.form4797Section1250 ?? [],
    installmentSales: amounts.installmentSales ?? 0,
    partnershipOrSCorporation: 0,
    partnershipInterestSale: 0,
    reportedOnStatements: roundDollars(amounts.dividendUnrecaptured1250 ?? 0),
    notInPartI: amounts.installmentNotInPartI ?? 0,
    rate28Gain: 0,
    scheduleDLine7Loss: atLeast(0, -line7),
    longTermLossCarryover: numberOrBlank(amounts.scheduleDLine14) ?? 0,
  });
  return result.line18 > 0 ? result.line18 : undefined;
}

/*
 * Schedule 1 line 12, certain business expenses of reservists, performing
 * artists and fee-basis government officials: the parts of Form 2106 line 10
 * for them (irs-2106-inst-2025::sec::line-10::b01–b03; irs-1040-inst-2025::sec::line-12::b01).
 * A performing artist's part counts only when AGI before it is $16,000 or less
 * (test 4, federal/2106/performingArtist.ts).
 */

import type { FormAccessor } from "../../defineForm.js";
import { numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { passesAgiTest } from "../2106/performingArtist.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";
import type { Schedule1 } from "./types.js";

const AGI_READS_THIS_LINE =
  "A qualified performing artist's AGI test needs AGI before the expenses, and with Social Security benefits, an IRA deduction or student loan interest that AGI is figured from this line; the engine does not figure the loop.";

const form2106Files = (info: Schedule1FilingInfo) => info.mustFile?.["form-2106"]?.value === true;

/*
 * Test 4: Form 1040 line 9 less every other adjustment on lines 11–25. Lines 20
 * and 21 and the taxable Social Security read this line, so a return with any
 * of them is a gap.
 */
function agiBeforePerformingArts(
  form: FormAccessor<Schedule1>,
  info: Schedule1FilingInfo,
  otherParts: number,
): number | string | undefined {
  const benefits = numberOrBlank(form["form-1040.line.6a"]) ?? 0;
  if (
    benefits > 0 ||
    (info.iraContributions ?? 0) > 0 ||
    info.studentLoanInterestPaid !== undefined
  ) {
    return AGI_READS_THIS_LINE;
  }
  const totalIncome = numberOrBlank(form["form-1040.line.9"]);
  if (totalIncome === undefined) return undefined;
  const otherAdjustments = sum(
    form["1.line.11"],
    form["1.line.13"],
    form["1.line.14"],
    form["1.line.15"],
    form["1.line.16"],
    form["1.line.17"],
    form["1.line.18"],
    form["1.line.19a"],
    form["1.line.23"],
    form["1.line.25"],
  );
  return totalIncome - otherAdjustments - otherParts;
}

export function line12(
  form: FormAccessor<Schedule1>,
  info: Schedule1FilingInfo,
): number | Unsupported | undefined {
  if (!form2106Files(info)) return undefined;
  if (info.form2106TotalsGap) return unsupported(info.form2106TotalsGap);
  const totals = info.form2106Totals;
  if (totals === undefined) return undefined;
  let performingArts = 0;
  if (totals.performingArts > 0) {
    const agi = agiBeforePerformingArts(form, info, totals.scheduleOne);
    if (typeof agi === "string") return unsupported(agi);
    if (agi === undefined) return undefined;
    performingArts = passesAgiTest(agi) ? totals.performingArts : 0;
  }
  const amount = totals.scheduleOne + performingArts;
  return amount > 0 ? amount : undefined;
}

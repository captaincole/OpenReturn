/*
 * The return-wide part of the limit: the amounts from the rest of the return,
 * whether the qualified dividends and capital gains are adjusted, and the
 * line 18 amount. Every Form 1116 of the return shares it.
 */

import { sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form1116FilingInfo } from "./filingInfo.js";
import { adjustmentRequired, line18Worksheet, qualifiesForAdjustmentException } from "./lines.js";
import type { RateBands } from "./partI.js";
import { returnAmounts, type Accessor, type ReturnAmounts } from "./returnAmounts.js";
import type { ForeignTaxSource } from "./sources.js";

export interface Limitation {
  amounts: ReturnAmounts;
  /* The rate split for line 1a; undefined when line 1a takes the amounts as they are. */
  bands?: RateBands;
  /* Line 18 before the floor at 0: the U.S. loss of line 16 reads it. */
  line18Amount: number;
}

const RATE_GAIN_GAP =
  "The qualified dividends and capital gains must be adjusted, and the return has 28% rate or unrecaptured section 1250 gain (Schedule D line 18 or 19): the Worksheet for Line 18 then reads the Schedule D Tax Worksheet (irs-1116-inst-2025::sec::taxpayers-who-completed-the-schedule-d-tax::b01), which the engine does not figure.";
const FOREIGN_GAIN_GAP =
  "The capital gains must be adjusted, and a Schedule D filer's foreign capital gain distributions go through Worksheet A or B or Pub. 514 (irs-1116-inst-2025::sec::schedule-d-filers::b04), which the engine does not figure.";

/* Foreign qualified dividends plus foreign capital gain distributions, the exception's second test. */
export function foreignPreferential(sources: ReadonlyArray<ForeignTaxSource>): number {
  return sum(
    ...sources.map((source) => sum(source.qualifiedDividends, source.capitalGainDistributions)),
  );
}

/*
 * Adjust or not (irs-1116-inst-2025::sec::individuals-who-completed-a-qualified-dividends::b01,
 * b02): the adjustments are required when the preferential rates lowered the
 * tax; a filer who qualifies for the adjustment exception elects not to adjust,
 * and the engine takes that election (QUESTIONS.md). Adjusted, line 1a takes the
 * rate factors and line 18 is the worksheet's line 12.
 */
export function limitationOf(
  form: Accessor,
  info: Form1116FilingInfo,
  sources: ReadonlyArray<ForeignTaxSource>,
): Limitation | Unsupported | undefined {
  const amounts = returnAmounts(form, info);
  if (amounts === undefined || "unsupported" in amounts) return amounts;
  const { qdcg } = amounts;
  const preferential = foreignPreferential(sources);
  const adjust =
    adjustmentRequired(qdcg.line5, qdcg.line23, qdcg.line24) &&
    !qualifiesForAdjustmentException(amounts.filingStatus, qdcg.line5, preferential);
  if (!adjust) return { amounts, line18Amount: amounts.limitTaxableIncome };
  if (amounts.rateGainWorksheet) return unsupported(RATE_GAIN_GAP);
  const foreignGains = sum(...sources.map((source) => source.capitalGainDistributions));
  if (info.mustFile?.["schedule-d"]?.value === true && foreignGains > 0) {
    return unsupported(FOREIGN_GAIN_GAP);
  }
  const worksheet = line18Worksheet(amounts.limitTaxableIncome, qdcg);
  return {
    amounts,
    bands: { zeroRate: qdcg.line9, fifteenRate: qdcg.line17, twentyRate: qdcg.line20 },
    line18Amount: worksheet.line1 - worksheet.line11,
  };
}

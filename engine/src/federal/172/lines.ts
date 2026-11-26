/*
 * Form 172 Part I, the 2025 NOL, as pure functions of amounts
 * (irs-172-inst-2025 and the form; no published example with numbers,
 * QUESTIONS.md). An input is a whole-dollar amount or the reason the engine
 * cannot figure it; a line that reads a gap is that gap.
 */

import { atLeast, sum } from "../../money.js";
import type { Unsupported } from "../../types.js";

export type Amount = number | Unsupported;

/* A value is the engine's gap: unsupported(reason). */
export const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && (value as Unsupported | null)?.unsupported === true;

/*
 * Line 19: "the smaller of: The loss on line 16; or $3,000 (If filing Form
 * 1040, $1,500 when married filing separately)" (irs-172-face-2025::sec::face-part-i::b03).
 */
export const CAPITAL_LOSS_LIMIT = 3_000;
export const CAPITAL_LOSS_LIMIT_MFS = 1_500;

/* The first gap among the values, else undefined. */
export function firstGap(values: ReadonlyArray<Amount | undefined>): Unsupported | undefined {
  return values.find((value): value is Unsupported => isGap(value));
}

/* The amount by which `larger` is more than `smaller`; 0 when it is not ("Otherwise, enter -0-"). */
const excessOver = (larger: number, smaller: number) => atLeast(0, larger - smaller);
const added = (first: number, second: number) => first + second;

/* `compute` on two amounts, or the first one's gap. */
export function both(
  first: Amount,
  second: Amount,
  compute: (a: number, b: number) => number,
): Amount {
  const gap = firstGap([first, second]);
  return gap ?? compute(first as number, second as number);
}

/* What Part I reads from the return. Every amount is whole dollars and positive unless named. */
export interface PartIInputs {
  /* Form 1040 line 11a, signed. */
  agi: number;
  /* Form 1040 line 12e: the standard deduction or the itemized deductions. */
  deduction: number;
  /* Lines 2 and 3 (irs-172-inst-2025::sec::lines-19-22-capital-loss-limitation::b01). */
  nonbusinessCapitalLosses: Amount;
  nonbusinessCapitalGains: Amount;
  /* Line 6 (::line-6-nonbusiness-deductions::b01). */
  nonbusinessDeductions: Amount;
  /* Line 7 (::line-7-nonbusiness-income-other-than::b01). */
  nonbusinessIncome: Amount;
  /* Lines 11 and 12. */
  businessCapitalLosses: Amount;
  businessCapitalGains: Amount;
  /* Line 16: the loss on Schedule D line 16 as a positive amount; 0 when it is not a loss. */
  scheduleDLoss: Amount;
  /* Line 17: gain excluded under section 1202 (::line-17-section-1202-exclusion::b01). */
  section1202Exclusion: number;
  /* Married filing separately: line 19's $1,500. */
  marriedFilingSeparately: boolean;
  /* Line 23: the NOL deduction for losses from other years, positive (Schedule 1 line 8a). */
  nolDeductionOtherYears: Amount;
}

export interface PartILines {
  line1: number;
  line2?: Amount;
  line3?: Amount;
  line4?: Amount;
  line5?: Amount;
  line6?: Amount;
  line7?: Amount;
  line8?: Amount;
  line9?: Amount;
  line10?: Amount;
  line11?: Amount;
  line12?: Amount;
  line13?: Amount;
  line14?: Amount;
  line15?: Amount;
  line16?: Amount;
  line17?: Amount;
  line18?: Amount;
  line19?: Amount;
  line20?: Amount;
  line21?: Amount;
  line22?: Amount;
  line23?: Amount;
  /* The NOL, a negative amount; undefined when the result is zero or more ("you don't have an NOL"). */
  line24?: Amount;
}

/* Lines 2 to 15: nonbusiness capital losses and deductions only against nonbusiness income (::lines-19-22::b01). */
function limitLines(input: PartIInputs) {
  const line2 = input.nonbusinessCapitalLosses;
  const line3 = input.nonbusinessCapitalGains;
  const line4 = both(line2, line3, excessOver);
  const line5 = both(line3, line2, excessOver);
  const line6 = input.nonbusinessDeductions;
  const line7 = input.nonbusinessIncome;
  const line8 = both(line5, line7, added);
  const line9 = both(line6, line8, excessOver);
  // Line 10: "But don't enter more than line 5".
  const line10 = both(both(line8, line6, excessOver), line5, (excess, cap) =>
    Math.min(excess, cap),
  );
  const line11 = input.businessCapitalLosses;
  const line12 = input.businessCapitalGains;
  const line13 = both(line10, line12, added);
  const line14 = both(line11, line13, excessOver);
  const line15 = both(line4, line14, added);
  return {
    line2,
    line3,
    line4,
    line5,
    line6,
    line7,
    line8,
    line9,
    line10,
    line11,
    line12,
    line13,
    line14,
    line15,
  };
}

/*
 * Lines 16 to 22. "If you don't have a loss on that line (and don't have a
 * section 1202 exclusion), skip lines 16 through 21 and enter on line 22 the
 * amount from line 15" (the form, line 16).
 */
function capitalLossLines(input: PartIInputs, line15: Amount) {
  const loss = input.scheduleDLoss;
  if (loss === 0 && input.section1202Exclusion === 0) return { line22: line15 };
  const line16 = loss;
  const line17 = input.section1202Exclusion;
  const line18 = both(line16, line17, excessOver);
  const limit = input.marriedFilingSeparately ? CAPITAL_LOSS_LIMIT_MFS : CAPITAL_LOSS_LIMIT;
  // Line 19: only "If line 16 is a loss"; else 0.
  const line19 = both(line16, limit, (amount, cap) => Math.min(amount, cap));
  const line20 = both(line18, line19, excessOver);
  const line21 = both(line19, line18, excessOver);
  const line22 = both(line15, line20, excessOver);
  return { line16, line17, line18, line19, line20, line21, line22 };
}

/*
 * Part I. Step 1 of the NOL Steps: "You may have an NOL if a negative amount
 * appears" when the deduction is subtracted from AGI, and Step 2: "If you do
 * not have an NOL, stop here" (irs-172-inst-2025::sec::nol-steps::b01). So
 * with line 1 at zero or more only line 1 prints. Line 24: "Combine lines 1,
 * 9, 17, and 21 through 23. If the result is less than zero, enter it here.
 * If the result is zero or more, you don't have an NOL" (the form).
 */
export function partI(input: PartIInputs): PartILines {
  const line1 = input.agi - input.deduction;
  if (line1 >= 0) return { line1 };
  const limits = limitLines(input);
  const capital = capitalLossLines(input, limits.line15);
  const line23 = input.nolDeductionOtherYears;
  const parts = [limits.line9, capital.line17 ?? 0, capital.line21 ?? 0, capital.line22, line23];
  const gap = firstGap(parts);
  const total = line1 + sum(...parts);
  const line24 = gap ?? (total < 0 ? total : undefined);
  return { line1, ...limits, ...capital, line23, line24 };
}

/* The NOL as a positive amount; 0 when there is none. */
export function nolAmount(lines: PartILines): Amount {
  const line24 = lines.line24;
  if (line24 === undefined) return 0;
  return isGap(line24) ? line24 : -line24;
}

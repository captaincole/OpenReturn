/*
 * What other forms receive from Form 8824. Schedule D line 4 takes the
 * short-term gain or (loss) and line 11 the long-term gain or (loss) "from Forms
 * 4684, 6781, and 8824"; Form 4797 line 5 takes the section 1231 and line 16 the
 * ordinary gain or (loss) "from like-kind exchanges from Form 8824" (the lines of
 * those forms; irs-8824-inst-2025::sec::line-22::b01, line-36::b01).
 */

import type { Form8824FilingInfo } from "./filingInfo.js";
import { lineAmount, type RoutedAmounts } from "./routedAmounts.js";
import type { ExchangeActivityAmounts, Form8824Totals } from "./totals.js";

export type Form8824Receipt =
  { kind: "none" } | { kind: "gap"; reason: string } | { kind: "amount"; amount: number };

/* A Schedule D line's receipt; "none" while the form does not file or sends nothing there. */
export function scheduleDReceipt(
  info: Form8824FilingInfo,
  line: keyof Pick<RoutedAmounts, "shortTermCapital" | "longTermCapital">,
): Form8824Receipt {
  const totals = info.form8824Totals;
  if (totals === undefined) return { kind: "none" };
  if (totals.scheduleD.gap) return { kind: "gap", reason: `Form 8824: ${totals.scheduleD.gap}` };
  const amount = totals.amounts[line];
  return amount === 0 ? { kind: "none" } : { kind: "amount", amount };
}

/* The fact keys behind a gap of a receiving form: a gap from the decision alone has none. */
const gapKeys = (totals: Form8824Totals, gap: string | undefined): string[] =>
  gap === undefined ? [] : [...totals.fileKeys, ...totals.malformedKeys];

/* Whether a fact makes Form 8824 send Schedule D an amount or a gap: Schedule D files for it. */
export function sendsToScheduleD(totals: Form8824Totals | undefined): boolean {
  if (totals === undefined) return false;
  const { shortTermCapital, longTermCapital } = totals.amounts;
  return (
    gapKeys(totals, totals.scheduleD.gap).length > 0 ||
    shortTermCapital !== 0 ||
    longTermCapital !== 0
  );
}

export interface Form4797Receipt {
  /* The facts that make Form 4797 file: an exchange with a line 5 or 16 amount, or a gap there. */
  keys: string[];
  gap?: string;
  line5?: number;
  line16?: number;
  activities: ExchangeActivityAmounts[];
}

export function form4797Receipt(totals: Form8824Totals | undefined): Form4797Receipt {
  if (totals === undefined) return { keys: [], activities: [] };
  const { gap, activities } = totals.form4797;
  return {
    keys: [...new Set([...activities.map((each) => each.key), ...gapKeys(totals, gap)])],
    gap: gap === undefined ? undefined : `Form 8824: ${gap}`,
    line5: lineAmount(totals.amounts.section1231),
    line16: lineAmount(totals.amounts.ordinary),
    activities,
  };
}

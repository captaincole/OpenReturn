/*
 * Line 10 is federal Form 1040 line 7a, so it holds every amount that reaches
 * federal Schedule D. Lines 1 to 3 carry the sales (with their California
 * basis), the capital gain distributions and a Form 4797 section 1231 gain. An
 * amount from any other form is in line 10 and not in line 11, so lines 12a and
 * 12b would move it to Schedule CA (540NR) as a California difference. Each
 * such amount is a gap here: the engine has no California amount for it on a
 * Form 540NR return. Never a silent 0.
 */

import { getSection1256Facts } from "../../../facts/index.js";
import { resolve4684Info } from "../../../federal/4684/resolveInfo.js";
import { form6252TotalsOf } from "../../../federal/6252/resolveInfo.js";
import { form8621Feeds } from "../../../federal/8621/totals.js";
import { resolve8814Info } from "../../../federal/8814/resolveInfo.js";
import { sendsToScheduleD } from "../../../federal/8824/receivers.js";
import { resolve8824Info } from "../../../federal/8824/resolveInfo.js";
import { receivedAmounts, type Receipt } from "../../../federal/passThrough/receipts.js";
import { resolveScheduleDInfo } from "../../../filingInfoResolvers.js";
import type { ResolverInputs } from "../../../resolverInputs.js";

export const K1_GAP =
  "A Schedule K-1 sends federal Schedule D line 5 or 12 a capital gain or loss. Line 2 takes the net gain or loss on the California Schedule(s) K-1 (100S, 541, 565 and 568) (ca-540nr-sched-d-inst-2025::sec::line-2-net-gain-or-loss-shown-on-california-schedule-s-k-1-100s-541-565-and-568::b01), which is not a fact the engine has.";

/* Each other form that sends federal Schedule D an amount, and why line 1 has no California amount for it. */
const OTHER_SOURCES: ReadonlyArray<[sends: (inputs: ResolverInputs) => boolean, gap: string]> = [
  [
    (inputs) => getSection1256Facts(inputs.facts).length > 0,
    "Form 6781 sends federal Schedule D a section 1256 gain or loss; the engine has no California amount for it on line 1.",
  ],
  [
    (inputs) => sendsToScheduleD(resolve8824Info(inputs).form8824Totals),
    "Form 8824 sends federal Schedule D a like-kind exchange gain or loss; the engine has no California amount for it on line 1.",
  ],
  [
    (inputs) => form8621Feeds(inputs).scheduleDFallback.value,
    "Form 8621 sends federal Schedule D a QEF net capital gain; the engine has no California amount for it on line 1.",
  ],
  [
    (inputs) => {
      const totals = resolve8814Info(inputs).form8814Totals;
      return totals !== undefined && (totals.kind !== "figured" || totals.line10 > 0);
    },
    "Form 8814 adds a child's capital gain distributions to federal Schedule D line 13; California's amount (FTB 3803) is figured for Form 540 only.",
  ],
  [
    (inputs) => resolve4684Info(inputs).mustFile?.["form-4684"]?.value === true,
    "Form 4684 files; the engine has no Schedule D amount from it on either return.",
  ],
  [
    (inputs) => {
      const totals = form6252TotalsOf(inputs);
      return totals?.scheduleDLine4 !== undefined || totals?.scheduleDLine11 !== undefined;
    },
    "A Form 6252 capital asset sale sends federal Schedule D a gain. Line 1 takes its California amount from FTB 3805E line 26 or 37 (ca-3805e-inst-2025::sec::line-26-and-line-37::b01), which the engine figures for Form 540 only.",
  ],
];

/* A K-1 receipt that holds an amount, waits for one, or is a gap. */
const k1Sends = (receipt: Receipt | undefined): boolean =>
  receipt !== undefined && (receipt.kind !== "received" || receivedAmounts(receipt).length > 0);

/* Line 2's gap, and the first gap of an amount line 1 or line 2 cannot carry. */
export function federalSourcesNotCarried(inputs: ResolverInputs): {
  line2Gap: string | undefined;
  gap: string | undefined;
} {
  const federal = resolveScheduleDInfo(inputs);
  const k1 = k1Sends(federal.passThroughShortTermGain) || k1Sends(federal.passThroughLongTermGain);
  const line2Gap = k1 ? K1_GAP : undefined;
  const other = OTHER_SOURCES.find(([sends]) => sends(inputs))?.[1];
  return { line2Gap, gap: line2Gap ?? other };
}

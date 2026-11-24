/*
 * The California Adjustment Worksheet for Schedule E, columns (c) and (d): each
 * Schedule E activity's net income (loss) after the PAL rules, in California
 * and in federal amounts (ca-3801-inst-2025::sec::step-4-figuring-the-california-adjustment::b02–b03).
 */

import type { PassiveActivities } from "../../../federal/8582/activities.js";
import {
  allowedLossForColumn,
  type FieldReader,
  type LossAllocation,
} from "../../../federal/8582/allocation.js";
import { atLeast, numberOrBlank, sum } from "../../../money.js";
import type { CaScheduleEActivity } from "./californiaRentals.js";
import type { Form3801FilingInfo } from "./filingInfo.js";

/*
 * Column (c): "the amount of any overall gain from Part IV and Part V and
 * allowed losses from Part VIII and Part IX" (step-4-figuring-the-california-adjustment::b02).
 * A passive activity keeps its income (column (a)) less the part of its
 * losses (columns (b) and (c)) that the form allows: Part VIII column (c) when
 * it is listed there, all of them otherwise (an overall gain, or line 3 income
 * or zero). A nonpassive activity keeps its California net income or loss.
 */
export function californiaAfterLimits(
  activity: CaScheduleEActivity,
  allocation: LossAllocation,
): number {
  if (!activity.passive) return activity.californiaNet;
  const income = sum(...activity.rows.map((row) => row.netIncome));
  const losses = sum(...activity.rows.map((row) => row.netLoss + row.priorUnallowedLoss));
  const listed = allocation.part8.find((row) => row.factKey === activity.factKey);
  return income - (listed ? listed.allowed : losses);
}

/* The activities and parts as the federal 8582 allocation reads them. */
export function partsOf(activities: CaScheduleEActivity[]): PassiveActivities {
  const rows = activities.flatMap((activity) => activity.rows);
  return {
    part4: rows.filter((row) => row.part === "part4"),
    part5: rows.filter((row) => row.part === "part5"),
  };
}

/*
 * Column (d): "the federal net income (loss) from this activity after
 * application of the PAL rules (e.g., ... Schedule E income, line 21; Schedule
 * E loss, line 22 ...)" (step-4-figuring-the-california-adjustment::b03). A
 * rental is its line 21 income less its line 22 loss. A royalty has no line
 * 22: a passive one's loss is the part Form 8582 allows; any other royalty's
 * line 21 counts in full. Undefined while a line it reads waits.
 */
export function federalAfterLimits(
  read: FieldReader,
  info: Form3801FilingInfo,
  activity: CaScheduleEActivity,
): number | undefined {
  const { column } = activity;
  const net = numberOrBlank(read(`schedule-e.0.line.21_income_or_loss_${column}`));
  if (net === undefined) return undefined;
  const property = info.rentalProperties?.find((entry) => entry.column === column);
  if (!property) return undefined;
  if (!activity.royalty) {
    const line22 = numberOrBlank(read(`schedule-e.0.line.22_deductible_loss_${column}`));
    const carries = (property.value.priorYearUnallowedLoss ?? 0) > 0;
    if ((net < 0 || carries) && line22 === undefined) return undefined;
    return atLeast(0, net) - (line22 ?? 0);
  }
  if (property.passive !== true) return net;
  const allowed = allowedLossForColumn(read, info, column);
  if (allowed === undefined) return undefined;
  return allowed === null ? net : atLeast(0, net) - allowed;
}

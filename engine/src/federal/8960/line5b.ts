/*
 * Line 5b: "Enter the amount of gains (as a negative number) and losses (as a
 * positive number) included on line 5a that are excluded from NII", such as
 * "Gain or loss from the sale of property held in a non-section 1411 trade or
 * business" (irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b01).
 * The Lines 5a–5d Worksheet enters each such business's net gain on line 2(a)
 * and net loss on line 2(b) (::b05), and line 2(j), the sum of lines 2(a) to
 * 2(i), goes on line 5b (::b07). Line 5a holds the whole Form 4797 amount of a
 * sale (Form 1040 line 7a and Schedule 1 line 4), so a business's line 2 amount
 * is the total of its properties (4797/activities.ts).
 *
 * A Schedule C business with line G "Yes" is a nonpassive section 162 trade or
 * business, as on line 4b (line-4b-adjustment-for-net-income-or-loss::b01), so
 * its sales come out. A passive business's, a rental's and a sale with no
 * business's gain stays in NII. A rental that line 4b takes out as a
 * nonpassive trade or business is a gap: its sale is not modeled. Lines 2(c) to
 * 2(g) have no facts. Lines 2(h) and 2(i) adjust a capital loss carryforward;
 * 2(h) is last year's line 2(i), which no fact gives, so a capital loss carried
 * in from 2024 makes the line a gap.
 */

import { sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form4797Activities } from "../4797/activities.js";
import type { RentalProperty } from "../schedule-e/filingInfo.js";
import type { Form8960FilingInfo } from "./filingInfo.js";
import { section162Nonpassive } from "./lines.js";

const CARRYOVER_GAP =
  "A capital loss was carried into 2025, and Lines 5a–5d Worksheet line 2(h) needs last year's line 2(i) (irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b06), which no fact gives.";

const rentalGap = (property: RentalProperty) =>
  `${property.value.address?.street ?? property.factKey}: a rental that is a nonpassive trade or business sold property; taking its gain out on line 5b is not modeled.`;

/* A rental with a sale that line 4b treats as a nonpassive trade or business: the gap, or undefined while its answer waits. */
function rentalSaleGap(
  activities: Form4797Activities,
  rentals: RentalProperty[],
): Unsupported | "waiting" | undefined {
  for (const property of rentals) {
    if (!activities.amounts.some((each) => each.key === property.factKey)) continue;
    const nonpassive = section162Nonpassive(property);
    if (nonpassive === undefined) return "waiting";
    if (nonpassive) return unsupported(rentalGap(property));
  }
  return undefined;
}

export function line5b(info: Form8960FilingInfo): number | Unsupported | undefined {
  const activities = info.form4797Activities;
  if (activities === undefined || activities.waiting) return undefined;
  const rental = rentalSaleGap(activities, info.rentalProperties ?? []);
  if (rental !== undefined) return rental === "waiting" ? undefined : rental;
  const nonpassive = info.nonpassiveBusinessKeys ?? [];
  const excluded = activities.amounts.filter((each) => nonpassive.includes(each.key));
  const unread = activities.amounts.length === 0 && nonpassive.length > 0;
  if (excluded.length === 0 && !(unread && activities.totalGap)) return undefined;
  if (activities.totalGap) return unsupported(`Form 4797: ${activities.totalGap}`);
  if (info.capitalLossCarriedIn) return unsupported(CARRYOVER_GAP);
  return 0 - sum(...excluded.map((each) => each.total));
}

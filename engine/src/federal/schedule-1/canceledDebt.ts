/*
 * Schedule 1 line 8c, cancellation of debt: the taxable part of each
 * nonbusiness canceled debt, after the exclusions of Form 982 ("You must report
 * any taxable canceled debt as ordinary income on: Schedule 1 (Form 1040), line
 * 8c, if the debt is a nonbusiness debt", irs-pub-4681-2025::sec::general-rules::b03).
 * An excluded amount stays off the line: "You don't include any of the $5,000
 * canceled debt on Schedule 1 (Form 1040), line 8c" (price-reduced-after::b06).
 * The amount comes from federal/982/resolveInfo.ts, cents kept, rounded once.
 */

import { roundDollars } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";

export function line8c(_: unknown, info: Schedule1FilingInfo): number | Unsupported | undefined {
  if (info.canceledDebtGap) return unsupported(info.canceledDebtGap);
  if (info.canceledDebtWaits) return undefined;
  const amount = info.canceledDebtIncome ?? 0;
  return amount > 0 ? roundDollars(amount) : undefined;
}

/* Line 9 waits while line 8c waits for an answer about a canceled debt. */
export function canceledDebtHold(info: Schedule1FilingInfo): "waiting" | undefined {
  return info.canceledDebtWaits && !info.canceledDebtGap ? "waiting" : undefined;
}

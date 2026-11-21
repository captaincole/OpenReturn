/*
 * Schedule 1 line 14, moving expenses for members of the Armed Forces.
 * - With Form 3903: its line 5, "Enter the result here and on Schedule 1 (Form
 *   1040), line 14" (irs-3903-inst-2025::sec::line-5::b01), every form summed
 *   (irs-pub-3-2025::sec::how-to-report-moving-expenses::b01).
 * - Storage fees alone: "Do not file Form 3903 ... Instead, enter the storage
 *   fees on Schedule 1 (Form 1040), line 14, and check the box for storage fees
 *   next to line 14" (irs-3903-inst-2025::sec::line-1::b01; irs-1040-inst-2025::sec::line-14::b01).
 */

import { roundDollars } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";

const BOTH =
  "Storage fees alone and a Form 3903 on one return: the storage fees are not the only moving expense, so they belong on a Form 3903 for the earlier move (irs-3903-inst-2025::sec::line-1::b01), which the engine does not print.";

const form3903Files = (info: Schedule1FilingInfo) => info.mustFile?.["form-3903"]?.value === true;

export function line14(_: unknown, info: Schedule1FilingInfo): number | Unsupported | undefined {
  const storageFees = info.armedForcesStorageFees;
  if (storageFees !== undefined && form3903Files(info)) return unsupported(BOTH);
  if (storageFees !== undefined) return roundDollars(storageFees);
  if (!form3903Files(info)) return undefined;
  if (info.movingTotalsGap) return unsupported(info.movingTotalsGap);
  return info.movingExpenseDeduction;
}

export function storageFeesOnlyBox(_: unknown, info: Schedule1FilingInfo): true | undefined {
  return info.armedForcesStorageFees !== undefined && !form3903Files(info) ? true : undefined;
}

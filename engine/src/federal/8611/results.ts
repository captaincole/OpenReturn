import { sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8611Copy, Form8611FilingInfo } from "./filingInfo.js";

const LINE_14 = 14;

/* A copy's line 14: its gap, undefined while it waits, else the amount. */
function line14Of(copy: Form8611Copy): number | Unsupported | undefined {
  if (copy.gap && copy.gap.fromLine <= LINE_14) return unsupported(copy.gap.reason);
  if (copy.waitingOn && copy.waitingOn.length > 0) return undefined;
  return copy.recapture?.line14;
}

/*
 * Schedule 2 line 16: "Enter the amount from Form 8611, line 14"
 * (irs-1040-inst-2025::sec::line-16-3::b01); "If more than one Form 8611 is
 * filed, add the line 14 amounts from all forms" (irs-8611-form-2025::sec::face-page-1::b03;
 * ::line-14::b01). Blank when Form 8611 does not file or while a copy waits;
 * unsupported when any copy's line 14 is.
 */
export function recaptureTaxForSchedule2(
  info: Form8611FilingInfo,
): number | Unsupported | undefined {
  if (info.mustFile?.["form-8611"]?.value !== true) return undefined;
  const copies = info.form8611Copies ?? [];
  if (copies.length === 0) return undefined;
  const amounts = copies.map(line14Of);
  const gap = amounts.find((amount): amount is Unsupported => typeof amount === "object");
  if (gap) return gap;
  if (amounts.some((amount) => amount === undefined)) return undefined;
  return sum(...amounts);
}

/* Schedule 2 files for Form 8611 when a copy has a gap, waits, or has a line 14 above 0. */
export function form8611ReachesSchedule2(info: Form8611FilingInfo): boolean {
  if (info.mustFile?.["form-8611"]?.value !== true) return false;
  return (info.form8611Copies ?? []).some((copy) => {
    const amount = line14Of(copy);
    return amount === undefined || typeof amount === "object" || amount > 0;
  });
}

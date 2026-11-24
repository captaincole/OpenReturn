/*
 * Form 1040 line 38, "Estimated tax penalty": Form 2210 line 19 when the form
 * figures the penalty (box B, C or D). Otherwise the line stays blank and "the
 * IRS will figure any penalty ... and send you a bill"
 * (irs-2210-inst-2025::sec::the-irs-will-figure-the-penalty-for::b01).
 */

import { unsupported, type Unsupported } from "../../types.js";
import { form2210Outcome, type Form2210Info } from "./outcome.js";
import type { ReturnAccessor } from "./returnAmounts.js";

/* The penalty once settled (undefined: none on the return), "waiting", or the gap. */
export type PenaltyOnReturn = { penalty: number | undefined } | "waiting" | Unsupported;

export function penaltyOnReturn(form: ReturnAccessor, info: Form2210Info): PenaltyOnReturn {
  const outcome = form2210Outcome(form, info);
  if (outcome.kind === "not_filed") return { penalty: undefined };
  if (outcome.kind === "waiting") return "waiting";
  if (outcome.kind === "gap") return unsupported(outcome.reason);
  const line19 = outcome.result.figured?.line19;
  return { penalty: line19 !== undefined && line19 > 0 ? line19 : undefined };
}

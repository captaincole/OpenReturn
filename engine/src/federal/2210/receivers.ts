/*
 * Form 1040 line 38, "Estimated tax penalty": Form 2210 line 19 when the form
 * figures the penalty (box B, C or D), or Form 2210-F line 16 for a farmer or
 * fisher whose form files ("Enter here and on Form 1040 ... line 38";
 * irs-2210f-face-2025::sec::face-part-iii::b01). Otherwise the line stays blank
 * and "the IRS will figure any penalty ... and send you a bill"
 * (irs-2210-inst-2025::sec::the-irs-will-figure-the-penalty-for::b01;
 * irs-2210f-inst-2025::sec::the-irs-will-figure-the-penalty-for::b01).
 * The two forms never both file (2210-f/farmerTest.ts).
 */

import { unsupported, type Unsupported } from "../../types.js";
import type { Form2210FFilingInfo } from "../2210-f/filingInfo.js";
import { form2210FOutcome, type Form2210FOutcome } from "../2210-f/outcome.js";
import { form2210Outcome, type Form2210Info } from "./outcome.js";
import type { ReturnAccessor } from "./returnAmounts.js";

/* The penalty once settled (undefined: none on the return), "waiting", or the gap. */
export type PenaltyOnReturn = { penalty: number | undefined } | "waiting" | Unsupported;

/* Form 2210-F line 16, when a Part I box keeps the form on the return. */
function farmerPenalty(outcome: Exclude<Form2210FOutcome, { kind: "not_filed" }>): PenaltyOnReturn {
  if (outcome.kind === "waiting") return "waiting";
  if (outcome.kind === "gap") return unsupported(outcome.reason);
  const { boxA, boxB, penalty } = outcome.lines;
  const line16 = penalty?.line16;
  return { penalty: (boxA || boxB) && line16 !== undefined && line16 > 0 ? line16 : undefined };
}

export function penaltyOnReturn(
  form: ReturnAccessor,
  info: Form2210Info & Form2210FFilingInfo,
): PenaltyOnReturn {
  const farmer = form2210FOutcome(form, info);
  if (farmer.kind !== "not_filed") return farmerPenalty(farmer);
  const outcome = form2210Outcome(form, info);
  if (outcome.kind === "not_filed") return { penalty: undefined };
  if (outcome.kind === "waiting") return "waiting";
  if (outcome.kind === "gap") return unsupported(outcome.reason);
  const line19 = outcome.result.figured?.line19;
  return { penalty: line19 !== undefined && line19 > 0 ? line19 : undefined };
}

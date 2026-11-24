/*
 * Schedule 1 line 8p: the section 461(l) excess business loss adjustment,
 * "the amount of your excess business loss from Form 461, line 16"
 * (irs-1040-inst-2025::sec::line-8p::b01), entered "as a positive number"
 * when line 16 is less than zero (the form's line 16;
 * irs-461-inst-2025::sec::line-16::b01). Without Form 461 the line is blank.
 */

import { numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { formGap, type Info } from "../461/figures.js";
import { excessBusinessLossAdjustment } from "../461/lines.js";

type Read = Record<string, unknown>;

const LINE_16 = "form-461.0.line.16_excess_business_loss";

const form461Files = (info: Info) => info.mustFile?.["form-461"]?.value === true;

/* Line 8p: blank with no Form 461 or no excess; the gap while Form 461 cannot be figured. */
export function line8p(form: Read, info: Info): number | Unsupported | undefined {
  if (!form461Files(info)) return undefined;
  const gap = formGap(info);
  if (gap) return unsupported(gap);
  const line16 = numberOrBlank(form[LINE_16]);
  return line16 === undefined ? undefined : excessBusinessLossAdjustment(line16);
}

/*
 * Lines 9 and 10 read line 8p: while Form 461 files and its line 16 waits,
 * they wait, and while it is a gap they show it. A sum() would count the
 * blank line 8p as 0 and give a total that looks complete. Undefined when
 * line 8p is settled.
 */
export function line8pHold(form: Read, info: Info): Unsupported | "waiting" | undefined {
  if (!form461Files(info)) return undefined;
  const gap = formGap(info);
  if (gap) return unsupported(gap);
  return numberOrBlank(form[LINE_16]) === undefined ? "waiting" : undefined;
}

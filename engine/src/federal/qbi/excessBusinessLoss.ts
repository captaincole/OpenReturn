/*
 * The QBI forms and Form 461. "Losses or deductions from a qualified trade or
 * business that are suspended by other provisions ... are not qualified losses
 * or deductions and, therefore, are not included in your QBI for the year.
 * Such Code provisions include ... 461(l)"
 * (irs-8995-inst-2025::sec::determining-your-qualified-business::b02). An
 * excess business loss (Form 461 line 16 below 0) is such a loss, but no rule
 * in the instructions says which business's loss it is when more than one
 * business has a loss. The engine does not choose: a QBI line that adds a
 * losing business's QBI is a gap then (federal/461/QUESTIONS.md). With no
 * losing QBI business, the excess holds back no QBI loss, and nothing changes.
 */

import { numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { formGap } from "../461/figures.js";
import type { QbiBusiness, QbiFilingInfo } from "./filingInfo.js";
import { qbiOf } from "./lines.js";

type Read = Record<string, unknown>;
type Info = Pick<
  QbiFilingInfo,
  "qbiScheduleSEFiled" | "taxpayerSSN" | "spouseSSN" | "rentalProperties" | "mustFile" | "form461"
>;

export const EXCESS_BUSINESS_LOSS_QBI_GAP =
  "Form 461 line 16 shows an excess business loss, which is not QBI this year (irs-8995-inst-2025::sec::determining-your-qualified-business::b02); which business's loss it holds back is not modeled.";

/*
 * The hold on a QBI line that adds business QBI: the gap, "waiting" while
 * Form 461 line 16 or a business's QBI is not known yet, or undefined when
 * Form 461 does not change QBI (it does not file, there is no excess, or no
 * QBI business has a loss).
 */
export function excessBusinessLossHold(
  form: Read,
  info: Info,
  businesses: readonly QbiBusiness[] | undefined,
): Unsupported | "waiting" | undefined {
  if (info.mustFile?.["form-461"]?.value !== true) return undefined;
  const amounts = (businesses ?? []).map((business) => qbiOf(form, info, business));
  if (amounts.includes(undefined)) return "waiting";
  if (!amounts.some((amount) => (amount ?? 0) < 0)) return undefined;
  const gap = formGap(info);
  if (gap) return unsupported(gap);
  const line16 = numberOrBlank(form["form-461.0.line.16_excess_business_loss"]);
  if (line16 === undefined) return "waiting";
  return line16 < 0 ? unsupported(EXCESS_BUSINESS_LOSS_QBI_GAP) : undefined;
}

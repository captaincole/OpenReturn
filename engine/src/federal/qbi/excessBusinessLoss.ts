/*
 * The QBI forms and Form 461. "Losses or deductions from a qualified trade or
 * business that are suspended by other provisions ... are not qualified losses
 * or deductions and, therefore, are not included in your QBI for the year.
 * Such Code provisions include ... 461(l)"
 * (irs-8995-inst-2025::sec::determining-your-qualified-business::b02). "If a
 * loss or deduction is partially suspended, only the portion of the allowed
 * loss or deduction attributable to QBI must be considered": the allowed loss
 * times the part of the total loss that is QBI (::b03).
 *
 * An excess business loss (Form 461 line 16 below 0) holds back part of the
 * business losses on Form 461. With exactly one business with a loss on the
 * form, the excess is that business's: its allowed loss is its loss less the
 * excess, and its QBI is its QBI times the allowed part of its loss (::b03).
 * With two or more, no rule in the instructions says which business's loss
 * the excess is, so a QBI line that adds a losing business is a gap
 * (federal/461/QUESTIONS.md item 10). With no losing QBI business, the excess
 * holds back no QBI loss, and nothing changes.
 */

import { numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { formGap } from "../461/figures.js";
import type { QbiBusiness, QbiFilingInfo } from "./filingInfo.js";
import { qbiBeforeExcessBusinessLoss } from "./lines.js";

type Read = Record<string, unknown>;
type Info = Pick<
  QbiFilingInfo,
  "qbiScheduleSEFiled" | "taxpayerSSN" | "spouseSSN" | "rentalProperties" | "mustFile" | "form461"
>;

export const EXCESS_BUSINESS_LOSS_QBI_GAP =
  "Form 461 line 16 shows an excess business loss, which is not QBI this year (irs-8995-inst-2025::sec::determining-your-qualified-business::b02), and more than one business has a loss on Form 461: which business's loss it holds back is not modeled.";

const LINE_16 = "form-461.0.line.16_excess_business_loss";

/* The one business the excess belongs to, and the part of its loss that is allowed. */
interface AllowedPart {
  factKey: string;
  allowed: number;
}

/*
 * The one losing business, when it is the only business with a loss on Form
 * 461 (lines 2, 5 and 8) and a QBI business. Its loss is the one Form 461
 * counts: Schedule C line 31, the K-1's business items, or a rental's allowed
 * loss (its QBI). Undefined when the rule does not settle it.
 */
function oneLosingBusiness(
  form: Read,
  info: Info,
  losers: readonly QbiBusiness[],
  excess: number,
): AllowedPart | undefined {
  const onForm461 = info.form461?.businessLosses;
  if (losers.length !== 1 || onForm461?.length !== 1) return undefined;
  const [business] = losers;
  if (onForm461[0].key !== business.factKey) return undefined;
  const qbi = qbiBeforeExcessBusinessLoss(form, info, business) ?? 0;
  const loss = onForm461[0].loss ?? 0 - qbi;
  if (loss <= 0 || excess > loss) return undefined;
  return { factKey: business.factKey, allowed: (loss - excess) / loss };
}

/*
 * What Form 461 does to the QBI of the businesses: undefined when nothing
 * changes, "waiting" while Form 461 line 16 or a business's QBI is not known,
 * the one business's allowed part, or the gap.
 */
function excessBusinessLossEffect(
  form: Read,
  info: Info,
  businesses: readonly QbiBusiness[] | undefined,
): AllowedPart | Unsupported | "waiting" | undefined {
  if (info.mustFile?.["form-461"]?.value !== true) return undefined;
  const all = businesses ?? [];
  const amounts = all.map((business) => qbiBeforeExcessBusinessLoss(form, info, business));
  if (amounts.includes(undefined)) return "waiting";
  const losers = all.filter((_, index) => (amounts[index] ?? 0) < 0);
  if (losers.length === 0) return undefined;
  const gap = formGap(info);
  if (gap) return unsupported(gap);
  const line16 = numberOrBlank(form[LINE_16]);
  if (line16 === undefined) return "waiting";
  if (line16 >= 0) return undefined;
  return (
    oneLosingBusiness(form, info, losers, 0 - line16) ?? unsupported(EXCESS_BUSINESS_LOSS_QBI_GAP)
  );
}

const isAllowedPart = (effect: unknown): effect is AllowedPart =>
  typeof effect === "object" && effect !== null && "allowed" in effect;

/*
 * The hold on a QBI line that adds business QBI: the gap, "waiting", or
 * undefined when the line can be figured (qbiOf then gives each business's QBI).
 */
export function excessBusinessLossHold(
  form: Read,
  info: Info,
  businesses: readonly QbiBusiness[] | undefined,
): Unsupported | "waiting" | undefined {
  const effect = excessBusinessLossEffect(form, info, businesses);
  return isAllowedPart(effect) ? undefined : effect;
}

/*
 * One business's QBI this year, unrounded: its QBI before Form 461, times the
 * allowed part of its loss when the excess business loss is its loss (::b03).
 */
export function qbiOf(
  form: Read,
  info: Info & Pick<QbiFilingInfo, "qbiBusinesses">,
  business: QbiBusiness,
): number | undefined {
  const qbi = qbiBeforeExcessBusinessLoss(form, info, business);
  const effect = excessBusinessLossEffect(form, info, info.qbiBusinesses);
  if (qbi === undefined || !isAllowedPart(effect) || effect.factKey !== business.factKey) {
    return qbi;
  }
  return qbi * effect.allowed;
}

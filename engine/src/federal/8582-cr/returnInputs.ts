/*
 * What Form 8582-CR takes from the rest of the return: the tax attributable to
 * an amount of income (lines 6, 15, 27 and 35), net passive income (line 6),
 * modified AGI (lines 10 and 22) and Form 8582 line 9 (lines 13, 25 and line
 * 35 D). Every read is by full field id, so Form 3800 figures the same numbers
 * with its own accessor. "waiting" means a line it reads has no value yet.
 */

import { lookupTax } from "../../data/taxTable.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { FilingStatus } from "../../values.js";
import { computeQdcg } from "../../worksheets/qdcg.js";
import { qdcgInputsFromReturn, scheduleDWorksheetTax } from "../1040/qdcgInputs.js";
import { isGap, type Cell } from "../3800/cells.js";
import { modifiedAgi } from "../8582/magi.js";
import { magiWithK1Gap } from "../8582/magiGap.js";
import { releasedOnDisposition } from "../passThrough/passiveActivity.js";
import type { PassiveLimitInfo } from "./filingInfo.js";

export type Accessor = { readonly [fieldId: string]: unknown };
export type Waiting = "waiting";

const files = (info: PassiveLimitInfo, formId: string) => info.mustFile?.[formId]?.value === true;

const OTHER_TAX_METHOD_GAP =
  "Form 1040 line 16 is figured on Form 8615 or with the Foreign Earned Income Tax Worksheet (Form 2555), and the tax attributable to an amount (Form 8582-CR lines 6, 15, 27 and 35) must use the method the return used (irs-8582cr-inst-2025::sec::line-6::b01); the engine does not refigure that method.";
const NO_FORM_8582_GAP =
  "The return has a passive activity that Form 8582 does not take (no deductions), so its net passive income (Form 8582-CR line 6, irs-8582cr-inst-2025::sec::line-6::b01) is not figured.";
const DISPOSITION_GAP =
  "An entire disposition of a passive activity: net passive income is reduced by its overall loss before line 6 (irs-8582cr-inst-2025::sec::line-6::b01), and the engine does not figure that loss apart from Schedule E.";
const MAGI_K1_GAP =
  "Modified adjusted gross income (Form 8582-CR lines 10 and 22) is built as Form 8582 line 6 is, which is not modeled for a return with a Schedule K-1 (federal/8582/magiGap.ts).";
const ADOPTION_GAP =
  "Modified adjusted gross income adds back excluded employer adoption benefits (irs-8582cr-inst-2025::sec::line-10::b01), which need Form 8839.";

/* Tax on an amount of taxable income by the method of Form 1040 line 16 (line-6::b01, the * note). */
function taxOnIncome(form: Accessor, taxable: number, status: FilingStatus): number {
  const qualifiedDividends = numberOrBlank(form["form-1040.line.3a"]) ?? 0;
  try {
    const worksheet = scheduleDWorksheetTax(form, taxable, qualifiedDividends, status);
    return (
      worksheet ?? computeQdcg(qdcgInputsFromReturn(form, taxable, qualifiedDividends, status)).tax
    );
  } catch {
    const lookup = lookupTax("federal-2025", taxable, status);
    return lookup.ok ? lookup.tax : 0;
  }
}

/*
 * The tax attributable to an amount: "B. Tax on line A" less "E. Tax on line
 * D", where line A is taxable income and line D is taxable income less the
 * amount (line-15::b02, line-27::b01, line-35::b01). Taxable income less the
 * amount is not below zero. "It isn't necessary to refigure items that are
 * based on a percentage of adjusted gross income" (line-15::b01), so only the
 * taxable income changes; the qualified dividends and net capital gain stay as
 * the return has them (QUESTIONS.md).
 */
export function taxAttributableOf(
  form: Accessor,
  info: PassiveLimitInfo,
): ((amount: number) => Cell) | Unsupported | Waiting {
  const status = info.filingStatus;
  if (status === undefined) return "waiting";
  if (files(info, "form-8615") || files(info, "form-2555"))
    return unsupported(OTHER_TAX_METHOD_GAP);
  const taxable = numberOrBlank(form["form-1040.line.15"]);
  if (taxable === undefined) return "waiting";
  const lineB = taxOnIncome(form, taxable, status);
  return (amount) =>
    amount <= 0 ? 0 : roundDollars(lineB - taxOnIncome(form, atLeast(0, taxable - amount), status));
}

/*
 * Net passive income, for line 6: Form 8582 line 3 when it shows income
 * (part-i-passive-activity-credits::b01, line-6::b01: "If you had a net
 * passive activity loss, enter -0- on line 6"). Without Form 8582 ("you
 * didn't complete Form 8582 because you had net passive income") it is the net
 * income of the K-1 passive activities, which then have no loss; a passive
 * rental property with no deduction is not figured.
 */
export function netPassiveIncomeOf(form: Accessor, info: PassiveLimitInfo): Cell | Waiting {
  const k1 = info.passiveK1Activities;
  if (k1?.gap) return unsupported(k1.gap);
  let income: number;
  if (!files(info, "form-8582")) {
    if ((info.rentalProperties ?? []).some((property) => property.passive)) {
      return unsupported(NO_FORM_8582_GAP);
    }
    if (k1 !== undefined && !k1.settled) return "waiting";
    income = roundDollars(sum(...(k1?.rows ?? []).map((row) => row.netIncome)));
  } else {
    const line3 = numberOrBlank(form["form-8582.0.line.3_combined"]);
    if (line3 === undefined) return "waiting";
    income = atLeast(0, line3);
  }
  const disposed = (info.passThroughEntities ?? []).some((entity) => releasedOnDisposition(entity));
  return income > 0 && disposed ? unsupported(DISPOSITION_GAP) : income;
}

/*
 * Form 8582 line 9, "the amount, if any" (lines 13 and 25): Form 8582 fills
 * it only when its Part II applies, a loss on lines 3 and 1d, and not for a
 * separate return living with the spouse (irs-8582-inst-2025::sec::part-ii-special-allowance-for-rental::b01).
 */
export function form8582Line9Of(form: Accessor, info: PassiveLimitInfo): Cell | Waiting {
  if (!files(info, "form-8582")) return undefined;
  const k1Gap = info.passiveK1Activities?.gap ?? magiWithK1Gap((id) => form[id], info);
  if (k1Gap) return typeof k1Gap === "string" ? unsupported(k1Gap) : k1Gap;
  const line3 = numberOrBlank(form["form-8582.0.line.3_combined"]);
  if (line3 === undefined) return "waiting";
  const line1d = numberOrBlank(form["form-8582.0.line.1d_rental_combined"]) ?? 0;
  if (line3 >= 0 || line1d >= 0) return undefined;
  const separate = info.filingStatus === "married_filing_separately";
  if (separate && info.livedApartFromSpouseAllYear !== true) return undefined;
  const line9 = numberOrBlank(form["form-8582.0.line.9_special_allowance"]);
  if (line9 === undefined) return "waiting";
  return line9 === 0 ? undefined : line9;
}

/*
 * Lines 10 and 22: Form 8582's modified AGI, which leaves out every passive
 * amount, plus the net passive income of line 6's source (Form 8582 line 3
 * when it shows income). With no K-1 (a K-1 is a gap here), Form 8582 line 3
 * adds the passive amounts that AGI counts and Form 8582's MAGI leaves out:
 * each passive property's Schedule E line 21, and its prior-year loss, which
 * net passive income allows in full.
 *
 * DECISION (2026-11-26, by the author): net passive income counts in modified AGI on lines 10 and 22.
 * - Form 8582-CR instructions, line 10 (line 22 uses the same amount): "combine
 *   all the amounts used to figure adjusted gross income, except don't take
 *   into account: • Any passive activity loss as defined in section 469(d)(1)"
 *   (irs-8582cr-inst-2025::sec::line-10::b01). With net passive income there
 *   is no passive activity loss, so the income stays in.
 * - Pub. 925, the special allowance phaseout: modified AGI is "your adjusted
 *   gross income figured without the following ... • Passive activity income
 *   or loss included on Form 8582" (irs-pub-925-2025::sec::rental-activities::b10),
 *   which Form 8582's own MAGI follows (federal/8582/magi.ts).
 * The engine follows the Form 8582-CR instruction: a form's own instructions
 * decide how that form is filled, and Pub. 925 describes the loss allowance
 * of Form 8582, where MAGI matters only when line 3 is a loss.
 */
export function magiOf(form: Accessor, info: PassiveLimitInfo): Cell | Waiting {
  if ((info.passThroughEntities ?? []).length > 0) return unsupported(MAGI_K1_GAP);
  if ((info.adoptionBenefits ?? 0) > 0) return unsupported(ADOPTION_GAP);
  const withoutPassive = modifiedAgi(form, info);
  if (withoutPassive === undefined) return "waiting";
  const netPassiveIncome = netPassiveIncomeOf(form, info);
  if (netPassiveIncome === "waiting" || isGap(netPassiveIncome)) return netPassiveIncome;
  return withoutPassive + (netPassiveIncome ?? 0);
}

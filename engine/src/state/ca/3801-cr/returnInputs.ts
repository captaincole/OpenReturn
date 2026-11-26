/*
 * What FTB 3801-CR takes from the rest of the return: the tax attributable to
 * an amount of California taxable income (lines 6 and 15), California net
 * passive income (line 6), federal modified AGI (line 10) and FTB 3801 line 9
 * (line 13). Every read is by full field id, so Form 540 and Schedule P (540)
 * read the same numbers. "waiting" means a line it reads has no value yet.
 */

import { isGap, type Cell } from "../../../federal/3800/cells.js";
import { magiOf, type Accessor, type Waiting } from "../../../federal/8582-cr/returnInputs.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { caTaxOnTaxableIncome } from "../540/tax.js";
import type { Form3801CRInfo } from "./filingInfo.js";

const files = (info: Form3801CRInfo, formId: string) => info.mustFile?.[formId]?.value === true;

export const NONRESIDENT_GAP =
  "FTB 3801-CR on Form 540NR: a nonresident or part-year resident figures passive items from California sources only and prorates carried amounts (ca-3801cr-inst-2025::sec::nonresident::b01, ::part-year-resident::b01), which the engine does not model.";
const CHILD_TAX_GAP =
  "Form 540 line 31 is figured on FTB 3800 (a child's tax at the parent's rate), and the tax attributable to an amount (FTB 3801-CR lines 6 and 15) must use that method; the engine does not refigure it.";

/* Form 540 line 19, the California taxable income. */
const TAXABLE_INCOME = "form-540.line.19_taxable_income";
/* FTB 3801 line 3, the combined California passive income or loss. */
const FTB_3801_LINE_3 = "form-3801.0.line.3_total_passive_income_or_loss";
/* FTB 3801 line 9, the special allowance used for losses. */
const FTB_3801_LINE_9 = "form-3801.0.line.9_special_allowance";

/*
 * The tax attributable to an amount: "B. Tax on line A" less "E. Tax on line
 * D", where line A is taxable income and line D is taxable income less the
 * amount, not below zero (ca-3801cr-inst-2025::sec::line-6::b01, ::line-15::b01).
 * The tax is Form 540 line 31's Tax Table or Tax Rate Schedule. "It is not
 * necessary to refigure items that are based on a percentage of adjusted gross
 * income", so only taxable income changes.
 */
export function caTaxAttributableOf(
  form: Accessor,
  info: Form3801CRInfo,
): ((amount: number) => Cell) | Unsupported | Waiting {
  if (files(info, "form-540nr") || !files(info, "form-540")) return unsupported(NONRESIDENT_GAP);
  if (files(info, "form-3800-ca")) return unsupported(CHILD_TAX_GAP);
  const status = info.filingStatus;
  const taxable = numberOrBlank(form[TAXABLE_INCOME]);
  if (status === undefined || taxable === undefined) return "waiting";
  const lineB = caTaxOnTaxableIncome(taxable, status);
  if (lineB === undefined) return "waiting";
  return (amount) => {
    if (amount <= 0) return 0;
    const lineE = caTaxOnTaxableIncome(atLeast(0, taxable - amount), status);
    return lineE === undefined ? undefined : roundDollars(lineB - lineE);
  };
}

/*
 * California net passive income, for line 6: "If form FTB 3801, line 3, shows
 * net income or if you did not complete form FTB 3801 because you had net
 * passive income ... If you had a net passive activity loss, enter -0- on line
 * 6" (ca-3801cr-inst-2025::sec::line-6::b01). Without FTB 3801 it is the
 * California net income of the passive Schedule E activities (3801/formScope.ts),
 * which then have no loss. FTB 3801's gaps (a passive K-1, an entire
 * disposition, a passive business) pass through.
 */
export function caNetPassiveIncomeOf(form: Accessor, info: Form3801CRInfo): Cell | Waiting {
  if (files(info, "form-3801")) {
    const line3 = form[FTB_3801_LINE_3];
    if (isGap(line3)) return line3;
    const amount = numberOrBlank(line3);
    return amount === undefined ? "waiting" : atLeast(0, amount);
  }
  const figures = info.form3801Figures;
  if (figures?.gap) return unsupported(figures.gap);
  if (figures === undefined || figures.activities === undefined) return "waiting";
  const passive = figures.activities.filter((activity) => activity.passive);
  return atLeast(0, roundDollars(sum(...passive.map((activity) => activity.californiaNet))));
}

/*
 * Line 13: "Enter the amount, if any, from line 9 of form FTB 3801" (the
 * face). FTB 3801 fills line 9 only when line 3 shows a loss
 * (ca-3801-inst-2025::sec::part-ii::b01), so line 13 is blank with no FTB
 * 3801, with income on its line 3, or with a line 9 of 0.
 */
export function ftb3801Line9Of(form: Accessor, info: Form3801CRInfo): Cell | Waiting {
  if (!files(info, "form-3801")) return undefined;
  const line3 = form[FTB_3801_LINE_3];
  if (isGap(line3)) return line3;
  const combined = numberOrBlank(line3);
  if (combined === undefined) return "waiting";
  if (combined >= 0) return undefined;
  const line9 = form[FTB_3801_LINE_9];
  if (isGap(line9)) return line9;
  const amount = numberOrBlank(line9);
  if (amount === undefined) return "waiting";
  return amount === 0 ? undefined : amount;
}

/*
 * Line 10: "Enter your federal modified adjusted gross income from federal
 * Form 8582-CR, line 10" (ca-3801cr-inst-2025::sec::line-10::b01), built as
 * that line is (federal/8582-cr/returnInputs.ts), also when the federal form
 * does not file. The military pay subtraction is for a servicemember
 * domiciled outside California, who files Form 540NR (NONRESIDENT_GAP).
 */
export const federalMagiOf = (form: Accessor, info: Form3801CRInfo): Cell | Waiting =>
  magiOf(form, info);

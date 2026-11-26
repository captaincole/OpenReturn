import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form965AFilingInfo } from "./filingInfo.js";
import { resolve965AInfo } from "./resolveInfo.js";

type Form965AInfo = Pick<Form965AFilingInfo, "form965A" | "form965AGap">;

/*
 * DECISION (2026-11-26, by the author): Schedule 2 line 20 takes Form 965-A
 * Part II Totals, column (k), the payments of every line for the reporting
 * year. The Form 965-A instructions name one line: "Individuals: For tax year
 * 2020, enter the amount from Form 965-A, Part II, column (k), line 4, on
 * Schedule 2 (Form 1040), line 9" (irs-965a-inst-2025::sec::line-1::b05). The
 * 2025 Schedule 2 names the form: "Section 965 net tax liability installment
 * from Form 965-A" (line 20), and column (k) has a Totals row. The engine
 * follows the Totals: the sentence was written for the 2020 line and would
 * leave out the installments of every other year (docs/rule-decisions.md).
 *
 * The amount is not added into line 21: "Add lines 4, 7 through 16, 18, and
 * 19. These are your total other taxes" (the 2025 Schedule 2). "none" when
 * Form 965-A does not file.
 */
export function line20From965A(info: Form965AInfo): number | Unsupported | undefined | "none" {
  if (info.form965AGap) return unsupported(info.form965AGap);
  if (info.form965A === undefined) return "none";
  const paid = info.form965A.totals.paidThisYear;
  return typeof paid === "string" ? unsupported(paid) : paid;
}

/* Whether Schedule 2 files for line 20: a payment for the reporting year, or a gap that hides one. */
export function form965AReachesSchedule2(inputs: ResolverInputs): boolean {
  const info = resolve965AInfo(inputs);
  if (info.form965AGap) return true;
  const paid = info.form965A?.totals.paidThisYear;
  return typeof paid === "string" || (typeof paid === "number" && paid > 0);
}

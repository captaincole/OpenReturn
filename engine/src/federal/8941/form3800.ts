/*
 * Form 8941's credit as a Form 3800 source: "All others, stop here and report
 * this amount on Form 3800, Part III, line 4h"
 * (irs-8941-face-2025::sec::face-page-1::b04). Form 3800 takes line 12 here, one
 * source for the business or farm, and the K-1 credits of line 15 as its own
 * K-1 sources (3800/sources.ts, with each entity's EIN and passive answer), so
 * its line 4h adds to Form 8941 line 16.
 */

import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { healthCreditFiguresOf, resolve8941Info } from "./resolveInfo.js";

/* Part III line 4h, Form 8941 (3800/rows.ts). */
export const FORM_3800_LINE = "4h";

/*
 * A credit of a business the owner does not materially participate in is a
 * passive activity credit (column (d)), which Form 8582-CR limits by the tax
 * on net passive income. The engine does not figure a passive Schedule C
 * business or farm, so that limit is a gap.
 */
const PASSIVE_ACTIVITY_GAP =
  "The small employer health credit is from a business or farm the owner did not materially participate in: a passive activity credit that Form 8582-CR limits by the tax on net passive income, and the engine does not figure a passive business or farm.";

/* One source that carries the gap, so line 4h and every total that adds it stay unsupported. */
function gapSource(key: string, reason: string): CreditSource {
  return { credit: { line: FORM_3800_LINE, key, amount: unsupported(reason), passive: false } };
}

/*
 * The decision decisions.scope.must_file_8941 = false takes Form 8941 off the
 * return, but the premiums deduction is reduced from the fact alone
 * (facts/kinds/activitiesOnReturn.ts and farm.ts read no decision). The
 * deduction goes down "by the amount of any credit ... allowed"
 * (irs-8941-inst-2025::sec::premium-deduction-reduced::b01): with no form,
 * nothing is claimed and nothing reduces the deduction. Until the two agree,
 * line 4h is a gap, so the return never loses the deduction and the credit together.
 */
const DECISION_CONFLICT_GAP = (key: string) =>
  `The decision decisions.scope.must_file_8941 is false, but the small employer health credit fact ${key} claims the credit, and the premiums deduction is reduced by it (irs-8941-inst-2025::sec::premium-deduction-reduced::b01). To not claim the credit, remove the fact; to claim it, remove the decision.`;

/*
 * The line 4h source of the taxpayer's own employees while Form 8941 files,
 * and the answer it waits on: the activity's material participation (Schedule
 * C line G, Schedule F line E), which decides column (d) or (e).
 */
export function smallEmployerHealthSourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const figures = healthCreditFiguresOf(inputs);
  const fact = figures.fact;
  if (fact === undefined || !figures.claimsCredit) return { sources: [], missing: [] };
  const credit = figures.lines?.line12 ?? 0;
  if (resolve8941Info(inputs).mustFile?.["form-8941"]?.value !== true) {
    const conflict = figures.gap === undefined && credit > 0;
    return {
      sources: conflict ? [gapSource(fact.key, DECISION_CONFLICT_GAP(fact.key))] : [],
      missing: [],
    };
  }
  if (figures.gap !== undefined)
    return { sources: [gapSource(fact.key, figures.gap)], missing: [] };
  if (credit <= 0) return { sources: [], missing: [] };
  const participated = figures.activity?.materiallyParticipated;
  if (participated === undefined) return { sources: [], missing: [fact.value.activityKey] };
  if (participated === false)
    return { sources: [gapSource(fact.key, PASSIVE_ACTIVITY_GAP)], missing: [] };
  return {
    sources: [{ credit: { line: FORM_3800_LINE, key: fact.key, amount: credit, passive: false } }],
    missing: [],
  };
}

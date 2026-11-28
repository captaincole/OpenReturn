/*
 * Form 8820's credit as a Form 3800 source: "All others, report this amount on
 * Form 3800, Part III, line 1h" (irs-8820-form-2025::sec::face-part-i::b01).
 * Form 3800 takes line 2c here, one source for the business, and the K-1
 * credits of line 3 as its own K-1 sources (3800/sources.ts, with each
 * entity's EIN and passive answer), so its line 1h adds to Form 8820 line 4.
 */

import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { orphanDrugFiguresOf, resolve8820Info } from "./resolveInfo.js";

/* Part III line 1h, Form 8820 (3800/rows.ts). */
export const FORM_3800_LINE = "1h";

/*
 * A credit of a business the owner does not materially participate in is a
 * passive activity credit (column (d)), which Form 8582-CR limits by the tax
 * on net passive income. The engine does not figure a passive Schedule C
 * business (its line 31 stays blank, schedule-c/lines.ts), so that limit is a gap.
 */
const PASSIVE_BUSINESS_GAP =
  "The orphan drug credit is from a Schedule C business the owner did not materially participate in: a passive activity credit that Form 8582-CR limits by the tax on net passive income, and the engine does not figure a passive Schedule C business.";

/* One source that carries the gap, so line 1h and every total that adds it stay unsupported. */
function gapSource(key: string, reason: string): CreditSource {
  return { credit: { line: FORM_3800_LINE, key, amount: unsupported(reason), passive: false } };
}

/*
 * The decision decisions.scope.must_file_8820 = false takes Form 8820 off the
 * return, but the Schedule C expenses are reduced from the orphan drug credit
 * fact alone (facts/kinds/activitiesOnReturn.ts reads no decision). The
 * deduction goes down "by the amount of the credit"
 * (irs-8820-form-2025::sec::line-2a::b02): with no form, nothing is claimed
 * and nothing reduces the deduction. Until the two agree, line 1h is a gap, so
 * the return never loses the deduction and the credit together.
 */
const DECISION_CONFLICT_GAP = (key: string) =>
  `The decision decisions.scope.must_file_8820 is false, but the orphan drug credit fact ${key} claims the credit, and the business's Schedule C expenses are reduced by it (irs-8820-form-2025::sec::line-2a::b02). To not claim the credit, remove the fact; to claim it, remove the decision.`;

/*
 * The line 1h source of the taxpayer's own business while Form 8820 files, and
 * the answers it waits on: lines 1 to 2c themselves, or the business's line G
 * (materially participated), which decides column (d) or (e).
 */
export function orphanDrugCreditSourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const figures = orphanDrugFiguresOf(inputs);
  const fact = figures.fact;
  if (fact === undefined) return { sources: [], missing: [] };
  if (resolve8820Info(inputs).mustFile?.["form-8820"]?.value !== true) {
    const conflict = figures.reduction !== undefined;
    return {
      sources: conflict ? [gapSource(fact.key, DECISION_CONFLICT_GAP(fact.key))] : [],
      missing: [],
    };
  }
  if (figures.gap !== undefined)
    return { sources: [gapSource(fact.key, figures.gap)], missing: [] };
  if (figures.lines === undefined) return { sources: [], missing: figures.missing };
  const participated = figures.business?.materiallyParticipated;
  if (participated === undefined) return { sources: [], missing: [fact.value.businessKey] };
  if (figures.lines.line2c <= 0) return { sources: [], missing: [] };
  if (participated === false)
    return { sources: [gapSource(fact.key, PASSIVE_BUSINESS_GAP)], missing: [] };
  const amount = figures.lines.line2c;
  return {
    sources: [{ credit: { line: FORM_3800_LINE, key: fact.key, amount, passive: false } }],
    missing: [],
  };
}

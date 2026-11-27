/*
 * Form 8882's own credit as a Form 3800 source: "All others, stop here and
 * report this amount on Form 3800, Part III, line 1k"
 * (irs-8882-form-2025::sec::face-page-1::b01). Line 7 is lines 2 and 4 (the
 * taxpayer's own expenditures) plus line 5 (the pass-through entities), up to
 * $150,000. The pass-through credits already are Form 3800 sources of their
 * own (3800/sources.ts), with the entity's EIN and passive answer, so this
 * adds lines 2 and 4 only. Form 3800 limits line 1k to $150,000 and allocates
 * the limit pro rata among the sources (3800/currentCredits.ts), so its line
 * 1k equals Form 8882 line 7.
 */

import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { CREDIT_LIMIT, line6Of, ownCreditOf } from "./lines.js";
import {
  FORM_3800_LINE,
  childcareFiguresOf,
  passThroughCreditsOf,
  resolve8882Info,
} from "./resolveInfo.js";

/*
 * A business the owner does not materially participate in gives a passive
 * activity credit (column (d), irs-3800-inst-2025::sec::transferees-of-eligible-credits-under-section::b05),
 * which Form 8582-CR limits; the engine does not figure a passive Schedule C
 * business (schedule-c/lines.ts), as for Form 8846.
 */
const PASSIVE_BUSINESS_GAP =
  "The childcare credit is from a Schedule C business the owner did not materially participate in: a passive activity credit that Form 8582-CR limits by the tax on net passive income, and the engine does not figure a passive Schedule C business.";

/*
 * With line 5 and line 6 over $150,000, the taxpayer's part of line 7 is the
 * limit allocated pro rata, and the deductions and basis come down by that
 * part only ("For credits entered on line 5, only the pass-through entity is
 * required to make this reduction", irs-8882-form-2025::sec::form-8882-rev-12-2017-page-2::b01).
 * The facts layer that lowers the deductions does not read the K-1s, so it
 * took off the whole own credit.
 */
const LIMIT_WITH_K1_GAP =
  "Line 6 is more than $150,000 and holds a pass-through credit (line 5): the taxpayer's own part of line 7 is the limit allocated pro rata, and the engine lowers the business's deductions and basis by the whole own credit, before the K-1s.";

const STATED_TWICE_GAP =
  "A childcare credit is stated as a Form 3800 line 1k amount with no pass-through entity, and Form 8882 figures one from the expenditure facts: the engine cannot tell whether they are the same credit.";

/*
 * The decision decisions.scope.must_file_8882 = false takes Form 8882 off the
 * return, but the business's deductions are reduced from the expenditure
 * facts alone (facts/kinds/activitiesOnReturn.ts reads no decision). Until the
 * two agree, line 1k is a gap, so the return never loses the deduction and the
 * credit together.
 */
const DECISION_CONFLICT_GAP = (key: string) =>
  `The decision decisions.scope.must_file_8882 is false, but the childcare expenditure fact ${key} claims the credit, and the business's deductions are reduced by it (irs-8882-form-2025::sec::form-8882-rev-12-2017-page-2::b01). To not claim the credit, remove the expenditure facts; to claim it, remove the decision.`;

function gapSource(key: string, reason: string): CreditSource {
  return { credit: { line: FORM_3800_LINE, key, amount: unsupported(reason), passive: false } };
}

function conflictSources(inputs: ResolverInputs): CreditSource[] {
  const figures = childcareFiguresOf(inputs);
  const first = figures.factKeys[0];
  if (figures.lines === undefined || first === undefined) return [];
  return ownCreditOf(figures.lines) > 0 ? [gapSource(first, DECISION_CONFLICT_GAP(first))] : [];
}

/* Why the own credit cannot be claimed as figured; undefined when it can. */
function ownSourceGap(inputs: ResolverInputs, own: number): string | undefined {
  const figures = childcareFiguresOf(inputs);
  const passThrough = passThroughCreditsOf(inputs);
  const line5 = passThrough !== undefined && "amount" in passThrough ? passThrough.amount : 0;
  if (line5 > 0 && figures.lines && line6Of(figures.lines, line5) > CREDIT_LIMIT) {
    return LIMIT_WITH_K1_GAP;
  }
  const statedTwice = getGeneralBusinessCreditFacts(inputs.facts).some(
    ({ value }) => value.line === FORM_3800_LINE && value.passThroughEin === undefined,
  );
  return statedTwice && own > 0 ? STATED_TWICE_GAP : undefined;
}

/*
 * The line 1k source of the taxpayer's own businesses while Form 8882 files,
 * and the answers it waits on: each business's line G (materially
 * participated), which decides column (d) or (e).
 */
export function childcareCreditSourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  if (resolve8882Info(inputs).mustFile?.["form-8882"]?.value !== true) {
    return { sources: conflictSources(inputs), missing: [] };
  }
  const figures = childcareFiguresOf(inputs);
  const first = figures.factKeys[0];
  if (first === undefined) return { sources: [], missing: [] };
  if (figures.gap !== undefined) return { sources: [gapSource(first, figures.gap)], missing: [] };
  const businesses = figures.expenditures.map((each) => each.business);
  const unknown = [
    ...new Set(
      figures.expenditures
        .filter((each) => each.business.materiallyParticipated === undefined)
        .map((each) => each.value.businessKey),
    ),
  ];
  if (figures.malformedKeys.length > 0 || unknown.length > 0 || figures.lines === undefined) {
    return { sources: [], missing: [...figures.malformedKeys, ...unknown] };
  }
  const own = ownCreditOf(figures.lines);
  if (own === 0) return { sources: [], missing: [] };
  if (businesses.some((business) => business.materiallyParticipated === false)) {
    return { sources: [gapSource(first, PASSIVE_BUSINESS_GAP)], missing: [] };
  }
  const reason = ownSourceGap(inputs, own);
  if (reason !== undefined) return { sources: [gapSource(first, reason)], missing: [] };
  return {
    sources: [{ credit: { line: FORM_3800_LINE, key: first, amount: own, passive: false } }],
    missing: [],
  };
}

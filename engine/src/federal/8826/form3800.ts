/*
 * Form 8826's credit as Form 3800 sources: "All others, report this amount on
 * Form 3800, Part III, line 1e" (irs-8826-form-2025::sec::face-page-1::b01).
 * Line 8 is line 6 (the taxpayer's own businesses) plus line 7 (the K-1s). The
 * K-1 credits already are Form 3800 sources of their own (3800/sources.ts),
 * with each entity's EIN and passive answer, so this adds line 6 only, as one
 * source. Form 3800 holds line 1e to $5,000 and prorates
 * the sources above it (3800/currentCredits.ts), so its line 1e equals line 8.
 */

import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import { sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import type { CreditSource } from "../3800/filingInfo.js";
import type { DisabledAccessOfBusiness } from "./figures.js";
import { disabledAccessFiguresOf, resolve8826Info } from "./resolveInfo.js";

/* Part III line 1e, Form 8826 (3800/rows.ts). */
export const FORM_3800_LINE = "1e";

/*
 * A credit of a business the owner does not materially participate in is a
 * passive activity credit (Schedule C line G; column (d),
 * irs-3800-inst-2025::sec::transferees-of-eligible-credits-under-section::b05),
 * which Form 8582-CR limits by the tax on net passive income. The engine does
 * not figure a passive Schedule C business (as for Form 8846, 8846/form3800.ts),
 * so that limit is a gap.
 */
const PASSIVE_BUSINESS_GAP =
  "The disabled access credit is from a Schedule C business the owner did not materially participate in: a passive activity credit that Form 8582-CR limits by the tax on net passive income, and the engine does not figure a passive Schedule C business.";

const STATED_TWICE_GAP =
  "A disabled access credit is stated as a Form 3800 line 1e amount with no pass-through entity, and Form 8826 figures one from the expenditure facts: the engine cannot tell whether they are the same credit.";

/*
 * The decision decisions.scope.must_file_8826 = false takes Form 8826 off the
 * return, but the Schedule C expense line is reduced from the facts alone
 * (facts/kinds/activitiesOnReturn.ts reads no decision). With no form, nothing
 * is claimed and nothing reduces the deduction. Until the two agree, line 1e
 * is a gap, so the return never loses the deduction and the credit together.
 */
const DECISION_CONFLICT_GAP = (key: string) =>
  `The decision decisions.scope.must_file_8826 is false, but the disabled access fact ${key} claims the credit, and its Schedule C expense line is reduced by it (irs-8826-form-2025::sec::line-6::b01). To not claim the credit, remove the fact; to claim it, remove the decision.`;

/* One source that carries the gap, so line 1e and every total that adds it stay unsupported. */
function gapSource(key: string, reason: string): CreditSource {
  return { credit: { line: FORM_3800_LINE, key, amount: unsupported(reason), passive: false } };
}

/*
 * Line 6 as one source: the taxpayer's own credit is one Form 8826 amount, not
 * a pass-through entity or a facility that Part V lists apart
 * (irs-3800-inst-2025::sec::part-v-3::b01), so column (a) counts it once.
 */
function ownSource(credits: DisabledAccessOfBusiness[]): CreditSource {
  const key = credits[0].key;
  if (credits.some((credit) => credit.business.materiallyParticipated === false)) {
    return gapSource(key, PASSIVE_BUSINESS_GAP);
  }
  const amount = sum(...credits.map((credit) => credit.share));
  return { credit: { line: FORM_3800_LINE, key, amount, passive: false } };
}

function conflictSources(inputs: ResolverInputs): CreditSource[] {
  const figures = disabledAccessFiguresOf(inputs);
  if (figures.lines === undefined) return [];
  const reduced = figures.credits.filter((credit) => (credit.share ?? 0) > 0);
  return reduced.map((credit) => gapSource(credit.key, DECISION_CONFLICT_GAP(credit.key)));
}

const statedOnLine1e = (inputs: ResolverInputs) =>
  getGeneralBusinessCreditFacts(inputs.facts).some(
    ({ value }) => value.line === FORM_3800_LINE && value.passThroughEin === undefined,
  );

/*
 * The line 1e sources of the taxpayer's own businesses while Form 8826 files,
 * and the answers they wait on: the prior-year answers, or a business's line
 * G (materially participated), which decides column (d) or (e).
 */
export function disabledAccessSourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  if (resolve8826Info(inputs).mustFile?.["form-8826"]?.value !== true) {
    return { sources: conflictSources(inputs), missing: [] };
  }
  const figures = disabledAccessFiguresOf(inputs);
  const first = figures.factKeys[0];
  if (figures.gap !== undefined && first !== undefined) {
    return { sources: [gapSource(first, figures.gap)], missing: [] };
  }
  const unknown = figures.credits.filter(
    (credit) => credit.business.materiallyParticipated === undefined,
  );
  const missing = [
    ...figures.missing,
    ...figures.malformedKeys,
    ...unknown.map((credit) => credit.businessKey),
  ];
  if (missing.length > 0 || figures.lines === undefined) return { sources: [], missing };
  // Expenditures of $250 or less have no credit and no row.
  const withCredit = figures.credits.filter((credit) => (credit.share ?? 0) > 0);
  if (withCredit.length === 0) return { sources: [], missing: [] };
  if (statedOnLine1e(inputs)) {
    return { sources: [gapSource(withCredit[0].key, STATED_TWICE_GAP)], missing: [] };
  }
  return { sources: [ownSource(withCredit)], missing: [] };
}

/*
 * Form 8881's credits as Form 3800 sources: line 8 goes to "Form 3800, Part
 * III, line 1j", line 11 to line 1dd and line 15 to line 1ee
 * (irs-8881-face-2025::sec::face-part-i::b03, face-part-ii::b01, face-part-iii::b01).
 *
 * The K-1 credits of lines 7, 10 and 14 already are Form 3800 sources of their
 * own (3800/sources.ts), with the entity's EIN in column (c) and their own
 * passive answer, so this adds the plan's own credits only: lines 5 plus 6g,
 * line 9, and lines 12 plus 13. Each Part III row then totals its line.
 *
 * The credit is column (e) when the taxpayer materially participates in the
 * plan's business or farm (Schedule C line G, Schedule F line E), else column
 * (d), limited by Form 8582-CR, as for Form 5884 (5884/sources.ts).
 */

import { getGeneralBusinessCreditFacts } from "../../facts/index.js";
import { sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { gap, isGap } from "../3800/cells.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { ownCredits } from "./lines.js";
import { ownLinesOf, ownPlanLines, planOnReturn } from "./plan.js";
import { resolve8881Info } from "./resolveInfo.js";
import { PARTS, type Part } from "./totals.js";

const STATED_TWICE_GAP =
  "A Form 8881 credit is stated as a Form 3800 Part III amount with no pass-through entity, and Form 8881 figures one from the plan fact: the engine cannot tell whether they are the same credit.";

const PART_ORDER: ReadonlyArray<Part> = ["partI", "partII", "partIII"];

/*
 * The decision decisions.scope.must_file_8881 = false takes Form 8881 off the
 * return: "You may elect, however, to have section 45E not apply ... by not
 * claiming it" (irs-8881-inst-2025::sec::part-i::b01). But Schedule C or F is
 * lowered by lines 5 and 6g from the plan fact alone (smallEmployerPlan.ts;
 * the facts layer reads no decision). With no credit claimed, nothing reduces
 * the deduction (no-deduction-allowed-for-credit-amount::b01). Until the two
 * agree, line 1j is a gap, so the return never loses the deduction and the
 * credit together. Form 8846 does the same (8846/form3800.ts).
 */
const DECISION_CONFLICT_GAP = (key: string) =>
  `The decision decisions.scope.must_file_8881 is false, but the plan fact ${key} claims the startup costs or contributions credit, and Schedule C or F is reduced by Form 8881 lines 5 and 6g (irs-8881-inst-2025::sec::no-deduction-allowed-for-credit-amount::b01). To elect not to claim the credit (irs-8881-inst-2025::sec::part-i::b01), remove the startup costs and contributions from the plan fact; to claim it, remove the decision.`;

/* A gap source on line 1j while the decision is false and the plan fact still lowers a deduction. */
function conflictSources(inputs: ResolverInputs): CreditSource[] {
  const plan = planOnReturn(inputs).plan;
  if (plan === undefined) return [];
  const lines = ownLinesOf(plan);
  if (sum(lines.section1?.line5, lines.section2?.line6g) <= 0) return [];
  const amount = gap(DECISION_CONFLICT_GAP(plan.key));
  return [{ credit: { line: PARTS.partI.line, key: plan.key, amount, passive: false } }];
}

/* A stated credit on the part's row with no pass-through entity: the taxpayer's own credit stated twice. */
const statedOwn = (inputs: ResolverInputs, part: Part) =>
  getGeneralBusinessCreditFacts(inputs.facts).some(
    ({ value }) => value.line === PARTS[part].line && value.passThroughEin === undefined,
  );

/*
 * The plan's own credits as Form 3800 sources, and the answers they wait on
 * (the material participation of the plan's business or farm). None while
 * Form 8881 does not file.
 */
export function smallEmployerPlanSources(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const info = resolve8881Info(inputs);
  if (info.mustFile?.["form-8881"]?.value !== true) {
    return { sources: conflictSources(inputs), missing: [] };
  }
  if (info.smallEmployerPlan === undefined) return { sources: [], missing: [] };
  const on = planOnReturn(inputs);
  const lines = ownPlanLines(on);
  if (isGap(lines)) {
    const key = on.unplacedKeys[0] ?? "";
    const credit = { line: PARTS.partI.line, key, amount: lines, passive: false };
    return { sources: [{ credit }], missing: [] };
  }
  const plan = on.plan;
  if (lines === undefined || plan === undefined) return { sources: [], missing: [] };
  const { key, activity } = plan;
  const passive = activity.materiallyParticipated === false;
  const credits = ownCredits(lines);
  const sources = PART_ORDER.filter((part) => credits[part] > 0).map((part): CreditSource => ({
    credit: {
      line: PARTS[part].line,
      key,
      amount: statedOwn(inputs, part) ? gap(STATED_TWICE_GAP) : credits[part],
      passive,
      activity: passive ? { name: activity.name, rentalRealEstate: false } : undefined,
    },
  }));
  return {
    sources,
    missing: activity.materiallyParticipated === undefined ? [activity.key] : [],
  };
}

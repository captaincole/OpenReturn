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
import type { ResolverInputs } from "../../resolverInputs.js";
import { gap, isGap } from "../3800/cells.js";
import type { CreditSource } from "../3800/filingInfo.js";
import { ownCredits } from "./lines.js";
import { ownPlanLines, planOnReturn } from "./plan.js";
import { resolve8881Info } from "./resolveInfo.js";
import { PARTS, type Part } from "./totals.js";

const STATED_TWICE_GAP =
  "A Form 8881 credit is stated as a Form 3800 Part III amount with no pass-through entity, and Form 8881 figures one from the plan fact: the engine cannot tell whether they are the same credit.";

const PART_ORDER: ReadonlyArray<Part> = ["partI", "partII", "partIII"];

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
  if (info.mustFile?.["form-8881"]?.value !== true || info.smallEmployerPlan === undefined) {
    return { sources: [], missing: [] };
  }
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

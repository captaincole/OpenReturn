import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { isGap } from "../3800/cells.js";
import type { Form8881FilingInfo, Form8881Lines } from "./filingInfo.js";
import { hasOwnCredit, ownPlanLines, planOnReturn, type PlanOnReturn } from "./plan.js";
import { passThroughCredit } from "./totals.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8881";

/* Lines from the facts: the plan's own lines and the K-1 lines 7, 10 and 14. */
function form8881LinesOf(inputs: ResolverInputs, on: PlanOnReturn): Form8881Lines {
  return {
    own: ownPlanLines(on),
    line7: passThroughCredit(inputs, "partI"),
    line10: passThroughCredit(inputs, "partII"),
    line14: passThroughCredit(inputs, "partIII"),
  };
}

/* The plan files the form while it has a credit, a gap, or a malformed fact to ask again. */
function planFiles(on: PlanOnReturn): boolean {
  if (on.unplacedKeys.length > 0 || on.malformedKeys.length > 0) return true;
  const lines = ownPlanLines(on);
  if (lines === undefined || isGap(lines)) return lines !== undefined;
  return hasOwnCredit(lines);
}

/*
 * Who files: "Eligible small employers use Form 8881" (irs-8881-inst-2025::sec::general-instructions::b01)
 * to claim a credit of Part I, II or III. A plan fact of the taxpayer's own
 * business or farm files it while one of its parts gives a credit. A taxpayer
 * "whose only source of these credits is from a partnership or S corporation"
 * is "not required to complete or file this form" and reports them "directly
 * on Form 3800" (same block), so a K-1 alone does not. The explicit decision
 * still wins.
 */
export function resolve8881Info(inputs: ResolverInputs): Form8881FilingInfo {
  const on = planOnReturn(inputs);
  const keys = [on.plan?.key, ...on.unplacedKeys, ...on.malformedKeys].filter(
    (key): key is string => key !== undefined,
  );
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${keys.length} small employer retirement plan fact(s) of the taxpayer's own business or farm with a credit`,
        value: keys.length > 0 && planFiles(on),
        triggeredByFactKeys: keys,
      },
    ],
  });
  const files = mustFile.value === true;
  return {
    mustFile: { "form-8881": mustFile },
    missingInputs: { "form-8881": files ? on.malformedKeys : [] },
    smallEmployerPlan: files ? form8881LinesOf(inputs, on) : undefined,
  };
}

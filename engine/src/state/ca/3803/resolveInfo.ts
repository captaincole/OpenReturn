import { getChildInvestmentIncomeFacts } from "../../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import { form3803Children, form3803TotalsOf, MUST_FILE_3803_KEY } from "./children.js";
import type { Form3803FilingInfo } from "./filingInfo.js";
import { childIncomeLine8z } from "./scheduleCaLine8z.js";

const FILES_540_KEY = "decisions.scope.must_file_ca_540";

/*
 * ca-3803-inst-2025::sec::a-purpose::b01: parents "may elect" to report a
 * child's interest and dividends on their California return, even when they do
 * not on the federal return. So no fact turns the form on: only the decision.
 * One copy per child with an investment income fact
 * (::c-how-to-make-the-election::b01); each copy waits for that child's
 * answers. A child's income on a California return with no decision yet waits
 * for the decision: the parents must choose.
 */
export function resolve3803Info(inputs: ResolverInputs): Form3803FilingInfo {
  const decision = inputs.decisionByKey.get(MUST_FILE_3803_KEY);
  const elected = typeof decision === "boolean" ? decision : undefined;
  const undecided =
    elected === undefined &&
    inputs.decisionByKey.get(FILES_540_KEY) === true &&
    getChildInvestmentIncomeFacts(inputs.facts).length > 0;
  const children = form3803Children(inputs);
  const totals = form3803TotalsOf(children);
  return {
    mustFile: {
      "form-3803": resolveMustFile(inputs.decisionByKey, {
        explicitKey: MUST_FILE_3803_KEY,
        fallbacks: undecided
          ? []
          : [{ rule: "fallback: no child has investment income to report", value: false }],
      }),
    },
    missingInputs: { "form-3803": [...new Set(children.flatMap((child) => child.missing))] },
    form3803Children: children.length > 0 ? children : undefined,
    form3803Totals: totals,
    childIncomeLine8z: childIncomeLine8z(
      inputs,
      undecided ? undefined : elected === true,
      children,
      totals,
    ),
  };
}

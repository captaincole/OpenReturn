import { missingInputs, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3801FilingInfo } from "./filingInfo.js";
import { form3801Scope, MUST_FILE_540NR_KEY } from "./formScope.js";

const MUST_FILE_KEY = "decisions.scope.must_file_3801";
const MUST_FILE_540_KEY = "decisions.scope.must_file_ca_540";

/*
 * ca-3801-inst-2025::sec::b-who-must-file::b01: FTB 3801 is filed by
 * individuals "that have losses (including prior year unallowed losses) from
 * passive activities". The fallback files it on a California return for a
 * passive activity with a California or federal loss or carryover
 * (formScope.ts). The exception (only rental real estate whose loss the
 * special allowance takes in full) is not modeled: Part II then allows the
 * whole loss, so filing changes no amount (QUESTIONS.md item 1). A missing
 * answer that could file the form leaves the decision open.
 */
export function resolve3801Info(inputs: ResolverInputs): Form3801FilingInfo {
  const california =
    inputs.decisionByKey.get(MUST_FILE_540_KEY) === true ||
    inputs.decisionByKey.get(MUST_FILE_540NR_KEY) === true;
  const scope = california ? form3801Scope(inputs) : undefined;
  const triggered = scope?.triggeredBy ?? [];
  const fallbacks =
    scope?.open && triggered.length === 0
      ? []
      : [
          {
            rule: "fallback: a California return with a passive activity that has a loss or a prior year unallowed loss",
            value: triggered.length > 0,
            triggeredByFactKeys: triggered.filter((key) => !key.startsWith("decisions.")),
            triggeredByDecisionKeys: [
              ...(california ? [MUST_FILE_540_KEY] : []),
              ...triggered.filter((key) => key.startsWith("decisions.")),
            ],
          },
        ];
  return {
    form3801Figures: scope?.figures,
    mustFile: {
      "form-3801": resolveMustFile(inputs.decisionByKey, { explicitKey: MUST_FILE_KEY, fallbacks }),
    },
    missingInputs: {
      "form-3801": missingInputs(
        Object.fromEntries((scope?.waitingKeys ?? []).map((key) => [key, undefined])),
      ),
    },
  };
}

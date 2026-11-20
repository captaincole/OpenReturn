import { resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form540NRFilingInfo } from "./filingInfo.js";

/*
 * ca-540nr-booklet-2025::sec::which-form-to-use::b01: the taxpayer or the spouse was a nonresident or a part-year resident in 2025.
 * The engine computes only the full-year resident return (Form 540), so no fact turns the form on: only the decision does.
 */
export function resolve540NRInfo(inputs: ResolverInputs): Form540NRFilingInfo {
  return {
    mustFile: {
      "form-540nr": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_540nr",
        fallbacks: [
          {
            rule: "fallback: the engine files Form 540 only; no rule yet for a nonresident or part-year resident",
            value: false,
          },
        ],
      }),
    },
  };
}

import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form7203FilingInfo } from "./filingInfo.js";

/*
 * Who files: an S corporation shareholder who claims a loss, receives a distribution, disposes of stock or receives a loan repayment.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve7203Info(inputs: ResolverInputs): Form7203FilingInfo {
  return {
    mustFile: {
      "form-7203": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_7203",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}

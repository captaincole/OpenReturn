import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8846FilingInfo } from "./filingInfo.js";

/*
 * Who files: a food or beverage employer, or a beauty service employer, who claims a credit for the employer social security and Medicare taxes paid on employees' tips.
 * The form holds its own instructions, which are not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8846Info(inputs: ResolverInputs): Form8846FilingInfo {
  return {
    mustFile: {
      "form-8846": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8846",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}

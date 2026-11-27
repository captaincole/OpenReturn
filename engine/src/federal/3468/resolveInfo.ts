import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form3468FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who claims an investment credit (advanced coal, gasification, advanced energy project, advanced manufacturing, clean electricity, energy or rehabilitation), or makes an elective payment or transfer election for one.
 * The instructions are a separate document (2025 Instructions for Form 3468), which is not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve3468Info(inputs: ResolverInputs): Form3468FilingInfo {
  return {
    mustFile: {
      "form-3468": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_3468",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}

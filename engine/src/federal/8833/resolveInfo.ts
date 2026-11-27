import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8833FilingInfo } from "./filingInfo.js";

/*
 * Who files: a taxpayer who takes a treaty-based return position that overrules or modifies a provision of the Internal Revenue Code (section 6114), or a dual-resident taxpayer who claims treaty benefits as a nonresident (section 7701(b)); one form for each position.
 * The form holds its own instructions ("Who Must File"), which are not in the corpus yet.
 * The form has no rules yet, so no fact turns it on: only the decision does.
 */
export function resolve8833Info(inputs: ResolverInputs): Form8833FilingInfo {
  return {
    mustFile: {
      "form-8833": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_8833",
        fallbacks: [{ rule: "fallback: the form has no rules yet", value: false }],
      }),
    },
  };
}

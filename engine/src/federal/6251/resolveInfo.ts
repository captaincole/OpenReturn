import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form6251FilingInfo } from "./filingInfo.js";

/*
 * irs-6251-inst-2025::sec::who-must-file::b01: attach Form 6251 when line 7 is more
 * than line 10, when a general business credit or the credits for prior year
 * minimum tax (8801), qualified electric vehicles (8834) or refueling property
 * (8911) are claimed, or when lines 2c through 3 are negative and line 7 would be
 * more than line 10 without them. KNOWN GAP: lines 7 and 10 need the evaluated
 * return, which the resolver cannot see, and none of those credits has a fact.
 * The form files on the explicit decision only; Cade records it when the taxpayer
 * has an AMT adjustment the engine models (an incentive stock option spread).
 */
export function resolve6251Info(inputs: ResolverInputs): Form6251FilingInfo {
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_6251",
    fallbacks: [
      {
        rule: "fallback: Who Must File compares lines 7 and 10, which the resolver cannot see",
        value: false,
      },
    ],
  });
  return { mustFile: { "form-6251": resolution } };
}

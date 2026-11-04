import { SPOUSE_KEYS } from "../../facts/index.js";
import { bornBeforeJan2_1961, filingStatusOf } from "../../filingInfoResolvers.js";
import { resolveMustFile, text, type ResolverInputs } from "../../resolverInputs.js";
import type { Schedule1AFilingInfo } from "./filingInfo.js";

/*
 * irs-1040-inst-2025::sec::part-v::b02 — the enhanced deduction for seniors: born
 * before January 2, 1961 (the spouse too on a joint return), with a valid SSN; a
 * married filer must file jointly. Parts II–IV (tips, overtime, car loan interest)
 * have no facts yet, so they never trigger the form.
 */
export function resolveSchedule1AInfo(inputs: ResolverInputs): Schedule1AFilingInfo {
  const status = filingStatusOf(inputs);
  const taxpayerSenior = bornBeforeJan2_1961(text(inputs, "identity.dob")) === true;
  const spouseSenior =
    status === "married_filing_jointly" &&
    bornBeforeJan2_1961(text(inputs, SPOUSE_KEYS.dob)) === true;
  return {
    mustFile: {
      "schedule-1-a": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_schedule_1_a",
        fallbacks: [
          {
            rule: "fallback: a filer born before January 2, 1961, not married filing separately (Part V)",
            value: status !== "married_filing_separately" && (taxpayerSenior || spouseSenior),
            triggeredByFactKeys: ["identity.dob", SPOUSE_KEYS.dob],
          },
        ],
      }),
    },
  };
}

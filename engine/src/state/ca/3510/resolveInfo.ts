import {
  CA_PRIOR_YEAR_AMT_KEYS,
  isCompleteCaPriorYearAmtExclusions,
  type CaPriorYearAmtExclusionsFactValue,
} from "../../../facts/index.js";
import {
  missingInputs,
  num,
  resolveMustFile,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import type { Form3510FilingInfo } from "./filingInfo.js";
import { line32FromAnswers } from "./lines.js";

/* The Part I figures, when complete. */
function exclusionsOf(inputs: ResolverInputs): CaPriorYearAmtExclusionsFactValue | undefined {
  const stated = inputs.factByKey.get(CA_PRIOR_YEAR_AMT_KEYS.exclusions) as
    CaPriorYearAmtExclusionsFactValue | undefined;
  return isCompleteCaPriorYearAmtExclusions(stated) ? stated : undefined;
}

/*
 * ca-3510-inst-2025::sec::b-who-must-file::b01: the credit needs an AMT credit
 * carryover from 2024, or 2024 AMT paid with adjustments other than exclusions.
 * A stated 2024 AMT or carryover above 0 files the form with a California
 * return, unless line 32 (from the answers alone) is 0 or less: then "you do
 * not have an AMT credit or an AMT credit to carry over"
 * (::specific-line-instructions::b04). While line 32 waits, the form files and
 * asks. Also read by Schedule P (540), which the credit needs through line 24.
 */
export function claimsCaPriorYearAmtCredit(inputs: ResolverInputs): boolean {
  const filesCalifornia =
    inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true ||
    inputs.decisionByKey.get("decisions.scope.must_file_540nr") === true;
  const amt = num(inputs, CA_PRIOR_YEAR_AMT_KEYS.amt);
  const carryover = num(inputs, CA_PRIOR_YEAR_AMT_KEYS.creditCarryover);
  if (!filesCalifornia || ((amt ?? 0) <= 0 && (carryover ?? 0) <= 0)) return false;
  const line32 = line32FromAnswers(amt, carryover, exclusionsOf(inputs));
  return line32 === undefined || line32 > 0;
}

export function resolve3510Info(inputs: ResolverInputs): Form3510FilingInfo {
  const amt = num(inputs, CA_PRIOR_YEAR_AMT_KEYS.amt);
  const carryover = num(inputs, CA_PRIOR_YEAR_AMT_KEYS.creditCarryover);
  const exclusions = exclusionsOf(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3510",
    fallbacks: [
      {
        rule: `fallback: a California return with a 2024 California AMT ($${amt ?? 0}) or AMT credit carryover ($${carryover ?? 0}) above 0, and line 32 not 0 or less`,
        value: claimsCaPriorYearAmtCredit(inputs),
        triggeredByFactKeys: [CA_PRIOR_YEAR_AMT_KEYS.amt, CA_PRIOR_YEAR_AMT_KEYS.creditCarryover],
        triggeredByDecisionKeys: [
          "decisions.scope.must_file_ca_540",
          "decisions.scope.must_file_540nr",
        ],
      },
    ],
  });
  const files = resolution.value === true;
  return {
    mustFile: { "form-3510": resolution },
    // Line 28 and line 31 always; Part I only with a 2024 AMT above 0 (line 29 is 0 without one).
    missingInputs: {
      "form-3510": files
        ? missingInputs({
            [CA_PRIOR_YEAR_AMT_KEYS.amt]: amt,
            [CA_PRIOR_YEAR_AMT_KEYS.creditCarryover]: carryover,
            ...((amt ?? 0) > 0 ? { [CA_PRIOR_YEAR_AMT_KEYS.exclusions]: exclusions } : {}),
          })
        : [],
    },
    caPriorYearAmt: amt,
    caPriorYearAmtCreditCarryover: carryover,
    caPriorYearAmtExclusions: exclusions,
  };
}

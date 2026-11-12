import {
  AMT_KEYS,
  INVESTMENT_INTEREST_KEYS,
  isDividendFactKey,
  isInterestFactKey,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  missingInputs,
  num,
  resolveMustFile,
  sumInvestmentBox,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { resolveScheduleAInfo } from "../schedule-a/resolveInfo.js";
import type { Form6251FilingInfo } from "./filingInfo.js";

/*
 * irs-6251-inst-2025::sec::who-must-file::b01: attach Form 6251 when line 7 is more
 * than line 10, when a general business credit or the credits for prior year
 * minimum tax (8801), qualified electric vehicles (8834) or refueling property
 * (8911) are claimed, or when lines 2c through 3 are negative and line 7 would be
 * more than line 10 without them. KNOWN GAP: lines 7 and 10 need the evaluated
 * return, which the resolver cannot see. The rule sees only the incentive stock
 * option spread, the one AMT adjustment the engine models: a spread above 0 files
 * the form. A filer who owes AMT for another reason still needs the explicit
 * decision.
 */
export function resolve6251Info(inputs: ResolverInputs): Form6251FilingInfo {
  const isoExerciseSpread = num(inputs, AMT_KEYS.isoExerciseSpread);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_6251",
    fallbacks: [
      {
        rule: `fallback: an ISO spread of $${isoExerciseSpread ?? 0} (files when above $0)`,
        value: (isoExerciseSpread ?? 0) > 0,
        triggeredByFactKeys: [AMT_KEYS.isoExerciseSpread],
      },
    ],
  });
  const itemizeDecision = inputs.decisionByKey.get("decisions.itemize_vs_standard");
  const itemizesDeductions =
    itemizeDecision === "itemized" ? true : itemizeDecision === "standard" ? false : undefined;
  const filesScheduleA = resolveScheduleAInfo(inputs).mustFile?.["schedule-a"]?.value === true;
  const amtDisallowedInterestCarryover = num(
    inputs,
    INVESTMENT_INTEREST_KEYS.amtDisallowedCarryover,
  );
  const needsAmtCarryover =
    itemizesDeductions === true &&
    (num(inputs, INVESTMENT_INTEREST_KEYS.disallowedCarryover) ?? 0) > 0;
  return {
    mustFile: { "form-6251": resolution },
    /*
     * Line 2a needs the choice only when Schedule A files, as 1040 line 12e does.
     * Line 2c needs last year's AMT carryover only when there was a regular one.
     * Line 2i needs the ISO spread: no document carries it, and 0 is an answer.
     */
    missingInputs: {
      "form-6251": missingInputs({
        ...(filesScheduleA ? { "decisions.itemize_vs_standard": itemizesDeductions } : {}),
        ...(needsAmtCarryover
          ? { [INVESTMENT_INTEREST_KEYS.amtDisallowedCarryover]: amtDisallowedInterestCarryover }
          : {}),
        [AMT_KEYS.isoExerciseSpread]: isoExerciseSpread,
      }),
    },
    itemizesDeductions,
    amtDisallowedInterestCarryover,
    privateActivityBondInterest: privateActivityBondInterest(inputs),
    isoExerciseSpread,
  };
}

/* Line 2g: 1099-INT box 9 and 1099-DIV box 13; undefined when neither form is on file. */
function privateActivityBondInterest(inputs: ResolverInputs): number | undefined {
  const has1099 = inputs.facts.some(
    (fact) =>
      fact.category === "investment_income" &&
      (isInterestFactKey(fact.key) || isDividendFactKey(fact.key)),
  );
  if (!has1099) return undefined;
  return sum(
    sumInvestmentBox(inputs, "box9", isInterestFactKey),
    sumInvestmentBox(inputs, "box13", isDividendFactKey),
  );
}

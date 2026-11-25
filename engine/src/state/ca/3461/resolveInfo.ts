import { CA_BUSINESS_LOSS_LIMIT_KEYS } from "../../../facts/index.js";
import { businessLossesWithoutIncome, form461Figures } from "../../../federal/461/resolveInfo.js";
import { totalBusinessLosses } from "../../../federal/passThrough/excessBusinessLoss.js";
import { roundDollars } from "../../../money.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  resolveMustFile,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import type { Form3461FilingInfo } from "./filingInfo.js";
import { caThreshold } from "./lines.js";

const FILES_540_KEY = "decisions.scope.must_file_ca_540";
const FILES_540NR_KEY = "decisions.scope.must_file_540nr";

const FORM_540NR_GAP =
  "Form 540NR files: FTB 3461 Part I then reads Schedule CA (540NR) column E (ca-3461-inst-2025::sec::line-2::b01), which the engine does not fill.";

/*
 * Who files (ca-3461-inst-2025::sec::b-who-must-file::b01): a noncorporate
 * taxpayer whose "net losses from all of your trades or businesses are more
 * than $313,000 ($626,000 for married/RDP taxpayers filing a joint return)".
 * California has no rule for one line's loss, as federal Form 461 has. The
 * resolver cannot see the lines, so it bounds the net loss with the return's
 * business losses added without any income (federal/461, the same bound).
 * A carryover from last year's FTB 3461 files the form too: line 14b and the
 * rules for using it are on this form (::line-14b::b01). The explicit
 * decision wins.
 */
function mustFileOf(inputs: ResolverInputs) {
  const files540 = inputs.decisionByKey.get(FILES_540_KEY) === true;
  const { k1Losses, other, line8Loss, entityKeys } = businessLossesWithoutIncome(inputs);
  const threshold = caThreshold(filingStatusOf(inputs) === "married_filing_jointly");
  const losses = other === undefined ? 0 : totalBusinessLosses(k1Losses, other) + line8Loss;
  const required = files540 && other !== undefined && losses > threshold;
  const carryover = num(inputs, CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearCarryover) ?? 0;
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3461",
    fallbacks: [
      {
        rule: "fallback: Form 540 files and the business losses, added without any income, are more than the threshold",
        value: required,
        triggeredByFactKeys: required ? entityKeys : [],
        triggeredByDecisionKeys: required ? [FILES_540_KEY] : [],
      },
      {
        rule: "fallback: Form 540 files with a California excess business loss carryover from 2024",
        value: files540 && carryover > 0,
        triggeredByFactKeys: [CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearCarryover],
        triggeredByDecisionKeys: [FILES_540_KEY],
      },
    ],
  });
}

/*
 * Line 14b asks last year's line 16 of every filer (0 is an answer); line 17
 * asks the prior adjustments only when there is a carryover. The rest are the
 * federal Form 461 answers (business rentals), which sort the same amounts.
 */
export function resolve3461Info(inputs: ResolverInputs): Form3461FilingInfo {
  const mustFile = mustFileOf(inputs);
  if (mustFile.value !== true) return { mustFile: { "form-3461": mustFile } };
  const keys = CA_BUSINESS_LOSS_LIMIT_KEYS;
  const carryover = roundDollars(num(inputs, keys.priorYearCarryover));
  const priorAdjustments = roundDollars(num(inputs, keys.priorYearAdjustmentsIncluded));
  const { figures, missing } = form461Figures(inputs);
  const asked = missingInputs({
    [keys.priorYearCarryover]: carryover,
    ...((carryover ?? 0) > 0 ? { [keys.priorYearAdjustmentsIncluded]: priorAdjustments } : {}),
  });
  return {
    mustFile: { "form-3461": mustFile },
    missingInputs: { "form-3461": [...new Set([...missing, ...asked])] },
    form3461: {
      threshold: caThreshold(filingStatusOf(inputs) === "married_filing_jointly"),
      federal: figures,
      carryover,
      priorAdjustments,
      gap: inputs.decisionByKey.get(FILES_540NR_KEY) === true ? FORM_540NR_GAP : undefined,
    },
  };
}

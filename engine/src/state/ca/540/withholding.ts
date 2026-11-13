/*
 * Form 540 line 71 from the information returns other than the W-2
 * (ca-540-inst-2025::sec::line-71-california-income-tax-withheld::b01): W-2G box
 * 15, 1099-INT box 17, 1099-MISC box 16, 1099-NEC box 5 and 1099-R box 14.
 * Withholding by another state is left out: a form whose state box names a
 * state other than California does not count. 1099-DIV, 1099-K and 1099-OID
 * have no state withholding box in their facts.
 */

import {
  getGamblingWinningsFacts,
  getNonemployeeCompensationFacts,
  isInterestFactKey,
  isMiscIncomeFactKey,
  isRetirementDistributionFactKey,
} from "../../../facts/index.js";
import { sumOrBlank } from "../../../money.js";
import { factsInCategory, type ResolverInputs } from "../../../resolverInputs.js";

const CALIFORNIA = "CA";

/* A state box ("CA", "CA/123456789") that names California, or no state box at all. */
const californiaOrUnstated = (state: unknown) =>
  typeof state !== "string" ||
  state.trim() === "" ||
  state.trim().toUpperCase().startsWith(CALIFORNIA);

type Box = Record<string, unknown>;

function boxes(inputs: ResolverInputs, category: string, isKey: (key: string) => boolean): Box[] {
  return factsInCategory(inputs, category)
    .filter((row) => isKey(row.key))
    .map((row) => row.value as Box);
}

/* The California tax withheld on those forms; undefined when none shows any. */
export function californiaWithholdingOtherForms(inputs: ResolverInputs): number | undefined {
  const withheld = (rows: Box[], amountBox: string, stateBox: string) =>
    rows.filter((row) => californiaOrUnstated(row[stateBox])).map((row) => row[amountBox]);
  return sumOrBlank(
    ...withheld(getGamblingWinningsFacts(inputs.facts) as unknown as Box[], "box15", "box13"),
    ...withheld(boxes(inputs, "investment_income", isInterestFactKey), "box17", "box15"),
    ...withheld(boxes(inputs, "other", isMiscIncomeFactKey), "box16", "box17"),
    ...withheld(
      getNonemployeeCompensationFacts(inputs.facts).map((form) => form.value as unknown as Box),
      "box5",
      "box6",
    ),
    ...withheld(boxes(inputs, "retirement", isRetirementDistributionFactKey), "box14", "box15"),
  );
}

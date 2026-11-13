/* Schedule 1 Part II adjustments the resolver reads from facts. */

import { EDUCATOR_EXPENSE_KEYS, isInterestFactKey } from "../../facts/index.js";
import { atLeast, sum } from "../../money.js";
import { factsInCategory, num, type ResolverInputs } from "../../resolverInputs.js";

/* irs-1040-inst-2025::sec::adjustments-to::b01: "up to $300 of qualified expenses you paid in 2025". */
const EDUCATOR_EXPENSE_LIMIT_2025 = 300;

/*
 * Line 11: each eligible educator's qualified expenses, at most $300 each. Only a
 * joint return adds the spouse's ("If you and your spouse are filing jointly and
 * both of you were eligible educators, the maximum deduction is $600. However,
 * neither spouse can deduct more than $300"). Undefined when no educator expense
 * is recorded, so the line stays blank.
 */
export function educatorExpenseDeduction(
  inputs: ResolverInputs,
  jointReturn: boolean,
): number | undefined {
  const taxpayer = num(inputs, EDUCATOR_EXPENSE_KEYS.taxpayer);
  const spouse = jointReturn ? num(inputs, EDUCATOR_EXPENSE_KEYS.spouse) : undefined;
  if (taxpayer === undefined && spouse === undefined) return undefined;
  const allowed = (paid: number | undefined) =>
    paid === undefined ? 0 : Math.min(atLeast(0, paid), EDUCATOR_EXPENSE_LIMIT_2025);
  return sum(allowed(taxpayer), allowed(spouse));
}

/*
 * Line 18: the penalty on early withdrawal of savings, 1099-INT box 2 summed over
 * every account, cents kept (irs-1040-inst-2025::sec::line-18::b01: "The Form
 * 1099-INT or Form 1099-OID you received will show the amount of any penalty you
 * were charged"). Form 1099-OID has no fact kind yet. Undefined when no 1099-INT
 * prints box 2.
 */
export function earlyWithdrawalPenalty(inputs: ResolverInputs): number | undefined {
  const penalties = factsInCategory(inputs, "investment_income")
    .filter((row) => isInterestFactKey(row.key))
    .map((row) => (row.value as Record<string, unknown>)?.box2)
    .filter((box2): box2 is number => typeof box2 === "number" && Number.isFinite(box2));
  return penalties.length > 0 ? sum(...penalties) : undefined;
}

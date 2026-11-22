import { getRefundDepositFacts, makeRefundDepositFactKey } from "../../facts/index.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { refundAccountOf, type RefundAccount } from "./accounts.js";
import type { Form8888FilingInfo } from "./filingInfo.js";
import { LEAST_ACCOUNTS, MOST_ACCOUNTS } from "./lines.js";

/*
 * The answers the form reads, by fact key: each stated account, undefined when
 * the form cannot use it. Only one account may leave its amount out (it takes
 * the rest); a second one waits for an amount. With fewer than two accounts the
 * first free lines wait too: the form splits among two or three.
 */
function accountAnswers(inputs: ResolverInputs): Record<string, RefundAccount | undefined> {
  const answers: Record<string, RefundAccount | undefined> = {};
  let restTaken = false;
  for (const fact of getRefundDepositFacts(inputs.factByKey)) {
    const account = refundAccountOf(fact.value);
    const secondRest = account !== undefined && account.amount === undefined && restTaken;
    if (account !== undefined && account.amount === undefined) restTaken = true;
    answers[fact.key] = secondRest ? undefined : account;
  }
  for (let position = 1; position <= MOST_ACCOUNTS; position += 1) {
    if (Object.keys(answers).length >= LEAST_ACCOUNTS) break;
    const key = makeRefundDepositFactKey(position);
    if (!(key in answers)) answers[key] = undefined;
  }
  return answers;
}

/*
 * Who files: a taxpayer who wants the refund deposited to two or three accounts
 * (irs-8888-form-2025::sec::general-instructions::b01; Form 1040 line 35a, "Check
 * the box on line 35a and attach Form 8888 if you want to split the direct
 * deposit of your refund into more than one account",
 * irs-1040-inst-2025::sec::starting-in-october-2025-the-irs::b01). Two or more
 * account facts file it; one account goes on Form 1040 lines 35b–35d instead.
 * The explicit decision still wins. Whether there is a refund at all shows only
 * on Form 1040 line 35a, which a resolver cannot read: the form names that line
 * in `filesOnlyWithAmountOn` (bindings.ts), and does not file without a refund.
 */
export function resolve8888Info(inputs: ResolverInputs): Form8888FilingInfo {
  const facts = getRefundDepositFacts(inputs.factByKey);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8888",
    fallbacks: [
      {
        rule: `fallback: ${facts.length} account(s) for the refund; Form 8888 splits it among two or three`,
        value: facts.length >= LEAST_ACCOUNTS,
        triggeredByFactKeys: facts.map((fact) => fact.key),
      },
    ],
  });
  const filed = { mustFile: { "form-8888": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8888": [] } };
  const answers = accountAnswers(inputs);
  const missing = missingInputs(answers);
  return {
    ...filed,
    missingInputs: { "form-8888": missing },
    form8888Accounts:
      missing.length === 0
        ? Object.values(answers).filter((account) => account !== undefined)
        : undefined,
  };
}

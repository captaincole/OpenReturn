import { businessesOnReturn, unlinkedPaymentTransactionsKeys } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { ScheduleCFilingInfo } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_schedule_c";

/*
 * irs-1040sc-inst-2025::sec::small-business-and-self-employed-sb-se-tax-center-do::b02:
 * Schedule C reports a business operated as a sole proprietor. A business fact
 * whose amounts are not numbers leaves the question open, so Cade asks again.
 * A 1099-K that names no business is open too: it can be business receipts or
 * personal sales. A false decision closes it (no Schedule C). Statutory
 * employees and qualified joint ventures have no facts yet. A spouse's business
 * is on this return only when filing jointly; an unknown status counts it until
 * it is known.
 */
export function resolveScheduleCInfo(inputs: ResolverInputs): ScheduleCFilingInfo {
  const status = filingStatusOf(inputs);
  const { businesses, malformedKeys } = businessesOnReturn(
    inputs.facts,
    status === undefined || status === "married_filing_jointly",
  );
  const unlinkedKeys = unlinkedPaymentTransactionsKeys(inputs.facts);
  const decided = inputs.decisionByKey.has(MUST_FILE_KEY);
  const open =
    !decided && (malformedKeys.length > 0 || (unlinkedKeys.length > 0 && businesses.length === 0));
  const noScheduleC = inputs.decisionByKey.get(MUST_FILE_KEY) === false;
  return {
    mustFile: {
      "schedule-c": open
        ? resolveMustFile(inputs.decisionByKey, { explicitKey: MUST_FILE_KEY })
        : resolveMustFile(inputs.decisionByKey, {
            explicitKey: MUST_FILE_KEY,
            fallbacks: [
              {
                rule: "fallback: a sole-proprietor business fact",
                value: businesses.length > 0,
                triggeredByFactKeys: businesses.map((business) => business.key),
              },
            ],
          }),
    },
    missingInputs: {
      "schedule-c": missingInputs(
        Object.fromEntries([
          ...malformedKeys.map((key) => [key, undefined]),
          ...(noScheduleC ? [] : unlinkedKeys).map((key) => [key, undefined]),
          // Line 5 waits for "sells goods" (Part III) and line 31 for line G: ask for the fact again.
          ...businesses
            .filter(
              (business) =>
                business.value.sellsGoods === undefined ||
                business.value.materiallyParticipated === undefined,
            )
            .map((business) => [business.key, undefined]),
        ]),
      ),
    },
    businesses: businesses.map((business) => business.value),
  };
}

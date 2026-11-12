import {
  businessesOnReturn,
  unlinkedNonemployeeCompensationKeys,
  unlinkedPaymentTransactionsKeys,
} from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { ScheduleCFilingInfo } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_schedule_c";

/*
 * irs-1040sc-inst-2025::sec::small-business-and-self-employed-sb-se-tax-center-do::b02:
 * Schedule C reports a business operated as a sole proprietor. A business fact
 * whose amounts are not numbers leaves the question open, so Cade asks again.
 * A 1099-K that names no business is open too, while there is no business: its
 * box 1a can be business receipts, personal sales or hobby income, and each
 * goes on a different line (irs-1040-inst-2025::sec::form-s-1099-k::b01). The
 * engine models only business receipts, so the 1099-K stays in missingInputs
 * until it is linked to a business, even after a "no Schedule C" decision. A
 * 1099-NEC that names no business is open the same way: box 1 belongs on line 1
 * (irs-1040sc-inst-2025::sec::line-1::b01) only when it is business income.
 * Statutory employees and qualified joint ventures have no facts yet. A spouse's
 * business is on this return only when filing jointly; an unknown status counts
 * it until it is known.
 */
export function resolveScheduleCInfo(inputs: ResolverInputs): ScheduleCFilingInfo {
  const status = filingStatusOf(inputs);
  const { businesses, malformedKeys } = businessesOnReturn(
    inputs.facts,
    status === undefined || status === "married_filing_jointly",
  );
  const unlinkedKeys = [
    ...unlinkedPaymentTransactionsKeys(inputs.facts),
    ...unlinkedNonemployeeCompensationKeys(inputs.facts),
  ];
  const open = malformedKeys.length > 0 || (unlinkedKeys.length > 0 && businesses.length === 0);
  const businessFallback = {
    rule: "fallback: a sole-proprietor business fact",
    value: businesses.length > 0,
    triggeredByFactKeys: businesses.map((business) => business.key),
  };
  return {
    mustFile: {
      "schedule-c": resolveMustFile(inputs.decisionByKey, {
        explicitKey: MUST_FILE_KEY,
        fallbacks: open ? [] : [businessFallback],
      }),
    },
    missingInputs: {
      "schedule-c": missingInputs(
        Object.fromEntries([
          ...malformedKeys.map((key) => [key, undefined]),
          ...unlinkedKeys.map((key) => [key, undefined]),
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

/* Schedule SE and Form 8995-A wait while Schedule C's must-file answer is open. */
export function scheduleCOpen(inputs: ResolverInputs): boolean {
  return resolveScheduleCInfo(inputs).mustFile?.["schedule-c"]?.value === undefined;
}

import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { qbiBusinesses } from "../qbi/resolveInfo.js";
import { qbiMustFile } from "../qbi/whichForm.js";
import { netIncomeOrLoss } from "../schedule-e/lines.js";
import { resolveScheduleEInfo } from "../schedule-e/resolveInfo.js";
import type { Form8995AScheduleCFilingInfo } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8995_a_schedule_c";

/*
 * irs-8995a-inst-2025::sec::schedule-c-form-8995-a-loss-netting-and::b01: complete
 * Schedule C (Form 8995-A) when a trade or business has a qualified business loss,
 * or there is a carryforward from prior years. No fact gives a prior-year
 * carryforward, so only this year's losses decide: a Schedule C net loss, or a QBI
 * rental's loss. A passive rental's loss is QBI only as far as Form 8582 allows it
 * (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b16), which the
 * resolver cannot see; MANUAL EDIT: it files anyway. b01 does not require the
 * schedule when Form 8582 suspends the whole loss, but column (a) is then the
 * allowed loss of 0 (rentalQbi) and a row of 0 nets nothing. A passive royalty's loss
 * stays open: its QBI waits (rentalQbi). The schedule attaches to Form 8995-A:
 * when Form 8995 figures the deduction, it does not file.
 */
export function resolve8995AScheduleCInfo(inputs: ResolverInputs): Form8995AScheduleCFilingInfo {
  const form8995A = qbiMustFile(inputs, "form-8995-a").value;
  const qbi = form8995A === false ? [] : qbiBusinesses(inputs).businesses;
  const properties = resolveScheduleEInfo(inputs).rentalProperties ?? [];
  const rentalOf = (factKey: string) => properties.find((property) => property.factKey === factKey);
  const losses = qbi.map((business) => {
    if (business.kind === "business") {
      // A blank line 31 may be a loss: the question stays open.
      const profit = business.netProfit;
      return { business, loss: profit === undefined ? undefined : profit < 0 };
    }
    const property = rentalOf(business.factKey);
    if (property === undefined) return { business, loss: false };
    // Schedule E line 21 before the at-risk test; undefined while an answer is open.
    const net = netIncomeOrLoss(property.value);
    if (net === undefined) return { business, loss: undefined };
    const loss = net < 0;
    const royalty = property.value.propertyType === "royalties";
    return { business, loss: loss && royalty && property.passive !== false ? undefined : loss };
  });
  const open = losses.some((entry) => entry.loss === undefined);
  const withLoss = losses.filter((entry) => entry.loss === true);
  return {
    mustFile: {
      "form-8995-a-schedule-c": resolveMustFile(inputs.decisionByKey, {
        explicitKey: MUST_FILE_KEY,
        fallbacks:
          (open && withLoss.length === 0) || (form8995A === undefined && withLoss.length > 0)
            ? []
            : [
                {
                  rule: "fallback: a Schedule C business or QBI rental with a loss",
                  value: withLoss.length > 0,
                  triggeredByFactKeys: withLoss.map((entry) => entry.business.factKey),
                },
              ],
      }),
    },
  };
}

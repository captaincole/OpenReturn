import type { RentalFactValue } from "../../facts/index.js";
import { sum } from "../../money.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { qbiBusinesses } from "../qbi/resolveInfo.js";
import { qbiMustFile } from "../qbi/whichForm.js";
import { resolveScheduleEInfo } from "../schedule-e/resolveInfo.js";
import type { Form8995AScheduleCFilingInfo } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8995_a_schedule_c";

/* Schedule E line 21 from the facts: rents and royalties less the expenses. */
function netRentalIncome(property: RentalFactValue): number {
  const { otherDescription: _description, ...expenses } = property.expenses ?? {};
  return sum(property.rentsReceived, property.royaltiesReceived) - sum(...Object.values(expenses));
}

/*
 * irs-8995a-inst-2025::sec::schedule-c-form-8995-a-loss-netting-and::b01: complete
 * Schedule C (Form 8995-A) when a trade or business has a qualified business loss,
 * or there is a carryforward from prior years. No fact gives a prior-year
 * carryforward, so only this year's losses decide: a Schedule C net loss, or a QBI
 * rental's loss. A passive rental's loss counts only as far as Form 8582 allows
 * it, which the resolver cannot see, so that case stays open. The schedule
 * attaches to Form 8995-A: when Form 8995 figures the deduction, it does not file.
 */
export function resolve8995AScheduleCInfo(inputs: ResolverInputs): Form8995AScheduleCFilingInfo {
  const form8995A = qbiMustFile(inputs, "form-8995-a").value;
  const qbi = form8995A === false ? [] : qbiBusinesses(inputs).businesses;
  const properties = resolveScheduleEInfo(inputs).rentalProperties ?? [];
  const rentalOf = (factKey: string) => properties.find((property) => property.factKey === factKey);
  const losses = qbi.map((business) => {
    if (business.kind === "business") return { business, loss: (business.netProfit ?? 0) < 0 };
    const property = rentalOf(business.factKey);
    const loss = property !== undefined && netRentalIncome(property.value) < 0;
    return { business, loss: loss && property?.passive !== false ? undefined : loss };
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

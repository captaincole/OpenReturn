import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { form461Required } from "../passThrough/excessBusinessLoss.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { businessLossesBeforeExcessBusinessLoss } from "../passThrough/limits.js";
import { limitContextOf } from "../passThrough/receipts.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";
import type { Form461FilingInfo } from "./filingInfo.js";

/*
 * Who files (irs-461-inst-2025::sec::who-must-file::b01): a noncorporate
 * taxpayer whose "net losses from all of your trades or businesses are more
 * than $313,000 ($626,000 for taxpayers filing a joint return)", or who "would
 * report a loss of more than $156,500 on any one of Form 461, lines 1 through
 * 8". MANUAL EDIT: the return's business losses come from the K-1s as the
 * loss limits allow them before the excess business loss stage, the Schedule
 * C losses and the rentals' losses, each added without any income
 * (passThrough/excessBusinessLoss.ts, form461Required). The form has no rules:
 * when it files, its lines are unsupported and the rest of the return
 * computes. A loss the limit could reduce stops the K-1 at that stage.
 */
export function resolve461Info(inputs: ResolverInputs): Form461FilingInfo {
  const context = limitContextOf(inputs);
  const other = context.otherBusinessLosses;
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  const { entities } = passThroughEntitiesOnReturn(inputs.facts, joint);
  const k1Losses = businessLossesBeforeExcessBusinessLoss(entities, context);
  const required = other !== undefined && form461Required(k1Losses, other);
  return {
    mustFile: {
      "form-461": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_461",
        fallbacks: [
          {
            rule: "fallback: business losses, added without any income, of more than $156,500 on Form 461 line 2 (Schedule C) or line 5 (Schedule E)",
            value: required,
            triggeredByFactKeys: required ? entities.map((entity) => entity.key) : [],
          },
        ],
      }),
    },
  };
}

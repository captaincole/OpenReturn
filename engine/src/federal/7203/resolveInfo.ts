import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { figureBasis, needsForm7203 } from "../passThrough/basis.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";
import type { Form7203FilingInfo } from "./filingInfo.js";

/*
 * Who files (irs-7203-inst-2025::sec::who-must-file::b01): an S corporation
 * shareholder claiming a deduction for a share of an aggregate loss (a loss
 * carried from last year included), or who received a non-dividend
 * distribution, disposed of stock, or received a loan repayment. One copy for
 * each such K-1 on this return (needsForm7203). The lines wait while the
 * holding lacks a basis answer (figureBasis).
 */
export function resolve7203Info(inputs: ResolverInputs): Form7203FilingInfo {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  const entities = passThroughEntitiesOnReturn(inputs.facts, joint).entities.filter(needsForm7203);
  const waiting = entities.flatMap((entity) => {
    const outcome = figureBasis(entity);
    return outcome.kind === "waiting" ? outcome.factKeys : [];
  });
  return {
    mustFile: {
      "form-7203": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_7203",
        fallbacks: [
          {
            rule: "fallback: an S corporation K-1 with a loss, a deduction, a distribution, a loan repayment, a carried basis loss or a disposal of stock",
            value: entities.length > 0,
            triggeredByFactKeys: entities.map((entity) => entity.key),
          },
        ],
      }),
    },
    missingInputs: { "form-7203": [...new Set(waiting)] },
    form7203Entities: entities.length > 0 ? entities : undefined,
  };
}

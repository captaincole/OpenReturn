import { businessesOnReturn } from "../../facts/index.js";
import { filingStatusOf, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { figureK1Form6198, k1AtRiskActivity } from "../passThrough/atRisk.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { k1sOnForm6198 } from "../passThrough/limits.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";
import { businessNeedsForm6198, figureBusinessForm6198 } from "../schedule-c/atRisk.js";
import { profitBeforeLossRules } from "../schedule-c/lines.js";
import type { Form6198Copy, Form6198FilingInfo } from "./filingInfo.js";

type Filer = { key: string; copy: Form6198Copy };

/* Each partnership or S corporation K-1 whose at-risk stage figures Form 6198 (passThrough/atRisk.ts). */
function k1Filers(inputs: ResolverInputs, joint: boolean): Filer[] {
  const { entities } = passThroughEntitiesOnReturn(inputs.facts, joint);
  return k1sOnForm6198(entities, {}).map(({ entity, items }) => {
    const activity = k1AtRiskActivity(entity, items);
    return {
      key: entity.key,
      copy: {
        description:
          typeof activity === "string" ? `${entity.name}, ${entity.ein}` : activity.description,
        owner: entity.holding?.owner ?? "taxpayer",
        outcome: figureK1Form6198(entity, items),
      },
    };
  });
}

/* Each Schedule C business with box 32b and a loss (schedule-c/atRisk.ts). */
function businessFilers(inputs: ResolverInputs, joint: boolean): Filer[] {
  const { businesses } = businessesOnReturn(inputs.facts, joint);
  const values = businesses.map((business) => business.value);
  return businesses.flatMap(({ key, value }) => {
    const beforeAtRisk = profitBeforeLossRules(value, values);
    if (beforeAtRisk === undefined || !businessNeedsForm6198(value, beforeAtRisk)) return [];
    return [
      {
        key,
        copy: {
          description: value.atRisk?.description ?? value.activity,
          owner: value.owner ?? "taxpayer",
          outcome: figureBusinessForm6198(value, beforeAtRisk, key),
        },
      },
    ];
  });
}

/*
 * Who files (irs-6198-inst-2025::sec::who-must-file::b01; irs-pub-925-2025::sec::at-risk-limits::b01):
 * an activity that had a loss and amounts not at risk, one copy per activity.
 * A K-1 files when the holding says some investment is not at risk and a loss
 * or deduction from the activity reaches the at-risk stage, or when the
 * at-risk limit carried a loss from an earlier year; a Schedule C business
 * when box 32b is checked and line 29 less line 30 is a loss
 * (irs-1040sc-inst-2025::sec::line-32::b03). The lines wait on the owner's
 * amounts at risk: the K-1's at_risk fact, or the business fact. The explicit
 * decision still wins.
 */
export function resolve6198Info(inputs: ResolverInputs): Form6198FilingInfo {
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  const filers = [...k1Filers(inputs, joint), ...businessFilers(inputs, joint)];
  const waiting = filers.flatMap(({ copy }) =>
    copy.outcome.kind === "waiting" ? copy.outcome.factKeys : [],
  );
  return {
    mustFile: {
      "form-6198": resolveMustFile(inputs.decisionByKey, {
        explicitKey: "decisions.scope.must_file_6198",
        fallbacks: [
          {
            rule: "fallback: an activity with a loss and amounts not at risk, or a carried at-risk loss",
            value: filers.length > 0,
            triggeredByFactKeys: filers.map((filer) => filer.key),
          },
        ],
      }),
    },
    missingInputs: { "form-6198": [...new Set(waiting)] },
    form6198Copies: filers.length > 0 ? filers.map((filer) => filer.copy) : undefined,
  };
}

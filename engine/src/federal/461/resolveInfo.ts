import { BUSINESS_LOSS_LIMIT_KEYS } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { filingStatusOf, num, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { resolve4797Info } from "../4797/resolveInfo.js";
import { resolve4835Info } from "../4835/resolveInfo.js";
import { excessBusinessLossThreshold, form461Required } from "../passThrough/excessBusinessLoss.js";
import { passThroughEntitiesOnReturn } from "../passThrough/items.js";
import { businessLossesBeforeExcessBusinessLoss } from "../passThrough/limits.js";
import { limitContextOf, receivedOnReturn } from "../passThrough/receipts.js";
import { spousePropertiesOnReturn } from "../rentals/passive.js";
import { passThroughGaps } from "../schedule-e/partII.js";
import { resolveScheduleEInfo } from "../schedule-e/resolveInfo.js";
import { resolveScheduleFInfo } from "../schedule-f/resolveInfo.js";
import { businessLossesOnReturn } from "./businessLosses.js";
import { rentalAnswerKey, sortK1Items, sortProperties } from "./classify.js";
import type { Form461Figures, Form461FilingInfo, Form461LineGaps } from "./filingInfo.js";

/*
 * Form 461 line 4 is Schedule 1 line 4 (irs-461-inst-2025::sec::line-4::b01),
 * which is Form 4797 line 18b (irs-1040-inst-2025::sec::line-4-2::b01). Form
 * 4797 has no rules yet, so the line is a gap while it files. When Form 4797
 * has rules, line 4 copies Schedule 1 line 4 the way line 2 copies line 3, and
 * this gap goes (QUESTIONS.md item 8 lists each change).
 */
const FORM_4797_GAP =
  "Form 4797 files and has no rules yet, so its line 18b, which Schedule 1 line 4 and Form 461 line 4 carry, is not known.";
const SCHEDULE_F_GAP =
  "Schedule F files, and the engine has no rules for it: Schedule 1 line 6 (Form 461 line 6) is not known.";
const FORM_4835_GAP =
  "Form 4835 files, and Schedule E line 40 (farm rental income, part of Form 461 line 5) is not modeled.";
const OVERFLOW_GAP =
  "More than three rental or royalty properties need a second Schedule E, which the engine does not fill: Schedule 1 line 5 (Form 461 line 5) is not known.";

const decided = (resolution: { mustFile?: Record<string, { value?: boolean }> }, formId: string) =>
  resolution.mustFile?.[formId]?.value === true;

/* The Part I lines the engine cannot fill on this return, each with its reason. */
function lineGaps(inputs: ResolverInputs): Form461LineGaps {
  const scheduleE = resolveScheduleEInfo(inputs);
  const line5 = [
    ...passThroughGaps(scheduleE),
    ...(scheduleE.rentalPropertiesOverflow ? [OVERFLOW_GAP] : []),
    ...(decided(resolve4835Info(inputs), "form-4835") ? [FORM_4835_GAP] : []),
  ];
  return {
    line4: decided(resolve4797Info(inputs), "form-4797") ? FORM_4797_GAP : undefined,
    line5: line5.length > 0 ? line5.join(" ") : undefined,
    line6: decided(resolveScheduleFInfo(inputs), "schedule-f") ? SCHEDULE_F_GAP : undefined,
  };
}

/*
 * What the lines read: the threshold (line 15), the two stated answers, and
 * Schedule E's amounts sorted into business and not business (classify.ts),
 * with the facts whose answer is still missing.
 */
export function form461Figures(inputs: ResolverInputs): {
  figures: Form461Figures;
  missing: string[];
} {
  const scheduleE = resolveScheduleEInfo(inputs);
  const onScheduleE = scheduleE.mustFile?.["schedule-e"]?.value === true;
  const onPartI = onScheduleE ? (scheduleE.rentalProperties ?? []) : [];
  const properties = sortProperties(onPartI);
  const rentalAnswer = (entityKey: string) => {
    const answer = inputs.factByKey.get(rentalAnswerKey(entityKey));
    return typeof answer === "boolean" ? answer : undefined;
  };
  const receipts = [
    receivedOnReturn(inputs, "schedule_e_part_ii"),
    receivedOnReturn(inputs, "schedule_e_part_iii"),
  ];
  const k1 = sortK1Items(receipts, rentalAnswer);
  const missing = [
    ...(properties.kind === "waiting" ? properties.factKeys : []),
    ...(k1.kind === "waiting" ? k1.factKeys : []),
  ];
  return {
    figures: {
      threshold: excessBusinessLossThreshold(filingStatusOf(inputs)),
      // Stated amounts in whole dollars, like the lines they join.
      businessCapitalGain: roundDollars(
        num(inputs, BUSINESS_LOSS_LIMIT_KEYS.businessCapitalGain) ?? 0,
      ),
      otherBusinessIncome: roundDollars(num(inputs, BUSINESS_LOSS_LIMIT_KEYS.otherBusinessIncome)),
      nonbusinessColumns: properties.kind === "sorted" ? properties.value : undefined,
      k1Nonbusiness: k1.kind === "sorted" ? k1.value : undefined,
      businessLosses: businessLossesOnReturn(inputs, onPartI, receipts, rentalAnswer),
      gaps: lineGaps(inputs),
    },
    missing,
  };
}

/*
 * The return's business losses added without any income, by the line they
 * reach: the K-1s' as the loss limits allow them before the excess business
 * loss stage, the other ones (Schedule C, rentals; undefined while an amount
 * is unknown) and a stated line 8 loss, positive. FTB 3461 reads them too.
 */
export function businessLossesWithoutIncome(inputs: ResolverInputs) {
  const context = limitContextOf(inputs);
  const joint = spousePropertiesOnReturn(filingStatusOf(inputs));
  const { entities } = passThroughEntitiesOnReturn(inputs.facts, joint);
  const line8 = num(inputs, BUSINESS_LOSS_LIMIT_KEYS.otherBusinessIncome) ?? 0;
  return {
    k1Losses: businessLossesBeforeExcessBusinessLoss(entities, context),
    other: context.otherBusinessLosses,
    line8Loss: line8 < 0 ? 0 - line8 : 0,
    entityKeys: entities.map((entity) => entity.key),
  };
}

/*
 * Who files (irs-461-inst-2025::sec::who-must-file::b01): a noncorporate
 * taxpayer whose "net losses from all of your trades or businesses are more
 * than $313,000 ($626,000 for taxpayers filing a joint return)", or who "would
 * report a loss of more than $156,500 on any one of Form 461, lines 1 through
 * 8". The resolver cannot see the lines, so it bounds them with the return's
 * business losses added without any income: the K-1s' as the loss limits
 * allow them before the excess business loss stage, the Schedule C losses,
 * the rentals' losses and a stated line 8 loss (excessBusinessLoss.ts,
 * form461Required). The explicit decision wins.
 */
export function resolve461Info(inputs: ResolverInputs): Form461FilingInfo {
  const { k1Losses, other, line8Loss, entityKeys } = businessLossesWithoutIncome(inputs);
  const status = filingStatusOf(inputs);
  const required = other !== undefined && form461Required(k1Losses, other, line8Loss, status);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_461",
    fallbacks: [
      {
        rule: "fallback: business losses, added without any income, of more than $156,500 on one Form 461 line (2, 5 or 8), or more than the threshold in all",
        value: required,
        triggeredByFactKeys: required ? entityKeys : [],
      },
    ],
  });
  if (mustFile.value !== true) return { mustFile: { "form-461": mustFile } };
  const { figures, missing } = form461Figures(inputs);
  return {
    mustFile: { "form-461": mustFile },
    missingInputs: { "form-461": [...new Set(missing)] },
    form461: figures,
  };
}

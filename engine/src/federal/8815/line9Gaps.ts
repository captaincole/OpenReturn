/*
 * Line 9 cases the engine does not figure. Each one adds an amount to
 * modified AGI, or needs a deduction figured before this exclusion, from a
 * form or a worksheet the engine does not have
 * (irs-8815-form-2025::sec::step-action::b01–b03).
 */

import {
  isW2FactKey,
  readRentalFacts,
  readTraditionalIraFact,
  type W2FactValue,
} from "../../facts/index.js";
import { factsInCategory, type ResolverInputs } from "../../resolverInputs.js";

export const IRA_CONTRIBUTION_GAP =
  "A traditional IRA contribution: Schedule 1 line 20 is figured before this exclusion (irs-8815-form-2025::sec::step-action::b01, step 3; Pub. 590-A), and the engine figures it from Form 1040 line 9, which this exclusion changes.";
export const FOREIGN_EXCLUSION_GAP =
  "Form 2555 or Form 4563 files: line 9 adds Form 2555 lines 45 and 50 and Form 4563 line 15 (irs-8815-form-2025::sec::step-action::b03), and neither form has rules yet.";
export const ADOPTION_BENEFITS_GAP =
  "Employer adoption benefits (W-2 box 12 code T): line 9 adds back the excluded part (irs-8815-form-2025::sec::step-action::b03), which needs Form 8839, not modeled.";
export const ROYALTY_INTEREST_GAP =
  "A royalty property with interest expense: step 6 figures that interest on a separate Form 4952 without this exclusion (irs-8815-form-2025::sec::step-action::b02), which the engine does not do.";

const contributedToTraditionalIra = (inputs: ResolverInputs) =>
  (["taxpayer", "spouse"] as const).some(
    (owner) => (readTraditionalIraFact(inputs.factByKey, owner)?.contributions ?? 0) > 0,
  );

const filesForeignExclusionForm = (inputs: ResolverInputs) =>
  inputs.decisionByKey.get("decisions.scope.must_file_2555") === true ||
  inputs.decisionByKey.get("decisions.scope.must_file_4563") === true;

const ADOPTION_BENEFITS_CODE = "T";

const hasAdoptionBenefits = (inputs: ResolverInputs) =>
  factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .some((row) =>
      ((row.value as W2FactValue).box12 ?? []).some(
        (entry) => entry.code.toUpperCase() === ADOPTION_BENEFITS_CODE && entry.amount > 0,
      ),
    );

const hasRoyaltyInterest = (inputs: ResolverInputs) =>
  readRentalFacts(inputs.facts).properties.some(
    ({ value }) =>
      value.propertyType === "royalties" &&
      ((value.expenses?.mortgageInterest ?? 0) > 0 || (value.expenses?.otherInterest ?? 0) > 0),
  );

/* The first case that applies, or undefined. */
export function line9Gap(inputs: ResolverInputs): string | undefined {
  if (contributedToTraditionalIra(inputs)) return IRA_CONTRIBUTION_GAP;
  if (filesForeignExclusionForm(inputs)) return FOREIGN_EXCLUSION_GAP;
  if (hasAdoptionBenefits(inputs)) return ADOPTION_BENEFITS_GAP;
  if (hasRoyaltyInterest(inputs)) return ROYALTY_INTEREST_GAP;
  return undefined;
}

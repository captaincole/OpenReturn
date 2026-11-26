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
import { factsInCategory, filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { resolve2555Info } from "../2555/resolveInfo.js";
import { iraAnswers } from "../schedule-1/answers.js";
import { iraWorksheetGap } from "../schedule-1/iraDeduction.js";
import { needsPub590AWorksheets } from "../schedule-1/pub590a.js";

export const IRA_CONTRIBUTION_GAP =
  "A traditional IRA contribution by a person covered by a retirement plan, or one Schedule 1 line 20 does not figure: the IRA deduction is figured before this exclusion (irs-8815-form-2025::sec::step-action::b01, step 3; Pub. 590-A), and the engine figures it from Form 1040 line 9, which this exclusion changes.";
export const FOREIGN_EXCLUSION_GAP =
  "Form 2555 or Form 4563 files: line 9 adds Form 2555 lines 45 and 50 and Form 4563 line 15 (irs-8815-form-2025::sec::step-action::b03), and neither form has rules yet.";
export const ADOPTION_BENEFITS_GAP =
  "Employer adoption benefits (W-2 box 12 code T): line 9 adds back the excluded part (irs-8815-form-2025::sec::step-action::b03), which needs Form 8839, not modeled.";
export const ROYALTY_INTEREST_GAP =
  "A royalty property with interest expense: step 6 figures that interest on a separate Form 4952 without this exclusion (irs-8815-form-2025::sec::step-action::b02), which the engine does not do.";

/*
 * Step 3 (step-action::b01) sends only a person covered by a plan at work or
 * through self-employment to Pub. 590-A. For anyone else Schedule 1 line 20 is
 * the contribution limit, the earned income or the contribution, whichever is
 * smallest, with no income test, and the Line 9 Worksheet subtracts it (line 4).
 * A gap when the person is covered, when line 20 itself is a gap (a joint
 * return, adoption benefits, Pub. 590-A), or when nondeductible contributions
 * are stated (line 20 then checks them against Form 1040 line 9's worksheet).
 */
function iraDeductionFiguredFirst(inputs: ResolverInputs): boolean {
  const spouse = readTraditionalIraFact(inputs.factByKey, "spouse");
  if ((spouse?.contributions ?? 0) > 0) return true;
  const ira = readTraditionalIraFact(inputs.factByKey, "taxpayer");
  if (!((ira?.contributions ?? 0) > 0)) return false;
  const answers = iraAnswers(inputs);
  const gap = iraWorksheetGap({
    status: filingStatusOf(inputs),
    coveredByPlan: answers.iraCoveredByPlan,
    adoptionBenefits: answers.iraAdoptionBenefits,
    livedApartAllYear: answers.livedApartAllYear,
    pub590aWorksheets: needsPub590AWorksheets(inputs),
  });
  return (
    answers.iraCoveredByPlan || gap !== undefined || (ira?.nondeductibleContributions ?? 0) > 0
  );
}

/* True when the taxpayer's IRA deduction (Schedule 1 line 20) goes on the Line 9 Worksheet. */
export const readsIraDeduction = (inputs: ResolverInputs): boolean =>
  (readTraditionalIraFact(inputs.factByKey, "taxpayer")?.contributions ?? 0) > 0;

const filesForeignExclusionForm = (inputs: ResolverInputs) =>
  resolve2555Info(inputs).mustFile?.["form-2555"]?.value === true ||
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
  if (iraDeductionFiguredFirst(inputs)) return IRA_CONTRIBUTION_GAP;
  if (filesForeignExclusionForm(inputs)) return FOREIGN_EXCLUSION_GAP;
  if (hasAdoptionBenefits(inputs)) return ADOPTION_BENEFITS_GAP;
  if (hasRoyaltyInterest(inputs)) return ROYALTY_INTEREST_GAP;
  return undefined;
}

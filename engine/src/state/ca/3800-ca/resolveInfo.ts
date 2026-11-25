import {
  CA_CHILD_UNEARNED_INCOME_KEYS as CA_KEYS,
  CHILD_UNEARNED_INCOME_KEYS as KEYS,
  isDividendFactKey,
  isInterestFactKey,
  readParentCaliforniaReturnFact,
  readParentReturnFact,
  type ParentCaliforniaReturnFactValue,
} from "../../../facts/index.js";
import {
  ageGroup,
  answer,
  meetsAgeCondition,
  type AgeGroup,
} from "../../../federal/8615/resolveInfo.js";
import { roundDollars, sum } from "../../../money.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  resolveMustFile,
  sumInvestmentBox,
  text,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import type { Form3800CaAnswers, Form3800CaFilingInfo } from "./filingInfo.js";
import { BASE_AMOUNT } from "./lines.js";

const FORM_ID = "form-3800-ca";
export const MUST_FILE_3800_CA_KEY = "decisions.scope.must_file_3800_ca";
const FILES_540_KEY = "decisions.scope.must_file_ca_540";
const RESIDENCY_KEY = "decisions.scope.ca_residency";

export const DEPENDENT_GAP =
  "Someone can claim the child as a dependent, so Form 540 line 18 needs the California Standard Deduction Worksheet for Dependents (ca-540-inst-2025::sec::california-standard-deduction-worksheet-for-dependents::b01), which the engine does not model; line 4 (Form 540 line 19) and the tax cannot be figured. The rules apply to a dependent child too (ca-3800-inst-2025::sec::purpose::b01).";

export const FORM_540NR_GAP =
  "The child is not a full-year California resident, so FTB 3800 attaches to Form 540NR and lines 15, 17 and 18 use the Form 540NR worksheets (ca-3800-inst-2025::sec::part-iii-child-s-tax::b02, ::b03), which read Form 540NR lines 17, 19, 32 and 35; the engine has no rules for Form 540NR.";

/*
 * The least California unearned income the documents show: taxable interest
 * (1099-INT box 1; box 3, U.S. obligations, is not taxed by California) and
 * ordinary dividends and capital gain distributions (1099-DIV boxes 1a and
 * 2a), each total rounded. Line 1 itself comes from the return (QUESTIONS.md).
 */
function californiaUnearnedFromDocuments(inputs: ResolverInputs): number {
  return sum(
    roundDollars(sumInvestmentBox(inputs, "box1", isInterestFactKey)),
    roundDollars(sumInvestmentBox(inputs, "box1a", isDividendFactKey)),
    roundDollars(sumInvestmentBox(inputs, "box2a", isDividendFactKey)),
  );
}

/* The child itemizes, as far as a resolver can tell: federal itemizing or Schedule A for California. */
function mayItemize(inputs: ResolverInputs): boolean {
  return (
    inputs.decisionByKey.get("decisions.itemize_vs_standard") === "itemized" ||
    inputs.decisionByKey.get("decisions.scope.must_file_schedule_a") === true
  );
}

/*
 * The header's parent: the California fact's, else the federal Form 8615
 * parent's ("enter the name and SSN or ITIN of the same parent who was
 * identified at the top of federal Form 8615", ::specific-line-instructions::b01).
 */
function parentOf(
  inputs: ResolverInputs,
  california: ParentCaliforniaReturnFactValue | undefined,
): Omit<Form3800CaAnswers, "itemizedForUnearnedIncome"> | undefined {
  if (california === undefined) return undefined;
  const federal = readParentReturnFact(inputs.facts);
  const parentName = california.name ?? federal?.name;
  const parentSsn = california.ssn ?? federal?.ssn;
  const parentFilingStatus = california.filingStatus ?? federal?.filingStatus;
  if (!parentName || !parentSsn || !parentFilingStatus) return undefined;
  return { parentName, parentSsn, parentFilingStatus, parent: california };
}

/* The answers the form reads, by key. */
function requiredAnswers(inputs: ResolverInputs, group: AgeGroup | undefined) {
  const parent = parentOf(inputs, readParentCaliforniaReturnFact(inputs.facts));
  return {
    [KEYS.parentAlive]: answer(inputs, KEYS.parentAlive),
    [KEYS.claimableAsDependent]: answer(inputs, KEYS.claimableAsDependent),
    [CA_KEYS.parentCaliforniaReturn]: parent,
    ...(group === "age_18" || group === "age_19_to_23"
      ? { [KEYS.earnedIncomeOverHalfOfSupport]: answer(inputs, KEYS.earnedIncomeOverHalfOfSupport) }
      : {}),
    ...(group === "age_19_to_23"
      ? { [KEYS.fullTimeStudent]: answer(inputs, KEYS.fullTimeStudent) }
      : {}),
    ...(mayItemize(inputs)
      ? {
          [CA_KEYS.californiaItemizedForUnearnedIncome]: num(
            inputs,
            CA_KEYS.californiaItemizedForUnearnedIncome,
          ),
        }
      : {}),
  };
}

/*
 * Who files (ca-3800-inst-2025::sec::purpose::b01): a child who files Form 540
 * or 540NR, is under 18 (or 18, or a full-time student under 24, whose earned
 * income was not more than half of their support), has a parent alive at the
 * end of 2025, does not file a joint return, and had more than $2,700 of
 * unearned income taxable by California. The documents stand in for line 1,
 * and a recorded parent's California return files the form too; line 1 at
 * $2,700 or less takes it off ("do not file this form", filesOnlyWithAmountOn
 * line 3 in bindings.ts). The explicit decision still wins.
 *
 * DECISION (2026-11-24, by the author, not reviewed by a person): the support
 * test applies to a full-time student aged 19 to 23, as on Form 8615.
 * ca-3800-inst-2025::sec::purpose::b01 lists it only for a child "age 18 at the
 * end of 2025"; ca-3800-inst-2025::sec::general-information::b01 says
 * California "conforms to the provision of the federal Small Business and Work
 * Opportunity Act of 2007 which increased the age of children to 18 and under
 * or a full-time student under age 24", and that provision (irs-8615-inst-2025::sec::who-must-file::b01,
 * condition 3c) holds the student to the same test. The engine follows the
 * conformity statement: the purpose list is a short summary of the federal
 * rule, and one rule for both returns keeps the child's two forms consistent.
 */
export function resolve3800CaInfo(inputs: ResolverInputs): Form3800CaFilingInfo {
  const group = ageGroup(text(inputs, "identity.dob"));
  const california = readParentCaliforniaReturnFact(inputs.facts);
  const unearned = californiaUnearnedFromDocuments(inputs);
  const eligible =
    inputs.decisionByKey.get(FILES_540_KEY) === true &&
    filingStatusOf(inputs) !== "married_filing_jointly" &&
    answer(inputs, KEYS.parentAlive) !== false &&
    meetsAgeCondition(inputs, group) !== false;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_3800_CA_KEY,
    fallbacks: [
      {
        rule: `fallback: a child (${group ?? "age unknown"}) with $${unearned} of California interest and dividends, or the parent's California return recorded`,
        value: eligible && (unearned > BASE_AMOUNT || california !== undefined),
        triggeredByFactKeys: [
          "identity.dob",
          ...(california ? [CA_KEYS.parentCaliforniaReturn] : []),
        ],
        triggeredByDecisionKeys: [FILES_540_KEY],
      },
    ],
  });
  const filed = { mustFile: { [FORM_ID]: resolution } };
  const none = { [FORM_ID]: [] as string[] };
  if (resolution.value !== true) return { ...filed, missingInputs: none };
  if (answer(inputs, KEYS.claimableAsDependent) === true) {
    return { ...filed, missingInputs: none, form3800CaGap: DEPENDENT_GAP };
  }
  const residency = inputs.decisionByKey.get(RESIDENCY_KEY);
  if (residency === "part_year" || residency === "non_resident") {
    return { ...filed, missingInputs: none, form3800CaGap: FORM_540NR_GAP };
  }
  const required = requiredAnswers(inputs, group);
  const missing = missingInputs(required);
  const parent = parentOf(inputs, california);
  if (missing.length > 0 || parent === undefined) {
    return { ...filed, missingInputs: { [FORM_ID]: missing } };
  }
  return {
    ...filed,
    missingInputs: none,
    form3800CaAnswers: {
      ...parent,
      itemizedForUnearnedIncome: num(inputs, CA_KEYS.californiaItemizedForUnearnedIncome),
    },
  };
}

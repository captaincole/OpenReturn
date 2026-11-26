/*
 * Form 7206 and Schedule 1 line 17: one fact per health insurance plan that is
 * established under a trade or business of the taxpayer or the spouse
 * (irs-7206-inst-2025::sec::general-instructions::b02). "If you have more than
 * one health plan during the year and each plan is established under a
 * different business, you must use a separate Form 7206" (::b06), so each plan
 * is one copy of the form, in the order recorded.
 *
 * Cade records a plan only when it is established under the business: for a
 * Schedule C or F business, a policy in the name of the business or of the
 * person; for a more-than-2% S corporation shareholder, premiums the S
 * corporation paid or reimbursed and reported as wages in W-2 box 1 (::b02,
 * ::b03). A policy that fails that test gives no deduction and is not recorded.
 * The taxpayer states every amount.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * The trade or business the plan is established under, and the fact that
 * holds it: a business fact (Schedule C), a farm fact (Schedule F), a
 * partnership K-1 fact (Form 1065), or the W-2 fact from the S corporation in
 * which the person is a more-than-2% shareholder.
 */
export type HealthPlanBusinessKind = "schedule_c" | "schedule_f" | "partnership" | "s_corporation";

export interface HealthPlanBusiness {
  kind: HealthPlanBusinessKind;
  factKey: string;
}

/*
 * Line 2: one person covered by a qualified long-term care insurance contract
 * (irs-7206-inst-2025::sec::general-instructions::b06, ::b07). Payments for a
 * month the person could join a subsidized employer long-term care plan are
 * left out (the form's line 2 note).
 */
export interface LongTermCareCoverage {
  /* The person's name, as it reads on the return: the age limit is per person across every plan. */
  person: string;
  /* The person's age at the end of 2025. */
  ageAtYearEnd: number;
  /* The premiums paid for that person in 2025, cents kept. */
  premiumsPaid: number;
}

export interface SelfEmployedHealthPlanFactValue {
  /* The plan's name for the reader: "Desert Mutual family PPO". */
  description: string;
  establishedUnder: HealthPlanBusiness;
  /*
   * Line 1: medical, dental and vision premiums paid in 2025 for 2025 coverage
   * of the taxpayer, the spouse, the dependents and any child under 27 at the
   * end of 2025 (irs-7206-inst-2025::sec::general-instructions::b04), cents
   * kept. Already without: months the person could join a subsidized employer
   * plan (::b09), amounts paid from nontaxable retired public safety officer
   * distributions, and long-term care premiums (the form's line 1). Medicare
   * premiums the person pays by choice count (::b03).
   */
  healthPremiums: number;
  /* Line 2: each person a qualified long-term care contract covers. Absent: none. */
  longTermCare?: LongTermCareCoverage[];
  /*
   * The plan was bought through the Health Insurance Marketplace (a Form
   * 1095-A). With advance payments of the premium tax credit, or a credit
   * claimed, Pub. 974 figures the deduction and the credit together
   * (irs-7206-inst-2025::sec::general-instructions::b06). Absent: not.
   */
  throughMarketplace?: boolean;
  /*
   * Line 9: the part of Schedule 1 line 16 (SEP, SIMPLE and qualified plan
   * contributions) made under the same business, cents kept. Absent: all of
   * line 16 when the return has one business or farm, else the line is a gap.
   */
  retirementPlanDeduction?: number;
}

export interface SelfEmployedHealthPlanFact {
  key: string;
  value: SelfEmployedHealthPlanFactValue;
}

const PLAN_CATEGORY = "health_coverage";
const PLAN_PREFIX = "se_health_plan.";

export function makeSelfEmployedHealthPlanFactKey(planSlug: string): string {
  return `${PLAN_PREFIX}${planSlug}`;
}

export function isSelfEmployedHealthPlanFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === PLAN_PREFIX && parts[1] !== "";
}

/* Every plan fact, in the order recorded: the order of the Forms 7206. */
export function getSelfEmployedHealthPlanFacts(
  facts: ReadonlyArray<FactRow>,
): SelfEmployedHealthPlanFact[] {
  return facts
    .filter((row) => row.category === PLAN_CATEGORY && isSelfEmployedHealthPlanFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as SelfEmployedHealthPlanFactValue }));
}

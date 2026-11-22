/*
 * California Schedule G-1: a qualified lump-sum distribution that the taxpayer
 * chooses to tax by the special methods (ca-540-sched-g1-inst-2025::sec::a-purpose::b01).
 * One fact per plan participant: "use Schedule G-1 only once for each plan
 * participant ... Combine the distributions on a single Schedule G-1", and a
 * separate schedule for each participant
 * (ca-540-sched-g1-inst-2025::sec::d-how-often-you-can-choose::b01).
 *
 * The amounts come from the Form 1099-R facts the fact names. The rest are the
 * taxpayer's answers: Part I, the two elections and the worksheet inputs that no
 * 1099-R prints. Federal Form 4972 asks the same Part I questions; this fact is
 * California's answers only.
 */

type FactRow = { key: string; value: unknown; category: string };

/* One Form 1099-R fact: makeRetirementDistributionFactKey(payerSlug, distributionId). */
export interface CaLumpSumDistributionRef {
  payerSlug: string;
  distributionId: string;
}

export interface CaLumpSumDistributionFactValue {
  /* The participant's 1099-Rs. More than one are added together (::specific-line-instructions::b01). */
  distributions: CaLumpSumDistributionRef[];
  /* Part I line 1: the participant's entire balance from all of an employer's qualified plans of one kind. */
  entireBalance: boolean;
  /* Line 2: any part rolled over. */
  rolledOver: boolean;
  /* Line 3: paid as a beneficiary of a participant born before January 2, 1936. */
  beneficiaryOfParticipantBornBefore1936: boolean;
  /* Line 4: the recipient is the participant, born before January 2, 1936, in the plan 5 years or more. */
  participantBornBefore1936FiveYears: boolean;
  /* Line 5: Schedule G-1 was used in a prior year for a distribution after 1986 for this participant. */
  usedScheduleG1After1986: boolean;
  /* Part II: the 5.5% capital gain election (::f-capital-gain-election::b01). */
  capitalGainElection: boolean;
  /* Part III: the 10-year averaging method (::10-year-averaging-method-capital-gain-election::b01). */
  tenYearAveraging: boolean;
  /* The election to include box 6 (net unrealized appreciation) in taxable income. Absent: not included. */
  includeNua?: boolean;
  /*
   * The recipient's share of the $5,000 death benefit exclusion, for a
   * participant who died before August 21, 1996 (::death-benefit-worksheet::b01).
   * Absent: none.
   */
  deathBenefitExclusion?: number;
  /*
   * FTB Pub. 1005, Worksheet I: the California taxable amount when the
   * California basis differs from the federal one (a Keogh plan with pre-1987
   * contributions over the California limit, ftb-pub-1005-2025::sec::lump-sum-distribution::b01).
   * Absent: the federal taxable amount, box 2a.
   */
  californiaTaxableAmount?: number;
}

export interface CaLumpSumDistributionFact {
  key: string;
  value: CaLumpSumDistributionFactValue;
}

const LUMP_SUM_CATEGORY = "retirement";
const LUMP_SUM_PREFIX = "retirement.ca_lump_sum.";

/* The participant: "taxpayer", "spouse", or a slug of a deceased participant's name. */
export function makeCaLumpSumDistributionKey(participantSlug: string): string {
  return `${LUMP_SUM_PREFIX}${participantSlug}`;
}

/* The key Cade records the taxpayer's own distribution under; the form asks for it when it waits. */
export const CA_LUMP_SUM_OWN_KEY = makeCaLumpSumDistributionKey("taxpayer");

export function isCaLumpSumDistributionKey(key: string): boolean {
  if (!key.startsWith(LUMP_SUM_PREFIX)) return false;
  const slug = key.slice(LUMP_SUM_PREFIX.length);
  return slug !== "" && !slug.includes(".");
}

/* Every lump-sum fact, in the order recorded. */
export function getCaLumpSumDistributionFacts(
  facts: ReadonlyArray<FactRow>,
): CaLumpSumDistributionFact[] {
  return facts
    .filter((row) => row.category === LUMP_SUM_CATEGORY && isCaLumpSumDistributionKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as CaLumpSumDistributionFactValue }));
}

const ANSWER_FIELDS = [
  "entireBalance",
  "rolledOver",
  "beneficiaryOfParticipantBornBefore1936",
  "participantBornBefore1936FiveYears",
  "usedScheduleG1After1986",
  "capitalGainElection",
  "tenYearAveraging",
] as const;

/* Every answer is stated and at least one 1099-R is named; else Cade asks again. */
export function isCompleteCaLumpSumDistribution(value: CaLumpSumDistributionFactValue): boolean {
  const answered = ANSWER_FIELDS.every((field) => typeof value?.[field] === "boolean");
  return answered && Array.isArray(value.distributions) && value.distributions.length > 0;
}

/*
 * Part I: "If 'No,' do not use this form" (line 1), "If 'Yes,' do not use this
 * form" (lines 2 and 5), and "If you answered 'No' to both questions 3 and 4,
 * do not use this form" (the blank form).
 */
export function qualifiesForScheduleG1(value: CaLumpSumDistributionFactValue): boolean {
  return (
    value.entireBalance &&
    !value.rolledOver &&
    (value.beneficiaryOfParticipantBornBefore1936 || value.participantBornBefore1936FiveYears) &&
    !value.usedScheduleG1After1986
  );
}

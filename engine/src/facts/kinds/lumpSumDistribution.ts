/*
 * Form 4972: the special tax on a qualified lump-sum distribution of a plan
 * participant born before January 2, 1936 (irs-4972-form-2025::sec::general-instructions::b01).
 * One fact per plan participant: "If you received more than one qualified
 * distribution in 2025 for the same plan participant, add them ... If you
 * received qualified distributions in 2025 for more than one participant, file
 * a separate Form 4972 for the distributions of each participant"
 * (irs-4972-form-2025::sec::specific-instructions::b01).
 *
 * The amounts come from the Forms 1099-R the fact names (boxes 2a, 3, 6, 8 and
 * 9a). The fact holds the Part I answers, the elections, and the two amounts
 * that a beneficiary gets from the estate, not from the 1099-R.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * How the recipient received the distribution: as the plan participant (line 4),
 * as a beneficiary after the participant's death (line 3), or as a spouse or
 * former spouse under a qualified domestic relations order
 * (irs-4972-form-2025::sec::what-is-a-qualified-lump-sum::b01).
 */
export type LumpSumRecipientRole = "participant" | "beneficiary" | "alternate_payee";

export interface LumpSumDistributionFactValue {
  /* The Form 1099-R fact keys (payer.<slug>.distributions.<id>) of this participant's distributions. */
  distributionKeys: string[];
  receivedAs: LumpSumRecipientRole;
  /* Line 1: the participant's entire balance from all of an employer's qualified plans of one kind. */
  entireBalance: boolean;
  /* Line 2: any part of the distribution was rolled over. */
  rolledOverAnyPart: boolean;
  /* Lines 3 and 4(b): the plan participant was born before January 2, 1936. */
  participantBornBefore1936: boolean;
  /* Line 4(c): a participant in the plan for at least 5 years before the year of the distribution. Asked of a participant. */
  participantFiveYears?: boolean;
  /* Line 5a: used Form 4972 after 1986 for a previous distribution from the recipient's own plan. */
  priorElectionOwnPlan: boolean;
  /* Line 5b: as a beneficiary, used Form 4972 after 1986 for a previous distribution of this participant. Asked of a beneficiary. */
  priorElectionAsBeneficiary?: boolean;
  /* Part II: the 20% capital gain election on Form 1099-R box 3. */
  capitalGainElection: boolean;
  /* Part III: the 10-year tax option. */
  tenYearOption: boolean;
  /* The election to include the net unrealized appreciation (box 6) in taxable income (irs-4972-form-2025::sec::capital-gain-election::b02). Absent: not included. */
  includeNua?: boolean;
  /*
   * A beneficiary of a participant who died before August 21, 1996: the allowable
   * death benefit exclusion, up to $5,000, before any split among recipients
   * (irs-4972-form-2025::sec::line-9::b01). Absent: none.
   */
  deathBenefitExclusion?: number;
  /*
   * A beneficiary: the federal estate tax paid on the lump-sum distribution, from
   * the administrator of the estate (irs-4972-form-2025::sec::line-18::b01). Absent: none.
   */
  federalEstateTax?: number;
}

export interface LumpSumDistributionFact {
  key: string;
  value: LumpSumDistributionFactValue;
}

const LUMP_SUM_CATEGORY = "retirement";
const LUMP_SUM_PREFIX = "retirement.lump_sum_distribution.";

/* One participant's distributions: the slug names the participant ("own_plan", "father"). */
export function makeLumpSumDistributionFactKey(participantSlug: string): string {
  return `${LUMP_SUM_PREFIX}${participantSlug}`;
}

export function isLumpSumDistributionFactKey(key: string): boolean {
  if (!key.startsWith(LUMP_SUM_PREFIX)) return false;
  const slug = key.slice(LUMP_SUM_PREFIX.length);
  return slug !== "" && !slug.includes(".");
}

/* Every lump-sum fact, in the order recorded: the order of the Forms 4972. */
export function getLumpSumDistributionFacts(
  facts: ReadonlyArray<FactRow>,
): LumpSumDistributionFact[] {
  return facts
    .filter((row) => row.category === LUMP_SUM_CATEGORY && isLumpSumDistributionFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as LumpSumDistributionFactValue }));
}

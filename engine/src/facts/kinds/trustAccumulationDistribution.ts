/*
 * Form 4970: an accumulation distribution from a trust. One fact per trust, in
 * the order the beneficiary wants the distributions considered made ("You can
 * arrange the distributions in any order you want",
 * irs-4970-form-2025::sec::purpose-of-form::b01).
 *
 * The amounts are Part IV of Schedule J (Form 1041), which the trustee gives
 * the beneficiary ("The trustee must give you a completed Part IV of Schedule J
 * (Form 1041) so you can complete this form", purpose-of-form::b01). Each row is
 * one throwback year, lines 32 to 36 (more rows when the trust attaches more
 * years: "There can be more than 5 'throwback years'", line-8::b01). The other
 * fields are the beneficiary's answers.
 */

type FactRow = { key: string; value: unknown; category: string };

/* One throwback year of Schedule J (Form 1041) Part IV, lines 32 to 36. */
export interface ThrowbackYearRow {
  /* The throwback year printed on the line (the trust's tax year, as 2018). */
  year: number;
  /* Column (a): this beneficiary's share of Schedule J line 13 (the UNI considered distributed). */
  amount: number;
  /* Column (b): this beneficiary's share of Schedule J line 14 (the trust's taxes on it). */
  taxes: number;
  /* Column (c): this beneficiary's share of Schedule J line 16 (tax-exempt interest in column (a)). Absent: none. */
  taxExemptInterest?: number;
  /*
   * The beneficiary's answer for the multiple trust rule
   * (irs-4970-form-2025::sec::line-4::b01): how many OTHER trusts made
   * accumulation distributions to the beneficiary (this year or earlier) that
   * are considered made in this same year, counting only a trust whose
   * distributions considered made in this year add up to $1,000 or more.
   * Absent: none.
   */
  otherTrustsCounted?: number;
}

export interface TrustAccumulationDistributionFactValue {
  /* Header C: the trust's name, and its address on one line. */
  trustName: string;
  trustAddress: string;
  /* Header D. */
  trustEin: string;
  /*
   * Header E. A foreign trust's distribution goes on Form 3520, not here
   * (irs-4970-form-2025::sec::who-must-file::b01, specific-instructions::b01).
   */
  trustType: "domestic" | "foreign";
  /* Who must file: "certain domestic trusts that were created before March 1, 1984" (who-must-file::b01). */
  createdBeforeMarch1984: boolean;
  /* A domestic trust that used to be a foreign trust: "see Rev. Rul. 91-6" (who-must-file::b01). Absent: no. */
  formerlyForeign?: boolean;
  /* Whose distribution it is on a joint return: the header's number and date of birth. Absent: the taxpayer. */
  beneficiary?: "taxpayer" | "spouse";
  /* Schedule J (Form 1041) Part IV, lines 32 to 36 (and any attached years). */
  throwbackYears: ThrowbackYearRow[];
  /*
   * Line 28: estate tax or generation-skipping transfer tax applies to the
   * accumulation distribution ("reduce the partial tax proportionately for those
   * taxes", line-28::b01).
   */
  estateOrGenerationSkippingTax: boolean;
  /*
   * FTB 5870A: what the trustee tells a California beneficiary. Absent while
   * the beneficiary has not given it; a trust with only a California
   * distribution has no federal throwback years ([]).
   */
  california?: CaliforniaTrustDistribution;
}

/*
 * The beneficiary's interest, which picks the part of FTB 5870A
 * (ca-5870a-inst-2025::sec::purpose::b01, ::b02):
 * - "schedule_j": noncontingent, with Schedule J (541) from a trust that filed
 *   Form 541 and paid the tax: Part I (IRC section 667);
 * - "contingent": an otherwise contingent beneficiary with no Schedule J (541):
 *   Part II (R&TC section 17745(b) and (d));
 * - "untaxed": noncontingent with no Schedule J (541), because the trust did not
 *   file Form 541 or pay the tax: no FTB 5870A; the whole amount goes on
 *   Schedule CA (540) line 8z column C (R&TC section 17745(a)).
 */
export type CaliforniaBeneficiaryInterest = "schedule_j" | "contingent" | "untaxed";

export interface CaliforniaTrustDistribution {
  beneficiaryInterest: CaliforniaBeneficiaryInterest;
  /* The header: the trust's address, in the form's four boxes. */
  trustStreet: string;
  trustCity: string;
  trustState: string;
  trustZip: string;
  /*
   * Part I: Schedule J (541) Part IV, one row per throwback year (lines 26 to
   * 29, more rows when the trust attaches more years: "There can be more than
   * four throwback years", ca-5870a-inst-2025::sec::part-i-tax-on-accumulation-distribution::b04).
   * California amounts: column (a) the UNI, (b) the California taxes, (c) the
   * tax-exempt interest; otherTrustsCounted is the multiple trust rule (::b03).
   */
  throwbackYears?: ThrowbackYearRow[];
  /*
   * Part II line 1, or the "untaxed" amount for Schedule CA: "Total amount of
   * the accumulation distribution" that the trustee must provide
   * (ca-5870a-inst-2025::sec::part-ii-tax-on-distributions-of-previously-untaxed-trust-income::b01).
   */
  accumulationDistribution?: number;
  /* Part II: "Total number of years that the trust income was accumulated" (the same block). */
  accumulationYears?: number;
  /*
   * Part II Section A line 5, Section B line 7: the distribution is a capital
   * gain distribution, which needs each year's capital loss refigured
   * (ca-5870a-inst-2025::sec::section-a::b03). Absent: ordinary income.
   */
  capitalGain?: boolean;
}

export interface TrustAccumulationDistributionFact {
  key: string;
  value: TrustAccumulationDistributionFactValue;
}

const TRUST_CATEGORY = "trust_estate";
const TRUST_PREFIX = "trust_accumulation_distribution.";

export function makeTrustAccumulationDistributionFactKey(trustSlug: string): string {
  return `${TRUST_PREFIX}${trustSlug}`;
}

export function isTrustAccumulationDistributionFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === TRUST_PREFIX && parts[1] !== "";
}

/* Every trust fact, in the order recorded: the order the distributions are considered made. */
export function getTrustAccumulationDistributionFacts(
  facts: ReadonlyArray<FactRow>,
): TrustAccumulationDistributionFact[] {
  return facts
    .filter(
      (row) => row.category === TRUST_CATEGORY && isTrustAccumulationDistributionFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as TrustAccumulationDistributionFactValue }));
}

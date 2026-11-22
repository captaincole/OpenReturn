/*
 * Form 8814: one fact per child whose interest and dividends the parents may
 * report on their own return. It holds the totals of the child's Forms 1099-INT
 * and 1099-DIV, and the answers the election needs that no document gives
 * (irs-8814-inst-2025::sec::general-instructions::b01). The key names the
 * child's dependent fact (dependent.<slug>), which holds the name, SSN, date of
 * birth and full-time student status. Category dependents, so no sum of the
 * parents' own investment income counts it. California's FTB 3803 reads the
 * same fact, with the California fields at the end.
 *
 * Nominee amounts and the accrued-interest, bond-premium and OID adjustments
 * (::line-1a::b01, ::line-2a::b01, ::line-3::b03) have no field: the engine
 * does not model them.
 */

type FactRow = { key: string; value: unknown; category: string };

export interface ChildInvestmentIncomeFactValue {
  /* Line 1a: taxable interest (1099-INT boxes 1 and 3). */
  taxableInterest?: number;
  /* Line 1b: tax-exempt interest (1099-INT box 8, 1099-DIV box 12). */
  taxExemptInterest?: number;
  /* The part of taxExemptInterest from specified private activity bonds (1099-INT box 9, 1099-DIV box 13). */
  privateActivityBondInterest?: number;
  /* Line 2a: ordinary dividends (1099-DIV box 1a), with any Alaska Permanent Fund dividends. */
  ordinaryDividends?: number;
  /* The Alaska Permanent Fund dividends included in ordinaryDividends: not investment income (Pub. 550). */
  alaskaPermanentFundDividends?: number;
  /* Line 2b: qualified dividends (1099-DIV box 1b). */
  qualifiedDividends?: number;
  /* Line 3: capital gain distributions (1099-DIV box 2a). */
  capitalGainDistributions?: number;
  /* The parts of capitalGainDistributions in 1099-DIV boxes 2b, 2c and 2d. */
  unrecapturedSection1250Gain?: number;
  section1202Gain?: number;
  collectiblesGain?: number;
  /* Federal income tax withheld (1099-INT and 1099-DIV box 4). */
  federalTaxWithheld?: number;
  /* Answer: estimated tax paid for 2025 under the child's name and SSN, a 2024 overpayment applied included. */
  estimatedTaxPaid?: boolean;
  /* Answer: the child had income other than interest and dividends (wages, for example). */
  hadOtherIncome?: boolean;
  /*
   * California (FTB 3803, ca-3803-inst-2025::sec::line-1a::b01, ::line-1b::b01).
   * The part of taxableInterest from U.S. savings bonds and Treasury obligations
   * (1099-INT box 3): California does not tax it, so it moves to FTB 3803 line 1b.
   */
  usObligationInterest?: number;
  /*
   * The part of taxExemptInterest that California taxes: interest on another
   * state's bonds, and exempt-interest dividends California does not exempt
   * (1099-INT box 8 or 1099-DIV box 12 with another state in the state box).
   * It moves to FTB 3803 line 1a.
   */
  taxExemptInterestTaxedByCalifornia?: number;
  /* California tax withheld (1099-INT box 17, 1099-DIV box 16): backup withholding bars FTB 3803. */
  stateTaxWithheld?: number;
  /* Answer: California estimated tax paid for 2025 under the child's name, a 2024 California overpayment applied included. */
  californiaEstimatedTaxPaid?: boolean;
}

export interface ChildInvestmentIncomeFact {
  dependentSlug: string;
  income: ChildInvestmentIncomeFactValue;
  factKey: string;
}

const CHILD_INCOME_CATEGORY = "dependents";
const KEY_START = "dependent.";
const KEY_END = ".investment_income";

export function makeChildInvestmentIncomeFactKey(dependentSlug: string): string {
  return `${KEY_START}${dependentSlug}${KEY_END}`;
}

/* The dependent slug between the key's start and end, with no dot; undefined for any other key. */
function dependentSlugOf(key: string): string | undefined {
  if (!key.startsWith(KEY_START) || !key.endsWith(KEY_END)) return undefined;
  const slug = key.slice(KEY_START.length, key.length - KEY_END.length);
  return slug === "" || slug.includes(".") ? undefined : slug;
}

export function isChildInvestmentIncomeFactKey(key: string): boolean {
  return dependentSlugOf(key) !== undefined;
}

/* Every child's investment income fact, in the order recorded: the order of the Forms 8814. */
export function getChildInvestmentIncomeFacts(
  facts: ReadonlyArray<FactRow>,
): ChildInvestmentIncomeFact[] {
  return facts.flatMap((row) => {
    const slug = dependentSlugOf(row.key);
    return row.category === CHILD_INCOME_CATEGORY && slug !== undefined
      ? [
          {
            dependentSlug: slug,
            income: row.value as ChildInvestmentIncomeFactValue,
            factKey: row.key,
          },
        ]
      : [];
  });
}

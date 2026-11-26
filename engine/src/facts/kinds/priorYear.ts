/* The 2024 CA balance paid in 2025 is a 2025 payment (Schedule A line 5a), asked with the prior-year answers. */

import type { FactsView } from "../../types.js";

export const PRIOR_YEAR_KEYS = {
  /* Picks the 100% / 110% safe harbor. */
  federalAgi: "prior_year.federal_agi",
  /*
   * The 2024 tax as Form 2210 line 8 figures it, before the 110%: 2024 Form 1040
   * line 22 plus the listed Schedule 2 lines, less the listed refundable credits
   * (irs-2210-inst-2025::sec::line-8::b01, line-19::b02). On a 2025 joint return
   * after 2024 separate returns, both spouses' 2024 tax; on a 2025 separate
   * return after a 2024 joint return, this filer's share (line-19::b03).
   */
  federalTax: "prior_year.federal_tax",
  /*
   * true when the filer (or either spouse) filed a joint 2024 return. Form 2210
   * box E compares it with the 2025 filing status.
   */
  filedJointReturn: "prior_year.filed_joint_return",
  /*
   * true when there was no 2024 return, or it covered less than 12 months:
   * Form 2210 line 8 stays blank and line 9 is line 5 (line-19::b03).
   */
  noTwelveMonthReturn: "prior_year.no_twelve_month_return",
  /*
   * The 2024 California tax as FTB 5805 line 5 and FTB 5805F line 9 take it:
   * 2024 Form 540 lines 48, 61 and 62 and any IRC Section 453A interest from
   * line 63, less the line 34 tax on lump-sum and accumulation distributions
   * (ca-5805-inst-2025::sec::part-ii-computing-the-required-annual-payment::b01).
   */
  caTax: "prior_year.ca_tax",
  /*
   * FTB 5805F line 8: the 2024 Form 540 line 34 tax on lump-sum distributions
   * and accumulation distributions of trusts. Recorded only when there was one.
   */
  caLumpSumTax: "prior_year.ca_lump_sum_tax",
  /*
   * FTB 5805F exception 2: the 2024 Form 540 lines 71 and 73, California tax
   * withheld (ca-5805f-inst-2025::sec::d-exceptions-to-the-penalty::b01).
   */
  caWithholding: "prior_year.ca_withholding",
  /*
   * true when there was no 2024 California return, or it covered less than 12
   * months: FTB 5805F lines 7 to 9 stay blank and line 10 is line 4.
   */
  caNoTwelveMonthReturn: "prior_year.ca_no_twelve_month_return",
  caBalancePaidThisYear: "prior_year.ca_balance_paid_this_year",
  /*
   * Form 1116 line 10: unused foreign tax from earlier years that may be carried
   * to 2025 in the category, a number (0 when none). It is Schedule B (Form 1116)
   * line 3, column (xiv) (irs-1116-inst-2025::sec::part-iii-figuring-the-credit::b01).
   */
  foreignTaxCarryoverPassive: "prior_year.foreign_tax_carryover_passive",
  foreignTaxCarryoverGeneral: "prior_year.foreign_tax_carryover_general",
  /*
   * Form 1116 line 16: true when an earlier year left an overall foreign loss, a
   * separate limitation loss or an overall domestic loss account with a balance
   * (irs-1116-inst-2025::sec::line-16::b06–b13). The engine cannot recapture one.
   */
  foreignLossAccounts: "prior_year.foreign_loss_accounts",
} as const;

export interface PriorYear {
  federalAgi?: number;
  federalTax?: number;
  caTax?: number;
  caBalancePaidThisYear?: number;
  factKeys: string[];
}

export function getPriorYear(facts: FactsView): PriorYear {
  const out: PriorYear = { factKeys: [] };
  const read = (key: string): number | undefined => {
    const row = facts.get(key);
    if (row === undefined) return undefined;
    out.factKeys.push(key);
    return row.value as number;
  };
  out.federalAgi = read(PRIOR_YEAR_KEYS.federalAgi);
  out.federalTax = read(PRIOR_YEAR_KEYS.federalTax);
  out.caTax = read(PRIOR_YEAR_KEYS.caTax);
  out.caBalancePaidThisYear = read(PRIOR_YEAR_KEYS.caBalancePaidThisYear);
  return out;
}

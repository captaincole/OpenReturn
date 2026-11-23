/* The 2024 CA balance paid in 2025 is a 2025 payment (Schedule A line 5a), asked with the prior-year answers. */

import type { FactsView } from "../../types.js";

export const PRIOR_YEAR_KEYS = {
  /* Picks the 100% / 110% safe harbor. */
  federalAgi: "prior_year.federal_agi",
  /* 2024 Form 1040 line 22 plus Schedule 2 taxes (the Form 2210 line 8 value). */
  federalTax: "prior_year.federal_tax",
  caTax: "prior_year.ca_tax",
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

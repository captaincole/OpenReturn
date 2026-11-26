/*
 * Schedule 3 line 11, the excess social security tax withheld, for one
 * person: "If you, or your spouse if filing a joint return, had more than one
 * employer for 2025 and total wages of more than $176,100, too much social
 * security or tier 1 railroad retirement (RRTA) tax may have been withheld.
 * You can take a credit on this line for the amount withheld in excess of
 * $10,918.20 ... Figure this amount separately for you and your spouse"
 * (irs-1040-inst-2025::sec::line-11-2::b01). The steps are Pub. 3's worksheet
 * (irs-pub-3-2025::sec::credit-for-excess-social-security-tax-withheld-worksheet::b01).
 *
 * One employer that withheld too much gives no amount here: "if any one
 * employer withheld more than $10,918.20, you can't claim the excess on your
 * return. The employer should adjust the tax for you" (line-11-2::b01). The
 * cap on each employer below does that.
 */

import type { W2FactValue } from "../../facts/index.js";
import { roundToPlaces, sum } from "../../money.js";
import { ein } from "../../values.js";
import { SOCIAL_SECURITY_TAX_RATE, SOCIAL_SECURITY_WAGE_BASE } from "../4137/lines.js";

/*
 * The most social security tax one person owes on 2025 wages: 6.2% of the
 * $176,100 wage base, $10,918.20 (irs-1040-inst-2025::sec::line-11-2::b01).
 */
export const MAX_SOCIAL_SECURITY_TAX_2025 = roundToPlaces(
  SOCIAL_SECURITY_WAGE_BASE * SOCIAL_SECURITY_TAX_RATE,
  2,
);

/*
 * The W-2 box 14 labels of a railroad employer: "Label them 'RRTA
 * compensation,' 'Tier 1 tax,' 'Tier 2 tax,' ..."
 * (irs-w2w3-inst-2025::sec::the-tax-cuts-and-jobs-act-of-2017-public-law::b13).
 */
const RAILROAD_LABEL_WORDS = ["RRTA", "TIER 1", "TIER 2"] as const;

/*
 * W-2 box 12 codes A and M: uncollected social security (or RRTA) tax on tips
 * and on group-term life insurance. Pub. 3's worksheet line 2 adds them, and
 * the engine does not figure them (Schedule 2 line 13 is unsupported).
 */
const UNCOLLECTED_SOCIAL_SECURITY_CODES = ["A", "M"] as const;

export const RAILROAD_W2_GAP =
  "A W-2 of this person shows railroad retirement (RRTA) tax in box 14, and the engine has no input for the tier 1 RRTA tax that line 11 adds (irs-1040-inst-2025::sec::line-11-2::b01).";
export const UNCOLLECTED_TAX_GAP =
  "A W-2 of this person shows uncollected social security tax in box 12 (code A or M), which the excess social security worksheet adds (irs-pub-3-2025::sec::credit-for-excess-social-security-tax-withheld-worksheet::b01), and Schedule 2 line 13 is not computed.";

/* One person's line 11 in dollars and cents, or why the engine cannot figure it. */
export type ExcessSocialSecurity = { amount: number } | { gap: string };

function isRailroadW2(w2: W2FactValue): boolean {
  return (w2.box14 ?? []).some((entry) => {
    const label = String(entry.label ?? "").toUpperCase();
    return RAILROAD_LABEL_WORDS.some((word) => label.includes(word));
  });
}

function hasUncollectedSocialSecurity(w2: W2FactValue): boolean {
  return (w2.box12 ?? []).some((entry) =>
    UNCOLLECTED_SOCIAL_SECURITY_CODES.some(
      (code) => String(entry.code ?? "").toUpperCase() === code,
    ),
  );
}

/* The employer of a W-2: its EIN's nine digits, or the EIN as stated when it is not nine digits. */
function employerOf(w2: W2FactValue): string {
  try {
    return ein(w2.employerEin);
  } catch {
    return w2.employerEin;
  }
}

/* Box 4 of each employer, its W-2s added, in cents. */
function socialSecurityTaxByEmployer(w2s: readonly W2FactValue[]): number[] {
  const byEmployer = new Map<string, number>();
  for (const w2 of w2s) {
    const employer = employerOf(w2);
    byEmployer.set(employer, sum(byEmployer.get(employer), w2.box4));
  }
  return [...byEmployer.values()];
}

/*
 * DECISION (2026-11-26, by the author): two or more employers, one of which
 * withheld too much (docs/rule-decisions.md, row A68). The Form 1040
 * instructions: "But if any one employer withheld more than $10,918.20, you
 * can't claim the excess on your return" (irs-1040-inst-2025::sec::line-11-2::b01),
 * which can be read as no credit at all. Pub. 3: "you can't take a credit for
 * the excess social security tax withheld over $10,918.20 by that employer",
 * and its worksheet line 1: "Add all social security tax withheld (but not
 * more than $10,918.20 for each employer)"
 * (irs-pub-3-2025::sec::credit-for-excess-social-security-tax::b02,
 * ::credit-for-excess-social-security-tax-withheld-worksheet::b01). The engine
 * follows Pub. 3: each employer counts up to $10,918.20, and the total over
 * $10,918.20 is the credit. Pub. 3 gives the steps, and the Form 1040 sentence
 * names that employer's own excess, which the employer refunds.
 *
 * One person's excess social security tax (worksheet lines 1 to 5), from that
 * person's W-2s. Line 1 caps each employer at $10,918.20, so one employer
 * gives 0. A railroad W-2 or uncollected tax in box 12 is a gap only with two
 * or more employers: with one, line 11 has no amount in any case.
 */
export function excessSocialSecurityOf(w2s: readonly W2FactValue[]): ExcessSocialSecurity {
  const byEmployer = socialSecurityTaxByEmployer(w2s);
  if (byEmployer.length < 2) return { amount: 0 };
  if (w2s.some(isRailroadW2)) return { gap: RAILROAD_W2_GAP };
  if (w2s.some(hasUncollectedSocialSecurity)) return { gap: UNCOLLECTED_TAX_GAP };
  const line1 = sum(
    ...byEmployer.map((withheld) => Math.min(withheld, MAX_SOCIAL_SECURITY_TAX_2025)),
  );
  const excess = roundToPlaces(line1 - MAX_SOCIAL_SECURITY_TAX_2025, 2);
  return { amount: excess > 0 ? excess : 0 };
}

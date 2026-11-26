/*
 * Form 982 Part I, the first step: for each debt, the part excluded in a title
 * 11 case (line 1a), as qualified principal residence indebtedness (line 1e)
 * and to the extent insolvent (line 1b), and what is left for the farm (line
 * 1c) and real property business (line 1d) exclusions. Those two have limits
 * that read the tax attributes after the insolvency reductions, so form.ts
 * figures them after Part II's first pass.
 *
 * The order is the law's: a title 11 discharge takes no other exclusion
 * (irs-982-inst-2025::sec::line-1b::b01, line-1c::b01, line-1d::b01, line-1e::b01);
 * the principal residence exclusion comes before insolvency unless the
 * taxpayer elects insolvency (line-1b::b01); insolvency comes before the farm
 * and real property business exclusions (irs-pub-4681-2025::sec::qualified-farm-indebtedness::b02,
 * qualified-real-property::b03).
 */

import { amountOrZero, type DebtInput } from "./lines.js";

export interface DebtSplit {
  debt: DebtInput;
  title11: number;
  principalResidence: number;
  insolvency: number;
  /* What is left after lines 1a, 1e and 1b, before the farm or real property business limits. */
  rest: number;
  /* The line 1d candidate: the rest, up to the first limit (principal over net value). */
  realPropertyCandidate: number;
}

/*
 * Line 1e with the ordering rule: "the exclusion applies only to the extent the
 * amount discharged exceeds the amount of the loan (immediately before the
 * discharge) that is not qualified principal residence indebtedness"
 * (irs-982-inst-2025::sec::line-1e::b03), and the qualified part counts only up
 * to the $750,000 or $375,000 left of the cap (line-1e::b02).
 *
 * DECISION (2026-11-26, by the author): the part of the loan above the cap is
 * not qualified, so the ordering rule takes it first. Text A, the cap: "The
 * maximum amount you can treat as qualified principal residence indebtedness
 * is $750,000 ($375,000 if married filing separately) after 2020 and before
 * 2026" (line-1e::b02). Text B, the example under the ordering rule: a $1
 * million debt "of which $800,000 is qualified principal residence
 * indebtedness ... only $100,000 of the debt discharged can be excluded (the
 * $300,000 that was discharged minus the $200,000 of nonqualified debt)"
 * (line-1e::b03). The engine follows Text A: only $750,000 of the $800,000 can
 * be treated as qualified, so $250,000 is not qualified and $50,000 is
 * excluded. The example's numbers fit the $2 million cap of earlier years;
 * the 2025 rule is the cap.
 */
export function principalResidenceExclusion(
  income: number,
  loanBalance: number,
  qualifiedPart: number,
  capLeft: number,
): { excluded: number; treated: number } {
  const treated = Math.min(amountOrZero(qualifiedPart), amountOrZero(capLeft), loanBalance);
  const notQualified = amountOrZero(loanBalance - treated);
  return { excluded: Math.min(treated, amountOrZero(income - notQualified)), treated };
}

/*
 * Line 1d, the first limit: "the excess of the outstanding principal amount of
 * the debt (immediately before the discharge) over the net FMV (as of that time)
 * of the property securing the debt reduced by the outstanding principal amount
 * of other qualified real property business indebtedness secured by that
 * property" (irs-982-inst-2025::sec::line-1d::b02).
 */
export function realPropertyFirstLimit(
  principalBeforeDischarge: number,
  propertyValue: number,
  otherQualifiedDebt: number,
): number {
  const netValue = amountOrZero(propertyValue - otherQualifiedDebt);
  return amountOrZero(principalBeforeDischarge - netValue);
}

/*
 * Lines 1a, 1e and 1b for every debt, in the order of the facts.
 *
 * DECISION (2026-11-26, by the author): on a home loan, line 1e comes before
 * line 1b, and insolvency takes only what line 1e leaves. Text A, the Form 982
 * instructions: the insolvency exclusion "doesn't apply to a discharge of
 * qualified principal residence indebtedness (see Line 1e, later) unless you
 * elect to have the insolvency exclusion apply instead of the exclusion for
 * qualified principal residence indebtedness" (irs-982-inst-2025::sec::line-1b::b01).
 * Text B, Pub. 4681: "Other exclusions must be applied before the qualified
 * principal residence indebtedness exclusion" (irs-pub-4681-2025::sec::qualified-principal::b04).
 * The engine follows Text A: a form's own instructions decide how the form is
 * filled, and Pub. 4681's next sentences give the same election (insolvency
 * "instead of" line 1e), which only makes sense if line 1e applies first.
 */
export function splitDebts(
  debts: readonly DebtInput[],
  insolvency: number,
  principalResidenceCap: number,
): DebtSplit[] {
  let insolvencyLeft = amountOrZero(insolvency);
  let capLeft = principalResidenceCap;
  return debts.map((debt) => {
    const income = amountOrZero(debt.income);
    const none = {
      debt,
      title11: 0,
      principalResidence: 0,
      insolvency: 0,
      realPropertyCandidate: 0,
    };
    if (debt.title11Case) return { ...none, title11: income, rest: 0 };
    let principalResidence = 0;
    const residence = debt.kind === "principal_residence" ? debt.residence : undefined;
    if (residence?.excluded) {
      const figured = principalResidenceExclusion(
        income,
        residence.loanBalance,
        residence.qualifiedPart,
        capLeft,
      );
      principalResidence = figured.excluded;
      capLeft -= figured.treated;
    }
    const afterResidence = income - principalResidence;
    const insolvent = debt.insolventBefore ? Math.min(afterResidence, insolvencyLeft) : 0;
    insolvencyLeft -= insolvent;
    const rest = afterResidence - insolvent;
    const property = debt.kind === "real_property_business" ? debt.realProperty : undefined;
    const realPropertyCandidate = property
      ? Math.min(
          rest,
          realPropertyFirstLimit(
            property.principalBeforeDischarge,
            property.propertyValue,
            property.otherQualifiedDebt,
          ),
        )
      : 0;
    return { ...none, principalResidence, insolvency: insolvent, rest, realPropertyCandidate };
  });
}

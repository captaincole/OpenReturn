/*
 * The boxes of a child's Form 1099-INT and Form 1099-DIV, from the child's
 * investment income fact (Form 8814, FTB 3803), for a child with one form of
 * each. The fact holds the sums Cade's ingest tools add up from the boxes
 * (cade/src/mastra/tools/ingestChild1099.ts); these are the inverse.
 */

import type {
  ChildInvestmentIncomeFactValue,
  DividendFactValue,
  InterestFactValue,
} from "../../../src/facts/index.js";

export interface Payer {
  payerName: string;
  payerTin: string;
}

/* Box 1 is the taxable interest that is not Treasury interest (box 3). */
export const childInterestForm = (
  payer: Payer,
  income: ChildInvestmentIncomeFactValue,
): InterestFactValue => ({
  ...payer,
  box1: (income.taxableInterest ?? 0) - (income.usObligationInterest ?? 0),
  box3: income.usObligationInterest,
  box8: income.taxExemptInterest,
});

export const childDividendForm = (
  payer: Payer,
  income: ChildInvestmentIncomeFactValue,
): DividendFactValue => ({
  ...payer,
  box1a: income.ordinaryDividends,
  box1b: income.qualifiedDividends,
  box2a: income.capitalGainDistributions,
});

/* The recipient on a child's form is the child, at the family's address. */
export const childRecipient = (
  name: string,
  ssn: string,
  home: { line1: string; city: string; state: string; zip: string },
) => ({
  recipientName: name,
  recipientTin: `***-**-${ssn.slice(-4)}`,
  recipientStreet: home.line1,
  recipientCityStateZip: `${home.city}, ${home.state} ${home.zip}`,
});

/*
 * The deductions catalog: one record per kind of itemized deduction the engine
 * supports, as data. An item names the facts that carry its amount (the
 * line-level question the engine asks) and where it lands on each return. How
 * to reach those facts in a conversation ("do you own your home?") is Cade's
 * job, not the engine's. The catalog holds no tax rule: the forms are the only
 * place a deduction is computed, and the comparison reads their totals.
 */

import { CA_MISC_DEDUCTION_KEYS, INVESTMENT_INTEREST_KEYS, MORTGAGE_KEYS } from "../facts/index.js";

export type ItemId =
  | "state_income_tax"
  | "real_estate_tax"
  | "personal_property_tax"
  | "mortgage_interest"
  | "investment_interest"
  | "gifts_cash"
  | "gifts_property"
  | "gift_carryover"
  | "medical"
  | "ca_investment_fees";

export interface ReturnLine {
  /** Where the amount lands on this return, in words. */
  line: string;
  /** False when this return does not deduct the item (state income tax in California). */
  deducts: boolean;
  /**
   * For an amount under an AGI floor (medical 7.5%, California miscellaneous
   * 2%): the evaluated line that is 0 while the amount is under the floor.
   */
  netLine?: string;
}

export interface DeductionItem {
  id: ItemId;
  /** The line-level question in plain words, for Cade and the summary panel. */
  title: string;
  /** The facts that carry the amount: what the engine asks for. Empty when a document supplies it (W-2 box 17). */
  amountKeys: string[];
  federal: ReturnLine;
  ca: ReturnLine;
}

export const DEDUCTION_ITEMS: readonly DeductionItem[] = [
  {
    id: "state_income_tax",
    title: "State income tax withheld or paid in 2025",
    amountKeys: [],
    federal: { line: "Schedule A line 5a", deducts: true },
    ca: { line: "Schedule CA Part II line 5a (column B takes it out)", deducts: false },
  },
  {
    id: "real_estate_tax",
    title: "Real estate tax paid on your home or land",
    amountKeys: ["state_local_tax.real_estate"],
    federal: { line: "Schedule A line 5b", deducts: true },
    ca: { line: "Schedule CA Part II line 5b", deducts: true },
  },
  {
    id: "personal_property_tax",
    title: "Vehicle license fee and other personal property tax",
    amountKeys: ["state_local_tax.personal_property"],
    federal: { line: "Schedule A line 5c", deducts: true },
    ca: { line: "Schedule CA Part II line 5c", deducts: true },
  },
  {
    id: "mortgage_interest",
    title: "Mortgage interest on your home (Form 1098)",
    amountKeys: [MORTGAGE_KEYS.interestForm1098, MORTGAGE_KEYS.outstandingPrincipalForm1098],
    federal: { line: "Schedule A line 8a", deducts: true },
    ca: { line: "Schedule CA Part II line 8a", deducts: true },
  },
  {
    id: "investment_interest",
    title: "Interest on money borrowed to buy investments (a margin loan)",
    amountKeys: [
      INVESTMENT_INTEREST_KEYS.expensePaid,
      INVESTMENT_INTEREST_KEYS.disallowedCarryover,
    ],
    federal: { line: "Schedule A line 9 (Form 4952)", deducts: true },
    ca: { line: "Schedule CA Part II line 9 (FTB 3526)", deducts: true },
  },
  {
    id: "gifts_cash",
    title: "Gifts to charity by cash, check or card",
    amountKeys: ["charitable.cash"],
    federal: { line: "Schedule A line 11", deducts: true },
    ca: { line: "Schedule CA Part II line 11", deducts: true },
  },
  {
    id: "gifts_property",
    title: "Gifts to charity of goods or securities",
    amountKeys: ["charitable.noncash"],
    federal: { line: "Schedule A line 12", deducts: true },
    ca: { line: "Schedule CA Part II line 12", deducts: true },
  },
  {
    id: "gift_carryover",
    title: "Gifts carried over from last year's return",
    amountKeys: ["charitable.carryover"],
    federal: { line: "Schedule A line 13", deducts: true },
    ca: { line: "Schedule CA Part II line 13", deducts: true },
  },
  {
    id: "medical",
    title: "Medical and dental bills you paid",
    amountKeys: ["medical.expenses_total"],
    federal: {
      line: "Schedule A line 1",
      deducts: true,
      netLine: "schedule-a.0.line.4_net_medical_dental",
    },
    // Column A copies Schedule A line 4; California makes no medical adjustment the engine models.
    ca: {
      line: "Schedule CA Part II line 1",
      deducts: true,
      netLine: "schedule-ca.4.page2.medical_line4_federal",
    },
  },
  {
    id: "ca_investment_fees",
    title: "Investment advisory and management fees from taxable accounts",
    amountKeys: [CA_MISC_DEDUCTION_KEYS.investmentFees],
    federal: { line: "not deductible (suspended through 2025)", deducts: false },
    ca: {
      line: "Schedule CA Part II line 21",
      deducts: true,
      netLine: "schedule-ca.5.page2.job_expenses_25_net",
    },
  },
];

/*
 * The fact keys an assumption may fill today: the deduction items' amounts.
 * Cade's record-assumptions tool accepts only these, so a mistyped key cannot
 * stay pending forever. Projections (what-ifs, future years) widen the list.
 */
export const ASSUMABLE_KEYS: readonly string[] = [
  ...new Set(DEDUCTION_ITEMS.flatMap((item) => item.amountKeys)),
];

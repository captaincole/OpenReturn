/*
 * The deductions catalog: one record per kind of itemized deduction the engine
 * supports, as data. A branch says what opens it (a life-probe answer), which
 * facts carry its amount, and where it lands on each return with which rule.
 * The comparison (compare.ts) applies the rules; the forms stay the only place
 * a deduction is computed for the return.
 */

import {
  CA_MISC_DEDUCTION_KEYS,
  INVESTMENT_INTEREST_KEYS,
  LIFE_KEYS,
  MORTGAGE_KEYS,
} from "../facts/index.js";
import { MEDICAL_FLOOR_RATE } from "../federal/schedule-a/rates.js";
import { CA_MISC_FLOOR_RATE } from "../state/ca/schedule-ca/itemizedWorksheet.js";

export type BranchId =
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

/*
 * How a branch counts on a return. "salt": in the state and local tax pool,
 * capped federally. "agi_floor": only the part over a share of AGI counts
 * (medical 7.5%, California miscellaneous 2%). "full": counts as stated (the
 * forms apply the form-specific limits, such as Form 4952). "none": not
 * deductible on that return.
 */
export type BranchRule = "salt" | "full" | "agi_floor" | "none";

export interface ReturnLine {
  line: string;
  rule: BranchRule;
  /** For "agi_floor": the share of AGI that does not count. */
  floorRate?: number;
}

export interface DeductionBranch {
  id: BranchId;
  /** Plain words, for Cade's questions and the summary panel. */
  title: string;
  /** The life-probe answer that opens it; absent when the documents open it (W-2 box 17, last year's return). */
  opensWith?: string;
  /** The facts that carry the amount: what Cade asks for once the branch is open. */
  amountKeys: string[];
  federal: ReturnLine;
  ca: ReturnLine;
}

export const DEDUCTION_BRANCHES: readonly DeductionBranch[] = [
  {
    id: "state_income_tax",
    title: "State income tax withheld or paid",
    amountKeys: [],
    federal: { line: "Schedule A line 5a", rule: "salt" },
    ca: { line: "Schedule CA Part II line 5a (column B takes it out)", rule: "none" },
  },
  {
    id: "real_estate_tax",
    title: "Property tax on your home",
    opensWith: LIFE_KEYS.ownsHome,
    amountKeys: ["state_local_tax.real_estate"],
    federal: { line: "Schedule A line 5b", rule: "salt" },
    ca: { line: "Schedule CA Part II line 5b", rule: "full" },
  },
  {
    id: "personal_property_tax",
    title: "Vehicle license fee",
    opensWith: LIFE_KEYS.caVehicle,
    amountKeys: ["state_local_tax.personal_property"],
    federal: { line: "Schedule A line 5c", rule: "salt" },
    ca: { line: "Schedule CA Part II line 5c", rule: "full" },
  },
  {
    id: "mortgage_interest",
    title: "Mortgage interest",
    opensWith: LIFE_KEYS.ownsHome,
    amountKeys: [MORTGAGE_KEYS.interestForm1098, MORTGAGE_KEYS.outstandingPrincipalForm1098],
    federal: { line: "Schedule A line 8a", rule: "full" },
    ca: { line: "Schedule CA Part II line 8a", rule: "full" },
  },
  {
    id: "investment_interest",
    title: "Interest on a margin loan",
    opensWith: LIFE_KEYS.marginLoan,
    amountKeys: [
      INVESTMENT_INTEREST_KEYS.expensePaid,
      INVESTMENT_INTEREST_KEYS.disallowedCarryover,
    ],
    federal: { line: "Schedule A line 9 (Form 4952)", rule: "full" },
    ca: { line: "Schedule CA Part II line 9 (FTB 3526)", rule: "full" },
  },
  {
    id: "gifts_cash",
    title: "Gifts to charity by cash or check",
    opensWith: LIFE_KEYS.gaveMoney,
    amountKeys: ["charitable.cash"],
    federal: { line: "Schedule A line 11", rule: "full" },
    ca: { line: "Schedule CA Part II line 11", rule: "full" },
  },
  {
    id: "gifts_property",
    title: "Gifts to charity of goods or securities",
    opensWith: LIFE_KEYS.gaveThings,
    amountKeys: ["charitable.noncash"],
    federal: { line: "Schedule A line 12", rule: "full" },
    ca: { line: "Schedule CA Part II line 12", rule: "full" },
  },
  {
    id: "gift_carryover",
    title: "Gifts carried over from last year",
    amountKeys: ["charitable.carryover"],
    federal: { line: "Schedule A line 13", rule: "full" },
    ca: { line: "Schedule CA Part II line 13", rule: "full" },
  },
  {
    id: "medical",
    title: "Medical and dental bills",
    opensWith: LIFE_KEYS.bigMedicalYear,
    amountKeys: ["medical.expenses_total"],
    federal: { line: "Schedule A line 1", rule: "agi_floor", floorRate: MEDICAL_FLOOR_RATE },
    ca: { line: "Schedule CA Part II line 1", rule: "agi_floor", floorRate: MEDICAL_FLOOR_RATE },
  },
  {
    id: "ca_investment_fees",
    title: "Investment advisory and management fees",
    opensWith: LIFE_KEYS.investmentAdvisor,
    amountKeys: [CA_MISC_DEDUCTION_KEYS.investmentFees],
    federal: { line: "not deductible (suspended through 2025)", rule: "none" },
    ca: { line: "Schedule CA Part II line 21", rule: "agi_floor", floorRate: CA_MISC_FLOOR_RATE },
  },
];

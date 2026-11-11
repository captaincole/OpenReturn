/*
 * The open door's cases: one thing a taxpayer says, and the outcome Cade must
 * record for it. Each label is a tax judgment under the door's own rule (an
 * expense that might count and that no item covers is not_sure), so a change
 * here needs the same care as a change to a form line.
 */
import type { ItemId } from "@openreturn/engine";
import type { Outcome } from "../../src/mastra/deductions/openDoor";

export interface DoorCase {
  name: string;
  /** The taxpayer's answer at the open door. */
  says: string;
  outcome: Outcome;
  /** counts_here: the catalog item that covers it. */
  item?: ItemId;
  why: string;
}

const COUNTS_HERE: DoorCase[] = [
  {
    name: "tithe",
    says: "Oh, I do tithe at my church every month.",
    outcome: "counts_here",
    item: "gifts_cash",
    why: "Money given to a church is a gift by cash or check (Schedule A line 11).",
  },
  {
    name: "goodwill-clothes",
    says: "I dropped off a few bags of clothes at Goodwill in the spring.",
    outcome: "counts_here",
    item: "gifts_property",
    why: "Used clothes given to a charity are a gift other than by cash or check (Schedule A line 12).",
  },
  {
    name: "adviser-fee",
    says: "My financial adviser takes a fee out of my brokerage account every quarter.",
    outcome: "counts_here",
    item: "ca_investment_fees",
    why: "Federal law does not allow investment fees. California does (Schedule CA (540) Part II line 21), and the catalog has the item.",
  },
];

const COUNTS_ELSEWHERE: DoorCase[] = [
  {
    name: "student-loan-interest",
    says: "I paid interest on my student loans all year.",
    outcome: "counts_elsewhere",
    why: "Student loan interest is an adjustment to income (Schedule 1 line 21), not an itemized deduction.",
  },
  {
    name: "hsa-contribution",
    says: "I put money into my HSA from my own bank account, not through payroll.",
    outcome: "counts_elsewhere",
    why: "A taxpayer's own HSA contribution is an adjustment to income (Form 8889, Schedule 1 line 13).",
  },
  {
    name: "daycare",
    says: "We pay for daycare for our daughter so that we can both work.",
    outcome: "counts_elsewhere",
    why: "Care for a child while the parents work is a credit (Form 2441), not an itemized deduction.",
  },
];

/* Each may count on a return, and the catalog has no item for it: the CPA gets it. */
const NOT_SURE: DoorCase[] = [
  {
    name: "union-dues",
    says: "I pay union dues, about $900 for the year.",
    outcome: "not_sure",
    why: "Federal law does not allow an employee's union dues. California does, as an unreimbursed employee expense (Schedule CA (540) Part II line 19). No item covers it, and the amount must not go on one.",
  },
  {
    name: "home-office",
    says: "I work from home most days for my employer, so I set up a home office.",
    outcome: "not_sure",
    why: "Federal law does not allow an employee's home office. California does, as an unreimbursed employee expense (Schedule CA (540) Part II line 19). No item covers it.",
  },
];

const DOES_NOT_COUNT: DoorCase[] = [
  {
    name: "gym",
    says: "I pay for a gym membership to stay in shape.",
    outcome: "does_not_count",
    why: "A gym membership for general health is a personal expense.",
  },
  {
    name: "commuting",
    says: "I spend a lot on gas and bridge tolls to get to the office.",
    outcome: "does_not_count",
    why: "The cost to get from home to a regular place of work is a personal expense.",
  },
  {
    name: "life-insurance",
    says: "I pay the premiums on a term life insurance policy.",
    outcome: "does_not_count",
    why: "Life insurance premiums are a personal expense.",
  },
];

export const CASES: DoorCase[] = [
  ...COUNTS_HERE,
  ...COUNTS_ELSEWHERE,
  ...NOT_SURE,
  ...DOES_NOT_COUNT,
];

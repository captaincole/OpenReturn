/*
 * Form 8958: how one item divides between the person on this return and the
 * spouse or registered domestic partner (RDP), and the three amounts of its
 * row. Pure arithmetic: the resolver reads the facts and the domicile.
 *
 * Every rule gives the taxpayer's fraction of an amount. Column A is the item's
 * total, column B the taxpayer's part, column C the rest, so "Together, columns
 * B and C should equal column A" (irs-8958-form-2025::sec::specific-instructions::b01).
 */

import type {
  CommunityPropertyItemFactValue,
  CommunityPropertyLine,
  CommunityPropertyPerson,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";

/* The community property states for married people (irs-pub-555-2025::sec::publication-555::b05). */
export const COMMUNITY_PROPERTY_STATES: ReadonlySet<string> = new Set([
  "AZ",
  "CA",
  "ID",
  "LA",
  "NV",
  "NM",
  "TX",
  "WA",
  "WI",
]);

/* RDPs follow community property law in Nevada, Washington and California only (publication-555::b05). */
export const RDP_COMMUNITY_PROPERTY_STATES: ReadonlySet<string> = new Set(["CA", "NV", "WA"]);

/*
 * "Other states characterize income from separate property as community income.
 * These states include Idaho, Louisiana, Texas, and Wisconsin"
 * (irs-pub-555-2025::sec::in-idaho-louisiana-texas-and-wisconsin-in::b15).
 */
export const SEPARATE_PROPERTY_INCOME_IS_COMMUNITY: ReadonlySet<string> = new Set([
  "ID",
  "LA",
  "TX",
  "WI",
]);

/*
 * The lines that hold income from property: "Dividends, interest, and rents from
 * separate property are characterized in accordance with the discussion under
 * Income from separate property" (in-idaho-…::b09), and so is the income of a
 * separate property partnership (in-idaho-…::b14). A gain on separate property
 * is a separate gain (in-idaho-…::b10).
 */
const PROPERTY_INCOME_LINES: ReadonlySet<CommunityPropertyLine> = new Set([
  "interest",
  "dividends",
  "rents_royalties_partnerships_estates_trusts",
]);

/* Community income "must be evenly split" (irs-8958-form-2025::sec::identifying-income-and-deductions::b01). */
export const COMMUNITY_SHARE = 0.5;

/* Schedule SE line 13: "Multiply line 12 by 50% (0.50)" (irs-1040sse-face-2025::sec::face-part-i::b03). */
export const DEDUCTIBLE_SE_TAX_RATE = 0.5;

export type Relationship = "spouse" | "registered_domestic_partner";

export interface AllocationContext {
  relationship: Relationship;
  /* Two letters, upper case. */
  domicileState: string;
  /* Married people who meet the four conditions (irs-pub-555-2025::sec::community-property-laws::b04–b05). */
  livingApartRules: boolean;
}

/* The taxpayer's fraction of the item, an answer the item still needs, or why the engine cannot split it. */
export type Split = { fraction: number } | { missing: true } | { gap: string };

const MISSING: Split = { missing: true };
const ownerSplit = (owner: CommunityPropertyPerson | undefined): Split =>
  owner === undefined ? MISSING : { fraction: owner === "taxpayer" ? 1 : 0 };

/*
 * The items that belong to one person whatever their basis:
 * - an IRA or Coverdell ESA distribution: "wholly taxable to the spouse (or RDP)
 *   whose name is on the account" (in-idaho-…::b11; 8958 identifying-income-and-deductions::b01–b02);
 * - for spouses, self-employment tax: a sole proprietorship's is "imposed on the
 *   spouse carrying on the trade or business" and a partnership's is the
 *   partner's (irs-8958-form-2025::sec::credits-taxes-and-payments::b01,
 *   form-8958-rev-11-2023-page-4::b01). RDPs split it (credits-taxes-and-payments::b01);
 * - for spouses living apart all year: earned income, trade or business income,
 *   partnership income, separate property income and social security benefits
 *   (irs-pub-555-2025::sec::community-property-laws::b05–b06). These rules "don't
 *   apply to RDPs" (community-property-laws::b01).
 */
function belongsToOwner(item: CommunityPropertyItemFactValue, context: AllocationContext): boolean {
  if (item.kind === "ira") return true;
  const married = context.relationship === "spouse";
  if (married && item.line === "self_employment_tax") return true;
  if (!married || !context.livingApartRules) return false;
  return (
    item.line === "wages" ||
    item.line === "self_employment_income" ||
    item.kind === "partnership" ||
    item.kind === "social_security" ||
    item.basis === "separate_property"
  );
}

/* part_community: the community part of the item as a fraction of it. */
function communityFraction(item: CommunityPropertyItemFactValue): Split {
  const { amount, communityAmount, communityMonths, participationMonths } = item;
  if (communityAmount !== undefined) {
    if (amount === 0) return { gap: "the item's total is 0, so its community part has no share" };
    const fraction = communityAmount / amount;
    if (fraction < 0 || fraction > 1) return { gap: "the community part is not within the total" };
    return { fraction };
  }
  if (communityMonths === undefined || participationMonths === undefined) return MISSING;
  if (participationMonths <= 0 || communityMonths < 0 || communityMonths > participationMonths) {
    return { gap: "the community months are not within the months of participation" };
  }
  // The civil service example: half the service in the community, so half the pay is community (in-idaho-…::b13).
  return { fraction: communityMonths / participationMonths };
}

/* The rest of a part-community item is the owner's separate income. */
function partCommunitySplit(item: CommunityPropertyItemFactValue): Split {
  const community = communityFraction(item);
  if (!("fraction" in community)) return community;
  if (item.owner === undefined) return MISSING;
  const separate = item.owner === "taxpayer" ? 1 - community.fraction : 0;
  return { fraction: community.fraction * COMMUNITY_SHARE + separate };
}

/*
 * "You must report half of all community income and all of your separate income"
 * (irs-8958-form-2025::sec::community-or-separate-income::b01).
 */
function basisSplit(item: CommunityPropertyItemFactValue, context: AllocationContext): Split {
  switch (item.basis) {
    case "community":
      return { fraction: COMMUNITY_SHARE };
    case "separate":
      return ownerSplit(item.owner);
    case "separate_property":
      return PROPERTY_INCOME_LINES.has(item.line) &&
        SEPARATE_PROPERTY_INCOME_IS_COMMUNITY.has(context.domicileState)
        ? { fraction: COMMUNITY_SHARE }
        : ownerSplit(item.owner);
    case "part_community":
      return partCommunitySplit(item);
    default:
      return MISSING;
  }
}

/*
 * Estimated tax paid jointly, on separate returns: "either of you can claim all
 * of the estimated tax paid, or you may divide it between you in any way that
 * you agree upon. If you can't agree on how to divide it, the estimated tax you
 * can claim equals the total estimated tax paid times the tax shown on your
 * separate return, divided by the total of the tax shown on your return and your
 * spouse's return" (irs-pub-555-2025::sec::credits-taxes-and-payments::b03–b04).
 */
function jointEstimatedPaymentsSplit(item: CommunityPropertyItemFactValue): Split {
  const { amount, agreedTaxpayerAmount, taxOnSeparateReturns } = item;
  if (agreedTaxpayerAmount !== undefined) {
    if (amount <= 0) return { gap: "joint estimated tax payments with no total paid" };
    const fraction = agreedTaxpayerAmount / amount;
    if (fraction < 0 || fraction > 1)
      return { gap: "the agreed part is not within the total paid" };
    return { fraction };
  }
  if (taxOnSeparateReturns === undefined) return MISSING;
  const { taxpayer, spouse } = taxOnSeparateReturns;
  if (taxpayer < 0 || spouse < 0 || taxpayer + spouse <= 0) {
    return {
      gap: "no tax on either separate return, so the Pub. 555 ratio cannot divide the payments",
    };
  }
  return { fraction: taxpayer / (taxpayer + spouse) };
}

/* The taxpayer's fraction of an item. */
export function splitOf(item: CommunityPropertyItemFactValue, context: AllocationContext): Split {
  if (item.kind === "joint_estimated_tax_payments") return jointEstimatedPaymentsSplit(item);
  if (belongsToOwner(item, context)) return ownerSplit(item.owner);
  return basisSplit(item, context);
}

/* One row: the description and columns A, B and C in whole dollars. */
export interface Form8958Row {
  description: string;
  a: number;
  b: number;
  c: number;
}

/*
 * Column A is the total rounded; column B the taxpayer's part, cents kept until
 * it is rounded; column C what is left, so B and C add up to A.
 *
 * DECISION (2026-11-26, by the author): an odd total, such as $1,001 of
 * community wages. Text A, the Form 1040 instructions: "If you do round to whole
 * dollars, you must round all amounts. To round, drop amounts under 50 cents and
 * increase amounts from 50 to 99 cents to the next dollar"
 * (irs-1040-inst-2025::sec::rounding-off-to-whole::b01), so each half, $500.50,
 * would print as $501. Text B, the Form 8958 instructions: "Together, columns B
 * and C should equal column A" (irs-8958-form-2025::sec::specific-instructions::b01).
 * The engine follows Text B: column B rounds by the 1040 rule ($501) and column C
 * is column A less column B ($500), because the form's arithmetic wins over a
 * rule that breaks it (docs/rule-decisions.md).
 */
export function rowOf(description: string, amount: number, fraction: number): Form8958Row {
  const total = roundDollars(amount);
  const taxpayerPart = roundDollars(amount * fraction);
  return { description, a: total, b: taxpayerPart, c: total - taxpayerPart };
}

/*
 * Line 9: the deductible part of a line 10 row. "The deductible portion of the
 * self-employment tax is split only when the self-employment tax is split"
 * (irs-8958-form-2025::sec::identifying-income-and-deductions::b03), so it takes
 * the line 10 row's fraction; the deductible part is half the tax (Schedule SE line 13).
 */
export function deductibleSeTaxRow(seTaxRow: {
  description: string;
  amount: number;
  fraction: number;
}): Form8958Row {
  return rowOf(seTaxRow.description, seTaxRow.amount * DEDUCTIBLE_SE_TAX_RATE, seTaxRow.fraction);
}

/*
 * Line 11: tax withheld from an item divides as the item does. "Report the credit
 * for federal income tax withheld on community wages in the same manner as your
 * wages" (irs-pub-555-2025::sec::credits-taxes-and-payments::b03; 8958
 * form-8958-rev-11-2023-page-4::b01).
 */
export function withholdingRow(
  description: string,
  withheld: number,
  fraction: number,
): Form8958Row {
  return rowOf(description, withheld, fraction);
}

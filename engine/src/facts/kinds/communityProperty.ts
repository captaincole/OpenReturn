/*
 * Community property on a separate return (Form 8958). A married person who
 * files separately, or a registered domestic partner (RDP), domiciled in a
 * community property state reports half of all community income and all of his
 * or her separate income (irs-8958-form-2025::sec::community-or-separate-income::b01).
 * Form 8958 lists each item with its total and the two shares.
 *
 * One fact per item: the taxpayer states the total, whose item it is and how
 * the state's law classifies it. The spouse's documents are not on this return,
 * so an item of the spouse is stated here too. The engine figures the two
 * shares from these answers (federal/8958/lines.ts). Line 9 (the deductible part
 * of self-employment tax) and line 11 (taxes withheld) come from the other
 * items, so no item names them.
 *
 * The facts describe the form only: the amounts on the return still come from
 * the taxpayer's own documents (federal/8958/QUESTIONS.md, "Proposals for a
 * discussion").
 */

type FactRow = { key: string; value: unknown; category: string };

/* The line of Form 8958 an item is listed on (lines 1–8, 10 and 12). */
export type CommunityPropertyLine =
  | "wages" // 1
  | "interest" // 2
  | "dividends" // 3
  | "state_income_tax_refund" // 4
  | "self_employment_income" // 5
  | "capital_gain_or_loss" // 6
  | "pension" // 7
  | "rents_royalties_partnerships_estates_trusts" // 8
  | "self_employment_tax" // 10
  | "other"; // 12

/* The person on the return ("taxpayer") or the spouse or RDP ("spouse"). */
export type CommunityPropertyPerson = "taxpayer" | "spouse";

/*
 * How the state's law classifies the item (irs-pub-555-2025::sec::community-or-separate::b01–b03):
 * - community: income from community property, or pay for services during the
 *   marriage or partnership while domiciled in the community property state.
 * - separate: the separate income of the owner (money earned while domiciled in
 *   a noncommunity property state, a gain on separate property).
 * - separate_property: income from the owner's separate property (interest,
 *   dividends, rents). Some states treat it as community income; the engine
 *   reads the domicile state (in-idaho-louisiana-texas-and-wisconsin-in::b15).
 * - part_community: partly community, the rest the owner's separate income
 *   (a pension earned partly while married and domiciled in the state, wages
 *   earned partly after a separation). State the community part as an amount
 *   or as months of participation.
 */
export type CommunityPropertyBasis =
  "community" | "separate" | "separate_property" | "part_community";

/*
 * An item with a rule of its own:
 * - ira: an IRA or Coverdell ESA distribution, the separate property of the
 *   person whose name is on the account by law (in-idaho-…::b10–b11).
 * - partnership: a partnership's income or loss (lines 5, 8 and 10).
 * - social_security: social security or equivalent railroad retirement benefits.
 * - joint_estimated_tax_payments: estimated tax paid jointly, on line 12
 *   (irs-pub-555-2025::sec::credits-taxes-and-payments::b03–b04).
 */
export type CommunityPropertyItemKind =
  "ira" | "partnership" | "social_security" | "joint_estimated_tax_payments";

export interface CommunityPropertyItemFactValue {
  line: CommunityPropertyLine;
  /* The source of the item as the row names it: "Brazos Clinic wages (Careane)". */
  description: string;
  /* Column A: the whole item, both people's parts. A loss is negative. */
  amount: number;
  /* Absent only for an IRA and for joint estimated tax payments, whose rules decide. */
  basis?: CommunityPropertyBasis;
  /*
   * Whose item it is: the employee, the account holder, the spouse who carries
   * on the trade or business, the partner, the recipient, the owner of separate
   * property. Required for a separate or part-community item, an IRA, a line 10
   * item, and on a return with the living-apart rules.
   */
  owner?: CommunityPropertyPerson;
  kind?: CommunityPropertyItemKind;
  /* part_community: the community part of amount, in dollars. */
  communityAmount?: number;
  /*
   * part_community, the pension rule (in-idaho-…::b11–b13): months of
   * participation while married (or partners) and domiciled in a community
   * property state, out of all months of participation.
   */
  communityMonths?: number;
  participationMonths?: number;
  /* Federal income tax withheld from the item (W-2 box 2, 1099 box 4): a line 11 row. */
  federalWithholding?: number;
  /* joint_estimated_tax_payments: the part the two agreed this return claims. */
  agreedTaxpayerAmount?: number;
  /* joint_estimated_tax_payments with no agreement: the tax shown on each separate return. */
  taxOnSeparateReturns?: { taxpayer: number; spouse: number };
}

export interface CommunityPropertyItemFact {
  key: string;
  value: CommunityPropertyItemFactValue;
}

export const COMMUNITY_PROPERTY_KEYS = {
  /* The state of domicile, two letters ("TX"). Its law decides community and separate income. */
  domicileState: "community_property.domicile_state",
  /*
   * true when the spouses meet the four conditions of "Spouses living apart all
   * year" (irs-pub-555-2025::sec::community-property-laws::b03–b05), or one is a
   * nonresident alien not treated as a resident. Married people only; absent
   * means community property law applies as usual.
   */
  spousesLivingApartRules: "community_property.spouses_living_apart_rules",
  /*
   * true when the person on a single or head of household return was married at
   * some time during the year ("If you are married at any time during the
   * calendar year", irs-pub-555-2025::sec::community-property-laws::b03), so the
   * other person on Form 8958 is a spouse, not an RDP. A head of household filer
   * who checked the 1040 lived-apart box is married without it.
   */
  marriedDuringYear: "community_property.married_during_year",
} as const;

const ITEM_CATEGORY = "other";
const ITEM_PREFIX = "community_property.item.";

export function makeCommunityPropertyItemFactKey(itemSlug: string): string {
  return `${ITEM_PREFIX}${itemSlug}`;
}

export function isCommunityPropertyItemFactKey(key: string): boolean {
  return key.startsWith(ITEM_PREFIX) && key.split(".").length === 3 && !key.endsWith(".");
}

/* Every item, in the order recorded: the order of the rows on each line. */
export function getCommunityPropertyItemFacts(
  facts: ReadonlyArray<FactRow>,
): CommunityPropertyItemFact[] {
  return facts
    .filter((row) => row.category === ITEM_CATEGORY && isCommunityPropertyItemFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as CommunityPropertyItemFactValue }));
}

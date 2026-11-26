/*
 * Form 8958 splits from the published examples with numbers (Pub. 555 and FTB
 * Pub. 1031, whose division of community income is the same rule) and limit
 * tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type { CommunityPropertyItemFactValue } from "../../../../src/facts/index.js";
import {
  deductibleSeTaxRow,
  rowOf,
  splitOf,
  withholdingRow,
  type AllocationContext,
} from "../../../../src/federal/8958/lines.js";

const married = (domicileState: string, livingApartRules = false): AllocationContext => ({
  relationship: "spouse",
  domicileState,
  livingApartRules,
});
const partners = (domicileState: string, livingApartRules = false): AllocationContext => ({
  relationship: "registered_domestic_partner",
  domicileState,
  livingApartRules,
});

type Item = CommunityPropertyItemFactValue;
const item = (value: Partial<Item> & Pick<Item, "line" | "amount">): Item => ({
  description: "test item",
  ...value,
});

/* Column B of an item: the taxpayer's whole dollars. */
function yours(value: Item, context: AllocationContext): number | undefined {
  const split = splitOf(value, context);
  return "fraction" in split ? rowOf(value.description, value.amount, split.fraction).b : undefined;
}
const total = (items: Item[], context: AllocationContext) =>
  items.reduce((all, each) => all + (yours(each, context) ?? Number.NaN), 0);
const theirs = (items: Item[], context: AllocationContext) =>
  items.reduce((all, each) => all + each.amount, 0) - total(items, context);

describe("Form 8958, published examples", () => {
  /*
   * FTB Pub. 1031 (2025), Division of Income, Example 1: California residents.
   * You earned $15,000 and your spouse $30,000; your inherited stock, kept
   * separate, paid $5,000 of dividends. "You and your spouse/RDP each have
   * $22,500 in community income ... making your total income $27,500."
   */
  it("FTB Pub. 1031 Example 1: you report 27,500, your spouse 22,500", () => {
    const items = [
      item({ line: "wages", amount: 15000, basis: "community", owner: "taxpayer" }),
      item({ line: "wages", amount: 30000, basis: "community", owner: "spouse" }),
      item({ line: "dividends", amount: 5000, basis: "separate_property", owner: "taxpayer" }),
    ];
    expect([total(items, married("CA")), theirs(items, married("CA"))]).toEqual([27500, 22500]);
  });

  /*
   * FTB Pub. 1031 Example 2: you earned $30,000 by June 30, when the spouses
   * separated, and $30,000 after; your spouse earned $10,000 after. "Community
   * Jan.–June $15,000 $15,000; Separate July–Dec. 30,000 10,000; Total $45,000 $25,000."
   */
  it("FTB Pub. 1031 Example 2: a part-community W-2 gives 45,000 and 25,000", () => {
    const yourW2 = item({
      line: "wages",
      amount: 60000,
      basis: "part_community",
      communityAmount: 30000,
      owner: "taxpayer",
    });
    const spouseW2 = item({ line: "wages", amount: 10000, basis: "separate", owner: "spouse" });
    const split = splitOf(yourW2, married("CA"));
    expect("fraction" in split && rowOf("W-2", 60000, split.fraction)).toEqual({
      description: "W-2",
      a: 60000,
      b: 45000,
      c: 15000,
    });
    expect([
      total([yourW2, spouseW2], married("CA")),
      theirs([yourW2, spouseW2], married("CA")),
    ]).toEqual([45000, 25000]);
  });

  /*
   * FTB Pub. 1031 Example 3, situation 1, both domiciled in community property
   * states (John's return): Jackie's wages $30,000 split 15,000 each; her separate
   * property gain $100,000 stays hers; John's pension $10,000 splits 5,000 each;
   * his separate rental $1,000 "is not divided even when domiciled in a
   * community property state".
   */
  it("FTB Pub. 1031 Example 3 (1): John reports 15,000, 0, 5,000 and 1,000", () => {
    const context = married("NV");
    const rows = [
      item({ line: "wages", amount: 30000, basis: "community", owner: "spouse" }),
      item({ line: "capital_gain_or_loss", amount: 100000, basis: "separate", owner: "spouse" }),
      item({ line: "pension", amount: 10000, basis: "community", owner: "taxpayer" }),
      item({
        line: "rents_royalties_partnerships_estates_trusts",
        amount: 1000,
        basis: "separate_property",
        owner: "taxpayer",
      }),
    ].map((each) => yours(each, context));
    expect(rows).toEqual([15000, 0, 5000, 1000]);
  });

  /*
   * Pub. 555, Civil service retirement: Henry Wright retired after 30 years of
   * service, 15 of them married and domiciled in a community property state.
   * "If Mr. Wright receives $1,000 a month in retirement pay, $500 is considered
   * community income—half ($250) is his income and half ($250) is his spouse's."
   */
  it("Pub. 555 Henry Wright: 1,000 a month is 750 his and 250 his spouse's", () => {
    const monthly = item({
      line: "pension",
      amount: 1000,
      basis: "part_community",
      communityMonths: 180,
      participationMonths: 360,
      owner: "taxpayer",
    });
    const split = splitOf(monthly, married("TX"));
    expect("fraction" in split && rowOf("CSRS", 1000, split.fraction)).toEqual({
      description: "CSRS",
      a: 1000,
      b: 750,
      c: 250,
    });
    expect(yours({ ...monthly, amount: 12000 }, married("TX"))).toBe(9000);
  });

  /* Pub. 555, Spouses living apart all year: George and Sharon (George's return). */
  const georgeAndSharon = [
    item({ line: "wages", amount: 20000, basis: "community", owner: "taxpayer" }),
    item({ line: "wages", amount: 22000, basis: "community", owner: "spouse" }),
    item({ line: "self_employment_income", amount: 5000, basis: "community", owner: "taxpayer" }),
    item({
      line: "rents_royalties_partnerships_estates_trusts",
      amount: 10000,
      basis: "community",
      kind: "partnership",
      owner: "spouse",
    }),
    item({ line: "dividends", amount: 1000, basis: "separate_property", owner: "taxpayer" }),
    item({ line: "dividends", amount: 2000, basis: "separate_property", owner: "spouse" }),
    item({ line: "interest", amount: 500, basis: "community", owner: "taxpayer" }),
    item({ line: "interest", amount: 500, basis: "community", owner: "spouse" }),
  ];

  /*
   * "Under the community property law of their state, all the income is
   * considered community income ... Ordinarily, on their separate returns, they
   * would each report $30,500, half the total community income of $61,000."
   * Texas treats income from separate property as community income.
   */
  it("Pub. 555 George and Sharon, ordinarily: each reports 30,500", () => {
    expect([total(georgeAndSharon, married("TX")), theirs(georgeAndSharon, married("TX"))]).toEqual(
      [30500, 30500],
    );
  });

  /*
   * "They each report on their returns only their own earnings and other income,
   * and their share of the interest income from community property. George
   * reports $26,500 and Sharon reports $34,500."
   */
  it("Pub. 555 George and Sharon, living apart all year: 26,500 and 34,500", () => {
    const context = married("TX", true);
    expect([total(georgeAndSharon, context), theirs(georgeAndSharon, context)]).toEqual([
      26500, 34500,
    ]);
  });

  /*
   * Pub. 555, Payments not alimony, Example 2: "each of you must report $10,000
   * of the total community income" of $20,000.
   */
  it("Pub. 555 alimony Example 2: 20,000 of community income is 10,000 each", () => {
    const pay = item({ line: "wages", amount: 20000, basis: "community", owner: "taxpayer" });
    expect(yours(pay, married("CA"))).toBe(10000);
  });
});

describe("Form 8958, stated rules", () => {
  it("an IRA distribution is the account holder's, even from community funds", () => {
    const ira = item({
      line: "pension",
      amount: 8000,
      basis: "community",
      kind: "ira",
      owner: "spouse",
    });
    expect([
      yours(ira, married("CA")),
      yours({ ...ira, owner: "taxpayer" }, partners("CA")),
    ]).toEqual([0, 8000]);
  });

  it("spouses: self-employment tax is the spouse's who carries on the business; RDPs split it", () => {
    const seTax = item({
      line: "self_employment_tax",
      amount: 4239,
      basis: "community",
      owner: "taxpayer",
    });
    expect(yours(seTax, married("CA"))).toBe(4239);
    expect(yours({ ...seTax, owner: "spouse" }, married("CA"))).toBe(0);
    expect(yours(seTax, partners("CA"))).toBe(2120);
  });

  it("line 9 follows line 10: half the tax, split only when the tax is split", () => {
    expect(deductibleSeTaxRow({ description: "Shop", amount: 4239, fraction: 1 })).toEqual({
      description: "Shop",
      a: 2120,
      b: 2120,
      c: 0,
    });
    expect(deductibleSeTaxRow({ description: "Shop", amount: 4239, fraction: 0.5 })).toEqual({
      description: "Shop",
      a: 2120,
      b: 1060,
      c: 1060,
    });
  });

  it("withholding divides as its wages do", () => {
    expect(withholdingRow("W-2", 7201, 0.5)).toEqual({
      description: "W-2",
      a: 7201,
      b: 3601,
      c: 3600,
    });
    expect(withholdingRow("W-2", 900, 0.75)).toEqual({
      description: "W-2",
      a: 900,
      b: 675,
      c: 225,
    });
  });

  it("income from separate property: community in Texas, separate in California", () => {
    const interest = item({
      line: "interest",
      amount: 600,
      basis: "separate_property",
      owner: "spouse",
    });
    expect([yours(interest, married("TX")), yours(interest, married("CA"))]).toEqual([300, 0]);
  });

  it("a gain on separate property stays separate in Texas", () => {
    const gain = item({
      line: "capital_gain_or_loss",
      amount: 5000,
      basis: "separate_property",
      owner: "taxpayer",
    });
    expect(yours(gain, married("TX"))).toBe(5000);
  });

  it("the living-apart rules do not apply to RDPs", () => {
    const wages = item({ line: "wages", amount: 40000, basis: "community", owner: "spouse" });
    expect([yours(wages, married("CA", true)), yours(wages, partners("CA", true))]).toEqual([
      0, 20000,
    ]);
  });

  it("living apart: social security is the recipient's; interest still splits", () => {
    const context = married("CA", true);
    const benefits = item({
      line: "other",
      amount: 18000,
      basis: "community",
      kind: "social_security",
      owner: "taxpayer",
    });
    const interest = item({ line: "interest", amount: 800, basis: "community", owner: "spouse" });
    expect([yours(benefits, context), yours(interest, context)]).toEqual([18000, 400]);
  });

  it("joint estimated tax: the agreed part, else the ratio of the separate returns' tax", () => {
    const paid = item({ line: "other", amount: 6000, kind: "joint_estimated_tax_payments" });
    expect(yours({ ...paid, agreedTaxpayerAmount: 2500 }, married("TX"))).toBe(2500);
    expect(
      yours({ ...paid, taxOnSeparateReturns: { taxpayer: 9000, spouse: 3000 } }, married("TX")),
    ).toBe(4500);
    expect(
      splitOf({ ...paid, taxOnSeparateReturns: { taxpayer: 0, spouse: 0 } }, married("TX")),
    ).toHaveProperty("gap");
    expect(splitOf(paid, married("TX"))).toEqual({ missing: true });
  });
});

describe("Form 8958, limits", () => {
  it("columns B and C add up to column A, odd dollars and losses included", () => {
    for (const amount of [1001, -1001, 0.5, 333.33, -77]) {
      const row = rowOf("item", amount, 0.5);
      expect(row.b + row.c).toBe(row.a);
    }
    expect(rowOf("loss", -1001, 0.5)).toEqual({ description: "loss", a: -1001, b: -501, c: -500 });
  });

  it("a community part outside the total, or months outside participation, is a gap", () => {
    const base = item({
      line: "pension",
      amount: 1000,
      basis: "part_community",
      owner: "taxpayer",
    });
    expect(splitOf({ ...base, communityAmount: 1200 }, married("CA"))).toHaveProperty("gap");
    expect(
      splitOf({ ...base, communityMonths: 13, participationMonths: 12 }, married("CA")),
    ).toHaveProperty("gap");
    expect(
      splitOf({ ...base, communityMonths: 0, participationMonths: 12 }, married("CA")),
    ).toEqual({ fraction: 1 });
  });

  it("an answer still missing waits: no basis, no owner where a rule needs one", () => {
    expect(splitOf(item({ line: "wages", amount: 100 }), married("CA"))).toEqual({ missing: true });
    expect(splitOf(item({ line: "wages", amount: 100, basis: "separate" }), married("CA"))).toEqual(
      { missing: true },
    );
    expect(
      splitOf(item({ line: "wages", amount: 100, basis: "community" }), married("CA")),
    ).toEqual({
      fraction: 0.5,
    });
  });
});

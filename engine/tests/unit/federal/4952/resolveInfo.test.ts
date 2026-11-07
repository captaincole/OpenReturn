/* Source: irs-4952-form-2025::sec::who-must-file::b01 (the exception to filing Form 4952). */

import { describe, expect, it } from "vitest";
import { INVESTMENT_INTEREST_KEYS, makeInterestFactKey } from "../../../../src/facts/index.js";
import { resolve4952Info } from "../../../../src/federal/4952/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

type Fact = { key: string; category: string; value: unknown };

const interest: Fact = {
  key: makeInterestFactKey("bank"),
  category: "investment_income",
  value: { payerName: "Bank", box1: 5000 },
};
const answer = (key: string, value: number): Fact => ({
  key,
  category: "investment_income",
  value,
});
const expense = answer(INVESTMENT_INTEREST_KEYS.expensePaid, 650);

const resolve = (facts: Fact[]) => resolve4952Info(makeResolverInputs({ facts, decisions: [] }));

describe("resolve4952Info", () => {
  it("skips the form when income beats the expense with no carryover and no other expenses", () => {
    const info = resolve([
      interest,
      expense,
      answer(INVESTMENT_INTEREST_KEYS.disallowedCarryover, 0),
      answer(INVESTMENT_INTEREST_KEYS.investmentExpenses, 0),
    ]);
    expect(info.mustFile?.["form-4952"]?.value).toBe(false);
    expect(info.noFormException).toBe(true);
  });

  it("files while the carryover or the other expenses are unanswered, and asks for them", () => {
    const info = resolve([interest, expense]);
    expect(info.mustFile?.["form-4952"]?.value).toBe(true);
    expect(info.noFormException).toBe(false);
    expect(info.missingInputs?.["form-4952"]).toEqual([
      INVESTMENT_INTEREST_KEYS.disallowedCarryover,
      INVESTMENT_INTEREST_KEYS.electedQualifiedDividendsAndGain,
      INVESTMENT_INTEREST_KEYS.investmentExpenses,
    ]);
  });

  it("files when a carryover comes in from last year", () => {
    const info = resolve([
      interest,
      expense,
      answer(INVESTMENT_INTEREST_KEYS.disallowedCarryover, 650),
      answer(INVESTMENT_INTEREST_KEYS.investmentExpenses, 0),
    ]);
    expect(info.mustFile?.["form-4952"]?.value).toBe(true);
  });

  it("does not file with no expense and no carryover", () => {
    expect(resolve([interest]).mustFile?.["form-4952"]?.value).toBe(false);
  });
});

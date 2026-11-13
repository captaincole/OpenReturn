/*
 * Sources: irs-1040-inst-2025::sec::adjustments-to::b01 (educator expenses) and
 * irs-1040-inst-2025::sec::line-18::b01 (the early withdrawal penalty).
 */

import { describe, expect, it } from "vitest";
import { EDUCATOR_EXPENSE_KEYS, makeInterestFactKey } from "../../../../src/facts/index.js";
import {
  earlyWithdrawalPenalty,
  educatorExpenseDeduction,
} from "../../../../src/federal/schedule-1/adjustments.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const educator = (taxpayer?: number, spouse?: number) =>
  makeResolverInputs({
    facts: [
      ...(taxpayer === undefined
        ? []
        : [{ key: EDUCATOR_EXPENSE_KEYS.taxpayer, category: "other", value: taxpayer }]),
      ...(spouse === undefined
        ? []
        : [{ key: EDUCATOR_EXPENSE_KEYS.spouse, category: "other", value: spouse }]),
    ],
    decisions: [],
  });

describe("educatorExpenseDeduction", () => {
  it("allows at most $300 for one educator", () => {
    expect(educatorExpenseDeduction(educator(400), false)).toBe(300);
    expect(educatorExpenseDeduction(educator(120), false)).toBe(120);
  });
  it("allows $300 for each spouse on a joint return only", () => {
    expect(educatorExpenseDeduction(educator(400, 500), true)).toBe(600);
    expect(educatorExpenseDeduction(educator(100, 500), true)).toBe(400);
    expect(educatorExpenseDeduction(educator(100, 500), false)).toBe(100);
  });
  it("is blank with no educator expenses", () => {
    expect(educatorExpenseDeduction(educator(), true)).toBeUndefined();
  });
});

describe("earlyWithdrawalPenalty", () => {
  it("adds box 2 of every 1099-INT and is blank when none prints it", () => {
    const inputs = (box2s: Array<number | undefined>) =>
      makeResolverInputs({
        facts: box2s.map((box2, index) => ({
          key: makeInterestFactKey(`bank-${index}`),
          category: "investment_income",
          value: { payerName: "Bank", box1: 10, box2 },
        })),
        decisions: [],
      });
    expect(earlyWithdrawalPenalty(inputs([1212, 30.5]))).toBe(1242.5);
    expect(earlyWithdrawalPenalty(inputs([undefined]))).toBeUndefined();
  });
});

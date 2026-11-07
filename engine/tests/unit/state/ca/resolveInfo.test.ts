/*
 * Sources: ca-3805p-inst-2025::sec::b-who-must-file (the box 7 codes),
 * ca-3526-inst-2025::sec::b-who-must-file (the exception), and
 * ca-540-sched-p-inst-2025::sec::b-who-must-file (when to complete Schedule P).
 */

import { describe, expect, it } from "vitest";
import {
  AMT_KEYS,
  INVESTMENT_INTEREST_KEYS,
  makeDividendFactKey,
  makeInterestFactKey,
  makeRetirementDistributionFactKey,
  makeTradeFactKey,
} from "../../../../src/facts/index.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { resolve3526Info } from "../../../../src/state/ca/3526/resolveInfo.js";
import { resolve3805pInfo } from "../../../../src/state/ca/3805p/resolveInfo.js";
import { resolveSchedulePInfo } from "../../../../src/state/ca/schedule-p/resolveInfo.js";

type Fact = { key: string; category: string; value: unknown };
type Decision = { decisionKey: string; decision: unknown };

const distribution = (box7: string, box2a: number): Fact => ({
  key: makeRetirementDistributionFactKey("plan", `code-${box7}`),
  category: "retirement",
  value: { payerName: "Plan", box1: box2a, box2a, box7, box7IraSepSimple: false },
});

describe("resolve3805pInfo", () => {
  it("files for a code 1 distribution and sums the taxable amounts", () => {
    const info = resolve3805pInfo(
      makeResolverInputs({
        facts: [distribution("1", 11207), distribution("7", 5000)],
        decisions: [],
      }),
    );
    expect(info.mustFile?.["form-3805p"]?.value).toBe(true);
    expect(info.earlyDistributionsInIncome).toBe(11207);
  });

  it("files for an undetermined taxable amount but leaves line 1 unknown, like the 1040", () => {
    const undetermined: Fact = {
      key: makeRetirementDistributionFactKey("plan", "code-1-nd"),
      category: "retirement",
      value: {
        payerName: "Plan",
        box1: 15000,
        box2b: { taxableAmountNotDetermined: true },
        box7: "1",
        box7IraSepSimple: false,
      },
    };
    const info = resolve3805pInfo(makeResolverInputs({ facts: [undetermined], decisions: [] }));
    expect(info.mustFile?.["form-3805p"]?.value).toBe(true);
    expect(info.earlyDistributionsInIncome).toBeUndefined();
  });

  it("leaves the amounts unknown when both spouses took an early distribution (two forms)", () => {
    const spouse: Fact = {
      key: makeRetirementDistributionFactKey("plan", "code-1-sp"),
      category: "retirement",
      value: {
        payerName: "Plan",
        owner: "spouse",
        box1: 2000,
        box2a: 2000,
        box7: "1",
        box7IraSepSimple: false,
      },
    };
    const info = resolve3805pInfo(
      makeResolverInputs({ facts: [distribution("1", 11207), spouse], decisions: [] }),
    );
    expect(info.mustFile?.["form-3805p"]?.value).toBe(true);
    expect(info.earlyDistributionsInIncome).toBeUndefined();
    expect(info.earlyDistributionOwner).toBeUndefined();
  });

  it("does not file when every early distribution carries an exception code (2, 3, 4) or is not early", () => {
    const info = resolve3805pInfo(
      makeResolverInputs({
        facts: [distribution("2", 11207), distribution("7", 5000), distribution("G", 9000)],
        decisions: [],
      }),
    );
    expect(info.mustFile?.["form-3805p"]?.value).toBe(false);
  });
});

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

describe("resolve3526Info", () => {
  it("skips the form when the only investment income is interest and the expense is covered", () => {
    const info = resolve3526Info(
      makeResolverInputs({
        facts: [
          interest,
          answer(INVESTMENT_INTEREST_KEYS.expensePaid, 800),
          answer(INVESTMENT_INTEREST_KEYS.disallowedCarryover, 0),
          answer(INVESTMENT_INTEREST_KEYS.caDisallowedCarryover, 0),
          answer(INVESTMENT_INTEREST_KEYS.investmentExpenses, 0),
        ],
        decisions: [],
      }),
    );
    expect(info.mustFile?.["form-3526"]?.value).toBe(false);
  });

  it("completes the form when the exception holds but federal Form 4952 limits the deduction", () => {
    /* Federal: 1,000 + 6,000 − 6,000 qualified = 1,000 < 4,000, so Form 4952 files; California counts all 7,000. */
    const smallInterest: Fact = {
      key: makeInterestFactKey("bank"),
      category: "investment_income",
      value: { payerName: "Bank", box1: 1000 },
    };
    const qualified: Fact = {
      key: makeDividendFactKey("fund"),
      category: "investment_income",
      value: { payerName: "Fund", box1a: 6000, box1b: 6000 },
    };
    const info = resolve3526Info(
      makeResolverInputs({
        facts: [
          smallInterest,
          qualified,
          answer(INVESTMENT_INTEREST_KEYS.expensePaid, 4000),
          answer(INVESTMENT_INTEREST_KEYS.disallowedCarryover, 0),
          answer(INVESTMENT_INTEREST_KEYS.caDisallowedCarryover, 0),
          answer(INVESTMENT_INTEREST_KEYS.investmentExpenses, 0),
        ],
        decisions: [],
      }),
    );
    expect(info.mustFile?.["form-3526"]?.value).toBe(true);
    expect(info.caGrossInvestmentIncome).toBe(7000);
  });

  it("files and asks while California's own carryover is unanswered", () => {
    const info = resolve3526Info(
      makeResolverInputs({
        facts: [
          interest,
          answer(INVESTMENT_INTEREST_KEYS.expensePaid, 800),
          answer(INVESTMENT_INTEREST_KEYS.disallowedCarryover, 0),
          answer(INVESTMENT_INTEREST_KEYS.investmentExpenses, 0),
        ],
        decisions: [],
      }),
    );
    expect(info.mustFile?.["form-3526"]?.value).toBe(true);
    expect(info.missingInputs?.["form-3526"]).toEqual([
      INVESTMENT_INTEREST_KEYS.caDisallowedCarryover,
    ]);
  });

  it("files when a sale of investment property breaks the exception", () => {
    const sale: Fact = {
      key: makeTradeFactKey("broker", "t1"),
      category: "investment_income",
      value: { tradeId: "t1", description: "stock", proceeds: 100, costBasis: 50 },
    };
    const info = resolve3526Info(
      makeResolverInputs({
        facts: [
          interest,
          sale,
          answer(INVESTMENT_INTEREST_KEYS.expensePaid, 800),
          answer(INVESTMENT_INTEREST_KEYS.disallowedCarryover, 0),
          answer(INVESTMENT_INTEREST_KEYS.caDisallowedCarryover, 0),
          answer(INVESTMENT_INTEREST_KEYS.investmentExpenses, 0),
        ],
        decisions: [],
      }),
    );
    expect(info.mustFile?.["form-3526"]?.value).toBe(true);
  });
});

const files540: Decision = { decisionKey: "decisions.scope.must_file_ca_540", decision: true };

describe("resolveSchedulePInfo", () => {
  it("completes the schedule for an incentive stock option spread", () => {
    const info = resolveSchedulePInfo(
      makeResolverInputs({
        facts: [{ key: AMT_KEYS.isoExerciseSpread, category: "other", value: 275000 }],
        decisions: [files540],
      }),
    );
    expect(info.mustFile?.["schedule-p"]?.value).toBe(true);
    expect(info.isoExerciseSpread).toBe(275000);
  });

  it("asks for last year's AMT carryover only when there is a regular California carryover", () => {
    const withCarryover = resolveSchedulePInfo(
      makeResolverInputs({
        facts: [
          { key: AMT_KEYS.isoExerciseSpread, category: "other", value: 275000 },
          {
            key: INVESTMENT_INTEREST_KEYS.caDisallowedCarryover,
            category: "investment_income",
            value: 650,
          },
        ],
        decisions: [files540],
      }),
    );
    expect(withCarryover.missingInputs?.["schedule-p"]).toEqual([
      INVESTMENT_INTEREST_KEYS.caAmtDisallowedCarryover,
    ]);
    const without = resolveSchedulePInfo(
      makeResolverInputs({
        facts: [{ key: AMT_KEYS.isoExerciseSpread, category: "other", value: 275000 }],
        decisions: [files540],
      }),
    );
    expect(without.missingInputs?.["schedule-p"]).toEqual([]);
  });

  it("completes the schedule for an itemizer and skips it for a standard-deduction filer with no preference", () => {
    const itemizer = resolveSchedulePInfo(
      makeResolverInputs({
        facts: [],
        decisions: [
          files540,
          { decisionKey: "decisions.itemize_vs_standard", decision: "itemized" },
        ],
      }),
    );
    expect(itemizer.mustFile?.["schedule-p"]?.value).toBe(true);
    const plain = resolveSchedulePInfo(makeResolverInputs({ facts: [], decisions: [files540] }));
    expect(plain.mustFile?.["schedule-p"]?.value).toBe(false);
  });
});

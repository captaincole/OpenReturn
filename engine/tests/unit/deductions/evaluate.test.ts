/*
 * The branch states from fact lists: what Cade asks next for a mortgage and a
 * margin loan, and the estimates path. No forms are evaluated here (the
 * comparison needs AGI from the 1040); the integration test covers that.
 */

import { describe, expect, it } from "vitest";
import { evaluateDeductions } from "../../../src/deductions/evaluate.js";
import { INVESTMENT_INTEREST_KEYS, LIFE_KEYS, MORTGAGE_KEYS } from "../../../src/facts/index.js";
import { resolveFilingInfo } from "../../../src/filingInfo.js";

type Fact = { key: string; category: string; value: unknown };

const itemized = [{ decisionKey: "decisions.itemize_vs_standard", decision: "itemized" }];

function branches(facts: Fact[], estimates = {}) {
  const filingInfo = resolveFilingInfo({ facts, decisions: itemized });
  return evaluateDeductions({ facts, filingInfo, forms: new Map(), estimates }).branches;
}

const fact = (key: string, value: unknown): Fact => ({ key, category: "mortgage", value });
const state = (facts: Fact[], id: string, estimates = {}) =>
  branches(facts, estimates).find((branch) => branch.id === id)!;

describe("evaluateDeductions branch states", () => {
  it("opens the mortgage branch from a 1098 that arrives early, and asks its principal", () => {
    const mortgage = state([fact(MORTGAGE_KEYS.interestForm1098, 12000)], "mortgage_interest");
    expect(mortgage).toMatchObject({
      status: "open",
      missing: [MORTGAGE_KEYS.outstandingPrincipalForm1098],
    });
  });

  it("asks the origination date for a principal between the two limits", () => {
    const mortgage = state(
      [
        fact(MORTGAGE_KEYS.interestForm1098, 30000),
        fact(MORTGAGE_KEYS.outstandingPrincipalForm1098, 850000),
      ],
      "mortgage_interest",
    );
    expect(mortgage).toMatchObject({
      status: "open",
      missing: [MORTGAGE_KEYS.originationDateForm1098],
    });
  });

  it("hands a loan over the limit to the CPA, with the 1098 interest as an upper bound", () => {
    const mortgage = state(
      [
        fact(MORTGAGE_KEYS.interestForm1098, 60000),
        fact(MORTGAGE_KEYS.outstandingPrincipalForm1098, 1200000),
        fact(MORTGAGE_KEYS.originationDateForm1098, "03/01/2020"),
      ],
      "mortgage_interest",
    );
    expect(mortgage).toMatchObject({ status: "for_cpa", amount: 60000, estimated: true });
  });

  it("settles a 1098 within the limit as exact", () => {
    const mortgage = state(
      [
        fact(MORTGAGE_KEYS.interestForm1098, 8059),
        fact(MORTGAGE_KEYS.outstandingPrincipalForm1098, 245552),
      ],
      "mortgage_interest",
    );
    expect(mortgage).toMatchObject({ status: "exact", amount: 8059, estimated: false });
  });

  it("takes a rough amount before any document", () => {
    const owns = [fact(LIFE_KEYS.ownsHome, true)];
    const mortgage = state(owns, "mortgage_interest", { mortgage_interest: 8000 });
    expect(mortgage).toMatchObject({
      status: "estimate",
      amount: 8000,
      estimated: true,
      missing: [MORTGAGE_KEYS.interestForm1098],
    });
  });

  it("closes a margin-loan branch with no interest and no carryover", () => {
    const margin = state(
      [
        fact(INVESTMENT_INTEREST_KEYS.expensePaid, 0),
        fact(INVESTMENT_INTEREST_KEYS.disallowedCarryover, 0),
      ],
      "investment_interest",
    );
    expect(margin).toMatchObject({ status: "closed", missing: [] });
  });

  it("asks Form 4952's own answers while its line 8 waits", () => {
    const margin = state([fact(INVESTMENT_INTEREST_KEYS.expensePaid, 1250)], "investment_interest");
    expect(margin.status).toBe("open");
    expect(margin.missing).toContain(INVESTMENT_INTEREST_KEYS.disallowedCarryover);
    expect(margin.missing).toContain(INVESTMENT_INTEREST_KEYS.investmentExpenses);
  });
});

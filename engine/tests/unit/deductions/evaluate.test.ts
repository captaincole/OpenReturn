/*
 * The item states from fact lists: what Cade asks next for a mortgage and a
 * margin loan, and assumptions. No forms are evaluated here (the
 * comparison needs AGI from the 1040); the integration test covers that.
 */

import { describe, expect, it } from "vitest";
import { evaluateDeductions } from "../../../src/deductions/evaluate.js";
import { INVESTMENT_INTEREST_KEYS, MORTGAGE_KEYS } from "../../../src/facts/index.js";
import { resolveFilingInfo } from "../../../src/filingInfo.js";

type Fact = { key: string; category: string; value: unknown };

const itemized = [{ decisionKey: "decisions.itemize_vs_standard", decision: "itemized" }];

/* As evaluateScenario passes them: the assumptions in use join the facts. */
function items(facts: Fact[], assumptions: Fact[] = []) {
  const filled = [...facts, ...assumptions];
  const filingInfo = resolveFilingInfo({ facts: filled, decisions: itemized });
  const assumedKeys = new Set(assumptions.map((assumption) => assumption.key));
  return evaluateDeductions({ facts: filled, assumedKeys, filingInfo, forms: new Map() }).items;
}

const fact = (key: string, value: unknown): Fact => ({ key, category: "mortgage", value });
const state = (facts: Fact[], id: string, assumptions: Fact[] = []) =>
  items(facts, assumptions).find((item) => item.id === id)!;

describe("evaluateDeductions item states", () => {
  it("opens the mortgage item from a 1098 that arrives early, and asks its principal", () => {
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
    expect(mortgage).toMatchObject({ status: "for_cpa", amount: 60000, assumed: false });
  });

  it("settles a 1098 within the limit as exact", () => {
    const mortgage = state(
      [
        fact(MORTGAGE_KEYS.interestForm1098, 8059),
        fact(MORTGAGE_KEYS.outstandingPrincipalForm1098, 245552),
      ],
      "mortgage_interest",
    );
    expect(mortgage).toMatchObject({ status: "exact", amount: 8059, assumed: false });
  });

  it("takes an assumption before any document, and asks for the fact behind it", () => {
    const gifts = state([], "gifts_cash", [fact("charitable.cash", 25000)]);
    expect(gifts).toMatchObject({
      status: "assumed",
      amount: 25000,
      assumed: true,
      missing: ["charitable.cash"],
    });
  });

  it("asks the principal with an assumed mortgage interest: the line needs both", () => {
    const mortgage = state([], "mortgage_interest", [fact(MORTGAGE_KEYS.interestForm1098, 8000)]);
    expect(mortgage).toMatchObject({
      status: "open",
      assumed: true,
      missing: [MORTGAGE_KEYS.outstandingPrincipalForm1098, MORTGAGE_KEYS.interestForm1098],
    });
  });

  it("settles a mortgage whose interest and principal are both assumed", () => {
    const mortgage = state([], "mortgage_interest", [
      fact(MORTGAGE_KEYS.interestForm1098, 8000),
      fact(MORTGAGE_KEYS.outstandingPrincipalForm1098, 300000),
    ]);
    expect(mortgage).toMatchObject({ status: "assumed", amount: 8000 });
  });

  it("closes a margin-loan item with no interest and no carryover", () => {
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

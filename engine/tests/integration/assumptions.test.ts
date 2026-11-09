/*
 * Assumptions on a real scenario: Madison (tcb-ca-005) with her cash gifts as
 * an assumption instead of a fact. The return computes the same lines, but it
 * is not ready to file until the fact replaces the assumption.
 */

import { describe, expect, it } from "vitest";
import { MORTGAGE_KEYS } from "../../src/facts/index.js";
import type { TaxFactRow } from "../../src/facts/rows.js";
import { evaluateScenario, pendingInputs, readyToFile } from "../../src/index.js";
import { SCENARIOS } from "../scenarios/index.js";

const madison = SCENARIOS.find((scenario) => scenario.name === "tcb-ca-005")!;
const GIFTS = "charitable.cash";
const LINE_11 = "schedule-a.0.line.11_gifts_cash_check";
const LINE_17 = "schedule-a.0.line.17_total_itemized_deductions";

const gifts = madison.facts.find((fact) => fact.key === GIFTS)!;
const assumption = (value: number): TaxFactRow => ({
  ...gifts,
  id: `assumed-${value}`,
  value,
  sourceNote: "About this much, verbal.",
});

function evaluate(facts: TaxFactRow[], assumptions: TaxFactRow[]) {
  return evaluateScenario({
    filing: { id: "madison", taxYear: madison.taxYear },
    facts,
    assumptions,
    decisions: madison.decisions,
  });
}

function line(result: ReturnType<typeof evaluate>, fieldId: string) {
  const field = result.forms
    .get("schedule-a")
    ?.fields.find((candidate) => candidate.fieldId === fieldId);
  return field?.result.ok ? field.result.value : undefined;
}

describe("assumptions", () => {
  it("fill a key with no fact: the lines compute, the return is not ready to file", () => {
    const withoutGifts = madison.facts.filter((fact) => fact.key !== GIFTS);
    const result = evaluate(withoutGifts, [assumption(25000)]);
    expect(line(result, LINE_11)).toBe(25000);
    expect(result.assumptionsInUse.map((row) => row.key)).toEqual([GIFTS]);
    const pending = pendingInputs(result);
    expect(pending.pendingAssumptions).toEqual([GIFTS]);
    expect(readyToFile(pending)).toBe(false);
    const item = result.deductions.items.find((state) => state.id === "gifts_cash");
    expect(item).toMatchObject({ status: "assumed", assumed: true, missing: [GIFTS] });
  });

  it("never override a fact: the document wins with no cleanup", () => {
    const result = evaluate(madison.facts, [assumption(1)]);
    expect(line(result, LINE_11)).toBe(25000);
    expect(result.assumptionsInUse).toEqual([]);
    expect(pendingInputs(result).pendingAssumptions).toEqual([]);
  });

  it("keep the newest assumption for a key", () => {
    const withoutGifts = madison.facts.filter((fact) => fact.key !== GIFTS);
    const result = evaluate(withoutGifts, [assumption(30000), assumption(25000)]);
    expect(line(result, LINE_11)).toBe(30000);
  });

  it("make an item deciding when its 0 or double flips the result, run through the forms", () => {
    const withoutGifts = madison.facts.filter((fact) => fact.key !== GIFTS);
    const comparison = evaluate(withoutGifts, [assumption(25000)]).deductions.comparison;
    // The same total as with the fact: the forms read the assumption.
    const withFact = line(evaluate(madison.facts, []), LINE_17);
    expect(comparison?.federal).toMatchObject({ itemized: withFact, recommendation: "itemize" });
    expect(comparison?.federal?.decidingItems).toEqual(["gifts_cash"]);
    // California itemizes even with no cash gifts.
    expect(comparison?.ca).toMatchObject({ recommendation: "itemize", decidingItems: [] });
  });
});

describe("a loan over the debt limit", () => {
  it("is for the CPA, and the comparison counts its full interest, the most the line can be", () => {
    const facts = madison.facts.map((fact) =>
      fact.key === MORTGAGE_KEYS.outstandingPrincipalForm1098 ? { ...fact, value: 1200000 } : fact,
    );
    const result = evaluate(facts, []);
    expect(line(result, LINE_17)).toBeUndefined();
    const mortgage = result.deductions.items.find((state) => state.id === "mortgage_interest");
    expect(mortgage?.status).toBe("for_cpa");
    // Her real loan is within the limit, so her line 17 counts the full interest.
    const fullInterest = line(evaluate(madison.facts, []), LINE_17);
    expect(result.deductions.comparison?.federal?.itemized).toBe(fullInterest);
  });
});

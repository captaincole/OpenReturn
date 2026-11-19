import { evaluateScenario } from "@openreturn/engine";
import { loadScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import { incomeSoFar } from "../../src/mastra/tools/incomeSoFar";

const madison = await loadScenario("tcb-ca-005");

const incomeWith = (facts: typeof madison.facts, decisions: typeof madison.decisions) =>
  incomeSoFar(
    evaluateScenario({
      filing: { id: "madison", taxYear: madison.taxYear },
      facts,
      decisions,
      authEmail: null,
    }),
  );

const line9 = () => {
  const scenario = evaluateScenario({
    filing: { id: "madison", taxYear: madison.taxYear },
    facts: madison.facts,
    decisions: madison.decisions,
    authEmail: null,
  });
  const field = scenario.forms
    .get("form-1040")!
    .fields.find((each) => each.fieldId === "form-1040.line.9");
  return field?.result.ok ? field.result.value : undefined;
};

describe("income so far", () => {
  it("is Form 1040's total income when the return is complete", () => {
    const income = incomeWith(madison.facts, madison.decisions);
    expect(income).toEqual({
      wages: 194368,
      interest: 330,
      dividends: 4870,
      capitalGains: 37109,
      other: 28088,
      total: 264765,
    });
    expect(income.total).toBe(line9());
  });

  it("counts the documents before any decision is made", () => {
    const income = incomeWith(madison.facts, []);
    expect(income).toMatchObject({
      wages: 194368,
      interest: 330,
      dividends: 4870,
      capitalGains: 37109,
    });
    /* Taxable Social Security waits for the filing status, so "other" is the pension only. */
    expect(income.other).toBe(11207);
  });

  it("grows with each document", () => {
    const wagesOnly = madison.facts.filter((fact) => fact.category === "wages");
    expect(incomeWith(wagesOnly, [])).toEqual({
      wages: 194368,
      interest: 0,
      dividends: 0,
      capitalGains: 0,
      other: 0,
      total: 194368,
    });
  });

  it("is zero with nothing recorded", () => {
    expect(incomeWith([], []).total).toBe(0);
  });

  it("does not assume a federal return against a recorded decision", () => {
    const noFederal = madison.decisions.map((row) =>
      row.decisionKey === "decisions.scope.must_file_federal" ? { ...row, decision: false } : row,
    );
    expect(incomeWith(madison.facts, noFederal).total).toBe(0);
  });
});

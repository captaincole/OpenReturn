/*
 * 1040 deduction and 1099-R rules, checked by running carter (MFS, born
 * 1953) with one input changed at a time:
 *   - line 12b / 12e: an MFS spouse who itemizes makes the standard
 *     deduction zero (instructions, Exception 2); no answer blocks 12e.
 *   - line 14: blank for a filer born before 1961 who is not MFS (the
 *     Schedule 1-A senior deduction is not modeled).
 *   - line 4b: Roth code Q is 0; codes J and T block (Form 8606).
 */

import { describe, expect, it } from "vitest";
import { SPOUSE_KEYS } from "../src/engine/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../src/engine/facts/rows.js";
import { evaluateScenario } from "../src/engine/index.js";
import { carterScenario } from "./scenarios/carter/index.js";

const LIBERTY_KEY = "payer.liberty-trust-company.distributions.code-q";

function lines(facts: TaxFactRow[], decisions: AIDecisionRow[] = carterScenario.decisions) {
  const { forms } = evaluateScenario({
    filing: { id: "carter-variant", taxYear: 2025 },
    facts,
    decisions,
    authEmail: null,
  });
  const form = forms.get("form-1040");
  return (fieldId: string) => {
    const f = form?.fields.find((x) => x.fieldId === `form-1040.${fieldId}`);
    return f?.result.ok ? f.result.value : "blank";
  };
}

const withFact = (key: string, value: unknown) =>
  carterScenario.facts.map((f) => (f.key === key ? { ...f, value } : f));
const withoutFact = (key: string) => carterScenario.facts.filter((f) => f.key !== key);
const withStatus = (status: string) =>
  carterScenario.decisions.map((d) =>
    d.decisionKey === "decisions.scope.filing_status" ? { ...d, decision: status } : d,
  );
const withRothCode = (code: string) => {
  const row = carterScenario.facts.find((f) => f.key === LIBERTY_KEY);
  return withFact(LIBERTY_KEY, { ...(row?.value as object), box7: code });
};

describe("line 12b / 12e — MFS spouse itemizes", () => {
  it("spouse does not itemize: full standard deduction, 12b blank", () => {
    const line = lines(carterScenario.facts);
    expect(line("line.12e")).toBe(17350);
    expect(line("line.12b_spouse_itemizes_separate")).toBe("blank");
  });

  it("spouse itemizes: 12b checked, 12e is 0 even when born before 1961", () => {
    const line = lines(withFact(SPOUSE_KEYS.itemizesSeparately, true));
    expect(line("line.12b_spouse_itemizes_separate")).toBe(true);
    expect(line("line.12e")).toBe(0);
    expect(line("line.15")).toBe(17800);
  });

  it("no answer: 12e through the refund stay blank", () => {
    const line = lines(withoutFact(SPOUSE_KEYS.itemizesSeparately));
    for (const id of ["line.12e", "line.14", "line.15", "line.16", "line.24", "line.34"]) {
      expect(line(id), id).toBe("blank");
    }
  });
});

describe("line 14 — enhanced deduction for seniors", () => {
  it("MFS cannot claim it: line 14 computes", () => {
    expect(lines(carterScenario.facts)("line.14")).toBe(17350);
  });

  it("single, born before 1961: 12e computes, line 14 and the tax and refund stay blank", () => {
    const line = lines(carterScenario.facts, withStatus("single"));
    expect(line("line.12e")).toBe(15750 + 2000);
    for (const id of ["line.14", "line.15", "line.16", "line.24", "line.34"]) {
      expect(line(id), id).toBe("blank");
    }
  });
});

describe("line 4b — Roth IRA codes", () => {
  it("code Q is not taxable", () => {
    expect(lines(withRothCode("Q"))("line.4b")).toBe(0);
  });

  it.each(["J", "T"])("code %s blocks 4b (Form 8606 not modeled)", (code) => {
    const line = lines(withRothCode(code));
    expect(line("line.4a")).toBe(35800);
    expect(line("line.4b")).toBe("blank");
  });
});

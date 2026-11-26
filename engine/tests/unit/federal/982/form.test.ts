/*
 * Form 982 on a whole return: who files, the answers it waits for, Schedule 1
 * line 8c, Schedule CA line 8c column C, and the cases the engine does not
 * figure. The synthetic ailil (Texas) and berowyn (California) scenarios are
 * the bases.
 */

import { describe, expect, it } from "vitest";
import {
  DEBT_RELIEF_KEYS,
  makeCanceledDebtFactKey,
  makeForm1099CFactKey,
  type CanceledDebtFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { aililScenario } from "../../../scenarios/synthetic/ailil/index.js";
import { berowynScenario } from "../../../scenarios/synthetic/berowyn/index.js";
import type { Scenario } from "../../../types.js";

const isDebtFact = (fact: TaxFactRow) =>
  fact.key.startsWith("canceled_debt.") ||
  fact.key.startsWith("debt_relief.") ||
  fact.key.includes(".1099c.");

function evaluate(
  base: Scenario,
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
) {
  const result = evaluateScenario({
    filing: { id: "form-982-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  const pending = pendingInputs(result);
  return { files, field, value, pending: [...pending.pendingDecisions, ...pending.pendingFacts] };
}

const without = (base: Scenario, drop: (fact: TaxFactRow) => boolean) =>
  base.facts.filter((fact) => !drop(fact));

const template = aililScenario.facts.find((fact) => fact.key.startsWith("canceled_debt."))!;
const debtFact = (slug: string, value: CanceledDebtFactValue): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeCanceledDebtFactKey(slug),
  value,
});

const decision = (base: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

describe("no canceled debt: nothing changes", () => {
  const facts = without(aililScenario, isDebtFact);
  const result = evaluate(aililScenario, facts);

  it("Form 982 does not file and Schedule 1 line 8c is blank", () => {
    expect(result.files("form-982")).toBe(false);
    expect(result.value("schedule-1", "0.line.8c")).toBeUndefined();
    expect(result.value("schedule-1", "0.line.9")).toBe(0);
    expect(result.value("form-1040", "line.8")).toBe(28200);
  });

  it("Schedule CA line 8c column C keeps a reason, line 9a column C its old one", () => {
    const facts = without(berowynScenario, isDebtFact);
    const ca = evaluate(berowynScenario, facts);
    expect(ca.field("schedule-ca", "1.line.b8c_additions")?.ok).toBe(false);
    expect(ca.value("schedule-ca", "1.line.b8c_federal")).toBeUndefined();
    expect(ca.field("schedule-ca", "2.line.b9a_additions")?.ok).toBe(false);
    expect(ca.value("form-540", "line.16_ca_adjustments_additions")).toBe(0);
  });
});

describe("the scenarios' receiving lines", () => {
  it("ailil: the card's $15,000 left after insolvency on Schedule 1 line 8c", () => {
    const result = evaluate(aililScenario, aililScenario.facts);
    expect(result.files("form-982")).toBe(true);
    expect(result.value("schedule-1", "0.line.8c")).toBe(15000);
    expect(result.value("form-982", "0.part3.corporation_amount_excluded")).toBeUndefined();
    expect(result.pending).toEqual([]);
  });

  it("berowyn: line 1e's $25,000 is a California addition on line 8c column C", () => {
    const result = evaluate(berowynScenario, berowynScenario.facts);
    expect(result.value("schedule-ca", "1.line.b8c_federal")).toBe(7400);
    expect(result.value("schedule-ca", "1.line.b8c_additions")).toBe(25000);
    expect(result.value("schedule-ca", "2.line.b9a_additions")).toBe(25000);
    expect(result.value("form-540", "line.16_ca_adjustments_additions")).toBe(25000);
  });
});

describe("who files and what it waits for", () => {
  it("the explicit decision false keeps Form 982 off the return", () => {
    const decisions = [
      ...aililScenario.decisions,
      decision(aililScenario, "decisions.scope.must_file_982", false),
    ];
    expect(evaluate(aililScenario, aililScenario.facts, decisions).files("form-982")).toBe(false);
  });

  it("a Form 1099-C with no answer: Schedule 1 asks for it and lines 8c and 9 wait", () => {
    const facts = aililScenario.facts.filter(
      (fact) => fact.key !== makeCanceledDebtFactKey("lone-star-card"),
    );
    const result = evaluate(aililScenario, facts);
    const asked = makeCanceledDebtFactKey("lone-star-card-2025-001");
    expect(result.pending).toContain(asked);
    expect(result.value("schedule-1", "0.line.8c")).toBeUndefined();
    expect(result.value("schedule-1", "0.line.9")).toBeUndefined();
    expect(result.value("schedule-1", "0.line.10")).toBeUndefined();
  });

  it("an insolvent debt with no worksheet waits for it", () => {
    const facts = aililScenario.facts.filter((fact) => fact.key !== DEBT_RELIEF_KEYS.insolvency);
    const result = evaluate(aililScenario, facts);
    expect(result.files("form-982")).toBe(true);
    expect(result.pending).toContain(DEBT_RELIEF_KEYS.insolvency);
    expect(result.value("form-982", "0.line.2_total_discharged_excluded")).toBeUndefined();
  });

  it("a farm debt with no tax attributes waits for them", () => {
    const facts = aililScenario.facts.filter((fact) => fact.key !== DEBT_RELIEF_KEYS.taxAttributes);
    expect(evaluate(aililScenario, facts).pending).toContain(DEBT_RELIEF_KEYS.taxAttributes);
  });

  it("a principal residence debt without its loan answers lists the debt again", () => {
    const key = makeCanceledDebtFactKey("caprock-home");
    const facts = aililScenario.facts.map((fact) =>
      fact.key === key
        ? { ...fact, value: { ...(fact.value as object), principalResidence: undefined } }
        : fact,
    );
    expect(evaluate(aililScenario, facts).pending).toContain(key);
  });

  it("a nonbusiness debt with no exclusion: no Form 982, the whole amount on line 8c", () => {
    const facts = [
      ...without(aililScenario, isDebtFact),
      debtFact("store-card", {
        amount: 1234.56,
        date: "2025-05-01",
        kind: "personal",
        title11Case: false,
        insolventBefore: false,
      }),
    ];
    const result = evaluate(aililScenario, facts);
    expect(result.files("form-982")).toBe(false);
    expect(result.files("schedule-1")).toBe(true);
    expect(result.value("schedule-1", "0.line.8c")).toBe(1235);
  });

  it("married filing separately uses the $375,000 cap", () => {
    const facts = [
      ...without(aililScenario, isDebtFact),
      debtFact("home", {
        amount: 100000,
        kind: "principal_residence",
        title11Case: false,
        insolventBefore: false,
        principalResidence: { loanBalance: 450000, qualifiedPart: 450000, keepsHome: false },
      }),
    ];
    const decisions = aililScenario.decisions.map((each) =>
      each.decisionKey === "decisions.scope.filing_status"
        ? { ...each, decision: "married_filing_separately" }
        : each,
    );
    const result = evaluate(aililScenario, facts, decisions);
    expect(result.value("form-982", "0.line.2_total_discharged_excluded")).toBe(25000);
  });
});

describe("cases the engine does not figure", () => {
  it("a taxable business debt makes line 8c unsupported", () => {
    const facts = [
      ...without(aililScenario, isDebtFact),
      debtFact("supplier", {
        amount: 5000,
        date: "2025-05-01",
        kind: "other_business",
        title11Case: false,
        insolventBefore: false,
      }),
    ];
    const line8c = evaluate(aililScenario, facts).field("schedule-1", "0.line.8c");
    expect(line8c?.ok === false && line8c.unsupported).toBe(true);
  });

  it("insolvent debts on two dates make Form 982 and line 8c unsupported", () => {
    const facts = [
      ...aililScenario.facts,
      debtFact("other-card", {
        amount: 2000,
        date: "2025-07-01",
        kind: "personal",
        title11Case: false,
        insolventBefore: true,
      }),
    ];
    const result = evaluate(aililScenario, facts);
    const line2 = result.field("form-982", "0.line.2_total_discharged_excluded");
    expect(line2?.ok === false && line2.unsupported).toBe(true);
    const line8c = result.field("schedule-1", "0.line.8c");
    expect(line8c?.ok === false && line8c.unsupported).toBe(true);
  });

  it("a debt fact that names a missing Form 1099-C is a gap", () => {
    const facts = [
      ...aililScenario.facts,
      debtFact("ghost", {
        form1099CKey: makeForm1099CFactKey("nobody", "1"),
        kind: "personal",
        title11Case: false,
        insolventBefore: false,
      }),
    ];
    const line2 = evaluate(aililScenario, facts).field(
      "form-982",
      "0.line.2_total_discharged_excluded",
    );
    expect(line2?.ok === false && line2.unsupported).toBe(true);
  });
});

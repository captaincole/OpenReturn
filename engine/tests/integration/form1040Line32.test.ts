import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import { EIC_KEYS, makeBusinessFactKey, makeDependentFactKey } from "../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { FORM_8862_GAP } from "../../src/federal/schedule-eic/credit.js";
import { decisionRow } from "../helpers/fixtureBuilders.js";
import { tcbUs002Scenario as base } from "../scenarios/tcb-us-002/index.js";

/*
 * Form 1040 line 32 adds line 27a (EIC) and line 28 (Schedule 8812 line 27). A
 * blank credit counts as 0 only when it is final: while one waits, line 32 and
 * the lines after it wait. tcb-us-002: head of household, $32,000 of wages, one nephew.
 */
const NEPHEW_KEY = makeDependentFactKey("kiddo-ben");
const REFUND_LINES = ["line.32", "line.33", "line.34", "line.35a"];

/* A side business: Schedule 8812 line 18a is unsupported, so line 27 stays blank. */
const business: TaxFactRow = {
  ...base.facts[0]!,
  id: "f-business",
  category: "self_employment",
  key: makeBusinessFactKey("side"),
  value: {
    activity: "Consulting",
    grossReceipts: 5_000,
    sellsGoods: false,
    materiallyParticipated: true,
    expenses: { supplies: 1_000 },
  },
};

function withWages(facts: TaxFactRow[], wages: number): TaxFactRow[] {
  return facts.map((fact) => {
    if (fact.category !== "wages") return fact;
    const w2 = fact.value as Record<string, unknown>;
    return { ...fact, value: { ...w2, box1: wages, box3: wages, box5: wages, box16: wages } };
  });
}

function withNephews(facts: TaxFactRow[], count: number): TaxFactRow[] {
  return facts.flatMap((fact): TaxFactRow[] => {
    if (fact.key !== NEPHEW_KEY) return [fact];
    const nephew = fact.value as Record<string, unknown>;
    return Array.from({ length: count }, (_, index) =>
      index === 0
        ? fact
        : {
            ...fact,
            id: `${fact.id}-${index}`,
            key: makeDependentFactKey(`kiddo-ben-${index}`),
            value: { ...nephew, firstName: `Kiddo${index}`, ssn: `900-45-678${index}` },
          },
    );
  });
}

/* Schedule 1-A files with no facts: 1040 line 18 waits, so 8812 lines 13 and 14 wait. */
const schedule1AFiles = decisionRow({
  userId: "t",
  taxYear: base.taxYear,
  key: "decisions.scope.must_file_schedule_1_a",
  decision: true,
  rationale: "test",
});

/* No date of birth: the nephew's row (7) credit is undecided, so 8812 line 4 waits. */
function withoutNephewBirthDate(facts: TaxFactRow[]): TaxFactRow[] {
  return facts.map((fact) => {
    if (fact.key !== NEPHEW_KEY) return fact;
    const { dob: _dob, ...nephew } = fact.value as Record<string, unknown>;
    return { ...fact, value: nephew };
  });
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const scenario = evaluateScenario({
    filing: { id: "form-1040-line-32-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const result = (formId: string, line: string) =>
    scenario.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${line}`)?.result;
  const value = (formId: string, line: string) => {
    const found = result(formId, line);
    return found?.ok ? found.value : undefined;
  };
  return {
    form1040: (line: string) => value("form-1040", line),
    form1040Result: (line: string) => result("form-1040", line),
    schedule8812: (line: string) => value("schedule-8812", line),
  };
}

describe("Form 1040 line 32", () => {
  it("adds tcb-us-002's EIC and additional child tax credit", () => {
    const result = evaluate(base.facts);
    expect(result.form1040("line.27a")).toBe(2678);
    expect(result.form1040("line.28")).toBe(1447);
    expect(result.form1040("line.32")).toBe(4125);
    expect(result.form1040("line.33")).toBe(6925);
    expect(result.form1040("line.35a")).toBe(6925);
  });

  it("waits with lines 33–35a while an EIC answer is missing", () => {
    const result = evaluate(base.facts.filter((fact) => fact.key !== EIC_KEYS.barredByIrs));
    expect(result.form1040("line.28")).toBe(1447);
    for (const line of REFUND_LINES) expect(result.form1040(line)).toBeUndefined();
    expect(result.form1040Result("line.32")).not.toHaveProperty("unsupported", true);
  });

  it("is unsupported with the EIC; lines 33–35a wait", () => {
    const result = evaluate(
      base.facts.map((fact) =>
        fact.key === EIC_KEYS.deniedInEarlierYear ? { ...fact, value: true } : fact,
      ),
    );
    expect(result.form1040Result("line.32")).toEqual({
      ok: false,
      unsupported: true,
      reason: FORM_8862_GAP,
    });
    const line33 = result.form1040Result("line.33");
    expect(line33?.ok).toBe(false);
    expect(line33).not.toHaveProperty("unsupported", true);
    expect(result.form1040("line.35a")).toBeUndefined();
  });

  it("waits while Schedule 8812 Part II is open and line 27 is blank", () => {
    const result = evaluate([...withNephews(base.facts, 3), business]);
    expect(result.form1040("line.27a")).toBeTypeOf("number");
    expect(result.schedule8812("1.line.16a_line12_minus_line14")).toBeTypeOf("number");
    expect(result.form1040("line.28")).toBeUndefined();
    for (const line of REFUND_LINES) expect(result.form1040(line)).toBeUndefined();
  });

  it("stays blank, and line 33 adds 0, when there is no EIC and Part II is closed", () => {
    const result = evaluate(withWages(base.facts, 120_000));
    expect(result.schedule8812("0.line.12_credit_after_phaseout")).toBe(2200);
    expect(result.schedule8812("0.line.14_child_tax_credit_and_other_dependents")).toBe(2200);
    expect(result.form1040("line.32")).toBeUndefined();
    expect(result.form1040("line.33")).toBe(result.form1040("line.25d"));
    expect(result.form1040("line.37")).toBeTypeOf("number");
  });

  it("waits while Schedule 8812 line 14 waits on Form 1040 line 18", () => {
    const result = evaluate(base.facts, [...base.decisions, schedule1AFiles]);
    expect(result.schedule8812("0.line.12_credit_after_phaseout")).toBe(2200);
    expect(result.schedule8812("0.line.14_child_tax_credit_and_other_dependents")).toBeUndefined();
    expect(result.form1040("line.27a")).toBe(2678);
    expect(result.form1040("line.28")).toBeUndefined();
    for (const line of REFUND_LINES) expect(result.form1040(line)).toBeUndefined();
  });

  it("waits while a dependent's credit is undecided", () => {
    const result = evaluate(withoutNephewBirthDate(withWages(base.facts, 120_000)));
    expect(result.schedule8812("0.line.12_credit_after_phaseout")).toBeUndefined();
    for (const line of REFUND_LINES) expect(result.form1040(line)).toBeUndefined();
  });
});

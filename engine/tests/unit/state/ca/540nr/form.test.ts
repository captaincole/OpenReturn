/*
 * Form 540NR and Schedule CA (540NR) on a whole return: who files, the stated
 * column E answers, the gaps for the forms figured for Form 540 only, the
 * limits of the ratios, and that a full-year resident's Form 540 does not
 * change. The synthetic pritalle scenario (a part-year resident) is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CA_RESIDENCY_FACT_KEYS,
  caCaliforniaAmountKey,
  makeInterestFactKey,
  makeW2FactKey,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { alexScenario } from "../../../../scenarios/alex/index.js";
import { pritalleScenario as base } from "../../../../scenarios/synthetic/pritalle/index.js";

const categoryOf = (key: string) => (key.startsWith("ca_540nr.") ? "state_local_tax" : "other");

/* The base return with facts replaced by key (undefined drops one) and decisions replaced (undefined drops one). */
function evaluate(facts: Record<string, unknown> = {}, decisions: Record<string, unknown> = {}) {
  const template = base.facts[0]!;
  const kept = base.facts.filter((fact) => !(fact.key in facts));
  const added: TaxFactRow[] = Object.entries(facts)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ({
      ...template,
      id: `f-${key}`,
      key,
      category: base.facts.find((fact) => fact.key === key)?.category ?? categoryOf(key),
      value,
    }));
  const decided: AIDecisionRow[] = [
    ...base.decisions.filter((row) => !(row.decisionKey in decisions)),
    ...Object.entries(decisions)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) =>
        decisionRow({
          userId: base.userId,
          taxYear: base.taxYear,
          key,
          decision: value,
          rationale: "test",
        }),
      ),
  ];
  const result = evaluateScenario({
    filing: { id: "form-540nr-test", taxYear: base.taxYear },
    facts: [...kept, ...added],
    decisions: decided,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (id: string) => {
    const [formId] = id.split(".");
    return result.forms.get(formId!)?.fields.find((each) => each.fieldId === id)?.result;
  };
  const value = (id: string) => {
    const result = field(id);
    return result?.ok ? result.value : undefined;
  };
  return { result, files, field, value, pending: pendingInputs(result) };
}

const INTEREST_KEY = makeInterestFactKey("golden-bear-savings");
const INTEREST = base.facts.find((fact) => fact.key === INTEREST_KEY)!.value as Record<
  string,
  unknown
>;
const W2_KEY = makeW2FactKey("delta-orchard");
const W2 = base.facts.find((fact) => fact.key === W2_KEY)!.value as Record<string, unknown>;

describe("who files", () => {
  it("a part-year resident with the decision files Form 540NR and Schedule CA (540NR), not Form 540", () => {
    const run = evaluate();
    expect(run.files("form-540nr")).toBe(true);
    expect(run.files("schedule-ca-540nr")).toBe(true);
    expect(run.files("form-540")).toBe(false);
  });

  it("a part-year resident with no decision is asked whether Form 540NR files", () => {
    const run = evaluate({}, { "decisions.scope.must_file_540nr": undefined });
    expect(run.pending.pendingDecisions).toContain("decisions.scope.must_file_540nr");
  });

  it("a nonresident with no stated California amount does not file Form 540NR", () => {
    const run = evaluate(
      {
        [caCaliforniaAmountKey("1a")]: undefined,
        [caCaliforniaAmountKey("2b")]: undefined,
        [caCaliforniaAmountKey("7a")]: undefined,
      },
      {
        "decisions.scope.must_file_540nr": undefined,
        "decisions.scope.ca_residency": "non_resident",
      },
    );
    expect(run.files("form-540nr")).toBe(false);
  });

  it("a nonresident who states California-source income is asked", () => {
    const run = evaluate(
      {},
      {
        "decisions.scope.must_file_540nr": undefined,
        "decisions.scope.ca_residency": "non_resident",
      },
    );
    expect(run.pending.pendingDecisions).toContain("decisions.scope.must_file_540nr");
  });

  it("asks for the residency when Form 540NR files without it", () => {
    const run = evaluate({}, { "decisions.scope.ca_residency": undefined });
    expect(run.pending.pendingDecisions).toContain("decisions.scope.ca_residency");
  });

  it("a full-year resident files Form 540, not Form 540NR", () => {
    const run = evaluateScenario({
      filing: { id: "alex", taxYear: alexScenario.taxYear },
      facts: alexScenario.facts,
      decisions: alexScenario.decisions,
      authEmail: null,
    });
    expect(run.forms.get("form-540")?.mustFile).toMatchObject({ ok: true, value: true });
    expect(run.forms.get("form-540nr")?.mustFile).toMatchObject({ ok: true, value: false });
    expect(run.forms.get("schedule-ca-540nr")?.mustFile).toMatchObject({ ok: true, value: false });
  });
});

describe("column E is a stated answer", () => {
  it("a line the form asks for waits for its answer, and the form lists it", () => {
    const run = evaluate({ [caCaliforniaAmountKey("1a")]: undefined });
    expect(run.value("schedule-ca-540nr.0.line.1a_ca_amounts")).toBeUndefined();
    expect(run.pending.pendingFacts).toContain(caCaliforniaAmountKey("1a"));
    expect(run.value("form-540nr.1.line.32_ca_agi")).toBeUndefined();
  });

  it("a stated 0 is an answer", () => {
    const run = evaluate({ [caCaliforniaAmountKey("2b")]: 0 });
    expect(run.value("schedule-ca-540nr.0.line.2b_ca_amounts")).toBe(0);
    expect(run.value("schedule-ca-540nr.3.line.c27_ca_amounts")).toBe(76000);
  });

  // A penalty on early withdrawal of savings (1099-INT box 2) is Schedule 1 line 18, Schedule CA line 18.
  it("a line the form does not ask for is a gap, and so are the totals, never 0", () => {
    const run = evaluate({ [INTEREST_KEY]: { ...INTEREST, box2: 120 } });
    expect(run.value("schedule-ca-540nr.2.line.c18_total_ca_law")).toBe(120);
    expect(run.field("schedule-ca-540nr.2.line.c18_ca_amounts")).toMatchObject({
      unsupported: true,
    });
    expect(run.field("schedule-ca-540nr.3.line.c27_ca_amounts")).toMatchObject({
      unsupported: true,
    });
    expect(run.field("schedule-ca-540nr.4.part4.1_california_agi")).toMatchObject({
      unsupported: true,
    });
  });

  it("stating that line clears the gap", () => {
    const run = evaluate({
      [INTEREST_KEY]: { ...INTEREST, box2: 120 },
      [caCaliforniaAmountKey("c18")]: 120,
    });
    expect(run.value("schedule-ca-540nr.3.line.c26_ca_amounts")).toBe(120);
    expect(run.value("schedule-ca-540nr.3.line.c27_ca_amounts")).toBe(76650 - 120);
  });
});

describe("the forms figured for Form 540 only are named gaps", () => {
  it("line 7a columns B and C name Schedule D (540NR)", () => {
    const run = evaluate();
    expect(run.field("schedule-ca-540nr.0.line.7a_subtractions")).toMatchObject({
      unsupported: true,
      reason: expect.stringContaining("Schedule D (540NR)"),
    });
  });

  it("without full-year coverage, line 91 names FTB 3853", () => {
    const run = evaluate({ "health_coverage.full_year_mec": false });
    expect(run.field("form-540nr.2.line.91_isr_penalty")).toMatchObject({
      unsupported: true,
      reason: expect.stringContaining("FTB 3853"),
    });
    expect(run.value("form-540nr.2.line.92_payments_after_isr_penalty")).toBe(3150);
  });

  it("the part-year resident needs none of them: lines 41 and 50 are blank, not gaps", () => {
    const run = evaluate();
    expect(run.field("form-540nr.1.line.41_tax_amount")).toMatchObject({ ok: false });
    expect(run.field("form-540nr.1.line.41_tax_amount")).not.toMatchObject({ unsupported: true });
    expect(run.field("form-540nr.1.line.50_child_dependent_care_credit")).not.toMatchObject({
      unsupported: true,
    });
  });
});

describe("the ratios on the return", () => {
  it("line 38 is 1.0000 when California taxable income is more than total taxable income", () => {
    const run = evaluate({ [caCaliforniaAmountKey("1a")]: 200000 });
    expect(run.value("form-540nr.1.line.38_exemption_credit_percentage_whole_digit")).toBe("1");
    expect(run.value("form-540nr.1.line.38_exemption_credit_percentage_decimal_digits")).toBe(
      "0000",
    );
    expect(run.value("schedule-ca-540nr.4.part4.3_deduction_percentage_whole_digit")).toBe(1);
    expect(run.value("form-540nr.1.line.39_ca_prorated_exemption_credits")).toBe(153);
  });

  /*
   * Federal AGI over $252,203: the AGI Limitation Worksheet. Wages $400,000:
   * AGI 413,400; (413,400 − 252,203) / 2,500 = 64.48 → 65 steps × $6 = $390,
   * more than the $153 credit: line n is 0, and so is line 39.
   */
  it("line 39 takes the AGI Limitation Worksheet above the threshold", () => {
    const run = evaluate({ [W2_KEY]: { ...W2, box1: 348000 } });
    expect(run.value("form-540nr.1.line.13_federal_agi")).toBe(413400);
    expect(run.value("form-540nr.1.line.39_ca_prorated_exemption_credits")).toBe(0);
  });

  it("line 72 is 1% of California taxable income over $1,000,000", () => {
    const run = evaluate({
      [W2_KEY]: { ...W2, box1: 1400000 },
      [caCaliforniaAmountKey("1a")]: 1400000,
    });
    const californiaIncome = run.value("form-540nr.1.line.35_ca_taxable_income") as number;
    expect(californiaIncome).toBeGreaterThan(1000000);
    expect(run.value("form-540nr.2.line.72_behavioral_health_services_tax")).toBe(
      Math.round((californiaIncome - 1000000) * 0.01),
    );
  });
});

describe("Part I prints each person's answers", () => {
  it("line 1a falls back on the residency decision when the Part I fact is missing, and the fact is asked", () => {
    const run = evaluate({ [CA_RESIDENCY_FACT_KEYS.taxpayer]: undefined });
    expect(run.value("schedule-ca-540nr.0.part1.1a_residency_myself")).toBe("part_year_resident");
    expect(run.value("schedule-ca-540nr.0.part1.6_days_in_ca_yourself")).toBeUndefined();
    expect(run.pending.pendingFacts).toContain(CA_RESIDENCY_FACT_KEYS.taxpayer);
  });
});

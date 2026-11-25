/*
 * FTB 3461 on a whole return: who files, the answers it waits on, the gap
 * for Form 540NR, and the Schedule CA lines that take its results (line 8p
 * columns B and C, line 8z column B, line 9a column C). The synthetic
 * egeanin and nisao scenarios are the bases; ottilie has no business.
 */

import { describe, expect, it } from "vitest";
import {
  CA_BUSINESS_LOSS_LIMIT_KEYS,
  type SCorporationK1FactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { egeaninScenario as egeanin } from "../../../../scenarios/synthetic/egeanin/index.js";
import { nisaoScenario as nisao } from "../../../../scenarios/synthetic/nisao/index.js";
import { ottilieScenario as ottilie } from "../../../../scenarios/synthetic/ottilie/index.js";
import type { Scenario } from "../../../../types.js";

function evaluate(base: Scenario, facts: TaxFactRow[] = base.facts, extra: AIDecisionRow[] = []) {
  const extraKeys = new Set(extra.map((row) => row.decisionKey));
  const result = evaluateScenario({
    filing: { id: "form-3461-test", taxYear: base.taxYear },
    facts,
    decisions: [...base.decisions.filter((row) => !extraKeys.has(row.decisionKey)), ...extra],
  });
  const field = (fieldId: string) =>
    result.forms.get(fieldId.split(".")[0])?.fields.find((entry) => entry.fieldId === fieldId)
      ?.result as
      { ok: boolean; value?: unknown; unsupported?: boolean; reason?: string } | undefined;
  const value = (fieldId: string) => {
    const found = field(fieldId);
    return found?.ok ? found.value : undefined;
  };
  const reason = (fieldId: string) => {
    const found = field(fieldId);
    return found?.unsupported ? found.reason : undefined;
  };
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  return { value, reason, files, pending: pendingInputs(result).pendingFacts };
}

const decision = (base: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const LINE = (line: string) => `form-3461.0.line.${line}`;
const CA = (line: string) => `schedule-ca.${line}`;
const L16 = LINE("16_excess_business_loss");
const L17 = LINE("17_excess_business_loss_adjustment");
const L14A = LINE("14a_business_income_or_loss");
const L14B = LINE("14b_prior_year_excess_loss_carryover");
const COLUMN_B_8P = CA("1.line.b8p_subtractions");
const COLUMN_C_8P = CA("1.line.b8p_additions");
const COLUMN_B_8Z = CA("1.line.b8z_subtractions");

const K1_KEYS: Record<string, string> = {
  egeanin: "k1.s_corporation.seanchan-dry-dock",
  nisao: "k1.s_corporation.malkier-instruments",
};

/* The base's K-1 with a new box 1 amount (other boxes kept). */
function withK1Loss(base: Scenario, amount: number): TaxFactRow[] {
  return base.facts.map((fact) => {
    if (fact.key !== K1_KEYS[base.name]) return fact;
    const value = fact.value as SCorporationK1FactValue;
    const boxes = value.boxes.map((box) => (box.box === "1" ? { ...box, amount } : box));
    return { ...fact, value: { ...value, boxes } };
  });
}

const without = (facts: TaxFactRow[], key: string) => facts.filter((fact) => fact.key !== key);
const withFact = (facts: TaxFactRow[], key: string, value: number): TaxFactRow[] => [
  ...without(facts, key),
  { ...facts[0], id: `f-${key}`, category: "other", key, value },
];

describe("who files (ca-3461-inst-2025::sec::b-who-must-file::b01)", () => {
  it("files when the business losses, added without income, pass $313,000", () => {
    expect(evaluate(egeanin).files("form-3461")).toBe(true);
    expect(evaluate(nisao).files("form-3461")).toBe(true);
  });

  it("does not file with a $100,000 K-1 loss and no carryover", () => {
    const small = evaluate(egeanin, withK1Loss(egeanin, -100000));
    expect(small.files("form-3461")).toBe(false);
    expect(small.value(COLUMN_C_8P)).toBeUndefined();
    expect(small.value(COLUMN_B_8P)).toBeUndefined();
  });

  it("files with a carryover alone (line 14b), and uses it against business income", () => {
    const income = evaluate(nisao, withK1Loss(nisao, -50000));
    expect(income.files("form-3461")).toBe(true);
    expect(income.value(L14A)).toBe(50000);
    // 50,000 − 200,000 + 313,000 = 163,000: "zero or greater", so line 16 is blank (the form).
    expect(income.value(L16)).toBeUndefined();
    expect(income.value(L17)).toBeUndefined();
    expect(income.value(COLUMN_B_8Z)).toBe(200000);
  });

  it("leaves line 16 blank at exactly zero (the form: only a negative amount is entered)", () => {
    // 100,000 − 213,000 − 200,000 = −313,000 on line 14c; + 313,000 = 0.
    const even = evaluate(nisao, withK1Loss(nisao, -213000));
    expect(even.value(LINE("14c_total_business_losses"))).toBe(-313000);
    expect(even.value(L16)).toBeUndefined();
    expect(even.value(L17)).toBeUndefined();
    expect(even.value(COLUMN_C_8P)).toBeUndefined();
    expect(even.value(COLUMN_B_8Z)).toBe(200000);
  });

  it("never files without Form 540", () => {
    const away = evaluate(egeanin, egeanin.facts, [
      decision(egeanin, "decisions.scope.must_file_ca_540", false),
    ]);
    expect(away.files("form-3461")).toBe(false);
  });

  it("the explicit decision wins, and Schedule CA line 8p then cannot swap the amounts", () => {
    const off = evaluate(egeanin, egeanin.facts, [
      decision(egeanin, "decisions.scope.must_file_3461", false),
    ]);
    expect(off.files("form-3461")).toBe(false);
    expect(off.reason(COLUMN_C_8P)).toMatch(/FTB 3461 does not file/);
    expect(off.reason(COLUMN_B_8P)).toMatch(/Column B prints only with column C/);
  });
});

describe("the answers it waits on", () => {
  it("asks for last year's line 16 when the form files", () => {
    const facts = without(egeanin.facts, CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearCarryover);
    const missing = evaluate(egeanin, facts);
    expect(missing.pending).toContain(CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearCarryover);
    expect(missing.value(L14A)).toBe(-605000);
    expect(missing.value(L16)).toBeUndefined();
    expect(missing.value(COLUMN_C_8P)).toBeUndefined();
  });

  it("asks for the prior adjustments only with a carryover", () => {
    expect(evaluate(egeanin).pending).not.toContain(
      CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearAdjustmentsIncluded,
    );
    const facts = without(nisao.facts, CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearAdjustmentsIncluded);
    const missing = evaluate(nisao, facts);
    expect(missing.pending).toContain(CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearAdjustmentsIncluded);
    expect(missing.value(L16)).toBe(-137000);
    expect(missing.value(L17)).toBeUndefined();
  });
});

describe("egeanin: no carryover, line 16 goes to Schedule CA line 8p column C", () => {
  const run = evaluate(egeanin);

  it("keeps the business capital loss as a business loss (::line-11::b01 note)", () => {
    expect(run.value(LINE("3_schedule_ca_section_a_line_7a"))).toBe(-3000);
    expect(run.value(LINE("11_nonbusiness_losses_or_deductions"))).toBe(1500);
    expect(run.value("form-461.0.line.11_nonbusiness_losses_deductions")).toBe(4500);
  });

  it("swaps the federal adjustment for California's on line 8p", () => {
    expect(run.value(L14B)).toBeUndefined();
    expect(run.value(L16)).toBe(-292000);
    expect(run.value(L17)).toBeUndefined();
    expect(run.value(CA("1.line.b8p_federal"))).toBe(289000);
    expect(run.value(COLUMN_B_8P)).toBe(289000);
    expect(run.value(COLUMN_C_8P)).toBe(292000);
    expect(run.value(CA("2.line.b9a_additions"))).toBe(292000);
    expect(run.value("form-540.line.17_ca_agi")).toBe(
      (run.value("form-540.line.13_federal_agi") as number) + 3000,
    );
  });
});

describe("nisao: a carryover (line 14b)", () => {
  it("under the threshold: the room left goes on line 8z column B, line 17 is blank", () => {
    const run = evaluate(nisao);
    expect(run.value(L14B)).toBe(-200000);
    expect(run.value(L16)).toBe(-137000);
    expect(run.value(L17)).toBeUndefined();
    expect(run.value(COLUMN_C_8P)).toBeUndefined();
    expect(run.value(COLUMN_B_8Z)).toBe(63000);
    expect(run.value(CA("1.line.b8z_income_type"))).toBe(
      "excess business losses carryover from prior years",
    );
  });

  it("over the threshold: line 17 is the new excess, and nothing goes on line 8z", () => {
    const run = evaluate(nisao, withK1Loss(nisao, -450000));
    expect(run.value(L14A)).toBe(-350000);
    expect(run.value(L16)).toBe(-237000);
    expect(run.value(L17)).toBe(37000);
    expect(run.value(COLUMN_C_8P)).toBe(37000);
    expect(run.value(COLUMN_B_8Z)).toBeUndefined();
  });

  it("with prior adjustments larger than line 16: no adjustment (::line-17::b01)", () => {
    const facts = withFact(
      withK1Loss(nisao, -450000),
      CA_BUSINESS_LOSS_LIMIT_KEYS.priorYearAdjustmentsIncluded,
      300000,
    );
    const run = evaluate(nisao, facts);
    expect(run.value(L17)).toBeUndefined();
    expect(run.value(COLUMN_C_8P)).toBeUndefined();
  });
});

describe("Form 540NR", () => {
  it("leaves Part I a gap: Schedule CA (540NR) column E is not filled", () => {
    const run = evaluate(egeanin, egeanin.facts, [
      decision(egeanin, "decisions.scope.must_file_540nr", true),
    ]);
    expect(run.reason(LINE("2_schedule_ca_section_b_line_3"))).toMatch(/540NR/);
    expect(run.reason(L16)).toMatch(/540NR/);
  });
});

describe("no facts, nothing changes", () => {
  it("a return with no business files no FTB 3461 and leaves line 8p and 8z column B as before", () => {
    const run = evaluate(ottilie);
    expect(run.files("form-3461")).toBe(false);
    expect(run.value(COLUMN_B_8P)).toBeUndefined();
    expect(run.value(COLUMN_C_8P)).toBeUndefined();
    expect(run.reason(COLUMN_B_8Z)).toBeDefined();
    expect(run.reason(CA("2.line.b9a_additions"))).toBeDefined();
  });
});

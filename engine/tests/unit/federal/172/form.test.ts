/*
 * Form 172 and Schedule 1 line 8a on a whole return: who files, the answers
 * Part II asks for, the carryover deduction with and without Form 172, and
 * the gaps. The synthetic galina (a farm NOL) and wren (no loss) scenarios
 * are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeNolCarrybackYearFactKey,
  makeSocialSecurityFactKey,
  NOL_KEYS,
  type NolCarryoverRow,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { AGI_ITEMS_GAP } from "../../../../src/federal/schedule-1/nolDeduction.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { galinaScenario as galina } from "../../../scenarios/synthetic/galina/index.js";
import { wrenScenario as wren } from "../../../scenarios/synthetic/wren/index.js";

type Base = typeof galina;

const row = (base: Base, category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const decision = (base: Base, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(base: Base, changes: Record<string, unknown>, extra: TaxFactRow[] = []) {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

function evaluate(base: Base, facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-172-test", taxYear: base.taxYear },
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
  const missing = result.forms.get("form-172")?.missingInputs ?? [];
  return { files, field, value, missing };
}

const LINE_8A = "0.line.8a";
const LINE_23 = "0.part1.23_nol_deduction_other_years";
const LINE_24 = "0.part1.24_net_operating_loss";
const PART_II_LINE_1 = "1.part2.1_nol_deduction_2nd_preceding";
const YEAR_2023 = makeNolCarrybackYearFactKey(2023);
const YEAR_2024 = makeNolCarrybackYearFactKey(2024);

describe("Form 172 on galina's return", () => {
  it("files with a business loss and asks for nothing more", () => {
    const run = evaluate(galina, galina.facts);
    expect(run.files("form-172")).toBe(true);
    expect(run.missing).toEqual([]);
    expect(run.value("form-172", LINE_24)).toBe(-60000);
    expect(run.value("form-172", PART_II_LINE_1)).toBe(60000);
  });

  it("Schedule 1 line 8a deducts the 2016 loss in full, and line 23 adds it back", () => {
    const run = evaluate(galina, galina.facts);
    expect(run.value("schedule-1", LINE_8A)).toBe(5000);
    expect(run.value("schedule-1", "0.line.9")).toBe(-5000);
    expect(run.value("form-172", LINE_23)).toBe(5000);
  });

  it("asks whether the farming loss carryback is waived", () => {
    const run = evaluate(
      galina,
      factsWith(galina, { [NOL_KEYS.waiveFarmingCarryback]: undefined }),
    );
    expect(run.missing).toEqual([NOL_KEYS.waiveFarmingCarryback]);
    expect(run.value("form-172", PART_II_LINE_1)).toBeUndefined();
    expect(run.value("form-172", LINE_24)).toBe(-60000);
  });

  it("leaves Part II blank when the carryback is waived", () => {
    const run = evaluate(galina, factsWith(galina, { [NOL_KEYS.waiveFarmingCarryback]: true }));
    expect(run.missing).toEqual([]);
    expect(run.value("form-172", PART_II_LINE_1)).toBeUndefined();
    expect(run.value("form-172", "1.part2.tax_year_ended_2nd_preceding")).toBeUndefined();
  });

  it("asks for each carryback year's return until its amounts are complete", () => {
    const without = evaluate(
      galina,
      factsWith(galina, { [YEAR_2023]: undefined, [YEAR_2024]: undefined }),
    );
    expect(without.missing).toEqual([YEAR_2023, YEAR_2024]);
    expect(without.value("form-172", PART_II_LINE_1)).toBeUndefined();
    const year2023 = galina.facts.find((fact) => fact.key === YEAR_2023)!.value as object;
    const incomplete = { ...year2023, agiAdjustment: undefined };
    expect(evaluate(galina, factsWith(galina, { [YEAR_2023]: incomplete })).missing).toEqual([
      YEAR_2023,
    ]);
  });

  it("a carryover from 2018 on adds nothing when 2025 has no taxable income", () => {
    const rows: NolCarryoverRow[] = [
      { yearOfLoss: 2016, carryoverTo2025: 5000 },
      { yearOfLoss: 2022, carryoverTo2025: 12000 },
    ];
    const run = evaluate(galina, factsWith(galina, { [NOL_KEYS.carryovers]: rows }));
    expect(run.value("schedule-1", LINE_8A)).toBe(5000);
    expect(run.value("form-172", LINE_24)).toBe(-60000);
  });

  it("the explicit decision keeps the form off the return", () => {
    const decisions = [
      ...galina.decisions,
      decision(galina, "decisions.scope.must_file_172", false),
    ];
    const run = evaluate(galina, galina.facts, decisions);
    expect(run.files("form-172")).toBe(false);
    expect(run.value("schedule-1", LINE_8A)).toBe(5000);
  });
});

describe("Schedule 1 line 8a without Form 172 (wren, no loss)", () => {
  const withCarryover = (rows: NolCarryoverRow[], extra: TaxFactRow[] = []) =>
    evaluate(wren, [...wren.facts, row(wren, "other", NOL_KEYS.carryovers, rows), ...extra]);

  it("no carryover: line 8a blank, Form 172 does not file, nothing else changes", () => {
    const run = evaluate(wren, wren.facts);
    expect(run.files("form-172")).toBe(false);
    expect(run.value("schedule-1", LINE_8A)).toBeUndefined();
    expect(run.value("form-1040", "line.11a")).toBe(47500);
  });

  it("an empty list is an answer: no deduction", () => {
    expect(withCarryover([]).value("schedule-1", LINE_8A)).toBeUndefined();
  });

  it("limits a 2021 loss to 80% of taxable income before the deduction", () => {
    const run = withCarryover([{ yearOfLoss: 2021, carryoverTo2025: 50000 }]);
    // 47,500 AGI − 31,500 standard deduction = 16,000; 80% is 12,800.
    expect(run.value("schedule-1", LINE_8A)).toBe(12800);
    expect(run.value("form-1040", "line.11a")).toBe(47500 - 12800);
    expect(run.files("form-172")).toBe(false);
  });

  it("deducts a smaller 2021 loss in full", () => {
    expect(
      withCarryover([{ yearOfLoss: 2021, carryoverTo2025: 4000 }]).value("schedule-1", LINE_8A),
    ).toBe(4000);
  });

  it("is a gap, and so are lines 9 and 10, when an item depends on AGI", () => {
    const ssa = row(wren, "retirement", makeSocialSecurityFactKey("ssa"), {
      payerName: "Social Security Administration",
      box3: 6000,
      box5: 6000,
    });
    const run = withCarryover([{ yearOfLoss: 2021, carryoverTo2025: 4000 }], [ssa]);
    expect(run.field("schedule-1", LINE_8A)).toMatchObject({
      unsupported: true,
      reason: AGI_ITEMS_GAP,
    });
    expect(run.field("schedule-1", "0.line.9")).toMatchObject({ unsupported: true });
    expect(run.field("schedule-1", "0.line.10")).toMatchObject({ unsupported: true });
  });

  it("a row that is not well formed makes line 8a a gap", () => {
    const run = evaluate(wren, [
      ...wren.facts,
      row(wren, "other", NOL_KEYS.carryovers, [{ year: 2016 }]),
    ]);
    expect(run.field("schedule-1", LINE_8A)).toMatchObject({ unsupported: true });
  });

  it("with the explicit decision, Form 172 shows only line 1 when there is no loss", () => {
    const decisions = [...wren.decisions, decision(wren, "decisions.scope.must_file_172", true)];
    const run = evaluate(wren, wren.facts, decisions);
    expect(run.files("form-172")).toBe(true);
    expect(run.value("form-172", "0.part1.1_agi_less_deductions")).toBe(16000);
    expect(run.value("form-172", "0.part1.2_nonbusiness_capital_losses")).toBeUndefined();
    expect(run.value("form-172", LINE_24)).toBeUndefined();
  });
});

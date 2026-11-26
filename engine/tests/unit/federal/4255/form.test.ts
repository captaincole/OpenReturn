/*
 * Form 4255 on a whole return: who files, the gaps and waits, and where its
 * columns (q) and (r) land on Schedule 2. The synthetic liandrin scenario is
 * the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeCreditRecaptureLineFactKey,
  makeCreditRecapturePropertyFactKey,
  type CreditRecaptureLineFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { sum } from "../../../../src/money.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { liandrinScenario as base } from "../../../scenarios/synthetic/liandrin/index.js";

const isRecapture = (fact: TaxFactRow) => fact.key.startsWith("credit_recapture.");
const withoutRecapture = base.facts.filter((fact) => !isRecapture(fact));

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category: "other",
  key,
  value,
});

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-4255-test", taxYear: base.taxYear },
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
  return { result, files, field, value };
}

const SCHEDULE_2_PART_I = [
  "0.line.1d_recapture_net_epe_form4255",
  "0.line.1e_excessive_payments_epe_amount",
  "0.line.1f_20pct_ep_amount",
  "0.line.1y_other_additions_amount",
] as const;
const SCHEDULE_2_PART_II_FROM_4255 = [
  "1.line.17a_recapture_other_credits_amount",
  "1.line.17z_other_taxes_amount",
  "1.line.19_recapture_net_epe_form4255_line1d",
] as const;

describe("Form 4255 on a return", () => {
  it("no Form 4255 fact: the form does not file and its Schedule 2 lines are as before", () => {
    const { files, value, field } = evaluate(withoutRecapture);
    expect(files("form-4255")).toBe(false);
    for (const id of SCHEDULE_2_PART_I) expect(value("schedule-2", id)).toBeUndefined();
    expect(value("schedule-2", "1.line.19_recapture_net_epe_form4255_line1d")).toBeUndefined();
    expect(isGap(field("schedule-2", "1.line.17a_recapture_other_credits_amount"))).toBe(true);
    expect(isGap(field("schedule-2", "1.line.17z_other_taxes_amount"))).toBe(true);
    expect(value("form-1040", "line.17")).toBeUndefined();
  });

  it("column (q) lands in Schedule 2 Part I and column (r) in Part II", () => {
    const { value } = evaluate(base.facts);
    const partI = SCHEDULE_2_PART_I.map((id) => value("schedule-2", id) as number);
    const partII = SCHEDULE_2_PART_II_FROM_4255.map((id) => value("schedule-2", id) as number);
    expect(sum(...partI)).toBe(value("form-4255", "2.part1.3_total_col_q"));
    expect(sum(...partII)).toBe(value("form-4255", "2.part1.3_total_col_r"));
  });

  it("the explicit decision wins: false keeps it off, true with no fact is a gap", () => {
    const off = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_4255", false),
    ]);
    expect(off.files("form-4255")).toBe(false);
    expect(off.value("schedule-2", "0.line.1d_recapture_net_epe_form4255")).toBeUndefined();
    const on = evaluate(withoutRecapture, [
      ...base.decisions,
      decision("decisions.scope.must_file_4255", true),
    ]);
    expect(on.files("form-4255")).toBe(true);
    expect(isGap(on.field("form-4255", "0.part1.1b_form_3468_part_iii_col_a"))).toBe(true);
    expect(isGap(on.field("schedule-2", "0.line.1d_recapture_net_epe_form4255"))).toBe(true);
  });

  it("a property whose line has no fact waits for that line's answer", () => {
    const facts = base.facts.filter((fact) => fact.key !== makeCreditRecaptureLineFactKey("1b"));
    const { result, files, value } = evaluate(facts);
    expect(files("form-4255")).toBe(true);
    expect(value("form-4255", "0.part1.3_total_col_a")).toBeUndefined();
    expect(pendingInputs(result).pendingFacts).toContain(makeCreditRecaptureLineFactKey("1b"));
  });

  it("a line with nothing owed does not file the form", () => {
    const quiet: CreditRecaptureLineFactValue = {
      creditClaimed: 5000,
      nonElectiveCreditAppliedToTax: 5000,
    };
    const { files } = evaluate([
      ...withoutRecapture,
      row(makeCreditRecaptureLineFactKey("1b"), quiet),
    ]);
    expect(files("form-4255")).toBe(false);
  });

  it("a fifth property is a gap on the form and on Schedule 2", () => {
    const extra = base.facts.find(
      (fact) => fact.key === makeCreditRecapturePropertyFactKey("heat-pump"),
    )!;
    const { field } = evaluate([
      ...base.facts,
      { ...extra, id: "f-fifth", key: makeCreditRecapturePropertyFactKey("fifth") },
    ]);
    expect(isGap(field("form-4255", "3.part2.20_total_increase_in_tax"))).toBe(true);
    expect(isGap(field("schedule-2", "1.line.17a_recapture_other_credits_amount"))).toBe(true);
    expect(isGap(field("schedule-2", "1.line.17z_other_taxes_amount"))).toBe(true);
  });

  it("a penalty alone lists its type on line 17z", () => {
    const penalty: CreditRecaptureLineFactValue = {
      creditClaimed: 0,
      nonElectiveCreditAppliedToTax: 0,
      prevailingWagePenalty: 700,
    };
    const { value } = evaluate([
      ...withoutRecapture,
      row(makeCreditRecaptureLineFactKey("1n"), penalty),
    ]);
    expect(value("form-4255", "2.part1.1n_form_8908_col_o3")).toBe(700);
    expect(value("schedule-2", "1.line.17z_other_taxes_amount")).toBe(700);
    expect(value("schedule-2", "1.line.17z_other_taxes_description")).toBe("NPWA");
  });
});

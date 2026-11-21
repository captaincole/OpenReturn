/*
 * Form 3903 on a whole return: who files, line 4 from W-2 code P, the forms that
 * take its results (Schedule 1 line 14, Form 1040 line 1h, Schedule CA line 14
 * column A) and the cases the engine does not print. The synthetic tamsin
 * scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  ARMED_FORCES_STORAGE_FEES_KEY,
  makeArmedForcesMoveFactKey,
  type ArmedForcesMoveFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { tamsinScenario as base } from "../../../scenarios/synthetic/tamsin/index.js";

const isMove = (fact: TaxFactRow) => fact.key.startsWith("armed_forces_move.");
const otherFacts = base.facts.filter((fact) => !isMove(fact));
const template = base.facts.find(isMove)!;
const baseMove = template.value as ArmedForcesMoveFactValue;

const move = (slug: string, value: Partial<ArmedForcesMoveFactValue> = {}): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeArmedForcesMoveFactKey(slug),
  value: { ...baseMove, ...value },
});

const storageFees = (amount: number): TaxFactRow => ({
  ...template,
  id: "f-storage",
  category: "other",
  key: ARMED_FORCES_STORAGE_FEES_KEY,
  value: amount,
});

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(extra: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3903-test", taxYear: base.taxYear },
    facts: [...otherFacts, ...extra],
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
  return { files, field, value };
}

const LINE_4 = "0.line.4_government_paid_amount";
const LINE_5 = "0.line.5_moving_expense_deduction";
const LINE_14 = "1.line.14";
const BOX_14 = "1.line.14_storage_fees_only";
const UNSUPPORTED = { ok: false, unsupported: true };

describe("Form 3903 who files", () => {
  it("files, with Schedule 1, for a move the member certifies", () => {
    const run = evaluate([move("pcs")]);
    expect([run.files("form-3903"), run.files("schedule-1")]).toEqual([true, true]);
    expect(run.value("form-3903", "0.header.armed_forces_move_certification")).toBe(true);
  });

  it("does not file for a move the member does not certify", () => {
    const run = evaluate([move("pcs", { certifiesRequirements: false })]);
    expect([run.files("form-3903"), run.files("schedule-1")]).toEqual([false, false]);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(
      [move("pcs")],
      [...base.decisions, decision("decisions.scope.must_file_3903", false)],
    );
    expect(run.files("form-3903")).toBe(false);
    expect(run.value("form-1040", "line.10")).toBeUndefined();
  });
});

describe("No move fact: nothing changes", () => {
  it("Form 3903 and Schedule 1 do not file; Form 1040 lines 1h and 10 stay blank", () => {
    const run = evaluate([]);
    expect([run.files("form-3903"), run.files("schedule-1")]).toEqual([false, false]);
    expect(run.value("form-1040", "line.1h_amount")).toBeUndefined();
    expect(run.value("form-1040", "line.10")).toBeUndefined();
    expect(run.value("form-1040", "line.11a")).toBe(58400);
  });

  it("Schedule 1 filed for another reason leaves line 14 and its box blank", () => {
    const run = evaluate(
      [],
      [...base.decisions, decision("decisions.scope.must_file_schedule_1", true)],
    );
    const line14 = run.field("schedule-1", LINE_14);
    expect(run.value("schedule-1", LINE_14)).toBeUndefined();
    expect(line14 && !line14.ok && line14.unsupported).toBeFalsy();
    expect(run.value("schedule-1", BOX_14)).toBeUndefined();
  });
});

describe("Form 3903 line 4", () => {
  it("a stated amount wins over W-2 code P", () => {
    const run = evaluate([move("pcs", { governmentReimbursements: 1000.4 })]);
    expect(run.value("form-3903", LINE_4)).toBe(1000);
    expect(run.value("form-3903", LINE_5)).toBe(2663);
  });

  it("with no code P and nothing stated, line 4 is 0", () => {
    const noCodeP = otherFacts.map((fact) =>
      fact.category === "wages"
        ? { ...fact, value: { ...(fact.value as object), box12: [] } }
        : fact,
    );
    const result = evaluateScenario({
      filing: { id: "form-3903-test", taxYear: base.taxYear },
      facts: [...noCodeP, move("pcs")],
      decisions: base.decisions,
      authEmail: null,
    });
    const line4 = result.forms
      .get("form-3903")
      ?.fields.find((each) => each.fieldId === `form-3903.${LINE_4}`)?.result;
    expect(line4).toMatchObject({ ok: true, value: 0 });
  });
});

describe("An allowance that is not income", () => {
  it("a dislocation allowance comes off line 1, not line 4, and lowers Schedule 1 line 14", () => {
    const run = evaluate([move("pcs", { excludedAllowances: 300 })]);
    expect(run.value("form-3903", "0.line.1_transportation_storage_household_goods")).toBe(2560);
    expect(run.value("form-3903", LINE_4)).toBe(3150);
    expect(run.value("form-3903", LINE_5)).toBe(213);
    expect(run.value("schedule-1", LINE_14)).toBe(213);
  });
});

describe("Line 4 more than line 3", () => {
  it("checks No, leaves line 5 and Schedule 1 blank, and puts the excess on Form 1040 line 1h", () => {
    const run = evaluate([move("pcs", { governmentReimbursements: 4000 })]);
    expect(run.value("form-3903", "0.line.5_line_3_more_than_line_4_no")).toBe(true);
    expect(run.value("form-3903", "0.line.5_line_3_more_than_line_4_yes")).toBeUndefined();
    expect(run.value("form-3903", LINE_5)).toBeUndefined();
    expect(run.files("schedule-1")).toBe(false);
    expect(run.value("form-1040", "line.1h_amount")).toBe(337);
    expect(run.value("form-1040", "line.1z")).toBe(58737);
  });
});

describe("Cases the engine does not print", () => {
  it("two moves: the form's lines are unsupported, Schedule 1 line 14 adds both line 5s", () => {
    const run = evaluate([
      move("first", { governmentReimbursements: 3000 }),
      move("second", { householdGoods: 500, travel: {}, governmentReimbursements: 100 }),
    ]);
    expect(run.field("form-3903", LINE_5)).toMatchObject(UNSUPPORTED);
    expect(run.value("schedule-1", LINE_14)).toBe(663 + 400);
  });

  it("two moves with no stated line 4: code P cannot be split", () => {
    const run = evaluate([move("first"), move("second")]);
    expect(run.field("schedule-1", LINE_14)).toMatchObject(UNSUPPORTED);
    expect(run.field("form-1040", "line.1h_amount")).toMatchObject(UNSUPPORTED);
  });

  it("both vehicle methods: line 2 and everything after it are unsupported", () => {
    const run = evaluate([move("pcs", { travel: { vehicleMiles: 100, vehicleGasAndOil: 30 } })]);
    expect(run.field("form-3903", "0.line.2_travel_lodging")).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-1", LINE_14)).toMatchObject(UNSUPPORTED);
  });
});

describe("Storage fees only", () => {
  it("go on Schedule 1 line 14 with the box checked and no Form 3903", () => {
    const run = evaluate([storageFees(1820.6)]);
    expect([run.files("form-3903"), run.files("schedule-1")]).toEqual([false, true]);
    expect(run.value("schedule-1", LINE_14)).toBe(1821);
    expect(run.value("schedule-1", BOX_14)).toBe(true);
    expect(run.value("form-1040", "line.10")).toBe(1821);
  });

  it("with a Form 3903 too, line 14 is unsupported", () => {
    const run = evaluate([storageFees(500), move("pcs")]);
    expect(run.field("schedule-1", LINE_14)).toMatchObject(UNSUPPORTED);
    expect(run.value("schedule-1", BOX_14)).toBeUndefined();
  });
});

describe("Schedule CA (540) line 14", () => {
  it("column A copies Schedule 1 line 14 for a California resident", () => {
    const caDecisions = base.decisions
      .filter((each) => !each.decisionKey.includes("ca_"))
      .concat([
        decision("decisions.scope.must_file_ca_540", true),
        decision("decisions.scope.ca_residency", "full_year"),
      ]);
    const run = evaluate([move("pcs")], caDecisions);
    expect(run.value("schedule-ca", "2.line.c14_federal")).toBe(513);
    expect(run.field("schedule-ca", "2.line.c14_additions")).toMatchObject(UNSUPPORTED);
  });
});

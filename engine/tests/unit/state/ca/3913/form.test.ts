/*
 * FTB 3913 on a whole return: who files, the answers it waits for, the
 * Schedule CA (540) lines and Form 540 lines that take its results, and the
 * cases the engine does not print. The synthetic loial scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeArmedForcesMoveFactKey,
  makeCaWorkMoveFactKey,
  type ArmedForcesMoveFactValue,
  type CaWorkMoveFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { loialScenario as base } from "../../../../scenarios/synthetic/loial/index.js";
import { ottilieScenario } from "../../../../scenarios/synthetic/ottilie/index.js";

const isMove = (fact: TaxFactRow) => fact.key.startsWith("ca_work_move.");
const otherFacts = base.facts.filter((fact) => !isMove(fact));
const template = base.facts.find(isMove)!;
const baseMove = template.value as CaWorkMoveFactValue;

const workMove = (slug: string, value: Partial<CaWorkMoveFactValue> = {}): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeCaWorkMoveFactKey(slug),
  value: { ...baseMove, ...value },
});

const militaryMove = (slug: string, value: Partial<ArmedForcesMoveFactValue> = {}): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeArmedForcesMoveFactKey(slug),
  value: {
    description: "Permanent change of station",
    certifiesRequirements: true,
    householdGoods: 2000,
    travel: { vehicleMiles: 1000 },
    governmentReimbursements: 500,
    ...value,
  },
});

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const withDecision = (key: string, value: unknown) =>
  base.decisions.filter((each) => each.decisionKey !== key).concat([decision(key, value)]);

function evaluate(extra: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3913-test", taxYear: base.taxYear },
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
  return { files, field, value, pending: pendingInputs(result) };
}

const LINE_1 = "0.line.1_transportation_storage_household_goods";
const LINE_4 = "0.line.4_employer_paid_not_in_wages";
const LINE_5 = "0.line.5_moving_expense_deduction";
const LINE_5_BOX = "0.line.5_line_3_more_than_line_4";
const MILITARY = "0.header.military_member";
const CA_14 = "2.line.c14_additions";
const CA_1H = "0.line.1h_additions";
const CA_26 = "3.line.c26_additions";
const UNSUPPORTED = { ok: false, unsupported: true };

describe("FTB 3913 who files", () => {
  it("files for a work move that meets both tests, with Form 540", () => {
    const run = evaluate([workMove("move")]);
    expect(run.files("form-3913")).toBe(true);
    expect(run.value("form-3913", MILITARY)).toBe("no");
    expect(run.value("form-3913", LINE_5)).toBe(7577);
  });

  it("does not file when the distance test fails: the worksheet's No", () => {
    const run = evaluate([
      workMove("move", { milesOldHomeToNewWorkplace: 61, milesOldHomeToOldWorkplace: 12 }),
    ]);
    expect(run.files("form-3913")).toBe(false);
    expect(run.value("form-540", "line.14_ca_adjustments_subtractions")).toBe(0);
  });

  it("files at exactly 50 miles farther", () => {
    const run = evaluate([
      workMove("move", { milesOldHomeToNewWorkplace: 62, milesOldHomeToOldWorkplace: 12 }),
    ]);
    expect(run.files("form-3913")).toBe(true);
  });

  it("does not file when the time test fails", () => {
    expect(evaluate([workMove("move", { meetsTimeTest: false })]).files("form-3913")).toBe(false);
  });

  it("does not file with no California return", () => {
    const run = evaluate(
      [workMove("move")],
      withDecision("decisions.scope.must_file_ca_540", false),
    );
    expect(run.files("form-3913")).toBe(false);
  });

  it("files with Form 540NR too", () => {
    const decisions = withDecision("decisions.scope.must_file_ca_540", false).concat([
      decision("decisions.scope.must_file_540nr", true),
    ]);
    expect(evaluate([workMove("move")], decisions).files("form-3913")).toBe(true);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate([workMove("move")], withDecision("decisions.scope.must_file_3913", false));
    expect(run.files("form-3913")).toBe(false);
  });

  it("does not file for an Armed Forces move the member does not certify", () => {
    const run = evaluate([militaryMove("pcs", { certifiesRequirements: false })]);
    expect(run.files("form-3913")).toBe(false);
  });
});

describe("Answers FTB 3913 waits for", () => {
  it.each([
    ["the time test", { meetsTimeTest: undefined }],
    ["line 4", { employerPaidNotInWages: undefined }],
  ])(
    "%s: the form files, its lines and Schedule CA line 14 wait, the move is pending",
    (_, change) => {
      const run = evaluate([workMove("move", change as Partial<CaWorkMoveFactValue>)]);
      expect(run.files("form-3913")).toBe(true);
      expect(run.value("form-3913", LINE_1)).toBeUndefined();
      expect(run.field("form-3913", LINE_1)).not.toMatchObject(UNSUPPORTED);
      expect(run.value("schedule-ca", CA_14)).toBeUndefined();
      expect(run.field("schedule-ca", CA_14)).not.toMatchObject(UNSUPPORTED);
      expect(run.pending.pendingFacts).toContain(makeCaWorkMoveFactKey("move"));
    },
  );
});

describe("Schedule CA (540) and Form 540", () => {
  it("line 5 Yes: line 14 column C, line 26, line 27 and Form 540 line 14", () => {
    const run = evaluate([workMove("move")]);
    expect(run.value("schedule-ca", CA_14)).toBe(7577);
    expect(run.value("schedule-ca", CA_26)).toBe(7577);
    expect(run.value("schedule-ca", "3.line.c27_additions")).toBe(-7577);
    expect(run.value("form-540", "line.14_ca_adjustments_subtractions")).toBe(7577);
    expect(run.value("form-540", "line.17_ca_agi")).toBe(96400 - 7577);
    expect(run.field("schedule-ca", CA_1H)).toMatchObject(UNSUPPORTED);
  });

  it("line 5 No with an excess: line 1h column C and Form 540 line 16", () => {
    const run = evaluate([workMove("move", { employerPaidNotInWages: 8000 })]);
    expect(run.value("form-3913", LINE_5_BOX)).toBe("no");
    expect(run.value("form-3913", LINE_5)).toBeUndefined();
    expect(run.value("schedule-ca", CA_1H)).toBe(423);
    expect(run.value("schedule-ca", "0.line.1h_income_type")).toBe("FTB 3913 excess reimbursement");
    expect(run.value("schedule-ca", CA_14)).toBeUndefined();
    expect(run.value("form-540", "line.16_ca_adjustments_additions")).toBe(423);
  });

  it("line 3 equal to line 4: No, and nothing goes to Schedule CA", () => {
    const run = evaluate([workMove("move", { employerPaidNotInWages: 7577 })]);
    expect(run.value("form-3913", LINE_5_BOX)).toBe("no");
    expect(run.value("schedule-ca", CA_14)).toBeUndefined();
    expect(run.field("schedule-ca", CA_1H)).toMatchObject(UNSUPPORTED);
    expect(run.value("form-540", "line.17_ca_agi")).toBe(96400);
  });

  it("a military move: Yes, the code P or stated line 4, no California adjustment", () => {
    const run = evaluate([militaryMove("pcs")]);
    expect(run.value("form-3913", MILITARY)).toBe("yes");
    expect(run.value("form-3913", LINE_4)).toBe(500);
    expect(run.value("form-3913", LINE_5)).toBe(2000 + 210 - 500);
    expect(run.value("schedule-ca", CA_14)).toBeUndefined();
    expect(run.field("schedule-ca", CA_14)).not.toMatchObject(UNSUPPORTED);
  });
});

describe("Cases the engine does not print", () => {
  it("two moves: the form's lines are unsupported, Schedule CA line 14 adds both line 5s", () => {
    const run = evaluate([
      workMove("first"),
      workMove("second", { householdGoods: 1000, travel: {}, employerPaidNotInWages: 0 }),
    ]);
    expect(run.field("form-3913", LINE_5)).toMatchObject(UNSUPPORTED);
    expect(run.field("form-3913", MILITARY)).toMatchObject(UNSUPPORTED);
    expect(run.value("schedule-ca", CA_14)).toBe(7577 + 1000);
  });

  it("a military move and a work move: only the work move reaches Schedule CA", () => {
    const run = evaluate([workMove("move"), militaryMove("pcs")]);
    expect(run.field("form-3913", LINE_5)).toMatchObject(UNSUPPORTED);
    expect(run.value("schedule-ca", CA_14)).toBe(7577);
  });

  it("both vehicle methods: the lines and Schedule CA line 14 are unsupported", () => {
    const run = evaluate([
      workMove("move", { travel: { vehicleMiles: 100, vehicleGasAndOil: 30 } }),
    ]);
    expect(run.field("form-3913", "0.line.2_travel_and_lodging")).toMatchObject(UNSUPPORTED);
    expect(run.value("form-3913", MILITARY)).toBe("no");
    expect(run.field("schedule-ca", CA_14)).toMatchObject(UNSUPPORTED);
  });
});

describe("No move fact: nothing changes", () => {
  it("FTB 3913 does not file; the Schedule CA lines keep their earlier reasons", () => {
    const run = evaluate([]);
    expect(run.files("form-3913")).toBe(false);
    for (const id of [CA_14, CA_1H, CA_26]) {
      expect(run.field("schedule-ca", id)).toMatchObject(UNSUPPORTED);
    }
    expect(run.value("schedule-ca", "0.line.1h_income_type")).toBeUndefined();
    expect(run.value("form-540", "line.17_ca_agi")).toBe(96400);
  });

  it("another California scenario (ottilie) does not file it", () => {
    const result = evaluateScenario({
      filing: { id: "form-3913-ottilie", taxYear: ottilieScenario.taxYear },
      facts: ottilieScenario.facts,
      decisions: ottilieScenario.decisions,
      authEmail: null,
    });
    const form = result.forms.get("form-3913");
    expect(form?.mustFile.ok && form.mustFile.value).toBe(false);
    const line14 = result.forms
      .get("schedule-ca")
      ?.fields.find((each) => each.fieldId === `schedule-ca.${CA_14}`)?.result;
    expect(line14).toMatchObject(UNSUPPORTED);
  });
});

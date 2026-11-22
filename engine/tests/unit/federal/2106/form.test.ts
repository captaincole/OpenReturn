/*
 * Form 2106 on a whole return: who files, the forms that take line 10 (Schedule
 * 1 line 12, Schedule A line 16, Form 1040 line 1a, Schedule CA line 12) and
 * the cases the engine does not print. The synthetic aviendha (federal) and
 * rhuarc (California) scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeEmployeeBusinessExpensesFactKey,
  type EmployeeBusinessExpensesFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { aviendhaScenario } from "../../../scenarios/synthetic/aviendha/index.js";
import { rhuarcScenario } from "../../../scenarios/synthetic/rhuarc/index.js";
import type { Scenario } from "../../../types.js";

const isExpenses = (fact: TaxFactRow) => fact.key.startsWith("employee_business_expenses.");
const UNSUPPORTED = { ok: false, unsupported: true };

function harness(base: Scenario) {
  const otherFacts = base.facts.filter((fact) => !isExpenses(fact));
  const template = base.facts.find(isExpenses)!;
  const expenses = (slug: string, value: Partial<EmployeeBusinessExpensesFactValue> = {}) => ({
    ...template,
    id: `f-${slug}`,
    key: makeEmployeeBusinessExpensesFactKey(slug),
    value: { ...(template.value as EmployeeBusinessExpensesFactValue), ...value },
  });
  const decision = (key: string, value: unknown): AIDecisionRow =>
    decisionRow({
      userId: base.userId,
      taxYear: base.taxYear,
      key,
      decision: value,
      rationale: "test",
    });
  function evaluate(
    extra: TaxFactRow[],
    decisions: AIDecisionRow[] = base.decisions,
    facts: TaxFactRow[] = otherFacts,
  ) {
    const result = evaluateScenario({
      filing: { id: "form-2106-test", taxYear: base.taxYear },
      facts: [...facts, ...extra],
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
  return { otherFacts, expenses, decision, evaluate };
}

const federal = harness(aviendhaScenario);
const california = harness(rhuarcScenario);
const LINE_10 = "0.line.10_total_employee_business_expenses";
const SCHEDULE_1_LINE_12 = "1.line.12";
const SCHEDULE_A_LINE_16 = "0.line.16_other_itemized_deductions_amount";

describe("Form 2106 who files", () => {
  it("files for a fee-basis official whose expenses are more than the reimbursements", () => {
    const run = federal.evaluate([federal.expenses("constable")]);
    expect([run.files("form-2106"), run.files("schedule-1")]).toEqual([true, true]);
    expect(run.value("form-2106", LINE_10)).toBe(31012);
  });

  it("does not file when the reimbursements cover every expense", () => {
    const run = federal.evaluate([
      federal.expenses("constable", {
        vehicles: [],
        otherExpenses: 500,
        impairmentRelatedWorkExpenses: undefined,
        overnightTravel: undefined,
        parkingTollsTransportation: undefined,
        meals: undefined,
        reimbursements: { otherThanMeals: 900 },
      }),
    ]);
    expect(run.files("form-2106")).toBe(false);
  });

  it("does not file for a reservist whose only entry is line 4", () => {
    const run = california.evaluate([
      california.expenses("reserve", {
        vehicles: [],
        overnightTravel: undefined,
        lodging: undefined,
        parkingTollsTransportation: undefined,
        meals: undefined,
        otherExpenses: 400,
        reimbursements: undefined,
      }),
    ]);
    expect(run.files("form-2106")).toBe(false);
  });

  it("an explicit decision false still wins", () => {
    const run = federal.evaluate(
      [federal.expenses("constable")],
      [...aviendhaScenario.decisions, federal.decision("decisions.scope.must_file_2106", false)],
    );
    expect(run.files("form-2106")).toBe(false);
    expect(run.value("schedule-1", SCHEDULE_1_LINE_12)).toBeUndefined();
  });
});

describe("No Form 2106 fact: nothing changes", () => {
  it("Form 2106 does not file; Schedule 1 line 12 and Schedule A line 16 stay blank", () => {
    const run = federal.evaluate([]);
    expect(run.files("form-2106")).toBe(false);
    expect(run.value("schedule-1", SCHEDULE_1_LINE_12)).toBeUndefined();
    expect(run.value("schedule-a", SCHEDULE_A_LINE_16)).toBeUndefined();
    expect(run.value("form-1040", "line.1a")).toBe(64000);
  });

  it("Schedule 1 filed for another reason leaves line 12 blank, not unsupported", () => {
    const run = federal.evaluate(
      [],
      [
        ...aviendhaScenario.decisions,
        federal.decision("decisions.scope.must_file_schedule_1", true),
      ],
    );
    const line12 = run.field("schedule-1", SCHEDULE_1_LINE_12);
    expect(line12 && !line12.ok && line12.unsupported).toBeFalsy();
  });

  it("Schedule CA line 12 is blank in all three columns", () => {
    const run = california.evaluate([]);
    for (const id of ["2.line.c12_federal", "2.line.c12_subtractions", "2.line.c12_additions"]) {
      const result = run.field("schedule-ca", id);
      expect(result && !result.ok && result.unsupported).toBeFalsy();
      expect(run.value("schedule-ca", id)).toBeUndefined();
    }
  });
});

describe("Where line 10 goes", () => {
  it("fee-basis expenses on Schedule 1 line 12; the interpreter's share on Schedule A line 16", () => {
    const run = federal.evaluate([federal.expenses("constable")]);
    expect(run.value("schedule-1", SCHEDULE_1_LINE_12)).toBe(26344);
    expect(run.value("schedule-a", SCHEDULE_A_LINE_16)).toBe(4668);
  });

  it("an employee with impairment-related expenses only: all of line 10 on Schedule A", () => {
    const run = federal.evaluate([
      federal.expenses("reader", {
        qualification: "impairment_related_work_expenses",
        vehicles: [],
        overnightTravel: undefined,
        parkingTollsTransportation: undefined,
        meals: undefined,
        otherExpenses: 6200,
        impairmentRelatedWorkExpenses: undefined,
        reimbursements: {},
      }),
    ]);
    expect(run.value("form-2106", LINE_10)).toBe(6200);
    expect(run.value("schedule-a", SCHEDULE_A_LINE_16)).toBe(6200);
    expect(run.value("schedule-1", SCHEDULE_1_LINE_12)).toBeUndefined();
  });

  it("a reservist's line 12 is held to the per diem limit", () => {
    const run = california.evaluate([
      california.expenses("reserve", { reimbursements: undefined, federalPerDiemMeals: 400 }),
    ]);
    // Line 10: 4,104 + 840. The limit: lodging 1,320 + 400 × 50% + 96 + 2,688.
    expect(run.value("form-2106", LINE_10)).toBe(4944);
    expect(run.value("schedule-1", SCHEDULE_1_LINE_12)).toBe(1320 + 200 + 96 + 2688);
  });

  it("a reservist with lodging and no per diem: Schedule 1 line 12 is unsupported", () => {
    const run = california.evaluate([
      california.expenses("reserve", { federalPerDiemLodging: undefined }),
    ]);
    expect(run.field("schedule-1", SCHEDULE_1_LINE_12)).toMatchObject(UNSUPPORTED);
  });

  it("the column A excess reimbursement goes on Form 1040 line 1a", () => {
    const run = california.evaluate([california.expenses("reserve")]);
    expect(run.value("form-1040", "line.1a")).toBe(65400 + 296);
    expect(run.value("schedule-1", SCHEDULE_1_LINE_12)).toBe(840);
  });

  it("Schedule CA line 12: column A copies Schedule 1; no depreciation, no B or C adjustment", () => {
    const run = california.evaluate([california.expenses("reserve")]);
    expect(run.value("schedule-ca", "2.line.c12_federal")).toBe(840);
    const columnB = run.field("schedule-ca", "2.line.c12_subtractions");
    expect(columnB && !columnB.ok && columnB.unsupported).toBeFalsy();
    expect(run.value("schedule-ca", "2.line.c12_subtractions")).toBeUndefined();
  });
});

describe("A qualified performing artist", () => {
  const artist = (overrides: Partial<EmployeeBusinessExpensesFactValue> = {}) =>
    federal.expenses("artist", {
      qualification: "qualified_performing_artist",
      vehicles: [],
      impairmentRelatedWorkExpenses: undefined,
      reimbursements: { otherThanMeals: 0 },
      performingArtsEmployersPaid200: 2,
      performingArtsGrossIncome: 14000,
      ...overrides,
    });
  const lowIncome = federal.otherFacts.map((fact) =>
    fact.category === "wages"
      ? { ...fact, value: { ...(fact.value as object), box1: 14000, box12: [] } }
      : fact,
  );

  it("test 4: AGI before the expenses of $16,000 or less puts them on Schedule 1 line 12", () => {
    const run = federal.evaluate([artist()], aviendhaScenario.decisions, lowIncome);
    expect(run.value("schedule-1", SCHEDULE_1_LINE_12)).toBe(run.value("form-2106", LINE_10));
  });

  it("test 4: AGI over $16,000 leaves line 12 blank", () => {
    const run = federal.evaluate([artist()]);
    expect(run.value("schedule-1", SCHEDULE_1_LINE_12)).toBeUndefined();
  });

  it("test 1: one employer is not enough; the form does not file", () => {
    const run = federal.evaluate(
      [artist({ performingArtsEmployersPaid200: 1 })],
      undefined,
      lowIncome,
    );
    expect(run.files("form-2106")).toBe(false);
  });
});

describe("Cases the engine does not print", () => {
  it("two Forms 2106: the printed lines are unsupported, Schedule 1 line 12 adds both", () => {
    const run = federal.evaluate([
      federal.expenses("constable"),
      federal.expenses("second", {
        vehicles: [],
        overnightTravel: undefined,
        parkingTollsTransportation: undefined,
        meals: undefined,
        otherExpenses: 300,
        impairmentRelatedWorkExpenses: undefined,
        reimbursements: {},
      }),
    ]);
    expect(run.field("form-2106", LINE_10)).toMatchObject(UNSUPPORTED);
    expect(run.value("schedule-1", SCHEDULE_1_LINE_12)).toBe(26344 + 300);
  });

  it("a W-2 code L with no stated reimbursements is a gap", () => {
    const run = federal.evaluate([federal.expenses("constable", { reimbursements: undefined })]);
    expect(run.field("form-2106", LINE_10)).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-1", SCHEDULE_1_LINE_12)).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-a", SCHEDULE_A_LINE_16)).toMatchObject(UNSUPPORTED);
  });

  it("three vehicles need a second page 2", () => {
    const fact = federal.expenses("constable");
    const vehicles = (fact.value as EmployeeBusinessExpensesFactValue).vehicles ?? [];
    const run = federal.evaluate([
      federal.expenses("constable", { vehicles: [...vehicles, vehicles[1]!] }),
    ]);
    expect(run.field("form-2106", "1.line.12_total_miles_driven_col_a")).toMatchObject(UNSUPPORTED);
  });

  it("Schedule CA line 12 columns B and C are unsupported with Form 2106 depreciation", () => {
    const caDecisions = aviendhaScenario.decisions
      .filter((each) => !each.decisionKey.includes("ca_"))
      .concat([
        federal.decision("decisions.scope.must_file_ca_540", true),
        federal.decision("decisions.scope.ca_residency", "full_year"),
      ]);
    const run = federal.evaluate([federal.expenses("constable")], caDecisions);
    expect(run.value("schedule-ca", "2.line.c12_federal")).toBe(26344);
    expect(run.field("schedule-ca", "2.line.c12_subtractions")).toMatchObject(UNSUPPORTED);
  });
});

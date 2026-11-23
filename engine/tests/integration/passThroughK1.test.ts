import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import { isK1FactKey, isK1HoldingFactKey, type SCorporationK1FactValue } from "../../src/facts";
import type { TaxFactRow } from "../../src/facts/rows";
import { lanScenario } from "../scenarios/synthetic/lan";
import { minScenario } from "../scenarios/synthetic/min";
import type { Scenario } from "../types";

function run(scenario: Scenario, facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: scenario.name, taxYear: scenario.taxYear },
    facts,
    decisions: scenario.decisions,
    authEmail: null,
  });
  const field = (fieldId: string) => {
    const formId = fieldId.split(".")[0];
    return result.forms.get(formId)?.fields.find((entry) => entry.fieldId === fieldId)?.result;
  };
  const value = (fieldId: string) => {
    const found = field(fieldId);
    return found?.ok ? found.value : undefined;
  };
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  return { result, field, value, files };
}

const withoutK1 = (facts: TaxFactRow[]) =>
  facts.filter((fact) => !isK1FactKey(fact.key) && !isK1HoldingFactKey(fact.key));

/* The scenario's K-1 fact with its value changed. */
const editK1 = (
  facts: TaxFactRow[],
  edit: (k1: SCorporationK1FactValue) => SCorporationK1FactValue,
): TaxFactRow[] =>
  facts.map((fact) =>
    isK1FactKey(fact.key) ? { ...fact, value: edit(fact.value as SCorporationK1FactValue) } : fact,
  );

describe("an S corporation K-1 is income, not self-employment or earned income (lan)", () => {
  const withK1 = run(lanScenario, lanScenario.facts);
  const without = run(lanScenario, withoutK1(lanScenario.facts));

  it("adds box 1 to AGI through Schedule E line 41 and Schedule 1 line 5", () => {
    expect(withK1.value("schedule-e.1.line.41_total_income_or_loss")).toBe(15000);
    expect(withK1.value("schedule-1.0.line.5")).toBe(15000);
    const agi = withK1.value("form-1040.line.11a") as number;
    expect(agi - (without.value("form-1040.line.11a") as number)).toBe(15000);
  });

  it("leaves Schedule SE as it is without the K-1", () => {
    for (const line of ["2", "3", "4a", "12", "13"]) {
      const fieldId = `schedule-se.0.line.${line}`;
      expect(withK1.value(fieldId), fieldId).toBe(without.value(fieldId));
    }
    expect(withK1.value("schedule-se.0.line.3")).toBe(5000);
  });

  it("leaves the EIC on the same earned income: the credit does not change", () => {
    expect(withK1.value("form-1040.line.27a")).toBe(3613);
    expect(without.value("form-1040.line.27a")).toBe(3613);
  });

  it("is ready to file with nothing pending", () => {
    expect(pendingInputs(withK1.result)).toEqual({
      pendingDecisions: [],
      pendingFacts: [],
      pendingAssumptions: [],
    });
  });
});

describe("a K-1 item with no route makes the return visibly incomplete", () => {
  const facts = editK1(lanScenario.facts, (k1) => ({
    ...k1,
    boxes: [...k1.boxes, { box: "16", code: "D", amount: 9000 }],
  }));
  const run16D = run(lanScenario, facts);

  it("reports it on Schedule E line 41 with the entity and the item type", () => {
    const line41 = run16D.field("schedule-e.1.line.41_total_income_or_loss");
    expect(line41?.ok).toBe(false);
    if (line41 && !line41.ok) {
      expect(line41.unsupported).toBe(true);
      expect(line41.reason).toContain("Malkier Fencing Academy, Inc. (S corporation K-1)");
      expect(line41.reason).toContain("distribution (box 16 code D)");
    }
  });

  it("reports it on the row's amount column too, and AGI stays blank", () => {
    const column = run16D.field("schedule-e.1.line.28_row_a_col_k_nonpassive_income");
    expect(column?.ok === false && column.unsupported).toBe(true);
    expect(run16D.value("form-1040.line.11a")).toBeUndefined();
  });

  it("reports a trust K-1 on line 41, though Part III has no route", () => {
    const trust: TaxFactRow = {
      ...lanScenario.facts[0],
      id: "f-trust",
      category: "k1",
      key: "k1.trust.ash-family",
      value: {
        form: "1041",
        entityName: "Ash Family Trust",
        entityEin: "00-0001041",
        boxes: [{ box: "1", amount: 250 }],
      },
    };
    const line41 = run(lanScenario, [...lanScenario.facts, trust]).field(
      "schedule-e.1.line.41_total_income_or_loss",
    );
    expect(line41?.ok === false && line41.reason).toContain(
      "Ash Family Trust (estate or trust K-1): interest income (box 1)",
    );
  });
});

describe("the section 199A statement makes the K-1 a QBI business (min)", () => {
  const withStatement = run(minScenario, minScenario.facts);

  it("adds the statement's QBI as a business on Form 8995", () => {
    expect(withStatement.value("form-8995.0.line.1i_a")).toBe("Baerlon Bindery, Inc.");
    expect(withStatement.value("form-8995.0.line.1i_b")).toBe("00-0001121");
    expect(withStatement.value("form-8995.0.line.1i_c")).toBe(3200);
    expect(withStatement.value("form-1040.line.13a")).toBe(640);
  });

  it("adds nothing to the deduction without a statement", () => {
    const facts = editK1(minScenario.facts, (k1) => ({
      ...k1,
      boxes: k1.boxes.filter((entry) => entry.box !== "17"),
      section199A: undefined,
    }));
    const without = run(minScenario, facts);
    expect(without.files("form-8995")).toBe(false);
    expect(without.value("schedule-e.1.line.41_total_income_or_loss")).toBe(3200);
  });
});

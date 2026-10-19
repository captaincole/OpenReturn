/*
 * Schedule H and Form 5695 rules, checked by running tara with one
 * input changed at a time, plus one fixpoint check:
 *   - Schedule H: wages under $2,800 with no withholding and no $1,000
 *     quarter mean no Schedule H; withheld income tax alone files it
 *     (line B, lines 7–8 only).
 *   - Form 5695: a No on line 17c drops Section A (doors, windows);
 *     a small tax limits line 32 through line 31.
 *   - Fixpoint: the result does not depend on the order of the forms.
 */

import { describe, expect, it } from "vitest";
import {
  HOME_ENERGY_KEYS,
  type HouseholdEmployeeFactValue,
  type W2FactValue,
} from "../src/engine/facts/index.js";
import type { TaxFactRow } from "../src/engine/facts/rows.js";
import { evaluateScenario } from "../src/engine/index.js";
import { runScenario } from "./runScenario.js";
import { taraScenario } from "./scenarios/tara/index.js";

const HOUSEHOLD_KEY = "employee.rosa-delgado.household_w2";

function lines(facts: TaxFactRow[]) {
  const { forms } = evaluateScenario({
    filing: { id: "tara-variant", taxYear: 2025 },
    facts,
    decisions: taraScenario.decisions,
    authEmail: null,
  });
  return (formId: string, line: string) => {
    const form = forms.get(formId);
    if (!form?.mustFile.ok || form.mustFile.value !== true) return "not filed";
    const f = form.fields.find((x) => x.fieldId === `${formId}.${line}`);
    return f?.result.ok ? f.result.value : "blank";
  };
}

const withValue = (key: string, change: (v: never) => unknown) =>
  taraScenario.facts.map((f) => (f.key === key ? { ...f, value: change(f.value as never) } : f));

const household = (change: Partial<HouseholdEmployeeFactValue>) =>
  withValue(HOUSEHOLD_KEY, (v: HouseholdEmployeeFactValue) => ({ ...v, ...change }));

describe("Schedule H", () => {
  it("is not filed for $2,000 in wages with no withholding", () => {
    const line = lines(household({ box3: 2000, box5: 2000 }));
    expect(line("schedule-h", "0.line.A_no")).toBe("not filed");
    expect(line("schedule-2", "0.line.9_household_employment_taxes")).toBe("not filed");
  });

  it("files lines B, 7, and 8 when income tax was withheld below $2,800", () => {
    const line = lines(household({ box2: 150, box3: 2000, box5: 2000 }));
    expect(line("schedule-h", "0.line.A_no")).toBe(true);
    expect(line("schedule-h", "0.line.B_yes")).toBe(true);
    expect(line("schedule-h", "0.line.1")).toBe("blank");
    expect(line("schedule-h", "0.line.8")).toBe(150);
    expect(line("schedule-2", "0.line.9_household_employment_taxes")).toBe(150);
  });
});

describe("Form 5695", () => {
  it("drops Section A when line 17c is No", () => {
    const line = lines(withValue(HOME_ENERGY_KEYS.lastsFiveYears, () => false));
    expect(line("form-5695", "1.line.17c_no")).toBe(true);
    expect(line("form-5695", "1.line.19h")).toBe("blank");
    expect(line("form-5695", "3.line.27")).toBe(600);
    expect(line("form-5695", "3.line.32")).toBe(600);
  });

  it("limits line 32 to the tax on line 31", () => {
    const facts = taraScenario.facts
      .filter((f) => f.key !== "employer.c-r")
      .map((f) =>
        f.key === "employer.the-green-ladies"
          ? { ...f, value: { ...(f.value as W2FactValue), box1: 17000 } }
          : f,
      );
    const line = lines(facts);
    // 17,000 − 15,750 = 1,250 taxable: tax table $126.
    expect(line("form-5695", "3.line.31")).toBe(126);
    expect(line("form-5695", "3.line.32")).toBe(126);
    expect(line("form-1040", "line.22")).toBe(0);
  });
});

describe("fixpoint", () => {
  it("gives the same lines with the forms in reverse order", async () => {
    const reversed = { ...taraScenario, forms: [...taraScenario.forms].reverse() };
    const result = await runScenario(reversed);
    expect(result.failures).toEqual([]);
  });
});

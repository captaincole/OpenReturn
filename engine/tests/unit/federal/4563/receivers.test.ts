/*
 * The MAGI lines of other forms that add Form 4563 line 15: each made-up
 * scenario that files the form, with and without a Form 4563 fact for the
 * taxpayer. Without the fact each line is what it was.
 */

import { describe, expect, it } from "vitest";
import { makeAmericanSamoaExclusionFactKey } from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { bashereScenario } from "../../../scenarios/synthetic/bashere/index.js";
import { americanSamoaIncome } from "../../../scenarios/synthetic/berylla/facts.js";
import { birgitteScenario } from "../../../scenarios/synthetic/birgitte/index.js";
import { isoldeScenario } from "../../../scenarios/synthetic/isolde/index.js";
import { odessaScenario } from "../../../scenarios/synthetic/odessa/index.js";
import type { Scenario } from "../../../types.js";

const LINE_15 = 57150;
const AGI = "form-1040.line.11b";

/* A field of the return, by its full id ("form-1040.line.11b"). */
function fieldsOf(scenario: Scenario, extra: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: `${scenario.name}-4563`, taxYear: scenario.taxYear },
    facts: [...scenario.facts, ...extra],
    decisions: scenario.decisions,
    authEmail: null,
  });
  return (fullId: string) => {
    const formId = fullId.split(".")[0];
    const field = result.forms.get(formId)?.fields.find((each) => each.fieldId === fullId);
    return field?.result.ok ? field.result.value : undefined;
  };
}

const exclusionFor = (scenario: Scenario): TaxFactRow => ({
  id: "f-american-samoa",
  userId: scenario.userId,
  taxYear: scenario.taxYear,
  category: "foreign",
  key: makeAmericanSamoaExclusionFactKey("taxpayer"),
  value: americanSamoaIncome,
  sourceNote: "test",
  createdAt: "2026-11-26T00:00:00Z",
});

/* [name, scenario, the MAGI line, the line it starts from (Form 1040 line 11b, or its own worksheet)]. */
const CASES: Array<[string, Scenario, string, string | undefined]> = [
  [
    "Form 8863 line 3 (irs-8863-inst-2025::sec::line-3::b01)",
    bashereScenario,
    "form-8863.0.line.3_modified_agi",
    AGI,
  ],
  [
    "Form 8839 line 7 (irs-8839-inst-2025::sec::line-7::b01)",
    isoldeScenario,
    "form-8839.0.line.7_modified_adjusted_gross_income",
    AGI,
  ],
  [
    "Form 8815 line 9 (irs-8815-form-2025::sec::step-action::b03)",
    odessaScenario,
    "form-8815.0.line.9_modified_adjusted_gross_income",
    undefined,
  ],
  [
    "Form 8936 line 2 (line 1e, irs-8936-face-2025::sec::face-part-i::b01)",
    birgitteScenario,
    "form-8936.0.line.2_2025_magi",
    undefined,
  ],
];

describe("Form 4563 line 15 on the MAGI lines of other forms", () => {
  for (const [name, scenario, line, start] of CASES) {
    it(`${name}: its amount without the fact, plus $57,150 with it`, () => {
      const before = fieldsOf(scenario, []);
      const after = fieldsOf(scenario, [exclusionFor(scenario)]);
      expect(typeof before(line)).toBe("number");
      if (start !== undefined) expect(before(line)).toBe(before(start));
      const base = start === undefined ? before(line) : after(start);
      expect(after(line)).toBe((base as number) + LINE_15);
    });
  }

  it("Form 8936 line 1e is Form 4563 line 15, blank without the form", () => {
    const id = "form-8936.0.line.1e_2025_form_4563_line_15";
    expect(fieldsOf(birgitteScenario, [])(id)).toBeUndefined();
    expect(fieldsOf(birgitteScenario, [exclusionFor(birgitteScenario)])(id)).toBe(LINE_15);
  });
});

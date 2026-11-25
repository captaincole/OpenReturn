/*
 * Form 8960 line 5b on a return with both a Form 4797 sale and a QEF: each part
 * comes out (line5b.ts). The base is berelain with a 300,000 W-2 added, so her
 * MAGI is over the threshold, as in 4797/niit.test.ts: every Form 4797 sale is
 * her print shop's (line G "Yes"), so 126,360 comes out. The fund is sheriam's
 * Swiss QEF without the section 1.1411-10(g) election: its line 7c gain
 * (0.0060240964 per unit per day × 199,200 unit days = 1,200) is in line 5a
 * through Schedule D line 11 and comes out on line 5b (worksheet line 2(f),
 * irs-8960-inst-2025::sec::line-6-adjustments-to-investment-income-for::b05).
 */

import { describe, expect, it } from "vitest";
import { makePficFundFactKey, makeW2FactKey } from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { berelainScenario as base } from "../../../scenarios/synthetic/berelain/index.js";
import { alpineBalanced } from "../../../scenarios/synthetic/sheriam/facts.js";

const template = base.facts.find((fact) => fact.category === "wages")!;
const fact = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...template,
  id: `f-${key}`,
  category,
  key,
  value,
});

const bigW2 = fact("wages", makeW2FactKey("plains-hospital"), {
  ...(template.value as object),
  employerName: "Plains Regional Hospital",
  box1: 300000,
  box2: 60000,
  box3: 176100,
  box4: 10918,
  box5: 300000,
  box6: 4350,
});

const qef = fact("foreign", makePficFundFactKey("alpine-balanced"), {
  ...alpineBalanced,
  qef: { ...alpineBalanced.qef!, section1411gElection: false },
});

function evaluate(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "form-8960-line-5b-pfic-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  return (formId: string, id: string) => {
    const found = result.forms
      .get(formId)
      ?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
    return found?.ok ? found.value : found;
  };
}

describe("Form 8960 line 5b with a Form 4797 sale and a QEF", () => {
  it("takes out both the shop's Form 4797 amount and the QEF's line 7c", () => {
    const value = evaluate([...base.facts, bigW2, qef]);
    // Schedule D line 11: Form 4797 line 9 79,960 + the QEF's line 7c 1,200.
    expect(value("schedule-d", "0.line.11_long_term_gain_other_forms")).toBe(81160);
    // Line 5b: −126,360 (Form 4797, lines 2(a) and 2(b)) − 1,200 (line 2(f)).
    expect(value("form-8960", "0.line.5b")).toBe(-127560);
  });

  it("with no fund the line is the Form 4797 part alone", () => {
    const value = evaluate([...base.facts, bigW2]);
    expect(value("schedule-d", "0.line.11_long_term_gain_other_forms")).toBe(79960);
    expect(value("form-8960", "0.line.5b")).toBe(-126360);
  });
});

/*
 * Form 8995 as the engine evaluates it: a return with only REIT dividends,
 * two businesses, and a business whose QBI is not known yet. The tcb-us-008
 * filer (MFS, under the threshold) with its business replaced.
 */

import { describe, expect, it } from "vitest";
import {
  makeBusinessFactKey,
  makeDividendFactKey,
  type BusinessFactValue,
  type DividendFactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { evaluateScenario } from "../../../src/index.js";
import { tcbUs008Scenario as base } from "../../scenarios/tcb-us-008/index.js";

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  id: `f-${key}`,
  userId: base.userId,
  taxYear: base.taxYear,
  category,
  key,
  value,
  sourceNote: "unit test",
  createdAt: "2026-11-11T00:00:00Z",
});

const business = (id: string, value: Partial<BusinessFactValue>): TaxFactRow =>
  row("self_employment", makeBusinessFactKey(id), {
    activity: id,
    grossReceipts: 0,
    sellsGoods: false,
    materiallyParticipated: true,
    specifiedService: false,
    ...value,
  } satisfies BusinessFactValue);

const reitDividends: DividendFactValue = {
  payerName: "Fund",
  payerTin: "00-0000001",
  box1a: 2000.4,
  box5: 2000.4,
};

/* tcb-us-008 without its business and 1099-NEC, plus the given facts. */
function form8995(facts: TaxFactRow[]) {
  const kept = base.facts.filter((fact) => fact.category !== "self_employment");
  const result = evaluateScenario({
    filing: { id: "form-8995-test", taxYear: base.taxYear },
    facts: [...kept, ...facts],
    decisions: base.decisions,
    authEmail: null,
  });
  const form = result.forms.get("form-8995");
  const value = (line: string) => {
    const field = form?.fields.find((each) => each.fieldId === `form-8995.0.${line}`);
    return field?.result.ok ? field.result.value : undefined;
  };
  return { files: form?.mustFile.ok ? form.mustFile.value : undefined, value };
}

describe("Form 8995", () => {
  it("figures the REIT part alone from 1099-DIV box 5", () => {
    const form = form8995([row("investment_income", makeDividendFactKey("fund"), reitDividends)]);
    expect(form.files).toBe(true);
    expect(["line.1i_a", "line.2", "line.4", "line.5"].map(form.value)).toEqual([
      undefined,
      undefined,
      0,
      0,
    ]);
    expect(["line.6", "line.8", "line.9", "line.10", "line.15"].map(form.value)).toEqual([
      2000, 2000, 400, 400, 400,
    ]);
  });

  it("adds two businesses' rows on line 2, each with its EIN or the owner's SSN", () => {
    // Net earnings under $400: no Schedule SE, so QBI is each line 31.
    const form = form8995([
      business("design", { grossReceipts: 150, ein: "00-0000002" }),
      business("tutoring", { grossReceipts: 200 }),
    ]);
    expect(form.files).toBe(true);
    expect(["line.1i_a", "line.1i_b", "line.1i_c"].map(form.value)).toEqual([
      "design",
      "00-0000002",
      150,
    ]);
    expect(["line.1ii_a", "line.1ii_b", "line.1ii_c"].map(form.value)).toEqual([
      "tutoring",
      "900456789",
      200,
    ]);
    expect(["line.2", "line.4", "line.5"].map(form.value)).toEqual([350, 350, 70]);
  });

  it("leaves the totals blank while a business's QBI is not known", () => {
    // Two businesses with Schedule SE: no rule splits line 13 between them.
    const form = form8995([
      business("design", { grossReceipts: 3000 }),
      business("tutoring", { grossReceipts: 4000 }),
    ]);
    expect(form.files).toBe(true);
    expect(
      ["line.1i_c", "line.2", "line.4", "line.10", "line.15", "line.16"].map(form.value),
    ).toEqual([undefined, undefined, undefined, undefined, undefined, undefined]);
  });
});

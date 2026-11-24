/*
 * Form 4797's ordinary gain in a business's QBI (qbi/form4797.ts, 4797/activities.ts):
 * the Part II rows, the Part III recapture and line 11 or 12 of one activity.
 * The synthetic berelain scenario is the base: every sale names her print shop.
 */

import { describe, expect, it } from "vitest";
import {
  NO_BUSINESS,
  SECTION_1231_KEYS,
  makeBusinessPropertySaleFactKey,
  type BusinessPropertySaleFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import {
  form4797Activities,
  type LinkedProperty,
} from "../../../../src/federal/4797/activities.js";
import type { Form4797Lines } from "../../../../src/federal/4797/lines.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { berelainScenario as base } from "../../../scenarios/synthetic/berelain/index.js";

function evaluate(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "form-4797-qbi-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  return { field, pending: pendingInputs(result) };
}

const HAY_FIELD = makeBusinessPropertySaleFactKey("hay-field");
const LAPTOP = makeBusinessPropertySaleFactKey("design-laptop");
const QBI_ROW = "0.line.1i_c";

/* Berelain's facts with one sale's link changed. */
function withLink(key: string, link: Partial<BusinessPropertySaleFactValue>): TaxFactRow[] {
  return base.facts.map((fact) => {
    if (fact.key !== key) return fact;
    const { businessId: _id, ...rest } = fact.value as BusinessPropertySaleFactValue;
    return { ...fact, value: { ...rest, ...link } };
  });
}

describe("Form 4797 in the QBI of the berelain return", () => {
  it("adds line 18b's ordinary gain to the shop's QBI: 49,152 + 46,400 − 3,473", () => {
    expect(evaluate(base.facts).field("form-8995", QBI_ROW)).toMatchObject({ value: 92079 });
  });

  it("asks for a sale's business, and the QBI waits", () => {
    const run = evaluate(withLink(LAPTOP, {}));
    expect(run.pending.pendingFacts).toContain(LAPTOP);
    expect(run.field("form-8995", QBI_ROW)).toMatchObject({ ok: false });
    expect(run.field("form-8995", QBI_ROW)).not.toMatchObject({ unsupported: true });
  });

  it("asks again for a sale that names a business not on the return", () => {
    const run = evaluate(withLink(LAPTOP, { businessId: "someone-else" }));
    expect(run.pending.pendingFacts).toContain(LAPTOP);
  });

  it("line 12 from two activities' section 1231 amounts is a gap: the split is not known", () => {
    const run = evaluate(withLink(HAY_FIELD, { businessId: NO_BUSINESS }));
    expect(run.pending.pendingFacts).not.toContain(HAY_FIELD);
    expect(run.field("form-8995", QBI_ROW)).toMatchObject({ ok: false, unsupported: true });
  });

  it("with no line 8 the section 1231 gain is capital: the shop keeps only its own ordinary part", () => {
    const facts = withLink(HAY_FIELD, { businessId: NO_BUSINESS }).map((fact) =>
      fact.key === SECTION_1231_KEYS.nonrecapturedLosses ? { ...fact, value: 0 } : fact,
    );
    // 49,152 + van 7,500 + improvements 14,400 + laptop 900 − 3,473 (QUESTIONS.md item 10).
    expect(evaluate(facts).field("form-8995", QBI_ROW)).toMatchObject({ value: 68479 });
  });
});

const row = (gainOrLoss: number) => ({
  description: "row",
  dateAcquired: "2020-01-01",
  dateSold: "2025-06-01",
  grossSalesPrice: 0,
  costPlusExpense: 0,
  gainOrLoss,
});

const partI = (activity: string, gainOrLoss: number): LinkedProperty => ({
  part: "part_i",
  row: row(gainOrLoss),
  activity,
});

const partII = (activity: string, gainOrLoss: number): LinkedProperty => ({
  part: "part_ii",
  row: row(gainOrLoss),
  activity,
});

const lines = (line7: number, line12?: number) =>
  ({
    line7,
    line12,
    partIRows: [],
    partIIRows: [],
    partIIIColumns: [],
    partIV: {},
  }) as unknown as Form4797Lines;

describe("form4797Activities", () => {
  it("a net section 1231 loss (line 11) of one activity is its ordinary loss", () => {
    const result = form4797Activities([partI("a", -500), partII("a", 200)], lines(-500));
    expect(result).toEqual({ amounts: [{ key: "a", ordinary: -300, total: -300 }] });
  });

  it("a net section 1231 loss of two activities is a gap for the ordinary amounts, not the totals", () => {
    const result = form4797Activities([partI("a", -500), partI("b", 100)], lines(-400));
    expect(result.ordinaryGap).toBeDefined();
    expect(result.amounts.map((each) => each.total)).toEqual([-500, 100]);
  });

  it("a capital section 1231 gain of two activities splits nothing: no gap", () => {
    const result = form4797Activities(
      [partI("a", 900), partI("b", -100), partII("b", 50)],
      lines(800),
    );
    expect(result).toEqual({
      amounts: [
        { key: "a", ordinary: 0, total: 900 },
        { key: "b", ordinary: 50, total: -50 },
      ],
    });
  });

  it("line 12 goes to the one activity with section 1231 amounts", () => {
    const result = form4797Activities([partI("a", 900), partII("b", 50)], lines(900, 300));
    expect(result.amounts).toEqual([
      { key: "a", ordinary: 300, total: 900 },
      { key: "b", ordinary: 50, total: 50 },
    ]);
  });
});

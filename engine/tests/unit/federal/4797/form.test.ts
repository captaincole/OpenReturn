/*
 * Form 4797 on a whole return: who files, the lines it sends on (Schedule 1
 * line 4, Schedule D lines 11 and 19, Schedule C line 6, Form 1040 line 16),
 * the gaps, and "no facts, nothing changes". The synthetic berelain scenario
 * is the base.
 */

import { describe, expect, it } from "vitest";
import {
  SECTION_1231_KEYS,
  makeBusinessPropertySaleFactKey,
  makeSection1256ContractFactKey,
  type BusinessPropertySaleFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { worksheet1 } from "../../../../src/federal/schedule-eic/worksheet1.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { computeQdcg } from "../../../../src/worksheets/qdcg.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { berelainScenario as base } from "../../../scenarios/synthetic/berelain/index.js";

const isForm4797Fact = (fact: TaxFactRow) =>
  fact.key.startsWith("business_property_sale.") || fact.key.startsWith("section_179_recapture.");

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(facts: TaxFactRow[], extraDecisions: AIDecisionRow[] = []) {
  const result = evaluateScenario({
    filing: { id: "form-4797-test", taxYear: base.taxYear },
    facts,
    decisions: [...base.decisions, ...extraDecisions],
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

const template = base.facts.find((fact) => fact.key.startsWith("business_property_sale."))!;
const saleFact = (slug: string, value: BusinessPropertySaleFactValue): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeBusinessPropertySaleFactKey(slug),
  value,
});

const SCHEDULE_1_LINE_4 = "0.line.4";
const SCHEDULE_D_LINE_11 = "0.line.11_long_term_gain_other_forms";
const SCHEDULE_D_LINE_19 = "1.line.19_unrecaptured_sec1250_gain";

describe("Form 4797 on the berelain return", () => {
  const run = evaluate(base.facts);

  it("sends line 18b to Schedule 1 line 4 and checks its box", () => {
    expect(run.value("schedule-1", SCHEDULE_1_LINE_4)).toBe(46400);
    expect(run.value("schedule-1", "0.line.4_form_4797")).toBe(true);
  });

  it("sends line 9 to Schedule D line 11 and the worksheet's line 18 to line 19", () => {
    expect(run.value("schedule-d", SCHEDULE_D_LINE_11)).toBe(79960);
    expect(run.value("schedule-d", SCHEDULE_D_LINE_19)).toBe(38460);
    expect(run.value("schedule-d", "1.line.20_use_qual_div_worksheet_no")).toBe(true);
  });

  it("adds the Part IV recapture to the business's Schedule C line 6", () => {
    expect(run.value("schedule-c", "0.line.6")).toBe(8134 + 4018);
  });

  it("figures Form 1040 line 16 on the Schedule D Tax Worksheet, above the QDCG worksheet's tax", () => {
    const qdcg = computeQdcg({
      taxableIncome: 163853,
      qualifiedDividends: 2800,
      netLongTermGain: 81460,
      filingStatus: "single",
      taxYear: 2025,
    }).tax;
    expect(run.value("form-1040", "line.16")).toBe(28050);
    expect(qdcg).toBeLessThan(28050);
  });

  it("an explicit decision false still wins", () => {
    const off = evaluate(base.facts, [decision("decisions.scope.must_file_4797", false)]);
    expect(off.files("form-4797")).toBe(false);
  });
});

describe("Form 4797 with no facts", () => {
  const without = evaluate(base.facts.filter((fact) => !isForm4797Fact(fact)));

  it("does not file, and the lines it feeds keep their reasons", () => {
    expect(without.files("form-4797")).toBe(false);
    expect(without.field("schedule-1", SCHEDULE_1_LINE_4)).toMatchObject({
      ok: false,
      unsupported: true,
      reason: "No Form 4797 or Form 4684 scenario yet.",
    });
    // Only the 1099-DIV box 2a is left: it goes on Form 1040 line 7a with no Schedule D.
    expect(without.files("schedule-d")).toBe(false);
    expect(without.value("form-1040", "line.7a")).toBe(1500);
  });

  it("line 16 is the QDCG worksheet's tax and Schedule C line 6 is blank", () => {
    expect(without.value("schedule-c", "0.line.6")).toBeUndefined();
    const taxable = without.value("form-1040", "line.15") as number;
    const qdcg = computeQdcg({
      taxableIncome: taxable,
      qualifiedDividends: 2800,
      netLongTermGain: 1500,
      filingStatus: "single",
      taxYear: 2025,
    }).tax;
    expect(without.value("form-1040", "line.16")).toBe(qdcg);
  });

  it("files by decision alone as a gap, so nothing silently counts as zero", () => {
    const decided = evaluate(
      base.facts.filter((fact) => !isForm4797Fact(fact)),
      [decision("decisions.scope.must_file_4797", true)],
    );
    expect(decided.field("form-4797", "0.line.7_net_section_1231_gain_loss")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(decided.field("schedule-1", SCHEDULE_1_LINE_4)).toMatchObject({
      ok: false,
      unsupported: true,
    });
  });
});

describe("Form 4797 waits and gaps", () => {
  it("waits for the nonrecaptured section 1231 losses when line 7 is a gain", () => {
    const run = evaluate(
      base.facts.filter((fact) => fact.key !== SECTION_1231_KEYS.nonrecapturedLosses),
    );
    expect(run.pending.pendingFacts).toContain(SECTION_1231_KEYS.nonrecapturedLosses);
    expect(run.value("form-4797", "0.line.7_net_section_1231_gain_loss")).toBe(94960);
    expect(run.value("form-4797", "0.line.8_nonrecaptured_section_1231_losses")).toBeUndefined();
    expect(run.value("schedule-d", SCHEDULE_D_LINE_11)).toBeUndefined();
    expect(run.value("schedule-1", "0.line.10")).toBeUndefined();
  });

  it("Form 6252 filing makes lines 7–18b and Schedule D line 11 a gap", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_6252", true)]);
    expect(run.field("form-4797", "0.line.17_ordinary_gain_loss_total")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.field("schedule-d", SCHEDULE_D_LINE_11)).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.value("form-4797", "1.line.31_total_recapture_amounts")).toBe(30500);
  });

  it("a Part IV recapture that names no business on the return makes its line 35 a gap", () => {
    const facts = base.facts.map((fact) =>
      fact.key === "section_179_recapture.pickup"
        ? { ...fact, value: { ...(fact.value as object), businessId: "someone-else" } }
        : fact,
    );
    const run = evaluate(facts);
    expect(run.field("form-4797", "1.line.35_recapture_amount_col_b")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.value("form-4797", "1.line.35_recapture_amount_col_a")).toBe(8134);
    expect(run.value("schedule-c", "0.line.6")).toBe(8134);
  });

  it("more than four Part I rows: the rows are a gap, line 7 still adds them all", () => {
    const extra = [1, 2].map((each) =>
      saleFact(`lot-${each}`, {
        description: `Lot ${each}`,
        kind: "land",
        dateAcquired: "2015-01-01",
        dateSold: "2025-04-01",
        grossSalesPrice: 1000,
        costOrOtherBasis: 500,
      }),
    );
    const run = evaluate([...base.facts, ...extra]);
    expect(run.field("form-4797", "0.line.2_row1_col_g")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.value("form-4797", "0.line.7_net_section_1231_gain_loss")).toBe(95960);
  });

  it("Schedule D line 11 adds Form 6781's line 9 to the Form 4797 gain", () => {
    const contract: TaxFactRow = {
      ...template,
      id: "f-contract",
      category: "capital_gains",
      key: makeSection1256ContractFactKey("corn"),
      value: { description: "Corn futures", gainOrLoss: 1000 },
    };
    const run = evaluate([...base.facts, contract]);
    expect(run.value("schedule-d", SCHEDULE_D_LINE_11)).toBe(79960 + 600);
  });

  it("a 28% rate gain (1099-DIV box 2d) makes Schedule D line 19 a gap", () => {
    const facts = base.facts.map((fact) =>
      fact.key === "account.high-plains-reit.dividends"
        ? { ...fact, value: { ...(fact.value as object), box2d: 100 } }
        : fact,
    );
    const run = evaluate(facts);
    expect(run.field("schedule-d", SCHEDULE_D_LINE_19)).toMatchObject({
      ok: false,
      unsupported: true,
    });
  });

  it("Form 6251 Part III is a gap while Schedule D line 19 has an amount", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_6251", true)]);
    expect(run.field("form-6251", "1.line.13_qualified_dividends_gain_amount")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.field("form-6251", "1.line.15_adjusted_net_capital_gain")).toMatchObject({
      ok: false,
      unsupported: true,
    });
  });

  it("two sales on one Form 1099-S with no price of their own are a gap, not box 2 each", () => {
    const noPrice = new Set([
      makeBusinessPropertySaleFactKey("shop-building"),
      makeBusinessPropertySaleFactKey("shop-land"),
    ]);
    const facts = base.facts.map((fact) => {
      if (!noPrice.has(fact.key)) return fact;
      const { grossSalesPrice: _price, ...rest } = fact.value as BusinessPropertySaleFactValue;
      return { ...fact, value: rest };
    });
    const run = evaluate(facts);
    expect(run.field("form-4797", "1.line.20_gross_sales_price_col_a")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.field("schedule-1", SCHEDULE_1_LINE_4)).toMatchObject({
      ok: false,
      unsupported: true,
    });
  });

  it("a sale that alone names its Form 1099-S still takes box 2 as its price", () => {
    const facts = base.facts.map((fact) => {
      const value = fact.value as BusinessPropertySaleFactValue;
      if (fact.key === makeBusinessPropertySaleFactKey("shop-building")) {
        const { grossSalesPrice: _price, ...rest } = value;
        return { ...fact, value: rest };
      }
      if (value.form1099SKey !== undefined) {
        const { form1099SKey: _key, ...rest } = value;
        return { ...fact, value: rest };
      }
      return fact;
    });
    expect(evaluate(facts).value("form-4797", "1.line.20_gross_sales_price_col_a")).toBe(350000);
  });

  it("a Part I loss while Form 8582 files makes lines 7–18b and what they send a gap", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_8582", true)]);
    expect(run.field("form-4797", "0.line.7_net_section_1231_gain_loss")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.field("schedule-1", SCHEDULE_1_LINE_4)).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(run.field("schedule-d", SCHEDULE_D_LINE_11)).toMatchObject({
      ok: false,
      unsupported: true,
    });
    // The rows and Part III still print.
    expect(run.value("form-4797", "0.line.2_row2_col_g")).toBe(-2500);
    expect(run.value("form-4797", "1.line.31_total_recapture_amounts")).toBe(30500);
  });

  it("with no Form 8582 the same losses stay on the form", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_8582", false)]);
    expect(run.value("form-4797", "0.line.7_net_section_1231_gain_loss")).toBe(94960);
    expect(run.value("schedule-1", SCHEDULE_1_LINE_4)).toBe(46400);
  });

  it("Pub. 596 Worksheet 1 is a gap for a Form 4797 filer", () => {
    const info = { mustFile: { "form-4797": { value: true } } } as unknown as Parameters<
      typeof worksheet1
    >[1];
    expect(worksheet1({} as Parameters<typeof worksheet1>[0], info, 0)).toMatchObject({
      kind: "unsupported",
    });
  });
});

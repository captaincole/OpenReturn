/*
 * More prior years than columns: "If there were more than 2 prior years,
 * attach additional Forms 8697 ... Complete lines 1 through 8 (as applicable),
 * but do not enter totals in column (c). Enter totals only in column (c) of the
 * first Form 8697" (irs-8697-inst-2025::sec::part-i-regular-method::b01). The
 * golden run checks the first copy only; this file checks the second.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { loadFromFixtures, type Catalog } from "../../../../src/catalog.js";
import { evaluateForm } from "../../../../src/engine.js";
import { LOOK_BACK_FACT_KEY, type RegularLookBackFactValue } from "../../../../src/facts/index.js";
import { resolveFilingInfo } from "../../../../src/filingInfo.js";
import { getFormSpec } from "../../../../src/registry.js";
import { makeDecisionsView, makeFactsView, type DerivationContext } from "../../../../src/types.js";
import { catalogPath } from "../../../helpers/formPaths.js";
import { dagdaraScenario } from "../../../scenarios/synthetic/dagdara/index.js";

const spec = getFormSpec("form-8697");
let catalog: Catalog;
let ctx: DerivationContext;

const facts = dagdaraScenario.facts.map((fact) => {
  if (fact.key !== LOOK_BACK_FACT_KEY) return fact;
  const value = fact.value as RegularLookBackFactValue;
  const earlier = {
    taxYear: 2022,
    taxableIncome: 90_000,
    incomeAdjustment: 10_000,
    taxOnAdjustedIncome: 16_000,
    taxAsReported: 14_000,
  };
  return { ...fact, value: { ...value, priorYears: [...value.priorYears, earlier] } };
});

beforeAll(async () => {
  spec.register?.();
  catalog = await loadFromFixtures([catalogPath(spec)]);
  const { decisions } = dagdaraScenario;
  ctx = {
    taxYear: dagdaraScenario.taxYear,
    facts: makeFactsView(facts),
    decisions: makeDecisionsView(decisions),
    filingInfo: resolveFilingInfo({
      facts: facts.map(({ key, value, category }) => ({ key, value, category })),
      decisions: decisions.map(({ decisionKey, decision }) => ({ decisionKey, decision })),
    }),
  };
});

function copyValues(index: number): Map<string, unknown> {
  const form = evaluateForm(
    spec.formId,
    { ...ctx, filingInfo: spec.copies?.select(ctx.filingInfo, index) },
    catalog,
  );
  return new Map(
    form.fields.map((field) => [field.fieldId, field.result.ok ? field.result.value : undefined]),
  );
}

const field = (id: string) => `form-8697.${id}`;

describe("Form 8697 with three Part I prior years", () => {
  it("needs two forms", () => {
    expect(spec.copies?.count(ctx.filingInfo)).toBe(2);
  });

  it("the first form prints 2022 and 2023, and totals all three years", () => {
    const first = copyValues(0);
    expect(first.get(field("0.part1.year_ended_year_col_a"))).toBe("2022");
    expect(first.get(field("0.part1.year_ended_year_col_b"))).toBe("2023");
    expect(first.get(field("0.part1.2_adjustment_to_income_col_c"))).toBe(10_000 + 40_000 - 15_000);
    const due =
      (first.get(field("0.part1.7_interest_due_on_increase_col_a")) as number) +
      (first.get(field("0.part1.7_interest_due_on_increase_col_b")) as number);
    expect(
      Math.abs((first.get(field("0.part1.7_interest_due_on_increase_col_c")) as number) - due),
    ).toBeLessThanOrEqual(1);
    expect(first.get(field("0.part1.8_interest_refunded_on_decrease_col_c"))).toBe(261);
  });

  it("the second form prints 2024 in column (a), nothing in (b), and no totals or net line", () => {
    const second = copyValues(1);
    expect(second.get(field("0.part1.year_ended_year_col_a"))).toBe("2024");
    expect(second.get(field("0.part1.6_increase_or_decrease_in_tax_col_a"))).toBe(-3_600);
    expect(second.get(field("0.part1.8_interest_refunded_on_decrease_col_a"))).toBe(261);
    expect(second.get(field("0.part1.year_ended_year_col_b"))).toBeUndefined();
    expect(second.get(field("0.part1.7_interest_due_on_increase_col_c"))).toBeUndefined();
    expect(second.get(field("0.part1.10_net_interest_owed"))).toBeUndefined();
    expect(second.get(field("0.part1.2_adjustment_to_income_filing_year"))).toBeUndefined();
  });

  it("the second form names the filer and the tax year", () => {
    const second = copyValues(1);
    expect(second.get(field("0.header.name"))).toBe("Dagdara Holloway");
    expect(second.get(field("0.header.filing_year_ending"))).toBe("12/31/2025");
    expect(second.get(field("0.header.b_taxpayer_type_individual"))).toBeUndefined();
  });
});

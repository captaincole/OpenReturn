/*
 * More than four properties in a part: "If you have more than four properties
 * to report, use additional forms" (irs-4797-inst-2025::sec::part-iii::b01).
 * The synthetic alanna scenario sells five Part III properties; the golden run
 * checks the first Form 4797 (it evaluates copy 0 only), and this file checks
 * the second.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { loadFromFixtures, type Catalog } from "../../../../src/catalog.js";
import { evaluateForm } from "../../../../src/engine.js";
import { form4797CopyCount } from "../../../../src/federal/4797/copies.js";
import type { Form4797Lines } from "../../../../src/federal/4797/lines.js";
import { resolveFilingInfo } from "../../../../src/filingInfo.js";
import { getFormSpec } from "../../../../src/registry.js";
import { makeDecisionsView, makeFactsView, type DerivationContext } from "../../../../src/types.js";
import { catalogPath } from "../../../helpers/formPaths.js";
import { alannaScenario } from "../../../scenarios/synthetic/alanna/index.js";

const spec = getFormSpec("form-4797");
let catalog: Catalog;
let ctx: DerivationContext;

beforeAll(async () => {
  spec.register?.();
  catalog = await loadFromFixtures([catalogPath(spec)]);
  const { facts, decisions } = alannaScenario;
  ctx = {
    taxYear: alannaScenario.taxYear,
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

const field = (id: string) => `form-4797.${id}`;

describe("Form 4797 copies on the alanna return", () => {
  it("five Part III properties need two copies", () => {
    expect(spec.copies?.count(ctx.filingInfo)).toBe(2);
  });

  it("the second copy prints the fifth property in column A, and nothing in B to D", () => {
    const second = copyValues(1);
    expect(second.get(field("1.line.19a_property_col_a"))).toBe("Compact skid steer");
    expect(second.get(field("1.line.19a_property_col_b"))).toBe("08/01/2018");
    expect(second.get(field("1.line.19a_property_col_c"))).toBe("09/12/2025");
    // 30,500 − (30,000 + 500 − 30,000): all of the 30,000 gain is section 1245 recapture.
    expect(second.get(field("1.line.20_gross_sales_price_col_a"))).toBe(30500);
    expect(second.get(field("1.line.21_cost_basis_plus_expense_col_a"))).toBe(30500);
    expect(second.get(field("1.line.22_depreciation_allowed_col_a"))).toBe(30000);
    expect(second.get(field("1.line.23_adjusted_basis_col_a"))).toBe(500);
    expect(second.get(field("1.line.24_total_gain_col_a"))).toBe(30000);
    expect(second.get(field("1.line.25b_sec_1245_smaller_amount_col_a"))).toBe(30000);
    expect(second.get(field("1.line.19b_property_col_a"))).toBeUndefined();
    expect(second.get(field("1.line.20_gross_sales_price_col_b"))).toBeUndefined();
  });

  it("the second copy has no Part II rows and no totals; the header repeats", () => {
    const second = copyValues(1);
    expect(second.get(field("0.line.10_row1_col_g"))).toBeUndefined();
    expect(second.get(field("1.line.30_total_gains_all_properties"))).toBeUndefined();
    expect(second.get(field("1.line.31_total_recapture_amounts"))).toBeUndefined();
    expect(second.get(field("0.line.13_gain_from_line_31"))).toBeUndefined();
    expect(second.get(field("0.line.18b_redetermined_ordinary_gain_loss"))).toBeUndefined();
    expect(second.get(field("0.header.taxpayer_name"))).toBe("Alanna Corbray");
  });

  it("the first copy's totals add all five properties", () => {
    const first = copyValues(0);
    expect(first.get(field("1.line.19d_property_col_a"))).toBe("Truck leaf loader");
    expect(first.get(field("1.line.30_total_gains_all_properties"))).toBe(40800);
    expect(first.get(field("1.line.31_total_recapture_amounts"))).toBe(40800);
  });
});

describe("form4797CopyCount", () => {
  const lines = (partI: number, partII: number, partIII: number) =>
    ({
      partIRows: Array.from({ length: partI }),
      partIIRows: Array.from({ length: partII }),
      partIIIColumns: Array.from({ length: partIII }),
    }) as unknown as Form4797Lines;

  it("each part counts on its own: the part with the most rows decides", () => {
    expect(form4797CopyCount(undefined)).toBe(1);
    expect(form4797CopyCount(lines(0, 0, 0))).toBe(1);
    expect(form4797CopyCount(lines(4, 4, 4))).toBe(1);
    expect(form4797CopyCount(lines(5, 1, 0))).toBe(2);
    expect(form4797CopyCount(lines(2, 9, 3))).toBe(3);
  });
});

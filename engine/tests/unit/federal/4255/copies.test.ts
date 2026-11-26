/*
 * More than four Part II properties: "complete and attach additional Forms
 * 4255" (irs-4255-inst-2025::sec::part-ii::b01). The liandrin scenario with a
 * fifth property (the heat pump again) needs a second copy; the golden run
 * checks the first copy only, and this file checks the second.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { loadFromFixtures, type Catalog } from "../../../../src/catalog.js";
import { evaluateForm } from "../../../../src/engine.js";
import { makeCreditRecapturePropertyFactKey } from "../../../../src/facts/index.js";
import { form4255CopyCount } from "../../../../src/federal/4255/copies.js";
import type { Form4255Result } from "../../../../src/federal/4255/filingInfo.js";
import { resolveFilingInfo } from "../../../../src/filingInfo.js";
import { getFormSpec } from "../../../../src/registry.js";
import { makeDecisionsView, makeFactsView, type DerivationContext } from "../../../../src/types.js";
import { catalogPath } from "../../../helpers/formPaths.js";
import { liandrinScenario as base } from "../../../scenarios/synthetic/liandrin/index.js";

const spec = getFormSpec("form-4255");
let catalog: Catalog;
let ctx: DerivationContext;

beforeAll(async () => {
  spec.register?.();
  catalog = await loadFromFixtures([catalogPath(spec)]);
  const heatPump = base.facts.find(
    (fact) => fact.key === makeCreditRecapturePropertyFactKey("heat-pump"),
  )!;
  const facts = [
    ...base.facts,
    { ...heatPump, id: "f-fifth", key: makeCreditRecapturePropertyFactKey("fifth") },
  ];
  ctx = {
    taxYear: base.taxYear,
    facts: makeFactsView(facts),
    decisions: makeDecisionsView(base.decisions),
    filingInfo: resolveFilingInfo({
      facts: facts.map(({ key, value, category }) => ({ key, value, category })),
      decisions: base.decisions.map(({ decisionKey, decision }) => ({ decisionKey, decision })),
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

const field = (id: string) => `form-4255.${id}`;

describe("Form 4255 copies with five properties", () => {
  it("five properties need two copies", () => {
    expect(spec.copies?.count(ctx.filingInfo)).toBe(2);
  });

  it("the second copy prints the fifth property in column A and adds only its columns", () => {
    const second = copyValues(1);
    expect(second.get(field("3.part2.section_a_property_a_description"))).toBe(
      "Energy credit: energy property (geothermal heat pump)",
    );
    expect(second.get(field("3.part2.16_recapture_tax_disposition_col_a"))).toBe(2000);
    expect(second.get(field("3.part2.section_a_property_b_description"))).toBeUndefined();
    expect(second.get(field("3.part2.18_total_line_9_all_properties"))).toBe(0);
    expect(second.get(field("3.part2.19_total_line_16_all_properties"))).toBe(2000);
    expect(second.get(field("3.part2.20_total_increase_in_tax"))).toBe(2000);
  });

  it("Part I and Part III print on the first copy only; the header repeats", () => {
    const first = copyValues(0);
    const second = copyValues(1);
    expect(first.get(field("3.part2.20_total_increase_in_tax"))).toBe(30900);
    expect(first.get(field("2.part1.3_total_col_r"))).toBe(59950);
    expect(second.get(field("2.part1.3_total_col_r"))).toBeUndefined();
    expect(first.get(field("4.part3.9_emissions_tier_recapture_tax"))).toBe(11250);
    expect(second.get(field("4.part3.9_emissions_tier_recapture_tax"))).toBeUndefined();
    expect(second.get(field("0.header.taxpayer_name"))).toBe("Liandrin Corvesse");
  });
});

describe("form4255CopyCount", () => {
  const withProperties = (count: number) =>
    ({ properties: Array.from({ length: count }) }) as unknown as Form4255Result;

  it("one copy for each four properties, at least one", () => {
    expect(form4255CopyCount(undefined)).toBe(1);
    expect(form4255CopyCount(withProperties(0))).toBe(1);
    expect(form4255CopyCount(withProperties(4))).toBe(1);
    expect(form4255CopyCount(withProperties(5))).toBe(2);
    expect(form4255CopyCount(withProperties(9))).toBe(3);
  });
});

/*
 * More than ten entities: "use additional forms FTB 3804-CR"
 * (ca-3804cr-inst-2025::sec::line-1-column-c-pte-elective-tax-credit-s::b01).
 * The domon facts with an eleventh entity: the golden run checks the first
 * form (copy 0 only), and this file checks the second.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { loadFromFixtures, type Catalog } from "../../../../../src/catalog.js";
import { evaluateForm } from "../../../../../src/engine.js";
import { makeCaPteElectiveCreditFactKey } from "../../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../../src/facts/rows.js";
import { resolveFilingInfo } from "../../../../../src/filingInfo.js";
import { getFormSpec } from "../../../../../src/registry.js";
import {
  makeDecisionsView,
  makeFactsView,
  type DerivationContext,
} from "../../../../../src/types.js";
import { catalogPath } from "../../../../helpers/formPaths.js";
import { domonScenario as base } from "../../../../scenarios/synthetic/domon/index.js";

const spec = getFormSpec("form-3804-cr");
let catalog: Catalog;
let ctx: DerivationContext;

const eleventh: TaxFactRow = {
  id: "f-eleventh",
  userId: base.userId,
  taxYear: base.taxYear,
  category: "state_local_tax",
  key: makeCaPteElectiveCreditFactKey("eleventh"),
  value: { entityName: "Shelter Island Marina LLC", entityId: "202301122334", credit: 2790 },
  sourceNote: "test",
  createdAt: "2026-11-25T00:00:00Z",
};

beforeAll(async () => {
  spec.register?.();
  catalog = await loadFromFixtures([catalogPath(spec)]);
  const facts = [...base.facts, eleventh];
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

const field = (id: string) => `form-3804-cr.0.${id}`;

describe("FTB 3804-CR copies", () => {
  it("eleven entities need two forms; ten need one", () => {
    expect(spec.copies?.count(ctx.filingInfo)).toBe(2);
    const ten = resolveFilingInfo({
      facts: base.facts.map(({ key, value, category }) => ({ key, value, category })),
      decisions: base.decisions.map(({ decisionKey, decision }) => ({ decisionKey, decision })),
    });
    expect(spec.copies?.count(ten)).toBe(1);
  });

  it("the first form: ten rows, its own line 2, and Part II line 1 with all eleven", () => {
    const first = copyValues(0);
    expect(first.get(field("part1.1j_electing_pte_col_a"))).toBe("Balboa Freight Partners");
    expect(first.get(field("part1.2_total_pte_elective_tax_credit"))).toBe(28830);
    expect(first.get(field("part2.1_total_credit_from_ptes"))).toBe(28830 + 2790);
    expect(first.get(field("part2.3_total_available_credit"))).toBe(28830 + 2790 + 2140);
  });

  it("the second form: the eleventh entity in row a, its line 2, and no Part II", () => {
    const second = copyValues(1);
    expect(second.get(field("part1.1a_electing_pte_col_a"))).toBe("Shelter Island Marina LLC");
    expect(second.get(field("part1.1a_electing_pte_col_b"))).toBe("202301122334");
    expect(second.get(field("part1.1a_electing_pte_col_c"))).toBe(2790);
    expect(second.get(field("part1.1b_electing_pte_col_a"))).toBeUndefined();
    expect(second.get(field("part1.2_total_pte_elective_tax_credit"))).toBe(2790);
    expect(second.get(field("part2.1_total_credit_from_ptes"))).toBeUndefined();
    expect(second.get(field("part2.4_credit_claimed_current_year"))).toBeUndefined();
    expect(second.get(field("header.name_on_return"))).toBe("Domon Tallvane");
  });
});

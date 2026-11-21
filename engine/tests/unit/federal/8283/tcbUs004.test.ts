/*
 * tcb-us-004 (TaxCalcBench ty25-us-004; README.md for its do-not-train notice):
 * the second and third Forms 8283 of the answer key (output.xml IRS8283-1 and
 * IRS8283-2). The golden run checks the first form; it evaluates copy 0 only.
 * Each value is the key's, with column (a) joined from the key's name and
 * address parts and the key's dates written as the paper form prints them.
 * Left out on purpose: column (g) where the answers give no cost (the key
 * prints 0; a gift of $500 or less need not complete it, the form's note).
 */

import { beforeAll, describe, expect, it } from "vitest";
import { loadFromFixtures, type Catalog } from "../../../../src/catalog.js";
import { evaluateForm } from "../../../../src/engine.js";
import { resolveFilingInfo } from "../../../../src/filingInfo.js";
import { getFormSpec } from "../../../../src/registry.js";
import { makeDecisionsView, makeFactsView, type DerivationContext } from "../../../../src/types.js";
import { catalogPath } from "../../../helpers/formPaths.js";
import { tcbUs004Scenario } from "../../../scenarios/tcb-us-004/index.js";

const spec = getFormSpec("form-8283");
let catalog: Catalog;
let ctx: DerivationContext;

beforeAll(async () => {
  spec.register?.();
  catalog = await loadFromFixtures([catalogPath(spec)]);
  const { facts, decisions } = tcbUs004Scenario;
  ctx = {
    taxYear: tcbUs004Scenario.taxYear,
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

const row = (letter: string, column: string) => `form-8283.0.line.1_row_${letter}_${column}`;

describe("tcb-us-004 Form 8283", () => {
  it("files with three copies: rows 4 + 4 + 3", () => {
    expect(ctx.filingInfo?.mustFile?.["form-8283"]?.value).toBe(true);
    expect(spec.copies?.count(ctx.filingInfo)).toBe(3);
    expect(ctx.filingInfo?.form8283Copies?.map((copy) => copy.length)).toEqual([4, 4, 3]);
    expect(ctx.filingInfo?.missingInputs?.["form-8283"]).toEqual([]);
  });

  it.each([
    // IRS8283-1
    [
      1,
      "a",
      "NONPROFIT CHARITY, 111 TEST ST, CITY, NC 28234",
      "PAINTING",
      "12/31/2025",
      "VARIOUS",
      "INHERITIE",
      1500,
      1500,
      "APPRAISED",
    ],
    [
      1,
      "b",
      "NAME, STREET, CITY, AL 36132",
      "COLLECTIBLE",
      "12/01/2025",
      undefined,
      "PURCHASED",
      undefined,
      100,
      "BOOK VALUE",
    ],
    [
      1,
      "c",
      "FARM COMMUNITY, ADDRESS, CITY, TX 75001",
      "QUAL CONSERVATION",
      "03/08/2025",
      undefined,
      "GIFTED",
      0,
      250,
      "BOOK VALUE",
    ],
    [
      1,
      "d",
      "OTHER REAL ESTATE, STREET, CITY, SC 29020",
      "OTHER REAL ESTATE",
      "07/19/2025",
      undefined,
      "PURCHASED",
      undefined,
      499,
      "APPRAISED",
    ],
    // IRS8283-2
    [
      2,
      "a",
      "NAME, ADDRESS, CITY, GA 30303",
      "INTELLECTUAL",
      "07/01/2025",
      undefined,
      undefined,
      undefined,
      100,
      "BOOK",
    ],
    [
      2,
      "b",
      "GOODWILL, 11 DONATION RD, CITY, FL 32771",
      "EQUIPMENT",
      "01/20/2025",
      "VARIOUS",
      "PURCHASED",
      undefined,
      100,
      "THRIFT VALUE",
    ],
    [
      2,
      "c",
      "TEST, STREET, CITY, DE 19701",
      "OTHER SECURITIES",
      "12/31/2025",
      undefined,
      "PURCHASED",
      undefined,
      1,
      "BOOK",
    ],
  ] as const)(
    "copy %i row %s",
    (copy, letter, donee, description, given, acquired, how, basis, value, method) => {
      const values = copyValues(copy);
      expect(values.get(row(letter, "col_a_donee_name_address"))).toBe(donee);
      expect(values.get(row(letter, "col_b_vehicle"))).toBe(false);
      expect(values.get(row(letter, "col_c_property_description"))).toBe(description);
      expect(values.get(row(letter, "col_d_contribution_date"))).toBe(given);
      expect(values.get(row(letter, "col_e_date_acquired"))).toBe(acquired);
      expect(values.get(row(letter, "col_f_how_acquired"))).toBe(how);
      if (basis !== undefined) expect(values.get(row(letter, "col_g_cost_basis"))).toBe(basis);
      expect(values.get(row(letter, "col_h_fair_market_value"))).toBe(value);
      expect(values.get(row(letter, "col_i_valuation_method"))).toBe(method);
    },
  );

  it("the third form's row D is blank", () => {
    const values = copyValues(2);
    expect(values.get(row("d", "col_a_donee_name_address"))).toBeUndefined();
    expect(values.get(row("d", "col_h_fair_market_value"))).toBeUndefined();
  });

  it("every copy carries the joint names and the SSN", () => {
    for (const copy of [1, 2]) {
      const values = copyValues(copy);
      expect(values.get("form-8283.0.header.taxpayer_name")).toBe("Madison Gray & Salvester Slone");
      expect(values.get("form-8283.0.header.identifying_number")).toBe("900456789");
    }
  });
});

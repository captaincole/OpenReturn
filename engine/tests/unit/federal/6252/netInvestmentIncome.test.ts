/*
 * Form 8960 line 5b with Form 6252: the Lines 5a–5d Worksheet line 2(d) takes
 * out "Gains recognized in the current year for payments received on an
 * installment sale obligation ... for the disposition of property used in a
 * non-section 1411 trade or business"
 * (irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b06).
 * Built on the bain facts (W-2 84,000): the duplex (passive rental, false)
 * sends 190,410 to Schedule D through Form 4797 line 4, and the pasture sends
 * 4,000 (line 26, Form 4797 line 4) and 5,000 (line 25, Form 4797 line 15).
 */

import { describe, expect, it } from "vitest";
import {
  makeInstallmentSaleFactKey,
  type InstallmentSaleFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { duplex, pasture } from "../../../scenarios/synthetic/bain/facts.js";
import { bainScenario as base } from "../../../scenarios/synthetic/bain/index.js";

const isInstallmentFact = (fact: TaxFactRow) => fact.key.startsWith("installment_sale.");
const otherFacts = base.facts.filter((fact) => !isInstallmentFact(fact));
const template = base.facts.find(isInstallmentFact)!;

const sale = (slug: string, value: InstallmentSaleFactValue): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeInstallmentSaleFactKey(slug),
  value,
});

function evaluate(installments: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "form-6252-niit-test", taxYear: base.taxYear },
    facts: [...otherFacts, ...installments],
    decisions: base.decisions,
    authEmail: null,
  });
  const form = result.forms.get("form-8960");
  const files = form?.mustFile.ok ? form.mustFile.value : undefined;
  const value = (line: string) => {
    const found = form?.fields.find((each) => each.fieldId === `form-8960.0.line.${line}`)?.result;
    return found?.ok ? found.value : undefined;
  };
  return { files, value, pending: pendingInputs(result) };
}

const businessPasture = { ...pasture, nonSection1411TradeOrBusiness: true };

describe("Form 8960 line 5b: a Form 6252 sale of non-section 1411 business property", () => {
  it("takes out the sale's whole income this year, recapture included (worksheet line 2(d))", () => {
    const run = evaluate([sale("duplex", duplex), sale("pasture", businessPasture)]);
    expect(run.files).toBe(true);
    // 1040 line 7a 194,410 (190,410 + 4,000) and Schedule 1 line 4 5,000.
    expect(run.value("5a")).toBe(199410);
    expect(run.value("5b")).toBe(-9000);
    expect(run.value("5d")).toBe(190410);
  });

  it("a passive sale stays in NII: line 5b is blank (bain's own answers)", () => {
    const run = evaluate([sale("duplex", duplex), sale("pasture", pasture)]);
    expect(run.value("5b")).toBeUndefined();
    expect(run.value("5d")).toBe(199410);
  });

  it("only non-section 1411 business sales: no investment income, so Form 8960 does not file", () => {
    const run = evaluate([sale("pasture", businessPasture)]);
    expect(run.files).toBe(false);
  });

  it("a business sale with no answer: lines 5b and 5d wait and the sale is asked", () => {
    const unanswered = { ...pasture, nonSection1411TradeOrBusiness: undefined };
    const run = evaluate([sale("duplex", duplex), sale("pasture", unanswered)]);
    expect(run.files).toBe(true);
    expect([run.value("5b"), run.value("5d")]).toEqual([undefined, undefined]);
    expect(run.pending.pendingFacts).toContain(makeInstallmentSaleFactKey("pasture"));
  });
});

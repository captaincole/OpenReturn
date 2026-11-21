/*
 * FTB 3805P Part I lines 2–4 on a whole return: the alex filer (single, born
 * 2002, Form 540 files) with an early 401(k) distribution, box 2a $8,000, code 1.
 * Sources: ca-3805p-inst-2025::sec::line-2-early-distributions-not-subject-to-additional-tax::b01–b06.
 */

import { describe, expect, it } from "vitest";
import {
  makeEarlyDistributionExceptionKey,
  makeRetirementDistributionFactKey,
} from "../../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { alexScenario as base } from "../../../../scenarios/alex/index.js";

const template = base.facts[0];
const fact = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...template,
  id: `f-${key}`,
  category,
  key,
  value,
});
const plan = (id: string, box2a: number) =>
  fact("retirement", makeRetirementDistributionFactKey("plan", id), {
    payerName: "Plan",
    box1: box2a,
    box2a,
    box7: "1",
    box7IraSepSimple: false,
  });
const exception = (id: string, number: string, amount: number) =>
  fact("retirement", makeEarlyDistributionExceptionKey("plan", id), { number, amount });

function evaluate(extra: TaxFactRow[], facts: TaxFactRow[] = base.facts) {
  const result = evaluateScenario({
    filing: { id: "form-3805p-test", taxYear: base.taxYear },
    facts: [...facts, ...extra],
    decisions: base.decisions,
    authEmail: null,
  });
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  return {
    federal: [
      value("form-5329", "0.line.2_early_distributions_not_subject"),
      value("form-5329", "0.line.3_amount_subject_to_tax"),
      value("form-5329", "0.line.4_additional_tax_early_distributions"),
    ],
    part1: [
      value("form-3805p", "0.part1.line_1_early_distributions_in_income"),
      value("form-3805p", "0.part1.line_2_distributions_not_subject_to_tax"),
      value("form-3805p", "0.part1.line_2_exception_number"),
      value("form-3805p", "0.part1.line_3_amount_subject_to_additional_tax"),
      value("form-3805p", "0.part1.line_4_early_distribution_tax_due"),
    ],
    line2: field("form-3805p", "0.part1.line_2_distributions_not_subject_to_tax"),
    line63: value("form-540", "line.63_other_taxes_credit_recapture"),
  };
}

describe("FTB 3805P line 2 on a return", () => {
  it("no exception: line 2 blank, the 2½% on all of line 1 (unchanged)", () => {
    const result = evaluate([plan("k1", 8000)]);
    expect(result.part1).toEqual([8000, undefined, undefined, 8000, 200]);
    // Blank because nothing applies, no longer an engine gap.
    expect(result.line2).not.toMatchObject({ unsupported: true });
    expect(result.line63).toBe(200);
  });

  // 5,100 × 0.025 = 127.50 → 128, nearest dollar.
  it("exception 05 for $2,900: line 2 takes it, as federal Form 5329 does", () => {
    const result = evaluate([plan("k1", 8000), exception("k1", "05", 2900)]);
    expect(result.federal).toEqual([2900, 5100, 510]);
    expect(result.part1).toEqual([8000, 2900, "05", 5100, 128]);
    expect(result.line63).toBe(128);
  });

  // ::b04: "18: Not applicable." The federal exclusion stands; California taxes the whole row.
  it("an exception California does not allow (18) excludes nothing on FTB 3805P", () => {
    const result = evaluate([plan("k1", 8000), exception("k1", "18", 2900)]);
    expect(result.federal).toEqual([2900, 5100, 510]);
    expect(result.part1).toEqual([8000, undefined, undefined, 8000, 200]);
  });

  it("two exceptions: 99, and each is capped at its row's amount in income", () => {
    const result = evaluate([
      plan("k1", 8000),
      plan("k2", 1000),
      exception("k1", "05", 2900),
      exception("k2", "03", 1500),
    ]);
    expect(result.part1).toEqual([9000, 3900, "99", 5100, 128]);
  });

  it("one allowed and one California does not allow: the allowed number alone", () => {
    const result = evaluate([
      plan("k1", 8000),
      plan("k2", 1000),
      exception("k1", "05", 2900),
      exception("k2", "13", 1000),
    ]);
    expect(result.part1).toEqual([9000, 2900, "05", 6100, 153]);
  });

  // FTB exception 12 (::b03): a code 1 row received at 59½ or older.
  it("59½ or older all year: exception 12 covers the whole row", () => {
    const older = base.facts.map((each) =>
      each.key === "identity.dob" ? { ...each, value: "01/01/1960" } : each,
    );
    const result = evaluate([plan("k1", 8000)], older);
    expect(result.part1).toEqual([8000, 8000, "12", 0, 0]);
  });
});

/*
 * Schedule D-1 on a whole return: who files, the lines it sends on (Schedule CA
 * lines 3, 4 and 7a, Schedule D (540) line 1), the gaps, and "no facts, nothing
 * changes". The synthetic tylin scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  SECTION_1231_KEYS,
  makeBusinessPropertySaleFactKey,
  type BusinessPropertySaleFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { tylinScenario as base } from "../../../../scenarios/synthetic/tylin/index.js";

const CALIFORNIA_FIELDS = [
  "californiaCostOrOtherBasis",
  "californiaDepreciationAllowed",
  "californiaAdditionalDepreciationAfter1976",
  "californiaAdditionalDepreciation1971To1976",
  "californiaSection1254Costs",
  "californiaPriorDeductions",
  "californiaRecomputedDepreciation",
];

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

/* The facts with every California amount taken out: California equals federal. */
const withoutCaliforniaAmounts = (facts: TaxFactRow[]) =>
  facts
    .filter((fact) => fact.key !== SECTION_1231_KEYS.californiaNonrecapturedLosses)
    .map((fact) => {
      if (!isForm4797Fact(fact) || typeof fact.value !== "object") return fact;
      const value = { ...(fact.value as Record<string, unknown>) };
      for (const field of CALIFORNIA_FIELDS) delete value[field];
      return { ...fact, value };
    });

function evaluate(facts: TaxFactRow[], extraDecisions: AIDecisionRow[] = []) {
  const overridden = new Set(extraDecisions.map((each) => each.decisionKey));
  const result = evaluateScenario({
    filing: { id: "schedule-d-1-test", taxYear: base.taxYear },
    facts,
    decisions: [
      ...base.decisions.filter((each) => !overridden.has(each.decisionKey)),
      ...extraDecisions,
    ],
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

const LINE_4_B = "0.line.b4_subtractions";
const LINE_4_C = "0.line.b4_additions";

describe("Schedule D-1 on the tylin return", () => {
  const run = evaluate(base.facts);

  it("files, and line 21a goes to Schedule CA line 4 column B", () => {
    expect(run.files("schedule-d-1")).toBe(true);
    expect(run.value("schedule-d-1", "1.line.19_federal_ordinary_gain_loss")).toBe(88000);
    expect(run.value("schedule-d-1", "1.line.21a_federal_exceeds_california_difference")).toBe(
      60800,
    );
    expect(run.value("schedule-ca", "0.line.b4_federal")).toBe(88000);
    expect(run.value("schedule-ca", LINE_4_B)).toBe(60800);
    expect(run.value("schedule-ca", LINE_4_C)).toBeUndefined();
  });

  it("line 9 goes to Schedule D (540) line 1, which files because the gain differs", () => {
    expect(run.files("schedule-d-ca")).toBe(true);
    expect(run.value("schedule-d-ca", "0.line.1a.gain")).toBe(25500);
    expect(run.value("schedule-d-ca", "3.line.10")).toBe(22000);
    expect(run.value("schedule-d-ca", "3.line.12b")).toBe(3500);
    expect(run.value("schedule-ca", "0.line.7a_additions")).toBe(3500);
  });

  it("line 38 against federal line 35 goes to Schedule CA line 3 column B", () => {
    expect(run.value("schedule-d-1", "1.line.38_recapture_amount_col_a")).toBe(15000);
    expect(run.value("form-4797", "1.line.35_recapture_amount_col_a")).toBe(24000);
    expect(run.value("schedule-ca", "0.line.b3_subtractions")).toBe(9000);
  });

  it("an explicit decision false still wins", () => {
    const off = evaluate(base.facts, [decision("decisions.scope.must_file_schedule_d_1", false)]);
    expect(off.files("schedule-d-1")).toBe(false);
    expect(off.value("schedule-ca", LINE_4_B)).toBeUndefined();
    expect(off.value("schedule-ca", "0.line.b3_subtractions")).toBeUndefined();
  });

  it("does not file without Form 540", () => {
    const federalOnly = evaluate(base.facts, [decision("decisions.scope.must_file_ca_540", false)]);
    expect(federalOnly.files("schedule-d-1")).toBe(false);
  });
});

describe("Schedule D-1 when California equals federal", () => {
  const same = evaluate(withoutCaliforniaAmounts(base.facts));

  it("does not file; Schedule CA line 4 copies Schedule 1 line 4 with no adjustment", () => {
    expect(same.files("schedule-d-1")).toBe(false);
    expect(same.value("schedule-ca", "0.line.b4_federal")).toBe(88000);
    expect(same.field("schedule-ca", LINE_4_B)?.ok).toBe(false);
    expect(same.value("schedule-ca", LINE_4_B)).toBeUndefined();
    expect(same.value("schedule-ca", "0.line.b3_subtractions")).toBeUndefined();
  });

  it("Schedule D (540) does not file for the section 1231 gain alone", () => {
    expect(same.files("schedule-d-ca")).toBe(false);
  });

  it("a California amount equal to the federal one files nothing", () => {
    const equal = withoutCaliforniaAmounts(base.facts).map((fact) =>
      fact.key === makeBusinessPropertySaleFactKey("yard-land")
        ? { ...fact, value: { ...(fact.value as object), californiaCostOrOtherBasis: 45000 } }
        : fact,
    );
    expect(evaluate(equal).files("schedule-d-1")).toBe(false);
  });
});

describe("Schedule D-1 with no Form 4797 facts", () => {
  const without = evaluate(base.facts.filter((fact) => !isForm4797Fact(fact)));

  it("does not file, and Schedule CA line 4 keeps its reasons", () => {
    expect(without.files("schedule-d-1")).toBe(false);
    expect(without.files("form-4797")).toBe(false);
    for (const id of ["0.line.b4_federal", LINE_4_B, LINE_4_C]) {
      expect(without.field("schedule-ca", id)).toMatchObject({ ok: false, unsupported: true });
    }
    expect(without.files("schedule-d-ca")).toBe(false);
  });
});

describe("Schedule D-1 answers and gaps", () => {
  it("waits for the line 8 answer and asks for it", () => {
    const facts = base.facts.filter(
      (fact) =>
        fact.key !== SECTION_1231_KEYS.nonrecapturedLosses &&
        fact.key !== SECTION_1231_KEYS.californiaNonrecapturedLosses,
    );
    const run = evaluate(facts);
    expect(run.files("schedule-d-1")).toBe(true);
    expect(run.pending.pendingFacts).toContain(SECTION_1231_KEYS.nonrecapturedLosses);
    expect(run.value("schedule-d-1", "0.line.9_line_7_minus_line_8")).toBeUndefined();
    expect(
      run.value("schedule-d-1", "1.line.21a_federal_exceeds_california_difference"),
    ).toBeUndefined();
  });

  it("the California line 8 answer replaces the federal one", () => {
    const facts = base.facts.filter(
      (fact) => fact.key !== SECTION_1231_KEYS.californiaNonrecapturedLosses,
    );
    expect(
      evaluate(facts).value("schedule-d-1", "0.line.8_nonrecaptured_section_1231_losses"),
    ).toBe(3000);
  });

  it("old section 1250 property with no California periods is a gap on every line it reaches", () => {
    const old: BusinessPropertySaleFactValue = {
      description: "Old barn",
      kind: "section_1250",
      dateAcquired: "1974-04-01",
      dateSold: "2025-04-01",
      grossSalesPrice: 50000,
      costOrOtherBasis: 30000,
      depreciationAllowed: 30000,
      additionalDepreciationAfter1975: 2000,
      californiaDepreciationAllowed: 29000,
      businessId: "marrowgate-landscape",
    };
    const template = base.facts.find((fact) => isForm4797Fact(fact))!;
    const facts = [
      ...base.facts,
      {
        ...template,
        id: "f-old-barn",
        key: makeBusinessPropertySaleFactKey("old-barn"),
        value: old,
      },
    ];
    const run = evaluate(facts);
    expect(run.files("schedule-d-1")).toBe(true);
    expect(run.field("schedule-d-1", "0.line.7_net_section_1231_gain_loss")).toMatchObject({
      unsupported: true,
    });
    expect(run.field("schedule-ca", LINE_4_B)).toMatchObject({ unsupported: true });
    expect(run.field("schedule-d-ca", "3.line.12b")).toMatchObject({ unsupported: true });
  });

  it("FTB 3805E filing makes lines 7 to 21 a gap", () => {
    const run = evaluate(base.facts, [decision("decisions.scope.must_file_3805e", true)]);
    expect(
      run.field("schedule-d-1", "1.line.21a_federal_exceeds_california_difference"),
    ).toMatchObject({
      unsupported: true,
    });
    expect(run.value("schedule-d-1", "1.line.23_gross_sales_price_col_a")).toBe(48000);
  });
});

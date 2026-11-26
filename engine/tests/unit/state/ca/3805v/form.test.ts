/*
 * FTB 3805V on a whole return: who files, the Schedule CA (540) lines 9b1 and
 * 9b2 that take its deductions, a current year NOL, the suspension, the gaps,
 * and returns with none of its facts. The made-up taxpayer masema is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CA_NOL_KEYS,
  makeBusinessFactKey,
  type BusinessFactValue,
  type CaNolCarryoverRow,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { OLD_LOSS_GAP } from "../../../../../src/state/ca/3805v/partIII.js";
import { FORM_540NR_GAP } from "../../../../../src/state/ca/3805v/resolveInfo.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { decisionsWithPreparerStyle } from "../../../../helpers/preparer.js";
import { masemaScenario as masema } from "../../../../scenarios/synthetic/masema/index.js";
import { ottilieScenario as ottilie } from "../../../../scenarios/synthetic/ottilie/index.js";
import { rosalindScenario as rosalind } from "../../../../scenarios/synthetic/rosalind/index.js";
import type { Scenario } from "../../../../types.js";

function evaluate(base: Scenario, facts: TaxFactRow[] = base.facts, extra: AIDecisionRow[] = []) {
  const extraKeys = new Set(extra.map((row) => row.decisionKey));
  const decisions = decisionsWithPreparerStyle(base).filter(
    (row) => !extraKeys.has(row.decisionKey),
  );
  const result = evaluateScenario({
    filing: { id: "form-3805v-test", taxYear: base.taxYear },
    facts,
    decisions: [...decisions, ...extra],
  });
  const field = (fieldId: string) =>
    result.forms.get(fieldId.split(".")[0])?.fields.find((entry) => entry.fieldId === fieldId)
      ?.result as
      { ok: boolean; value?: unknown; unsupported?: boolean; reason?: string } | undefined;
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  return {
    value: (fieldId: string) => (field(fieldId)?.ok ? field(fieldId)?.value : undefined),
    reason: (fieldId: string) => field(fieldId)?.reason,
    files,
  };
}

const B9B1 = "schedule-ca.2.line.b9b1_subtractions";
const B9B2 = "schedule-ca.2.line.b9b2_subtractions";
const LINE_17 = "form-540.line.17_ca_agi";
const PART_I = (line: string) => `form-3805v.0.part1.${line}`;
const PART_III = (line: string) => `form-3805v.2.part3.${line}`;

const withRows = (rows: CaNolCarryoverRow[]) =>
  masema.facts.map((fact) =>
    fact.key === CA_NOL_KEYS.priorYearCarryovers ? { ...fact, value: rows } : fact,
  );

const business = (value: Partial<BusinessFactValue>): TaxFactRow => ({
  id: "f-business",
  userId: masema.userId,
  taxYear: masema.taxYear,
  category: "self_employment",
  key: makeBusinessFactKey("charter"),
  value: {
    activity: "Fishing charters",
    code: "487210",
    accountingMethod: "cash",
    materiallyParticipated: true,
    startedThisYear: false,
    paymentsRequire1099: false,
    sellsGoods: false,
    specifiedService: false,
    w2WagesPaid: 0,
    qualifiedPropertyUbia: 0,
    allInvestmentAtRisk: true,
    grossReceipts: 0,
    ...value,
  },
  sourceNote: "test",
  createdAt: "2026-11-25T00:00:00Z",
});

const ROWS: CaNolCarryoverRow[] = [
  { yearOfLoss: 2020, type: "GEN", initialLoss: 95000, carryoverFrom2024: 68000 },
  { yearOfLoss: 2018, code: "107", type: "DIS", initialLoss: 40000, carryoverFrom2024: 22000 },
];

describe("the carryovers on Schedule CA", () => {
  it("masema: the disaster loss on line 9b1, the general NOL up to the MTI on line 9b2", () => {
    const result = evaluate(masema);
    expect(result.files("form-3805v")).toBe(true);
    expect(result.value(B9B1)).toBe(22000);
    expect(result.value(B9B2)).toBe(56594);
    expect(result.value(LINE_17)).toBe(2706);
    // Part II line 6 and Part III line 1: the MTI the deductions used.
    expect(result.value("form-3805v.2.part2.6_modified_taxable_income")).toBe(78594);
  });

  it("without the carryover fact the form does not file and California AGI is federal AGI", () => {
    const facts = masema.facts.filter((fact) => fact.key !== CA_NOL_KEYS.priorYearCarryovers);
    const result = evaluate(masema, facts);
    expect(result.files("form-3805v")).toBe(false);
    expect(result.value(B9B1)).toBeUndefined();
    expect(result.value(LINE_17)).toBe(81300);
  });

  it("an empty list is an answer: no carryover, no form", () => {
    expect(evaluate(masema, withRows([])).files("form-3805v")).toBe(false);
  });

  it("a small carryover is used in full and nothing carries to 2026", () => {
    const result = evaluate(masema, withRows([{ ...ROWS[0], carryoverFrom2024: 5000 }]));
    expect(result.value(B9B2)).toBe(5000);
    expect(result.value(PART_III("5_nol_carryover"))).toBe(0);
    expect(result.value(LINE_17)).toBe(76300);
  });

  it("an old general NOL is the gap on line 9b2", () => {
    const result = evaluate(masema, withRows([{ ...ROWS[0], yearOfLoss: 2005 }]));
    expect(result.reason(B9B2)).toBe(OLD_LOSS_GAP);
  });

  it("a fifth row: Part III prints four and the fourth is the gap", () => {
    const rows = [2009, 2012, 2014, 2016, 2019].map((year) => ({
      ...ROWS[0],
      yearOfLoss: year,
      carryoverFrom2024: 1000,
    }));
    const result = evaluate(masema, withRows(rows));
    expect(result.value(PART_III("2_row3_col_a"))).toBe("2014");
    expect(result.reason(PART_III("2_row4_col_a"))).toMatch(/four rows/);
    expect(result.value(B9B2)).toBe(5000);
  });
});

describe("a current year NOL", () => {
  // A charter business with 120,000 of supplies and no receipts: wages less the loss leave -38,000.
  const facts = [...masema.facts, business({ expenses: { supplies: 120000 } })];

  it("Part I line 25 is the NOL; Part III line 4 records it as a general NOL", () => {
    const result = evaluate(masema, facts);
    expect(result.value(PART_I("3a_agi_less_deductions"))).toBe(-44406);
    expect(result.value(PART_I("23_prior_year_nol_carryovers"))).toBe(0);
    expect(result.value(PART_I("25_current_year_nol"))).toBe(-38000);
    expect(result.value(PART_III("4_row1_col_c"))).toBe("GEN");
    expect(result.value(PART_III("4_row1_col_d"))).toBe(38000);
    expect(result.value(PART_III("4_row1_col_h"))).toBe(38000);
    // No MTI: the carryovers are not used and go forward with the new NOL.
    expect(result.value(B9B1)).toBeUndefined();
    expect(result.value(PART_III("5_nol_carryover"))).toBe(68000 + 38000);
    expect(result.value(PART_III("6_disaster_loss_carryover"))).toBe(22000);
  });

  it("with no carryover the business loss alone files the form", () => {
    const without = facts.filter((fact) => fact.key !== CA_NOL_KEYS.priorYearCarryovers);
    const result = evaluate(masema, without);
    expect(result.files("form-3805v")).toBe(true);
    expect(result.value(PART_III("5_nol_carryover"))).toBe(38000);
    expect(result.value("form-3805v.2.part2.6_modified_taxable_income")).toBeUndefined();
  });

  it("a small business loss with income: the form comes off the return", () => {
    const small = [
      ...masema.facts.filter((fact) => fact.key !== CA_NOL_KEYS.priorYearCarryovers),
      business({ grossReceipts: 1000, expenses: { supplies: 3000 } }),
    ];
    expect(evaluate(masema, small).files("form-3805v")).toBe(false);
  });
});

describe("the suspension", () => {
  it("business income and AGI of $1,000,000 or more: the disaster loss is used, the general NOL is not", () => {
    const facts = [
      ...masema.facts,
      business({ grossReceipts: 1_200_000, expenses: { supplies: 50000 } }),
    ];
    const result = evaluate(masema, facts);
    expect(result.value(B9B1)).toBe(22000);
    expect(result.value(B9B2)).toBeUndefined();
    expect(result.value(PART_III("2_row2_col_f"))).toBe(0);
    expect(result.value(PART_III("2_row2_col_h"))).toBe(68000);
  });
});

describe("Form 540NR", () => {
  it("the form is the gap", () => {
    const decision = (key: string, value: unknown) =>
      decisionRow({
        userId: masema.userId,
        taxYear: masema.taxYear,
        key,
        decision: value,
        rationale: "test",
      });
    const result = evaluate(masema, masema.facts, [
      decision("decisions.scope.must_file_540nr", true),
    ]);
    expect(result.reason(PART_III("5_nol_carryover"))).toBe(FORM_540NR_GAP);
    expect(result.reason("form-3805v.1.part1_section_b.1_adjusted_gross_income_col_a")).toBe(
      FORM_540NR_GAP,
    );
  });
});

describe("returns with none of its facts", () => {
  it.each([
    ["rosalind", rosalind],
    ["ottilie", ottilie],
  ])("%s: no form, lines 9b1 and 9b2 blank", (_, base) => {
    const result = evaluate(base);
    expect(result.files("form-3805v")).toBe(false);
    expect(result.value(B9B1)).toBeUndefined();
    expect(result.value(B9B2)).toBeUndefined();
  });
});

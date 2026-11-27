/*
 * Schedule J on a whole return: who files, what waits, the base-year sources,
 * the gaps, Form 1040 line 16 and Form 6251 line 10. The synthetic adine
 * scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  FARM_INCOME_AVERAGING_KEY,
  makeBusinessPropertySaleFactKey,
  makeFarmAveragingBaseYearFactKey,
  type BusinessPropertySaleFactValue,
  type FarmAveragingBaseYearFactValue,
  type FarmIncomeAveragingFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { adineScenario as base } from "../../../scenarios/synthetic/adine/index.js";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const YEAR_2024 = makeFarmAveragingBaseYearFactKey(2024);
const YEAR_2023 = makeFarmAveragingBaseYearFactKey(2023);

/* The base facts with each fact for a key replaced (undefined drops it). */
function factsWith(changes: Record<string, unknown>): TaxFactRow[] {
  return base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
}

const valueOf = (key: string) => base.facts.find((fact) => fact.key === key)!.value;

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "schedule-j-test", taxYear: base.taxYear },
    facts,
    decisions,
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
  const isGap = (formId: string, id: string) => {
    const found = field(formId, id);
    return found !== undefined && !found.ok && found.unsupported === true;
  };
  const line = (id: string) => value("schedule-j", id);
  return { files, value, line, isGap, pending: pendingInputs(result).pendingFacts };
}

/* Regular tax on $133,839 with $24,000 of net capital gain, single: 19,208 + 3,600. */
const REGULAR_TAX = 22808;

describe("Schedule J who files", () => {
  it("files for the election, and Form 1040 line 16 takes line 23", () => {
    const run = evaluate(base.facts);
    expect(run.files("schedule-j")).toBe(true);
    expect(run.line("1.line.23_tax")).toBe(21043);
    expect(run.value("form-1040", "line.16")).toBe(21043);
    expect(run.pending).toEqual([]);
  });

  it("no election: no Schedule J, and line 16 is the regular tax", () => {
    const run = evaluate(factsWith({ [FARM_INCOME_AVERAGING_KEY]: undefined }));
    expect(run.files("schedule-j")).toBe(false);
    expect(run.value("form-1040", "line.16")).toBe(REGULAR_TAX);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_schedule_j", false),
    ]);
    expect(run.files("schedule-j")).toBe(false);
    expect(run.value("form-1040", "line.16")).toBe(REGULAR_TAX);
  });

  it("a decision with no election asks for the election; line 16 waits", () => {
    const run = evaluate(factsWith({ [FARM_INCOME_AVERAGING_KEY]: undefined }), [
      ...base.decisions,
      decision("decisions.scope.must_file_schedule_j", true),
    ]);
    expect(run.files("schedule-j")).toBe(true);
    expect(run.pending).toContain(FARM_INCOME_AVERAGING_KEY);
    expect(run.value("form-1040", "line.16")).toBeUndefined();
  });

  it("asks for a missing base year, and for a base year below zero with no worksheet", () => {
    const missing = evaluate(factsWith({ [YEAR_2024]: undefined }));
    expect(missing.pending).toContain(YEAR_2024);
    expect(missing.line("0.line.13_base_year_income_2024")).toBeUndefined();
    const belowZero = evaluate(
      factsWith({
        [YEAR_2023]: { filingStatus: "single", taxableIncome: 0, sectionOneTax: 0 },
      }),
    );
    expect(belowZero.pending).toContain(YEAR_2023);
  });
});

describe("Schedule J lines on the adine return", () => {
  it("lines 1 to 4: the elected farm income with its capital gain, the 2025 tax on the rest", () => {
    const run = evaluate(base.facts);
    expect(run.line("0.line.1_taxable_income_2025")).toBe(133839);
    expect(run.line("0.line.2a_elected_farm_income")).toBe(100000);
    expect(run.line("0.line.2b_net_capital_gain_included")).toBe(24000);
    expect(run.line("0.line.2c_unrecaptured_1250_gain")).toBeUndefined();
    expect(run.line("0.line.3_income_less_elected_farm")).toBe(33839);
    // The tax table on 33,839 with no capital gain left: 1,192.50 + 12% × 21,900 = 3,820.50.
    expect(run.line("0.line.4_tax_on_line3_2025")).toBe(3821);
  });

  it("line 2a is capped at line 1, and line 2b at the return's net capital gain", () => {
    const election = valueOf(FARM_INCOME_AVERAGING_KEY) as FarmIncomeAveragingFactValue;
    const run = evaluate(
      factsWith({
        [FARM_INCOME_AVERAGING_KEY]: {
          ...election,
          electedFarmIncome: 900000,
          netCapitalGain: 90000,
        },
      }),
    );
    expect(run.line("0.line.2a_elected_farm_income")).toBe(133839);
    expect(run.line("0.line.2b_net_capital_gain_included")).toBe(24000);
    expect(run.line("0.line.3_income_less_elected_farm")).toBe(0);
    expect(run.line("0.line.4_tax_on_line3_2025")).toBe(0);
  });

  it("a farm unrecaptured section 1250 gain: line 2c, and the base-year taxes are gaps", () => {
    const election = valueOf(FARM_INCOME_AVERAGING_KEY) as FarmIncomeAveragingFactValue;
    const run = evaluate(
      factsWith({
        [FARM_INCOME_AVERAGING_KEY]: { ...election, unrecapturedSection1250Gain: 6000 },
      }),
    );
    expect(run.line("0.line.2c_unrecaptured_1250_gain")).toBe(6000);
    expect(run.isGap("schedule-j", "0.line.8_tax_on_line7_2022")).toBe(true);
    expect(run.isGap("schedule-j", "1.line.23_tax")).toBe(true);
    expect(run.isGap("form-1040", "line.16")).toBe(true);
  });

  /*
   * A machine shed bought in 2015 for $40,000 with $9,000 of straight-line
   * depreciation, sold for $40,000: a $9,000 gain, all unrecaptured section
   * 1250 gain (Schedule D line 19). Form 1040 line 15 rises by $9,000 to
   * 142,839; Schedule D lines 15 and 16 to $33,000.
   */
  function withShed(netCapitalGain: number) {
    const election = valueOf(FARM_INCOME_AVERAGING_KEY) as FarmIncomeAveragingFactValue;
    const sale = base.facts.find(
      (fact) => fact.key === makeBusinessPropertySaleFactKey("breeding-cows"),
    )!;
    const shed: BusinessPropertySaleFactValue = {
      description: "Machine shed",
      kind: "section_1250",
      dateAcquired: "2015-05-01",
      dateSold: "2025-09-02",
      grossSalesPrice: 40000,
      costOrOtherBasis: 40000,
      depreciationAllowed: 9000,
    };
    const shedRow = {
      ...sale,
      id: "f-shed",
      key: makeBusinessPropertySaleFactKey("shed"),
      value: shed,
    };
    const changed = { ...election, netCapitalGain, unrecapturedSection1250Gain: 9000 };
    return evaluate([...factsWith({ [FARM_INCOME_AVERAGING_KEY]: changed }), shedRow]);
  }

  it("line 2c with all the gain elected: line 4 is the Tax Table on line 3", () => {
    const run = withShed(33000);
    expect(run.value("schedule-d", "1.line.19_unrecaptured_sec1250_gain")).toBe(9000);
    expect(run.line("0.line.1_taxable_income_2025")).toBe(142839);
    expect(run.line("0.line.2b_net_capital_gain_included")).toBe(33000);
    expect(run.line("0.line.2c_unrecaptured_1250_gain")).toBe(9000);
    expect(run.line("0.line.3_income_less_elected_farm")).toBe(42839);
    // No gain left in 2025: the Tax Table row 42,800–42,850, 1,192.50 + 12% × (42,825 − 11,925).
    expect(run.line("0.line.4_tax_on_line3_2025")).toBe(4901);
  });

  it("line 2c comes off Schedule D line 19 for line 4: the gain left keeps the 0% rate", () => {
    const run = withShed(24000);
    expect(run.line("0.line.2b_net_capital_gain_included")).toBe(24000);
    expect(run.line("0.line.2c_unrecaptured_1250_gain")).toBe(9000);
    expect(run.line("0.line.3_income_less_elected_farm")).toBe(42839);
    /*
     * $9,000 of gain left, none of it section 1250 gain: QDCG, ordinary 33,839 → 3,821
     * (Tax Table), and 9,000 at 0% (below $48,350). With line 19 left at $9,000 the
     * Schedule D Tax Worksheet would tax that gain at 25%, limited to the Tax Table on
     * 42,839: 4,901.
     */
    expect(run.line("0.line.4_tax_on_line3_2025")).toBe(3821);
    expect(run.isGap("schedule-j", "0.line.8_tax_on_line7_2022")).toBe(true);
  });

  it("base years from the 2024 Schedule J: its lines 11, 15 and 3, and 12, 16 and 4", () => {
    const own = valueOf(YEAR_2024) as FarmAveragingBaseYearFactValue;
    const scheduleJ = {
      line3: 40000,
      line4: 4573,
      line11: 30000,
      line12: 3363,
      line15: 45000,
      line16: 5170,
    };
    const run = evaluate(factsWith({ [YEAR_2024]: { ...own, scheduleJ } }));
    expect(run.line("0.line.5_base_year_income_2022")).toBe(30000);
    expect(run.line("0.line.9_base_year_income_2023")).toBe(45000);
    expect(run.line("0.line.13_base_year_income_2024")).toBe(40000);
    expect(run.line("1.line.19_base_year_2022_tax")).toBe(3363);
    expect(run.line("1.line.20_base_year_2023_tax")).toBe(5170);
    expect(run.line("1.line.21_base_year_2024_tax")).toBe(4573);
    expect(run.line("1.line.22_add_lines_19_through_21")).toBe(3363 + 5170 + 4573);
  });

  it("totals equal their parts, and line 23 is line 18 less line 22", () => {
    const run = evaluate(base.facts);
    const parts = [
      "0.line.4_tax_on_line3_2025",
      "0.line.8_tax_on_line7_2022",
      "0.line.12_tax_on_line11_2023",
      "0.line.16_tax_on_line15_2024",
    ].map((id) => run.line(id) as number);
    const total = parts.reduce((running, part) => running + part, 0);
    expect(run.line("0.line.17_total_base_year_tax")).toBe(total);
    expect(run.line("1.line.18_amount_from_line_17")).toBe(total);
    const earlier = run.line("1.line.22_add_lines_19_through_21") as number;
    expect(run.line("1.line.23_tax")).toBe(total - earlier);
  });
});

describe("Form 6251 line 10 refigures line 16 without Schedule J", () => {
  it("line 10 is the tax without Schedule J, not line 16", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_6251", true),
    ]);
    expect(run.value("form-1040", "line.16")).toBe(21043);
    expect(run.value("form-6251", "0.line.10_regular_tax_less_credits")).toBe(REGULAR_TAX);
  });

  it("with no Schedule J, line 10 is line 16 as before", () => {
    const run = evaluate(factsWith({ [FARM_INCOME_AVERAGING_KEY]: undefined }), [
      ...base.decisions,
      decision("decisions.scope.must_file_6251", true),
    ]);
    expect(run.value("form-6251", "0.line.10_regular_tax_less_credits")).toBe(REGULAR_TAX);
  });
});

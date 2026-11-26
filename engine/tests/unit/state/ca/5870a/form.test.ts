/*
 * FTB 5870A on a whole return: who files, what waits, the cases the engine
 * does not print, and the lines it reaches (Form 540 lines 34 and 62,
 * Schedule CA line 8z column C). The synthetic bode (Part II) and cenn
 * (Part I) scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeCaEarlierYearReturnFactKey,
  makeTrustAccumulationDistributionFactKey,
  type CaEarlierYearReturnFactValue,
  type CaliforniaTrustDistribution,
  type TrustAccumulationDistributionFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { bodeScenario as bode } from "../../../../scenarios/synthetic/bode/index.js";
import { cennScenario as cenn } from "../../../../scenarios/synthetic/cenn/index.js";
import type { Scenario } from "../../../../types.js";

const isTrust = (fact: TaxFactRow) => fact.key.startsWith("trust_accumulation_distribution.");
const isCaYear = (fact: TaxFactRow) => fact.key.startsWith("ca_earlier_year_return.");

const LINE_34 = "line.34_tax_amount";
const LINE_34_BOX = "line.34_tax_from_ftb_5870a";
const LINE_35 = "line.35_total_tax_after_credits";
const LINE_62 = "line.62_behavioral_health_services_tax";
const LINE_8Z_C = "1.line.b8z_additions";

function evaluate(
  scenario: Scenario,
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = scenario.decisions,
) {
  const result = evaluateScenario({
    filing: { id: "form-5870a-test", taxYear: scenario.taxYear },
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
  return { files, value, isGap, pending: pendingInputs(result).pendingFacts };
}

const decision = (scenario: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: scenario.userId,
    taxYear: scenario.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

/* The scenario's facts with its trust's California answers changed. */
function withCalifornia(scenario: Scenario, change: Partial<CaliforniaTrustDistribution>) {
  return scenario.facts.map((fact) => {
    if (!isTrust(fact)) return fact;
    const value = fact.value as TrustAccumulationDistributionFactValue;
    return { ...fact, value: { ...value, california: { ...value.california!, ...change } } };
  });
}

function withYear(scenario: Scenario, year: number, change: Partial<CaEarlierYearReturnFactValue>) {
  const key = makeCaEarlierYearReturnFactKey(year);
  return scenario.facts.map((fact) =>
    fact.key === key ? { ...fact, value: { ...(fact.value as object), ...change } } : fact,
  );
}

describe("Part II on Form 540 and Schedule CA (bode)", () => {
  const run = evaluate(bode, bode.facts);

  it("files and carries line 14 to line 34, Part III to line 62, line 2 to line 8z", () => {
    expect(run.files("form-5870a")).toBe(true);
    expect([run.value("form-540", LINE_34), run.value("form-540", LINE_34_BOX)]).toEqual([
      23078,
      true,
    ]);
    // This year's tax, 1% of $194,294, plus Part III line 6.
    expect(run.value("form-540", LINE_62)).toBe(1943 + 850);
    expect(run.value("schedule-ca", LINE_8Z_C)).toBe(50000);
    expect(run.value("schedule-ca", "2.line.b9a_additions")).toBe(50000);
    expect(run.pending).toEqual([]);
  });

  it("Section B for fewer than five years: line 4 goes on line 8z", () => {
    const section = evaluate(bode, withCalifornia(bode, { accumulationYears: 2 }));
    expect(section.value("form-5870a", "1.part2b.3_averaging_factor_total")).toBe(3);
    expect(section.value("form-5870a", "1.part2b.4_line_1_divided_by_line_3")).toBe(100000);
    expect(section.value("schedule-ca", LINE_8Z_C)).toBe(100000);
    expect(
      section.value("form-5870a", "1.part2a.1_income_accumulated_five_or_more"),
    ).toBeUndefined();
    // Two columns, 2024 and 2023: 2024 1,085,000 → 115,000 at 12.3% less 102,550; 2023 likewise.
    expect(section.value("form-5870a", "1.part2b.15_additional_tax_with_amt_col_a")).toBe(12300);
    expect(
      section.value("form-5870a", "1.part2b.6_taxable_income_before_distribution_col_c"),
    ).toBeUndefined();
    expect(section.value("form-5870a", "2.part3_section_b.6_total_bhst")).toBe(850 + 1000);
  });

  it("no recomputed income over $1,000,000: Part III is blank and line 62 is this year's only", () => {
    const small = evaluate(bode, withCalifornia(bode, { accumulationDistribution: 60000 }));
    const lowered = withYear(bode, 2023, { taxableIncome: 900000, taxBeforeCredits: 100000 });
    const both = evaluate(
      bode,
      lowered.map((fact, index) =>
        isTrust(fact) ? withCalifornia(bode, { accumulationDistribution: 60000 })[index] : fact,
      ),
    );
    expect(small.value("form-5870a", "2.part3_section_a.6_total_bhst")).toBe(
      600 * 0 + 1000 * 0 + 100,
    );
    expect(both.value("form-5870a", "2.part3_section_a.6_total_bhst")).toBeUndefined();
    expect(both.value("form-540", LINE_62)).toBe(1543);
  });

  it("waits for a missing year, and for the BHST paid in a year over $1,000,000", () => {
    const missing = evaluate(
      bode,
      bode.facts.filter((fact) => fact.key !== makeCaEarlierYearReturnFactKey(2022)),
    );
    expect(missing.pending).toContain(makeCaEarlierYearReturnFactKey(2022));
    expect([missing.value("form-540", LINE_34), missing.value("form-540", LINE_35)]).toEqual([
      undefined,
      undefined,
    ]);
    const unpaid = evaluate(bode, withYear(bode, 2023, { behavioralHealthTaxPaid: undefined }));
    expect(unpaid.pending).toContain(makeCaEarlierYearReturnFactKey(2023));
    expect(unpaid.value("form-540", LINE_62)).toBeUndefined();
  });

  it("a capital gain distribution or a changed NOL is a gap on lines 34 and 62, not a blank", () => {
    for (const facts of [
      withCalifornia(bode, { capitalGain: true }),
      withYear(bode, 2022, { netOperatingLossChanges: true }),
    ]) {
      const gap = evaluate(bode, facts);
      expect([gap.isGap("form-540", LINE_34), gap.isGap("form-540", LINE_62)]).toEqual([
        true,
        true,
      ]);
      expect(gap.value("form-540", LINE_35)).toBeUndefined();
      expect(gap.value("schedule-ca", LINE_8Z_C)).toBe(50000);
    }
  });
});

describe("Part I on Form 540 (cenn)", () => {
  it("files and carries line 26 to line 34", () => {
    const run = evaluate(cenn, cenn.facts);
    expect([run.value("form-540", LINE_34), run.value("form-540", LINE_34_BOX)]).toEqual([
      2307,
      true,
    ]);
    expect(run.value("schedule-ca", LINE_8Z_C)).toBeUndefined();
    expect(run.pending).toEqual([]);
  });

  it("a kept year as a nonresident is a gap (the Form 540NR route)", () => {
    const run = evaluate(cenn, withYear(cenn, 2022, { residency: "nonresident" }));
    expect(run.isGap("form-5870a", "0.part1.21_combine_lines_19_20_col_b")).toBe(true);
    expect(run.isGap("form-540", LINE_34)).toBe(true);
  });

  const cennRows = (cenn.facts.find(isTrust)!.value as TrustAccumulationDistributionFactValue)
    .california!.throwbackYears!;
  const bornIn = (facts: TaxFactRow[], dob: string) =>
    facts.map((fact) => (fact.key === "identity.dob" ? { ...fact, value: dob } : fact));

  it("a year before age 21 under the multiple trust rule is a gap", () => {
    expect(evaluate(cenn, bornIn(cenn.facts, "01/05/2005")).isGap("form-540", LINE_34)).toBe(true);
  });

  it("every year before age 21: the partial tax is 0 and line 34 stays blank", () => {
    const single = cennRows.map(({ otherTrustsCounted: _, ...rest }) => rest);
    const young = bornIn(withCalifornia(cenn, { throwbackYears: single }), "01/05/2005");
    const run = evaluate(cenn, young);
    expect(run.value("form-5870a", "0.part1.26_partial_tax_accumulation_distribution")).toBe(0);
    expect([run.value("form-540", LINE_34), run.value("form-540", LINE_34_BOX)]).toEqual([
      undefined,
      undefined,
    ]);
    expect(run.value("form-540", LINE_35)).toBe(
      run.value("form-540", "line.33_tax_after_exemption_credits"),
    );
  });

  it("a year in which the beneficiary reached 21 is a gap", () => {
    const split = cenn.facts.map((fact) =>
      fact.key === "identity.dob" ? { ...fact, value: "06/15/1998" } : fact,
    );
    expect(evaluate(cenn, split).isGap("form-540", LINE_34)).toBe(true);
  });

  /* Form 4970 line 2 leaves out only the "UNI of a domestic trust" (irs-4970-form-2025::sec::line-2::b01). */
  const foreign = (facts: TaxFactRow[]) =>
    facts.map((fact) =>
      isTrust(fact)
        ? { ...fact, value: { ...(fact.value as object), trustType: "foreign" } }
        : fact,
    );

  it("a foreign trust keeps the years before age 21 (2015 stays)", () => {
    const run = evaluate(cenn, foreign(cenn.facts));
    const part1 = (id: string) => run.value("form-5870a", `0.part1.${id}`);
    expect(part1("1_current_distribution_earlier_years")).toBe(43000);
    expect(part1("10_average_amount_recomputing_tax")).toBe(10985);
    expect(part1("26_partial_tax_accumulation_distribution")).toBe(2580);
    expect(run.value("form-540", LINE_34)).toBe(2580);
  });

  it("a foreign trust: a year in which the beneficiary reached 21 is no gap", () => {
    const split = bornIn(foreign(cenn.facts), "06/15/1998");
    expect(evaluate(cenn, split).isGap("form-540", LINE_34)).toBe(false);
  });
});

describe("who files", () => {
  const trustOf = (scenario: Scenario) => scenario.facts.find(isTrust)!;

  it("the explicit decision false wins; true with no fact is a gap", () => {
    const off = evaluate(bode, bode.facts, [
      ...bode.decisions,
      decision(bode, "decisions.scope.must_file_5870a", false),
    ]);
    expect(off.files("form-5870a")).toBe(false);
    expect(off.value("form-540", LINE_34)).toBeUndefined();
    const facts = bode.facts.filter((fact) => !isTrust(fact));
    const on = evaluate(bode, facts, [
      ...bode.decisions,
      decision(bode, "decisions.scope.must_file_5870a", true),
    ]);
    expect([on.files("form-5870a"), on.isGap("form-540", LINE_34)]).toEqual([true, true]);
  });

  it("no Form 540: no FTB 5870A", () => {
    const decisions = bode.decisions.map((entry) =>
      entry.decisionKey === "decisions.scope.must_file_ca_540"
        ? { ...entry, decision: false }
        : entry,
    );
    expect(evaluate(bode, bode.facts, decisions).files("form-5870a")).toBe(false);
  });

  it("an untaxed distribution files no FTB 5870A; the whole amount goes on line 8z", () => {
    const run = evaluate(bode, withCalifornia(bode, { beneficiaryInterest: "untaxed" }));
    expect(run.files("form-5870a")).toBe(false);
    expect(run.value("schedule-ca", LINE_8Z_C)).toBe(300000);
    const noAmount = evaluate(
      bode,
      withCalifornia(bode, { beneficiaryInterest: "untaxed", accumulationDistribution: undefined }),
    );
    expect(noAmount.isGap("schedule-ca", LINE_8Z_C)).toBe(true);
  });

  it("more than one trust is a gap", () => {
    const second = {
      ...trustOf(bode),
      id: "f-second",
      key: makeTrustAccumulationDistributionFactKey("second"),
    };
    const run = evaluate(bode, [...bode.facts, second]);
    expect(run.value("form-5870a", "0.header.number_of_trusts")).toBe(2);
    expect([run.isGap("form-540", LINE_34), run.isGap("schedule-ca", LINE_8Z_C)]).toEqual([
      true,
      true,
    ]);
  });
});

describe("no FTB 5870A facts: nothing changes", () => {
  const facts = bode.facts.filter((fact) => !isTrust(fact) && !isCaYear(fact));
  const run = evaluate(bode, facts);
  const full = evaluate(bode, bode.facts);

  it("the form does not file and lines 34, 62 and 8z keep their earlier rules", () => {
    expect(run.files("form-5870a")).toBe(false);
    expect([run.value("form-540", LINE_34), run.value("form-540", LINE_34_BOX)]).toEqual([
      undefined,
      undefined,
    ]);
    // Taxable income 1,144,294: 1% of 144,294.
    expect(run.value("form-540", LINE_62)).toBe(1443);
    expect(run.isGap("schedule-ca", LINE_8Z_C)).toBe(true);
    expect(run.value("form-540", LINE_35)).toBe(
      run.value("form-540", "line.33_tax_after_exemption_credits"),
    );
  });

  it("the federal return is the same with or without the trust", () => {
    expect(run.value("form-1040", "line.24")).toBe(full.value("form-1040", "line.24"));
  });
});

/*
 * Form 8609-A on a whole return: who files, the stops of Part I, the years of
 * the compliance period, the gaps and waits, the credits Form 8586 reads, and
 * a return with no building fact. The synthetic ewin and haral scenarios are
 * the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeLowIncomeHousingBuildingFactKey,
  type LowIncomeHousingBuildingFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { form8609ABuildingCredits } from "../../../../src/federal/8609-a/credits.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { ewinScenario as base } from "../../../scenarios/synthetic/ewin/index.js";
import { haralScenario } from "../../../scenarios/synthetic/haral/index.js";

const isBuilding = (fact: TaxFactRow) => fact.key.startsWith("low_income_housing_building.");
const otherFacts = base.facts.filter((fact) => !isBuilding(fact));
const template = base.facts.find(isBuilding)!;
const LARKSPUR = template.value as LowIncomeHousingBuildingFactValue;
const MARROW = haralScenario.facts.find(isBuilding)!.value as LowIncomeHousingBuildingFactValue;

const building = (
  slug: string,
  value: Partial<LowIncomeHousingBuildingFactValue> = {},
  from = LARKSPUR,
) => ({
  ...template,
  id: `f-${slug}`,
  key: makeLowIncomeHousingBuildingFactKey(slug),
  value: { ...from, ...value },
});

const withYear = (firstCreditYear: number, from = LARKSPUR) => ({
  form8609: { ...from.form8609, firstCreditYear },
});

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8609-a-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const form = result.forms.get("form-8609-a");
  const files = form?.mustFile.ok ? form.mustFile.value : undefined;
  const field = (id: string) =>
    form?.fields.find((each) => each.fieldId === `form-8609-a.${id}`)?.result;
  const line = (id: string) => {
    const found = field(id);
    return found?.ok ? found.value : undefined;
  };
  const gap = (id: string) => {
    const found = field(id);
    return found !== undefined && !found.ok;
  };
  return { result, files, line, gap, credits: form8609ABuildingCredits(result.filingInfo) };
}

const FIELD = {
  b: "0.line.b_new_or_existing_building",
  c: "0.line.c_original_form_8609_in_records",
  e: "0.line.e_decrease_in_qualified_basis",
  1: "0.line.1_eligible_basis_building",
  2: "0.line.2_low_income_portion_decimal",
  3: "0.line.3_qualified_basis_building",
  4: "0.line.4_part_year_adjustment_disposition",
  6: "0.line.6_multiply_3_or_4_by_5",
  7: "0.line.7_additions_to_qualified_basis",
  11: "0.line.11_section_42f3b_modification",
  14: "0.line.14_disallowed_credit_federal_grants",
  15: "0.line.15_credit_allowed_for_building",
  16: "0.line.16_proportionate_share_of_credit",
  17: "0.line.17_deferred_first_year_credit_adjustments",
  18: "0.line.18_taxpayers_credit",
};

describe("who files (general-instructions::b01)", () => {
  it("a building in its compliance period files Form 8609-A", () => {
    const { files, line, credits } = evaluate(base.facts);
    expect(files).toBe(true);
    expect(line(FIELD[18])).toBe(26042);
    expect(credits).toEqual([
      {
        buildingIdentificationNumber: "WA-21-00377",
        qualifiedBasisDecreased: false,
        credit: 26042,
      },
    ]);
  });

  it("no building fact: the form does not file", () => {
    expect(evaluate(otherFacts).files).toBe(false);
    expect(evaluate(otherFacts).credits).toEqual([]);
  });

  it("a building before or after its compliance period does not file", () => {
    expect(evaluate([...otherFacts, building("a", withYear(2026))]).files).toBe(false);
    expect(evaluate([...otherFacts, building("a", withYear(2010))]).files).toBe(false);
    expect(evaluate([...otherFacts, building("a", withYear(2011))]).files).toBe(true);
  });

  it("the explicit decision wins", () => {
    const off = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8609_a", false),
    ]);
    expect(off.files).toBe(false);
    const on = evaluate(otherFacts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8609_a", true),
    ]);
    expect(on.files).toBe(true);
    expect(on.line(FIELD[1])).toBeUndefined();
  });

  it("two buildings: one copy each, and Form 8586 reads both credits", () => {
    const { credits } = evaluate([...base.facts, building("marrow", {}, MARROW)]);
    expect(credits.map((each) => each.credit)).toEqual([26042, 56700]);
  });
});

describe("Part I stops (specific-instructions::b01, b02)", () => {
  it("item C No: Part II is blank and the credit is 0", () => {
    const { line, credits } = evaluate([
      ...otherFacts,
      building("a", { hasSignedForm8609: false }),
    ]);
    expect(line(FIELD.c)).toBe(false);
    expect(line(FIELD.e)).toBeUndefined();
    expect(line(FIELD[1])).toBeUndefined();
    expect(credits[0].credit).toBe(0);
  });

  it("item D No: Part II is blank", () => {
    const { line } = evaluate([...otherFacts, building("a", { qualifiedAtYearEnd: false })]);
    expect(line(FIELD[1])).toBeUndefined();
    expect(line(FIELD[18])).toBeUndefined();
  });

  it("item B: one box for the building, the other for rehabilitation", () => {
    expect(evaluate(base.facts).line(FIELD.b)).toBe(true);
    expect(
      evaluate([...otherFacts, building("a", { allocation: "rehabilitation" })]).line(FIELD.b),
    ).toBeUndefined();
  });
});

describe("a qualified basis of zero (line-3-2::b01, b03)", () => {
  it("a violated deep rent skewed test: lines 3 and 16 are 0, 4 to 15 and 18 blank", () => {
    const { line, credits } = evaluate([
      ...otherFacts,
      building("a", { deepRentSkewed: "violated" }),
    ]);
    expect([line(FIELD[3]), line(FIELD[16])]).toEqual([0, 0]);
    expect([line(FIELD[4]), line(FIELD[15]), line(FIELD[18])]).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
    expect(credits[0].credit).toBe(0);
  });

  it("a disposition without the procedures: zero; one that does not say waits", () => {
    const sold = { share: 0.6, acquiredOn: "2025-06-10", disposedOn: "2025-11-20" };
    const zero = evaluate([
      ...otherFacts,
      building("a", { ownership: { ...sold, recaptureAvoided: false } }),
    ]);
    expect(zero.line(FIELD[3])).toBe(0);
    const facts = [...otherFacts, building("a", { ownership: sold })];
    const waiting = evaluate(facts);
    expect(waiting.line(FIELD[3])).toBeUndefined();
    expect(pendingInputs(waiting.result).pendingFacts).toContain("low_income_housing_building.a");
  });

  it("no low-income units: zero", () => {
    const yearEnd = { ...LARKSPUR.yearEnd, lowIncomeUnits: 0 };
    const { line } = evaluate([...otherFacts, building("a", { yearEnd })]);
    expect([line(FIELD[3]), line(FIELD[16]), line(FIELD[18])]).toEqual([0, 0, undefined]);
  });
});

describe("the years of the compliance period", () => {
  it("year 1: line 2 averages the full months, line 14 is 0, no additions", () => {
    const month = LARKSPUR.yearEnd;
    const facts = [
      ...otherFacts,
      building("a", {
        ...withYear(2025),
        firstYearMonthEnds: [month, month, month],
        ownership: { share: 1 },
      }),
    ];
    const { line } = evaluate(facts);
    // .7900 × 3 / 12 = .1975.
    expect(line(FIELD[2])).toBe("1975");
    expect(line(FIELD[3])).toBe(493750);
    expect(line(FIELD[7])).toBeUndefined();
    expect(line(FIELD[14])).toBe(0);
  });

  it("year 1 without the month counts waits", () => {
    const { line, credits } = evaluate([...otherFacts, building("a", withYear(2025))]);
    expect(line(FIELD[1])).toBeUndefined();
    expect(credits[0].credit).toBeUndefined();
  });

  it("year 11: the deferred credit only (haral)", () => {
    const { line } = evaluate([...otherFacts, building("m", {}, MARROW)]);
    expect([line(FIELD[16]), line(FIELD[17]), line(FIELD[18])]).toEqual([0, 56700, 56700]);
    expect(line(FIELD[6])).toBeUndefined();
  });

  it("year 11 for part of the building: line 17 is unsupported", () => {
    const { gap, line } = evaluate([
      ...otherFacts,
      building("m", { ownership: { share: 0.5 } }, MARROW),
    ]);
    expect(line(FIELD[16])).toBe(0);
    expect(gap(FIELD[17])).toBe(true);
    expect(gap(FIELD[18])).toBe(true);
  });

  it("years 11 to 15 with additions to qualified basis are unsupported", () => {
    const eleventh = evaluate([...otherFacts, building("a", withYear(2015))]);
    expect(eleventh.line(FIELD[3])).toBe(1975000);
    expect(eleventh.gap(FIELD[7])).toBe(true);
    const twelfth = evaluate([...otherFacts, building("a", withYear(2014))]);
    expect(twelfth.gap(FIELD[1])).toBe(true);
    expect(typeof twelfth.credits[0].credit).toBe("object");
  });

  it("years 12 to 15 with no additions: Part II is blank", () => {
    const facts = [...otherFacts, building("m", withYear(2013, MARROW), MARROW)];
    const { files, line, credits } = evaluate(facts);
    expect(files).toBe(true);
    expect(line(FIELD[1])).toBeUndefined();
    expect(credits[0].credit).toBe(0);
  });
});

describe("gaps and waits", () => {
  it("the at-risk rule of section 42(k): Part II is unsupported", () => {
    expect(evaluate([...otherFacts, building("a", { atRiskFinancing: true })]).gap(FIELD[1])).toBe(
      true,
    );
  });

  it("the Line 11 Worksheet for a part-year owner is unsupported from line 11", () => {
    const increase = { ...LARKSPUR.increase!, priorYearLowIncomePortion: 0.75 };
    const { line, gap } = evaluate([...otherFacts, building("a", { increase })]);
    expect(line(FIELD[7])).toBe(225000);
    expect(gap(FIELD[11])).toBe(true);
    expect(gap(FIELD[18])).toBe(true);
  });

  it("the Line 11 Worksheet for a whole-year owner fills line 11", () => {
    const increase = {
      ...LARKSPUR.increase!,
      priorYearLowIncomePortion: 0.75,
      monthEnds: LARKSPUR.increase!.monthEnds.map((month, index) =>
        index < 6 ? { ...month, lowIncomeUnits: 30, lowIncomeFloorSpace: 27000 } : month,
      ),
    };
    const { line } = evaluate([
      ...otherFacts,
      building("a", { increase, ownership: { share: 1 } }),
    ]);
    /* Worksheet: 1,975,000 − 1,875,000 = 100,000; line 4 (.04 × 6) / 12 = .0200; × 2,500,000 = 50,000; line 6 50,000; × .0267 = 1,335. */
    expect(line(FIELD[11])).toBe(1335);
    expect(line(FIELD[4])).toBe(0);
  });

  it("additions with no worksheet inputs wait", () => {
    const { line, credits } = evaluate([...otherFacts, building("a", { increase: undefined })]);
    expect(line(FIELD[7])).toBeUndefined();
    expect(credits[0].credit).toBeUndefined();
  });

  it("an interest change in a year of acquisition is unsupported on line 16", () => {
    const ownership = {
      ...LARKSPUR.ownership,
      interestChange: { on: "2025-10-31", shareAfter: 0.8 },
    };
    const { line, gap } = evaluate([...otherFacts, building("a", { ownership })]);
    expect(line(FIELD[15])).toBe(43404);
    expect(gap(FIELD[16])).toBe(true);
  });
});

describe("no building fact, nothing changes", () => {
  it("Form 1040 is the same with and without the building", () => {
    const withBuilding = evaluate(base.facts).result.forms.get("form-1040")!;
    const without = evaluate(otherFacts).result.forms.get("form-1040")!;
    expect(withBuilding.fields.map((field) => field.result)).toEqual(
      without.fields.map((field) => field.result),
    );
  });
});

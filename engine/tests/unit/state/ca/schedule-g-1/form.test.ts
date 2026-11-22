/*
 * Schedule G-1 on a whole return: who files, the answers it waits for, the
 * gaps, and the lines it feeds (Form 540 line 34, Schedule CA line 5b column B).
 * The synthetic tuon scenario is the base; ottilie has no lump sum.
 */

import { describe, expect, it } from "vitest";
import {
  CA_LUMP_SUM_OWN_KEY,
  makeCaLumpSumDistributionKey,
  type CaLumpSumDistributionFactValue,
  type RetirementDistributionFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { ottilieScenario } from "../../../../scenarios/synthetic/ottilie/index.js";
import { tuonScenario as base } from "../../../../scenarios/synthetic/tuon/index.js";

const PENSION_KEY = "payer.redwood-valley-pension.distributions.r-1";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const lumpSum = base.facts.find((fact) => fact.key === CA_LUMP_SUM_OWN_KEY)!
  .value as CaLumpSumDistributionFactValue;
const pension = base.facts.find((fact) => fact.key === PENSION_KEY)!
  .value as RetirementDistributionFactValue;

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const withLumpSum = (value: Partial<CaLumpSumDistributionFactValue>) =>
  factsWith({ [CA_LUMP_SUM_OWN_KEY]: { ...lumpSum, ...value } });

function evaluate(
  facts: TaxFactRow[] = base.facts,
  decisions: AIDecisionRow[] = base.decisions,
  id = "schedule-g-1-test",
) {
  const result = evaluateScenario({
    filing: { id, taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (formId: string, key: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${key}`)?.result;
  const value = (formId: string, key: string) => {
    const found = field(formId, key);
    return found?.ok ? found.value : undefined;
  };
  const line = (key: string) => value("schedule-g-1", key);
  const missing = result.forms.get("schedule-g-1")?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const LINE_28 = "0.line.28_tax_on_lump_sum_distribution";
const LINE_34 = "line.34_tax_amount";
const LINE_35 = "line.35_total_tax_after_credits";
const CA_5B = "0.line.5b_subtractions";

describe("Schedule G-1 who files", () => {
  it("files with Form 540 when the taxpayer chooses it and Part I qualifies", () => {
    const run = evaluate();
    expect(run.files("schedule-g-1")).toBe(true);
    expect(run.missing).toEqual([]);
    expect(run.line(LINE_28)).toBe(970);
  });

  it.each([
    ["line 1 is no", { entireBalance: false }],
    ["line 2 is yes", { rolledOver: true }],
    ["lines 3 and 4 are no", { participantBornBefore1936FiveYears: false }],
    ["line 5 is yes", { usedScheduleG1After1986: true }],
    ["neither election", { capitalGainElection: false, tenYearAveraging: false }],
  ])("does not file when %s", (_, change) => {
    expect(evaluate(withLumpSum(change)).files("schedule-g-1")).toBe(false);
  });

  it("files for a beneficiary (line 3 yes, line 4 no)", () => {
    const run = evaluate(
      withLumpSum({
        beneficiaryOfParticipantBornBefore1936: true,
        participantBornBefore1936FiveYears: false,
      }),
    );
    expect(run.files("schedule-g-1")).toBe(true);
    expect(run.line("0.line.3_beneficiary_of_participant")).toBe("yes");
  });

  it("does not file without Form 540", () => {
    const decisions = base.decisions.map((each) =>
      each.decisionKey === "decisions.scope.must_file_ca_540" ? { ...each, decision: false } : each,
    );
    expect(evaluate(base.facts, decisions).files("schedule-g-1")).toBe(false);
  });

  it("the explicit decision wins, and asks for the choice when none is recorded", () => {
    const off = [...base.decisions, decision("decisions.scope.must_file_schedule_g_1", false)];
    expect(evaluate(base.facts, off).files("schedule-g-1")).toBe(false);
    const on = [...base.decisions, decision("decisions.scope.must_file_schedule_g_1", true)];
    const run = evaluate(factsWith({ [CA_LUMP_SUM_OWN_KEY]: undefined }), on);
    expect(run.files("schedule-g-1")).toBe(true);
    expect(run.missing).toEqual([CA_LUMP_SUM_OWN_KEY]);
    expect(run.value("form-540", LINE_35)).toBeUndefined();
  });

  it("waits on an incomplete choice and on a named 1099-R that is missing", () => {
    const partial = { ...lumpSum } as Partial<CaLumpSumDistributionFactValue>;
    delete partial.tenYearAveraging;
    const incomplete = evaluate(factsWith({ [CA_LUMP_SUM_OWN_KEY]: partial }));
    expect(incomplete.files("schedule-g-1")).toBe(true);
    expect(incomplete.missing).toEqual([CA_LUMP_SUM_OWN_KEY]);
    expect(incomplete.line(LINE_28)).toBeUndefined();
    const noForm = evaluate(factsWith({ [PENSION_KEY]: undefined }));
    expect(noForm.missing).toEqual([PENSION_KEY]);
  });
});

describe("Schedule G-1 lines that feed other forms", () => {
  it("Form 540 line 34 takes line 28, checks the box, and line 35 adds it", () => {
    const run = evaluate();
    expect(run.value("form-540", LINE_34)).toBe(970);
    expect(run.value("form-540", "line.34_tax_from_schedule_g1")).toBe(true);
    expect(run.value("form-540", LINE_35)).toBe(970);
    expect(run.value("schedule-ca", CA_5B)).toBe(52000);
  });

  it("with only Part II, line 34 takes line 7 and only box 3 leaves California income", () => {
    const run = evaluate(withLumpSum({ tenYearAveraging: false }));
    expect(run.line(LINE_28)).toBeUndefined();
    expect(run.line("0.line.8_ordinary_income_1099r_box_2a")).toBeUndefined();
    expect(run.value("form-540", LINE_34)).toBe(330);
    expect(run.value("schedule-ca", CA_5B)).toBe(6000);
  });

  it("caps the death benefit exclusion at $5,000", () => {
    const run = evaluate(withLumpSum({ deathBenefitExclusion: 7000 }));
    // A 6,000; B 52,000; C .115; E 575; F 5,425.
    expect(run.line("0.line.6_capital_gain_1099r_box_3")).toBe(5425);
    expect(run.line("0.line.9_death_benefit_exclusion")).toBe(4425);
  });

  it("with federal Form 4972 too, the California subtraction is a gap", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_4972", true)];
    const run = evaluate(base.facts, decisions);
    expect(run.line(LINE_28)).toBe(970);
    expect(isGap(run.field("schedule-ca", CA_5B))).toBe(true);
  });

  it("FTB 5870A on line 34 is a gap", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_5870a", true)];
    expect(isGap(evaluate(base.facts, decisions).field("form-540", LINE_34))).toBe(true);
  });
});

describe("Schedule G-1 gaps", () => {
  it("a second plan participant needs a second schedule", () => {
    const second: TaxFactRow = {
      ...base.facts.find((fact) => fact.key === CA_LUMP_SUM_OWN_KEY)!,
      id: "f-second",
      key: makeCaLumpSumDistributionKey("late-husband"),
    };
    const run = evaluate([...base.facts, second]);
    expect(run.files("schedule-g-1")).toBe(true);
    expect(isGap(run.field("schedule-g-1", LINE_28))).toBe(true);
    expect(run.value("form-540", LINE_35)).toBeUndefined();
  });

  it("an IRA distribution does not qualify", () => {
    const run = evaluate(factsWith({ [PENSION_KEY]: { ...pension, box7IraSepSimple: true } }));
    expect(isGap(run.field("schedule-g-1", "0.line.6_capital_gain_1099r_box_3"))).toBe(true);
  });

  it("a blank box 2a needs Pub. 575", () => {
    const run = evaluate(factsWith({ [PENSION_KEY]: { ...pension, box2a: undefined } }));
    expect(isGap(run.field("schedule-g-1", LINE_28))).toBe(true);
  });

  it("a California taxable amount keeps Schedule CA line 5b column B a gap", () => {
    const run = evaluate(withLumpSum({ californiaTaxableAmount: 50000 }));
    expect(run.line("0.line.6_capital_gain_1099r_box_3")).toBe(5769);
    expect(isGap(run.field("schedule-ca", CA_5B))).toBe(true);
  });
});

describe("no lump sum, nothing changes", () => {
  it("ottilie: no Schedule G-1, line 34 blank, line 35 is line 33, line 5b column B a gap", () => {
    const run = evaluate(ottilieScenario.facts, ottilieScenario.decisions, "ottilie-g1");
    expect(run.files("schedule-g-1")).toBe(false);
    expect(run.value("form-540", LINE_34)).toBeUndefined();
    expect(run.value("form-540", "line.34_tax_from_schedule_g1")).toBeUndefined();
    expect(run.value("form-540", LINE_35)).toBe(830);
    expect(isGap(run.field("schedule-ca", CA_5B))).toBe(true);
  });
});

/*
 * Form 8697 on a whole return: who files, Schedule 2 line 17n, the header, the
 * gaps, and the cases the scenarios do not reach. The synthetic dagdara
 * scenario (Part I, interest owed) is the base.
 */

import { describe, expect, it } from "vitest";
import {
  LOOK_BACK_FACT_KEY,
  type LookBackFactValue,
  type RegularLookBackFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { NO_LOOK_BACK_FORM } from "../../../../src/federal/8697/results.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { dagdaraScenario as base } from "../../../scenarios/synthetic/dagdara/index.js";

const isLookBack = (fact: TaxFactRow) => fact.key === LOOK_BACK_FACT_KEY;
const otherFacts = base.facts.filter((fact) => !isLookBack(fact));
const template = base.facts.find(isLookBack)!;
const baseValue = template.value as RegularLookBackFactValue;

const lookBack = (value: Partial<RegularLookBackFactValue> | LookBackFactValue): TaxFactRow => ({
  ...template,
  value: { ...baseValue, ...value },
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
    filing: { id: "form-8697-test", taxYear: base.taxYear },
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
  const missing = result.forms.get("form-8697")?.missingInputs;
  return { files, field, value, missing };
}

const LINE_17N = "1.line.17n_lookback_interest_section_167g_460b";
const LINE_10 = "0.part1.10_net_interest_owed";
const LINE_9A = "0.part1.9a_net_interest_refunded";
const UNSUPPORTED = { ok: false, unsupported: true };

describe("Form 8697 who files", () => {
  it("files for a look-back fact, and its line 10 is Schedule 2 line 17n", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-8697")).toBe(true);
    expect(run.value("form-8697", LINE_10)).toBe(1_291);
    expect(run.value("schedule-2", LINE_17N)).toBe(1_291);
  });

  it("the explicit decision turns it off; line 17n keeps its reason", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8697", false),
    ]);
    expect(run.files("form-8697")).toBe(false);
    expect(run.field("schedule-2", LINE_17N)).toMatchObject({
      ...UNSUPPORTED,
      reason: NO_LOOK_BACK_FORM,
    });
  });

  it("a decision to file with no fact waits for the fact, so Cade asks for it", () => {
    const run = evaluate(otherFacts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8697", true),
    ]);
    expect(run.files("form-8697")).toBe(true);
    expect(run.value("form-8697", LINE_10)).toBeUndefined();
    expect(run.value("schedule-2", LINE_17N)).toBeUndefined();
  });
});

describe("with no look-back fact, nothing changes", () => {
  const without = evaluate(otherFacts);

  it("the form does not file and line 17n is unsupported, as before", () => {
    expect(without.files("form-8697")).toBe(false);
    expect(without.field("schedule-2", LINE_17N)).toMatchObject(UNSUPPORTED);
  });

  it("Schedule 2 line 21 and Form 1040 line 23 hold the self-employment tax alone", () => {
    const seTax = without.value("schedule-2", "0.line.4_self_employment_tax");
    expect(without.value("schedule-2", "1.line.21_total_other_taxes")).toBe(seTax);
    expect(without.value("form-1040", "line.23")).toBe(seTax);
  });

  it("with the fact, line 23 rises by line 17n exactly", () => {
    const withFact = evaluate(base.facts);
    expect(withFact.value("form-1040", "line.23")).toBe(
      (without.value("form-1040", "line.23") as number) + 1_291,
    );
  });
});

describe("the header", () => {
  it("one pass-through entity fills item C; more than one is a gap", () => {
    const one = evaluate([
      ...otherFacts,
      lookBack({ entities: [{ name: "Gulf Hull Partners LP", ein: "00-0008697" }] }),
    ]);
    expect(one.value("form-8697", "0.header.c_pass_through_entity_name")).toBe(
      "Gulf Hull Partners LP",
    );
    expect(one.value("form-8697", "0.header.c_pass_through_entity_ein")).toBe("00-0008697");
    const two = evaluate([
      ...otherFacts,
      lookBack({
        entities: [
          { name: "A LP", ein: "00-0000001" },
          { name: "B LP", ein: "00-0000002" },
        ],
      }),
    ]);
    expect(two.field("form-8697", "0.header.c_pass_through_entity_name")).toMatchObject(
      UNSUPPORTED,
    );
    expect(two.value("form-8697", LINE_10)).toBe(1_291);
  });

  it("the address prints only on a refund, filed separately", () => {
    const owed = evaluate(base.facts);
    expect(owed.value("form-8697", "0.header.street_address")).toBeUndefined();
    const refund = evaluate([
      ...otherFacts,
      lookBack({
        priorYears: baseValue.priorYears.map((year) => ({
          ...year,
          taxOnAdjustedIncome: year.taxAsReported - 2_000,
        })),
        refundDeposit: {
          routingNumber: "321270742",
          accountNumber: "55-1",
          accountType: "savings",
        },
      }),
    ]);
    expect(refund.value("form-8697", LINE_9A)).toBeGreaterThan(0);
    expect(refund.value("form-8697", LINE_10)).toBeUndefined();
    expect(refund.value("form-8697", "0.header.street_address")).toBe("918 Harbor Light Lane");
    expect(refund.value("form-8697", "0.part1.9c_account_type_savings")).toBe(true);
    expect(refund.value("form-8697", "0.part1.9c_account_type_checking")).toBeUndefined();
    expect(refund.value("schedule-2", LINE_17N)).toBeUndefined();
  });
});

describe("gaps", () => {
  it("a negative line 3 (a look-back loss) stops the interest, not lines 1 to 6", () => {
    const run = evaluate([
      ...otherFacts,
      lookBack({
        priorYears: [
          { ...baseValue.priorYears[0], taxableIncome: -50_000 },
          baseValue.priorYears[1],
        ],
      }),
    ]);
    expect(run.value("form-8697", "0.part1.6_increase_or_decrease_in_tax_col_a")).toBe(9_600);
    expect(run.field("form-8697", "0.part1.7_interest_due_on_increase_col_a")).toMatchObject(
      UNSUPPORTED,
    );
    expect(run.field("form-8697", LINE_10)).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-2", LINE_17N)).toMatchObject(UNSUPPORTED);
  });

  it("a carryover the fact marks stops the interest too", () => {
    const run = evaluate([
      ...otherFacts,
      lookBack({
        priorYears: [
          baseValue.priorYears[0],
          { ...baseValue.priorYears[1], carryoverChanged: true },
        ],
      }),
    ]);
    expect(run.field("form-8697", LINE_10)).toMatchObject(UNSUPPORTED);
  });

  it("a prior year that is not before 2025 is a gap on every amount line", () => {
    const run = evaluate([
      ...otherFacts,
      lookBack({ priorYears: [{ ...baseValue.priorYears[0], taxYear: 2025 }] }),
    ]);
    expect(run.field("form-8697", "0.part1.1_prior_year_taxable_income_col_a")).toMatchObject(
      UNSUPPORTED,
    );
    expect(run.field("schedule-2", LINE_17N)).toMatchObject(UNSUPPORTED);
  });

  it("other adjustments in line 2 leave column 2(c) blank", () => {
    const run = evaluate([...otherFacts, lookBack({ otherAdjustmentsIncluded: true })]);
    expect(run.value("form-8697", "0.part1.2_adjustment_to_income_col_c")).toBeUndefined();
    expect(run.value("form-8697", LINE_10)).toBe(1_291);
  });

  it("the years print oldest first, whatever order the fact lists them", () => {
    const run = evaluate([
      ...otherFacts,
      lookBack({ priorYears: [...baseValue.priorYears].reverse() }),
    ]);
    expect(run.value("form-8697", "0.part1.year_ended_year_col_a")).toBe("2023");
    expect(run.value("form-8697", LINE_10)).toBe(1_291);
  });
});

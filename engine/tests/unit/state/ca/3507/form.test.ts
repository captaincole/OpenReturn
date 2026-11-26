/*
 * FTB 3507 on a whole return: who files, what it asks, line 6a's limits, the
 * $5,000,000 limit with and without the FTB 3870 election, the gaps, Schedule
 * P (540) line 4, Form 540 lines 43 to 48 and Schedule S line 2, and "no facts,
 * nothing changes". The synthetic katerine scenario is the base; javindhra is
 * the second.
 */

import { describe, expect, it } from "vitest";
import {
  CA_BUSINESS_CREDIT_REFUNDABLE_ELECTION_KEY,
  CA_PRISON_INMATE_LABOR_KEYS,
  isCaPrisonInmateLaborPassThroughFactKey,
  makeCaPrisonInmateLaborPassThroughFactKey,
  type CaPrisonInmateLaborPassThroughFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { javindhraScenario } from "../../../../scenarios/synthetic/javindhra/index.js";
import { katerineScenario as base } from "../../../../scenarios/synthetic/katerine/index.js";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({ userId: base.userId, taxYear: base.taxYear, key, decision: value, rationale: "t" });

const withDecision = (key: string, value: unknown) => [
  ...base.decisions.filter((each) => each.decisionKey !== key),
  decision(key, value),
];

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  id: `f-${key}`,
  userId: base.userId,
  taxYear: base.taxYear,
  category,
  key,
  value,
  sourceNote: "test",
  createdAt: "2026-11-26T00:00:00Z",
});

const passThrough = (slug: string, value: Partial<CaPrisonInmateLaborPassThroughFactValue>) =>
  row("state_local_tax", makeCaPrisonInmateLaborPassThroughFactKey(slug), value);

const PRISON_KEYS: string[] = [
  CA_PRISON_INMATE_LABOR_KEYS.qualifyingWages,
  CA_PRISON_INMATE_LABOR_KEYS.carryover,
  CA_BUSINESS_CREDIT_REFUNDABLE_ELECTION_KEY,
];
const isPrisonKey = (key: string) =>
  PRISON_KEYS.includes(key) || isCaPrisonInmateLaborPassThroughFactKey(key);
const withoutPrison = (facts: TaxFactRow[]) => facts.filter((fact) => !isPrisonKey(fact.key));

/* The base facts with the prison labor facts replaced; null leaves a key unstated. */
function withPrison(opts: {
  wages?: unknown;
  carryover?: number | null;
  rows?: TaxFactRow[];
  extra?: TaxFactRow[];
  facts?: TaxFactRow[];
}): TaxFactRow[] {
  const facts = [...withoutPrison(opts.facts ?? base.facts), ...(opts.rows ?? [])];
  if (opts.wages !== null) {
    facts.push(
      row(
        "self_employment",
        CA_PRISON_INMATE_LABOR_KEYS.qualifyingWages,
        opts.wages ?? { wages: 0 },
      ),
    );
  }
  if (opts.carryover !== null) {
    facts.push(row("other", CA_PRISON_INMATE_LABOR_KEYS.carryover, opts.carryover ?? 0));
  }
  return [...facts, ...(opts.extra ?? [])];
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3507-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-3507", `0.line.${id}`);
  const form540 = (id: string) => value("form-540", `line.${id}`);
  const missing = result.forms.get("form-3507")?.missingInputs ?? [];
  return { files, field, value, line, form540, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;
const reasonOf = (result: unknown) => (result as { reason?: string } | undefined)?.reason ?? "";

const K1_CREDIT = { entityName: "Folsom Lake Components, Inc.", entityId: "4417350" };

describe("FTB 3507 who files", () => {
  it("files with the katerine K-1 credit and asks nothing", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-3507")).toBe(true);
    expect(run.files("schedule-p")).toBe(true);
    expect(run.missing).toEqual([]);
  });

  it("files with wages alone, with a carryover alone", () => {
    const wages = evaluate(withPrison({ wages: { wages: 25000 } }));
    expect(wages.files("form-3507")).toBe(true);
    expect([wages.line("1_total_qualifying_wages"), wages.line("2_current_year_credit")]).toEqual([
      25000, 2500,
    ]);
    expect(wages.line("3_pass_through_credit_k1")).toBe(0);
    const carry = evaluate(withPrison({ carryover: 800 }));
    expect(carry.files("form-3507")).toBe(true);
    expect(carry.line("5_total_available_credit")).toBe(800);
  });

  it("does not file with wages of 0, a credit of 0 and no carryover", () => {
    const zero = passThrough("zero", { ...K1_CREDIT, credit: 0 });
    const run = evaluate(withPrison({ rows: [zero] }));
    expect(run.files("form-3507")).toBe(false);
    expect(run.missing).toEqual([]);
  });

  it("does not file without a California return, or when the decision says no", () => {
    const no540 = withDecision("decisions.scope.must_file_ca_540", false);
    expect(evaluate(base.facts, no540).files("form-3507")).toBe(false);
    const no = withDecision("decisions.scope.must_file_3507", false);
    expect(evaluate(base.facts, no).files("form-3507")).toBe(false);
  });

  it("asks for line 1 and line 4 when they are not stated, and for a row that is not complete", () => {
    const partial = passThrough("partial", { entityName: "Half Done LP" });
    const run = evaluate(
      withPrison({ wages: null, carryover: null, rows: [partial], facts: base.facts }),
    );
    expect(run.files("form-3507")).toBe(true);
    expect(run.missing).toEqual([
      CA_PRISON_INMATE_LABOR_KEYS.qualifyingWages,
      partial.key,
      CA_PRISON_INMATE_LABOR_KEYS.carryover,
    ]);
    expect(run.line("5_total_available_credit")).toBeUndefined();
    expect(run.line("6a_credit_claimed")).toBeUndefined();
  });
});

describe("FTB 3507 line 6a and Schedule P (540) line 4", () => {
  it("katerine: the credit stops at the excess tax and line 7 carries the rest", () => {
    const run = evaluate(base.facts);
    const excess = run.value("schedule-p", "1.part3.3_excess_tax_offset_by_credits_col_c");
    expect(excess).toBe(9267);
    expect(run.value("schedule-p", "1.part3.4_prison_inmate_labor_credit_col_a")).toBe(12000);
    expect(run.value("schedule-p", "1.part3.4_prison_inmate_labor_credit_col_b")).toBe(9267);
    expect(run.value("schedule-p", "1.part3.4_prison_inmate_labor_credit_col_c")).toBe(0);
    expect(run.line("6a_credit_claimed")).toBe(9267);
    expect(run.line("6b_total_credit_assigned")).toBe(0);
    expect(run.line("6c_credit_elected_refundable")).toBe(0);
    expect(run.line("7_disallowed_credit_carryover")).toBe(2733);
  });

  it("javindhra: the whole credit is used, and Section B starts from TMT plus line 4 (c)", () => {
    const run = evaluateScenario({
      filing: { id: "javindhra-test", taxYear: javindhraScenario.taxYear },
      facts: javindhraScenario.facts,
      decisions: javindhraScenario.decisions,
    });
    const value = (formId: string, id: string) => {
      const found = run.forms
        .get(formId)
        ?.fields.find((each) => each.fieldId === `${formId}.${id}`);
      return found?.result.ok ? found.result.value : undefined;
    };
    expect(value("schedule-p", "1.part3.4_prison_inmate_labor_credit_col_c")).toBe(675);
    expect(value("schedule-p", "2.part3.11_tax_balance_col_c")).toBe(3786 + 675);
    expect(value("form-3507", "0.line.6a_credit_claimed")).toBe(4950);
    expect(value("form-3507", "0.line.7_disallowed_credit_carryover")).toBe(0);
  });

  it("a credit of 0 on line 5 leaves Schedule P line 4 blank and claims 0", () => {
    const zero = passThrough("zero", { ...K1_CREDIT, credit: 0 });
    const decisions = [
      ...withDecision("decisions.scope.must_file_3507", true).filter(
        (each) => each.decisionKey !== "decisions.scope.must_file_schedule_p",
      ),
      decision("decisions.scope.must_file_schedule_p", true),
    ];
    const run = evaluate(withPrison({ rows: [zero] }), decisions);
    expect(run.line("5_total_available_credit")).toBe(0);
    expect(run.line("6a_credit_claimed")).toBe(0);
    expect(run.line("7_disallowed_credit_carryover")).toBe(0);
    const columnA = run.field("schedule-p", "1.part3.4_prison_inmate_labor_credit_col_a");
    expect(columnA?.ok).toBe(false);
    expect(isGap(columnA)).toBe(false);
    // Without Schedule P (540) the credit of 0 is still 0, not a gap.
    const alone = evaluate(
      withPrison({ rows: [zero] }),
      withDecision("decisions.scope.must_file_3507", true),
    );
    expect(alone.line("6a_credit_claimed")).toBe(0);
    expect(alone.form540("47_total_credits")).toBe(5800);
  });
});

describe("FTB 3507 the $5,000,000 business credit limit", () => {
  // A very large W-2 so the excess tax is above $5,000,000.
  const bigWages = base.facts.map((fact) =>
    fact.category === "wages"
      ? { ...fact, value: { ...(fact.value as object), box1: 200_000_000, box16: 200_000_000 } }
      : fact,
  );
  const credit = passThrough("big", { ...K1_CREDIT, credit: 6_000_000 });
  const facts = (extra: TaxFactRow[]) =>
    withPrison({ facts: bigWages, rows: [credit], extra }).filter(
      (fact) =>
        !fact.key.startsWith("ca_pte_elective_credit.") && !fact.key.startsWith("other_state_tax."),
    );
  const election = (elects: boolean) =>
    row("other", CA_BUSINESS_CREDIT_REFUNDABLE_ELECTION_KEY, elects);

  it("asks for the FTB 3870 election when line 5 is above the limit", () => {
    const run = evaluate(facts([]));
    expect(run.missing).toEqual([CA_BUSINESS_CREDIT_REFUNDABLE_ELECTION_KEY]);
    expect(run.line("6a_credit_claimed")).toBe(5_000_000);
    expect(run.line("6c_credit_elected_refundable")).toBeUndefined();
    expect(run.line("7_disallowed_credit_carryover")).toBeUndefined();
  });

  it("with the election, 6c holds the disallowed part and line 7 is 0", () => {
    const run = evaluate(facts([election(true)]));
    expect(run.missing).toEqual([]);
    expect(run.line("6a_credit_claimed")).toBe(5_000_000);
    expect(run.line("6c_credit_elected_refundable")).toBe(1_000_000);
    expect(run.line("7_disallowed_credit_carryover")).toBe(0);
    expect(run.value("schedule-p", "1.part3.4_prison_inmate_labor_credit_col_b")).toBe(5_000_000);
  });

  it("without the election, line 7 carries the disallowed part", () => {
    const run = evaluate(facts([election(false)]));
    expect(run.line("6c_credit_elected_refundable")).toBe(0);
    expect(run.line("7_disallowed_credit_carryover")).toBe(1_000_000);
  });

  it("does not ask for the election at or under the limit", () => {
    const atLimit = passThrough("big", { ...K1_CREDIT, credit: 5_000_000 });
    const run = evaluate(
      withPrison({ facts: bigWages, rows: [atLimit] }).filter(
        (fact) => !fact.key.startsWith("ca_pte_elective_credit."),
      ),
    );
    expect(run.missing).toEqual([]);
    expect(run.line("6c_credit_elected_refundable")).toBe(0);
  });
});

describe("FTB 3507 gaps", () => {
  it("a credit through a disregarded SMLLC is unsupported on line 6a, Schedule P (b) and Form 540", () => {
    const smllc = passThrough("smllc", {
      ...K1_CREDIT,
      credit: 3000,
      throughDisregardedSmllc: true,
    });
    const run = evaluate(withPrison({ rows: [smllc] }));
    expect(isGap(run.field("form-3507", "0.line.6a_credit_claimed"))).toBe(true);
    expect(isGap(run.field("form-3507", "0.line.7_disallowed_credit_carryover"))).toBe(true);
    expect(isGap(run.field("schedule-p", "1.part3.4_prison_inmate_labor_credit_col_b"))).toBe(true);
    expect(run.value("schedule-p", "1.part3.4_prison_inmate_labor_credit_col_a")).toBe(3000);
    expect(isGap(run.field("form-540", "line.45_schedule_p_credits"))).toBe(true);
    expect(isGap(run.field("form-540", "line.48_tax_after_credits"))).toBe(true);
  });

  it("wages paid through a disregarded SMLLC are the same gap", () => {
    const run = evaluate(
      withPrison({ wages: { wages: 10000, throughDisregardedSmllc: true }, rows: [] }),
    );
    expect(reasonOf(run.field("form-3507", "0.line.6a_credit_claimed"))).toContain("disregarded");
  });

  it("a decision that Schedule P (540) does not file is a gap, not a credit with no floor", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_schedule_p", false));
    expect(reasonOf(run.field("form-3507", "0.line.6a_credit_claimed"))).toContain("Schedule P");
    expect(isGap(run.field("form-540", "line.47_total_credits"))).toBe(true);
    expect(isGap(run.field("schedule-s", "0.line.2_california_tax_liability"))).toBe(true);
  });
});

describe("FTB 3507 on Form 540 and Schedule S", () => {
  it("katerine: three credits go to line 45; Schedule S line 2 leaves out code 162's credit", () => {
    const run = evaluate(base.facts);
    expect(run.form540("43_credit_amount")).toBeUndefined();
    expect(run.form540("45_schedule_p_credits")).toBe(9267 + 1800 + 4000);
    expect(run.value("schedule-s", "0.line.2_california_tax_liability")).toBe(23775 - 9267);
    expect(run.form540("48_tax_after_credits")).toBe(23775 - 15067);
  });

  it("the credit alone goes on line 43 with its name and code", () => {
    const facts = base.facts.filter(
      (fact) =>
        !fact.key.startsWith("ca_pte_elective_credit.") && !fact.key.startsWith("other_state_tax."),
    );
    const run = evaluate(facts);
    expect([
      run.form540("43_credit_name"),
      run.form540("43_credit_code"),
      run.form540("43_credit_amount"),
    ]).toEqual(["Prison Inmate Labor", "162", 9267]);
    expect(run.form540("44_credit_amount")).toBeUndefined();
    expect(run.form540("47_total_credits")).toBe(9267);
  });
});

describe("FTB 3507 no facts, nothing changes", () => {
  it("without prison labor facts the form does not file and Schedule P line 4 keeps its reason", () => {
    const run = evaluate(withoutPrison(base.facts));
    expect(run.files("form-3507")).toBe(false);
    expect(run.files("schedule-p")).toBe(false);
    // Two credits: Utah tax on line 43, the PTE credit on line 44, as before FTB 3507 had rules.
    expect([run.form540("43_credit_code"), run.form540("44_credit_code")]).toEqual(["187", "242"]);
    expect(run.value("schedule-s", "0.line.2_california_tax_liability")).toBe(23775);
  });

  it("Schedule P line 4 keeps its reason when FTB 3507 does not file", () => {
    const run = evaluate(
      withoutPrison(base.facts),
      withDecision("decisions.scope.must_file_schedule_p", true),
    );
    expect(reasonOf(run.field("schedule-p", "1.part3.4_prison_inmate_labor_credit_col_a"))).toBe(
      "Section A1 line 4, prison inmate labor credit (FTB 3507) — no credit facts.",
    );
  });
});

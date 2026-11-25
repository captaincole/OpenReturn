/*
 * FTB 3804-CR on a whole return: who files, what it asks, line 4's limit, the
 * gaps, Form 540 lines 43 to 48, and "no facts, nothing changes". The synthetic
 * domon scenario (no Schedule P) is the base; teslyn (Schedule P) is the second.
 */

import { describe, expect, it } from "vitest";
import {
  CA_PTE_CREDIT_CARRYOVER_KEY,
  isCaPteElectiveCreditFactKey,
  makeCaPteElectiveCreditFactKey,
  type CaPteElectiveCreditFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { domonScenario as base } from "../../../../scenarios/synthetic/domon/index.js";
import { teslynScenario } from "../../../../scenarios/synthetic/teslyn/index.js";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const withDecision = (key: string, value: unknown) => [
  ...base.decisions.filter((each) => each.decisionKey !== key),
  decision(key, value),
];

const pteFact = (slug: string, value: Partial<CaPteElectiveCreditFactValue>): TaxFactRow => ({
  id: `f-${slug}`,
  userId: base.userId,
  taxYear: base.taxYear,
  category: "state_local_tax",
  key: makeCaPteElectiveCreditFactKey(slug),
  value,
  sourceNote: "test",
  createdAt: "2026-11-25T00:00:00Z",
});

const isPteKey = (key: string) =>
  isCaPteElectiveCreditFactKey(key) || key === CA_PTE_CREDIT_CARRYOVER_KEY;
const withoutPte = (facts: TaxFactRow[]) => facts.filter((fact) => !isPteKey(fact.key));
const withoutOtherState = (facts: TaxFactRow[]) =>
  facts.filter((fact) => !fact.key.startsWith("other_state_tax."));

/* The base facts with the PTE facts replaced; a carryover of null is not stated. */
function withPte(rows: TaxFactRow[], carryover: number | null): TaxFactRow[] {
  const facts = [...withoutPte(base.facts), ...rows];
  if (carryover === null) return facts;
  return [
    ...facts,
    {
      ...pteFact("carry", {}),
      category: "other",
      key: CA_PTE_CREDIT_CARRYOVER_KEY,
      value: carryover,
    },
  ];
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3804-cr-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-3804-cr", `0.${id}`);
  const form540 = (id: string) => value("form-540", `line.${id}`);
  const missing = result.forms.get("form-3804-cr")?.missingInputs ?? [];
  return { files, field, value, line, form540, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

describe("FTB 3804-CR who files", () => {
  it("files with the domon credits and asks nothing", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-3804-cr")).toBe(true);
    expect(run.missing).toEqual([]);
  });

  it("files with a carryover alone: line 1 is 0, line 3 the carryover", () => {
    const run = evaluate(withPte([], 900));
    expect(run.files("form-3804-cr")).toBe(true);
    expect([
      run.line("part2.1_total_credit_from_ptes"),
      run.line("part2.3_total_available_credit"),
    ]).toEqual([0, 900]);
    expect(run.line("part1.2_total_pte_elective_tax_credit")).toBeUndefined();
  });

  it("does not file with a credit of 0 and no carryover", () => {
    const zero = pteFact("zero", { entityName: "Zero LLC", entityId: "201900000001", credit: 0 });
    expect(evaluate(withPte([zero], 0)).files("form-3804-cr")).toBe(false);
  });

  it("does not file without a California return, or when the decision says no", () => {
    expect(
      evaluate(base.facts, withDecision("decisions.scope.must_file_ca_540", false)).files(
        "form-3804-cr",
      ),
    ).toBe(false);
    expect(
      evaluate(base.facts, withDecision("decisions.scope.must_file_3804_cr", false)).files(
        "form-3804-cr",
      ),
    ).toBe(false);
  });

  it("asks for the carryover, and for an entity row with an answer missing", () => {
    const partial = pteFact("partial", { entityName: "Partial LP" });
    const run = evaluate(withPte([partial], null));
    expect(run.files("form-3804-cr")).toBe(true);
    expect(run.missing).toEqual([
      makeCaPteElectiveCreditFactKey("partial"),
      CA_PTE_CREDIT_CARRYOVER_KEY,
    ]);
    expect(run.line("part2.3_total_available_credit")).toBeUndefined();
    expect(run.form540("47_total_credits")).toBeUndefined();
  });
});

describe("FTB 3804-CR line 4 with no Schedule P (540)", () => {
  it("domon: line 4 is the tax left after the other state tax credit", () => {
    const run = evaluate(base.facts);
    // 19,959 (Form 540 line 35) − 1,540 (Schedule S line 12).
    expect(run.line("part2.4_credit_claimed_current_year")).toBe(18419);
    expect(run.line("part2.5_credit_carryover_future_years")).toBe(30970 - 18419);
    expect(run.form540("48_tax_after_credits")).toBe(0);
  });

  it("a credit below the tax is taken in full, with no carryover", () => {
    const small = pteFact("small", {
      entityName: "Small LP",
      entityId: "201900000002",
      credit: 4000.4,
    });
    const run = evaluate(withPte([small], 600));
    expect(run.line("part1.1a_electing_pte_col_c")).toBe(4000);
    expect(run.line("part2.4_credit_claimed_current_year")).toBe(4600);
    expect(run.line("part2.5_credit_carryover_future_years")).toBe(0);
    expect([run.form540("44_credit_code"), run.form540("44_credit_amount")]).toEqual(["242", 4600]);
    expect(run.form540("48_tax_after_credits")).toBe(19959 - 1540 - 4600);
  });

  it("with no other state tax credit, the credit takes line 43 and the whole tax", () => {
    const run = evaluate(withoutOtherState(base.facts));
    expect(run.line("part2.4_credit_claimed_current_year")).toBe(19959);
    expect([run.form540("43_credit_name"), run.form540("43_credit_code")]).toEqual([
      "PTE Elective Tax",
      "242",
    ]);
    expect(run.form540("43_credit_amount")).toBe(19959);
    expect(run.form540("44_credit_amount")).toBeUndefined();
    expect(run.form540("45_schedule_p_credits")).toBeUndefined();
  });
});

describe("FTB 3804-CR gaps", () => {
  it("a credit through a disregarded SMLLC: line 4 and Form 540 lines 44, 47, 48 are unsupported", () => {
    const smllc = pteFact("smllc", {
      entityName: "Through LLC",
      entityId: "201900000003",
      credit: 3000,
      throughDisregardedSmllc: true,
    });
    const run = evaluate(withPte([smllc], 0));
    expect(run.line("part2.3_total_available_credit")).toBe(3000);
    expect(isGap(run.field("form-3804-cr", "0.part2.4_credit_claimed_current_year"))).toBe(true);
    for (const id of ["44_credit_amount", "47_total_credits", "48_tax_after_credits"]) {
      expect(isGap(run.field("form-540", `line.${id}`))).toBe(true);
    }
  });

  it("a Form 540NR return: line 4 is unsupported", () => {
    const decisions = [
      ...withDecision("decisions.scope.must_file_ca_540", false).filter(
        (each) => each.decisionKey !== "decisions.scope.must_file_540nr",
      ),
      decision("decisions.scope.must_file_540nr", true),
    ];
    const run = evaluate(base.facts, decisions);
    expect(run.files("form-3804-cr")).toBe(true);
    expect(run.line("part2.3_total_available_credit")).toBe(30970);
    expect(isGap(run.field("form-3804-cr", "0.part2.4_credit_claimed_current_year"))).toBe(true);
  });
});

describe("FTB 3804-CR: no facts, nothing changes", () => {
  it("without the credit, domon's Form 540 keeps Schedule S alone on line 43", () => {
    const run = evaluate(withoutPte(base.facts));
    expect(run.files("form-3804-cr")).toBe(false);
    expect(run.form540("43_credit_amount")).toBe(1540);
    expect(run.form540("44_credit_amount")).toBeUndefined();
    expect(run.form540("45_schedule_p_credits")).toBeUndefined();
    expect(run.form540("47_total_credits")).toBe(1540);
    expect(run.form540("48_tax_after_credits")).toBe(19959 - 1540);
    expect(run.value("schedule-s", "0.line.2_california_tax_liability")).toBe(19959);
  });

  it("with no other credit form, lines 43 to 45 stay unsupported as before", () => {
    const run = evaluate(withoutOtherState(withoutPte(base.facts)));
    for (const id of ["43_credit_amount", "44_credit_amount", "45_schedule_p_credits"]) {
      expect(isGap(run.field("form-540", `line.${id}`))).toBe(true);
    }
    expect(run.form540("48_tax_after_credits")).toBe(19959);
  });

  it("Schedule S line 2 leaves the PTE credit out", () => {
    expect(evaluate(base.facts).value("schedule-s", "0.line.2_california_tax_liability")).toBe(
      19959,
    );
  });
});

describe("FTB 3804-CR with Schedule P (540): teslyn", () => {
  const run = () =>
    (() => {
      const result = evaluateScenario({
        filing: { id: "teslyn-test", taxYear: teslynScenario.taxYear },
        facts: teslynScenario.facts,
        decisions: teslynScenario.decisions,
        authEmail: null,
      });
      return (formId: string, id: string) => {
        const found = result.forms
          .get(formId)
          ?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
        return found?.ok ? found.value : undefined;
      };
    })();

  it("line 21 comes after line 20, and line 4 is its column (b)", () => {
    const value = run();
    // Line 20 column (c) 15,525 is the balance before line 21.
    expect(value("schedule-p", "3.part3.20_other_state_tax_tax_balance_col_c")).toBe(15525);
    expect(value("schedule-p", "3.part3.21_pte_elective_tax_credit_used_col_b")).toBe(15525);
    expect(value("form-3804-cr", "0.part2.4_credit_claimed_current_year")).toBe(15525);
    expect(value("schedule-p", "3.part3.21_pte_elective_tax_credit_carryover_col_d")).toBe(
      value("form-3804-cr", "0.part2.5_credit_carryover_future_years"),
    );
  });

  it("three other credits: line 45 holds them and lines 43 and 44 are blank", () => {
    const value = run();
    expect(value("form-540", "line.45_schedule_p_credits")).toBe(6450 + 1800 + 15525);
    expect(value("form-540", "line.43_credit_amount")).toBeUndefined();
    expect(value("form-540", "line.44_credit_amount")).toBeUndefined();
  });
});

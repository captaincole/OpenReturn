/*
 * Form 6198 on a whole return: who files, the copies, the waits, the gaps,
 * and the lines that take its results (Schedule C line 31, Schedule E line 28).
 * The synthetic ituralde scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeAtRiskFactKey,
  makeBusinessFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeRentalFactKey,
  type BusinessFactValue,
  type K1HoldingFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { ituraldeScenario as base } from "../../../scenarios/synthetic/ituralde/index.js";
import { noalScenario as noal } from "../../../scenarios/synthetic/noal/index.js";

const FILM = makeBusinessFactKey("varga-film-works");
const RANCH = makePartnershipK1FactKey("kandor-ridge-cattle");
const HOLDING = makeK1HoldingFactKey("kandor-ridge-cattle");
const RANCH_AT_RISK = makeAtRiskFactKey(RANCH);

const valueOf = <T>(key: string) => base.facts.find((fact) => fact.key === key)!.value as T;
const film = valueOf<BusinessFactValue>(FILM);
const holding = valueOf<K1HoldingFactValue>(HOLDING);

/* The base facts with each fact for a key replaced (undefined drops it). */
function factsWith(changes: Record<string, unknown>): TaxFactRow[] {
  return base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-6198-test", taxYear: base.taxYear },
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
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, missing, info: result.filingInfo };
}

/* An engine gap: unsupported(reason), not a blank line. */
const gapReason = (result: unknown) => {
  const found = result as { unsupported?: boolean; reason?: string } | undefined;
  return found?.unsupported === true ? found.reason : undefined;
};

const LINE_31 = "0.line.31";
const ROW_A_LOSS = "1.line.28_row_a_col_i_nonpassive_loss_allowed";
const ROW_A_AT_RISK = "1.line.28_row_a_col_f_amount_not_at_risk";

describe("Form 6198 who files", () => {
  it("files one copy per activity: the K-1 first, then the business", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-6198")).toBe(true);
    const copies = run.info.form6198Copies ?? [];
    expect(copies.map((copy) => copy.description)).toEqual([
      "Cattle ranching, Kandor Ridge Cattle LLC, 00-0004802",
      "Documentary film production",
    ]);
    const second = copies[1]?.outcome;
    expect(second?.kind === "figured" && second.figures.line21).toBe(-10000);
  });

  it("does not file, and nothing changes, when all of the investment is at risk", () => {
    const run = evaluate(
      factsWith({
        [FILM]: { ...film, allInvestmentAtRisk: true, atRisk: undefined },
        [HOLDING]: { ...holding, allInvestmentAtRisk: true, carriedLosses: undefined },
        [RANCH_AT_RISK]: undefined,
      }),
    );
    expect(run.files("form-6198")).toBe(false);
    expect(run.value("schedule-c", LINE_31)).toBe(-27000);
    expect(run.value("schedule-e", ROW_A_LOSS)).toBe(40000);
    expect(run.value("schedule-e", ROW_A_AT_RISK)).toBe(false);
  });

  it("files for the business alone when the K-1 has income", () => {
    const k1 = valueOf<{ boxes: unknown[] }>(RANCH);
    const run = evaluate(
      factsWith({
        [RANCH]: { ...k1, boxes: [{ box: "1", amount: 5000 }] },
        [HOLDING]: { ...holding, carriedLosses: undefined },
      }),
    );
    expect(run.info.form6198Copies?.map((copy) => copy.description)).toEqual([
      "Documentary film production",
    ]);
    expect(run.value("schedule-e", ROW_A_AT_RISK)).toBe(false);
  });

  it("follows the explicit decision", () => {
    const decisions = [
      ...base.decisions,
      decisionRow({
        userId: base.userId,
        taxYear: base.taxYear,
        key: "decisions.scope.must_file_6198",
        decision: false,
        rationale: "test",
      }),
    ];
    expect(evaluate(base.facts, decisions).files("form-6198")).toBe(false);
  });
});

describe("Form 6198 waits on the amounts at risk", () => {
  it("lists the K-1's at-risk fact, and Schedule E waits on it", () => {
    const run = evaluate(factsWith({ [RANCH_AT_RISK]: undefined }));
    expect(run.missing("form-6198")).toContain(RANCH_AT_RISK);
    expect(run.missing("schedule-e")).toContain(RANCH_AT_RISK);
    expect(run.value("form-6198", "0.line.21_deductible_loss")).toBeUndefined();
    expect(run.value("schedule-e", ROW_A_LOSS)).toBeUndefined();
  });

  it("lists the business fact, and Schedule C line 31 waits", () => {
    const run = evaluate(factsWith({ [FILM]: { ...film, atRisk: undefined } }));
    expect(run.missing("form-6198")).toContain(FILM);
    expect(run.missing("schedule-c")).toContain(FILM);
    expect(run.value("schedule-c", LINE_31)).toBeUndefined();
  });
});

describe("Form 6198 cases the engine does not handle", () => {
  it("makes line 31 a gap when the amount at risk is below zero", () => {
    const run = evaluate(
      factsWith({
        [FILM]: {
          ...film,
          atRisk: { simplified: { adjustedBasisAtStart: 1000, decreases: 4000 } },
        },
      }),
    );
    expect(gapReason(run.field("schedule-c", LINE_31))).toContain("recapture");
    expect(run.value("schedule-c", LINE_31)).toBeUndefined();
  });

  it("checks a profit year for recapture too (irs-6198-inst-2025::sec::line-5::b01)", () => {
    const profit = { ...film, grossReceipts: 60000 };
    const belowZero = evaluate(
      factsWith({
        [FILM]: {
          ...profit,
          atRisk: { simplified: { adjustedBasisAtStart: 1000, decreases: 4000 } },
        },
      }),
    );
    expect(gapReason(belowZero.field("schedule-c", LINE_31))).toContain("recapture");
    expect(belowZero.value("schedule-1", "0.line.3")).toBeUndefined();
    const aboveZero = evaluate(factsWith({ [FILM]: profit }));
    expect(aboveZero.value("schedule-c", LINE_31)).toBe(15000);
    expect(aboveZero.info.form6198Copies?.length).toBe(1);
  });

  it("makes a rental loss with amounts not at risk a gap, not the whole loss", () => {
    const facts = noal.facts.map((fact) =>
      fact.key === makeRentalFactKey("oriole-house")
        ? { ...fact, value: { ...(fact.value as object), allInvestmentAtRisk: false } }
        : fact,
    );
    const run = evaluate(facts, noal.decisions);
    expect(gapReason(run.field("schedule-e", "0.line.21_income_or_loss_a"))).toContain("Form 6198");
    expect(run.value("form-1040", "line.11a")).toBeUndefined();
  });
});

describe("Form 6198 lines on the return", () => {
  it("prints lines 4 and 21 as positive amounts: the form prints the parentheses", () => {
    const run = evaluate(base.facts);
    expect(run.value("form-6198", "0.line.21_deductible_loss")).toBe(28000);
    expect(run.value("form-6198", "0.line.4_other_deductions_losses")).toBeUndefined();
    expect(run.value("form-6198", "0.line.15_amount_at_risk")).toBe(0);
  });

  it("checks Schedule E line 27 Yes for the allowed carried loss, on its PYA row", () => {
    const run = evaluate(base.facts);
    expect(run.value("schedule-e", "1.line.27_yes")).toBe(true);
    expect(run.value("schedule-e", "1.line.28_row_b_col_a_name")).toBe(
      "PYA Kandor Ridge Cattle LLC",
    );
  });
});

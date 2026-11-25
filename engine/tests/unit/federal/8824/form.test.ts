/*
 * Form 8824 on a whole return: who files, what it asks, the summary form, and
 * the lines that take its results (Schedule D lines 4, 11 and 19, Form 4797
 * lines 5 and 16, Schedule 1 line 4). The synthetic gaul and dobraine
 * scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  isConflictOfInterestSaleFactKey,
  isLikeKindExchangeFactKey,
  makeLikeKindExchangeFactKey,
  type LikeKindExchangeFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { dobraineScenario } from "../../../scenarios/synthetic/dobraine/index.js";
import { gaulScenario } from "../../../scenarios/synthetic/gaul/index.js";
import type { Scenario } from "../../../types.js";

const isForm8824Fact = (fact: TaxFactRow) =>
  isLikeKindExchangeFactKey(fact.key) || isConflictOfInterestSaleFactKey(fact.key);

function evaluate(base: Scenario, facts: TaxFactRow[], extraDecisions: AIDecisionRow[] = []) {
  const result = evaluateScenario({
    filing: { id: "form-8824-test", taxYear: base.taxYear },
    facts,
    decisions: [...base.decisions, ...extraDecisions],
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
  return { result, files, field, value };
}

const decision = (base: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const exchangeOf = (base: Scenario) =>
  base.facts.find((fact) => isLikeKindExchangeFactKey(fact.key))!;

function withExchange(
  base: Scenario,
  change: (value: LikeKindExchangeFactValue) => LikeKindExchangeFactValue,
) {
  const template = exchangeOf(base);
  return base.facts.map((fact) =>
    fact === template ? { ...fact, value: change(fact.value as LikeKindExchangeFactValue) } : fact,
  );
}

const UNSUPPORTED = { ok: false, unsupported: true };

describe("Form 8824 who files", () => {
  it("files for a 2025 exchange and a 2025 conflict-of-interest sale", () => {
    const run = evaluate(gaulScenario, gaulScenario.facts);
    expect([run.files("form-8824"), run.files("schedule-d")]).toEqual([true, true]);
  });

  it("with no Form 8824 fact, the form does not file and Schedule D has nothing to report", () => {
    const run = evaluate(
      gaulScenario,
      gaulScenario.facts.filter((fact) => !isForm8824Fact(fact)),
    );
    expect(run.files("form-8824")).toBe(false);
    expect(run.files("schedule-d")).toBe(false);
    expect(run.value("form-1040", "line.7a")).toBeUndefined();
  });

  it("the explicit decision false wins, and nothing reaches Schedule D", () => {
    const run = evaluate(gaulScenario, gaulScenario.facts, [
      decision(gaulScenario, "decisions.scope.must_file_8824", false),
    ]);
    expect(run.files("form-8824")).toBe(false);
    expect(run.files("schedule-d")).toBe(false);
  });

  it("files by decision with no fact: its lines are a gap", () => {
    const facts = gaulScenario.facts.filter((fact) => !isForm8824Fact(fact));
    const run = evaluate(gaulScenario, facts, [
      decision(gaulScenario, "decisions.scope.must_file_8824", true),
    ]);
    expect(run.files("form-8824")).toBe(true);
    expect(run.field("form-8824", "1.line.23_recognized_gain")).toMatchObject(UNSUPPORTED);
  });

  it("asks again for a related party exchange whose lines 9 and 10 are not answered", () => {
    const facts = withExchange(gaulScenario, (value) => ({
      ...value,
      relatedParty: { ...value.relatedParty!, relatedPartyDisposed: undefined },
    }));
    const run = evaluate(gaulScenario, facts);
    expect(pendingInputs(run.result).pendingFacts).toContain(exchangeOf(gaulScenario).key);
  });
});

describe("Form 8824 results on other forms", () => {
  it("a related party disposition with no exception reports line 24 too (Schedule D line 11)", () => {
    const facts = withExchange(gaulScenario, (value) => ({
      ...value,
      relatedParty: { ...value.relatedParty!, taxpayerDisposed: true },
    }));
    const run = evaluate(gaulScenario, facts);
    // 25,500 (line 22) + 3,500 (line 14) + 66,000 (line 24).
    expect(run.value("schedule-d", "0.line.11_long_term_gain_other_forms")).toBe(95000);
  });

  it("an installment sale makes Schedule D lines 4 and 11 a gap (Form 6252 has no rules)", () => {
    const facts = withExchange(gaulScenario, (value) => ({ ...value, installmentMethod: true }));
    const run = evaluate(gaulScenario, facts);
    expect(run.field("schedule-d", "0.line.11_long_term_gain_other_forms")).toMatchObject(
      UNSUPPORTED,
    );
  });

  it("business property: Form 4797 lines 5 and 16, Schedule 1 line 4", () => {
    const run = evaluate(dobraineScenario, dobraineScenario.facts);
    expect(run.value("form-4797", "0.line.5_section_1231_like_kind_exchanges")).toBe(8000);
    expect(run.value("form-4797", "0.line.16_ordinary_like_kind_exchanges")).toBe(18000);
    expect(run.value("schedule-1", "0.line.4")).toBe(18000);
  });

  it("a depreciated building given up makes Schedule D line 19 a gap", () => {
    const facts = withExchange(dobraineScenario, (value) => ({
      ...value,
      givenUp: {
        ...value.givenUp,
        recapture: { section1245Depreciation: 18000, section1250Depreciation: 5000 },
      },
    }));
    const run = evaluate(dobraineScenario, facts);
    expect(run.field("schedule-d", "1.line.19_unrecaptured_sec1250_gain")).toMatchObject(
      UNSUPPORTED,
    );
  });

  it("other property used in a business makes Form 4797 lines 5 and 16 a gap", () => {
    const facts = withExchange(dobraineScenario, (value) => ({
      ...value,
      otherPropertyGivenUp: {
        description: "Forklift",
        fairMarketValue: 4000,
        adjustedBasis: 1000,
        dateAcquired: "2020-01-01",
        use: "business_or_rental",
      },
    }));
    const run = evaluate(dobraineScenario, facts);
    expect(run.field("form-4797", "0.line.5_section_1231_like_kind_exchanges")).toMatchObject(
      UNSUPPORTED,
    );
    expect(run.field("form-4797", "0.line.7_net_section_1231_gain_loss")).toMatchObject(
      UNSUPPORTED,
    );
  });
});

describe("Form 8824 with two exchanges: the summary form (irs-8824-inst-2025::sec::purpose-of-form::b02)", () => {
  it("prints Summary on line 1, the totals on lines 23 and 25, and leaves the rest blank", () => {
    const second = {
      ...exchangeOf(dobraineScenario),
      id: "f-second",
      key: makeLikeKindExchangeFactKey("second-site"),
    };
    const run = evaluate(dobraineScenario, [...dobraineScenario.facts, second]);
    expect(run.value("form-8824", "0.line.1_property_given_up_description_row1")).toBe("Summary");
    expect(run.value("form-8824", "1.line.23_recognized_gain")).toBe(52000);
    expect(run.value("form-8824", "1.line.25_basis_like_kind_property_received")).toBe(120000);
    expect(run.value("form-8824", "1.line.19_realized_gain_loss")).toBeUndefined();
    expect(run.value("form-4797", "0.line.16_ordinary_like_kind_exchanges")).toBe(36000);
  });
});

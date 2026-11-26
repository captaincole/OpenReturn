/*
 * Form 4835 on a whole return: who files, the lines Schedule E takes (lines 40
 * to 43), the answers it asks for, and the cases it does not print. The
 * synthetic jasin (net income) and keille (a professional's loss) scenarios
 * are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  isFarmRentalFactKey,
  makeFarmRentalFactKey,
  RENTAL_KEYS,
  type FarmRentalFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { jasinScenario } from "../../../scenarios/synthetic/jasin/index.js";
import { keilleScenario } from "../../../scenarios/synthetic/keille/index.js";
import type { Scenario } from "../../../types.js";

const isFarm = (fact: TaxFactRow) => isFarmRentalFactKey(fact.key);
const farmOf = (base: Scenario) => base.facts.find(isFarm)!;

const withFarm = (
  base: Scenario,
  value: Partial<FarmRentalFactValue>,
  slug?: string,
): TaxFactRow => {
  const template = farmOf(base);
  return {
    ...template,
    id: `f-${slug ?? template.key}`,
    key: slug ? makeFarmRentalFactKey(slug) : template.key,
    value: { ...(template.value as FarmRentalFactValue), ...value },
  };
};

const decision = (base: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(base: Scenario, facts: TaxFactRow[], extraDecisions: AIDecisionRow[] = []) {
  const result = evaluateScenario({
    filing: { id: "form-4835-test", taxYear: base.taxYear },
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
    const outcome = field(formId, id);
    return outcome?.ok ? outcome.value : undefined;
  };
  const isUnsupported = (formId: string, id: string) =>
    (field(formId, id) as { unsupported?: boolean } | undefined)?.unsupported === true;
  return { files, value, isUnsupported, pending: pendingInputs(result) };
}

const otherFacts = (base: Scenario) => base.facts.filter((fact) => !isFarm(fact));
const LINE_40 = "1.line.40_net_farm_rental_income";
const LINE_41 = "1.line.41_total_income_or_loss";

describe("who files", () => {
  it("a farm rental fact files Form 4835 and Schedule E", () => {
    const run = evaluate(jasinScenario, jasinScenario.facts);
    expect(run.files("form-4835")).toBe(true);
    expect(run.files("schedule-e")).toBe(true);
  });

  it("no farm rental fact: no Form 4835, no Schedule E, Schedule 1 line 5 blank", () => {
    const run = evaluate(jasinScenario, otherFacts(jasinScenario));
    expect(run.files("form-4835")).toBe(false);
    expect(run.files("schedule-e")).toBe(false);
    expect(run.value("form-1040", "line.8")).toBeUndefined();
  });

  it("the explicit decision wins over the fact", () => {
    const run = evaluate(jasinScenario, jasinScenario.facts, [
      decision(jasinScenario, "decisions.scope.must_file_4835", false),
    ]);
    expect(run.files("form-4835")).toBe(false);
    expect(run.files("schedule-e")).toBe(false);
  });

  it("a spouse's farm rental is off a single return", () => {
    const run = evaluate(jasinScenario, [
      ...otherFacts(jasinScenario),
      withFarm(jasinScenario, { owner: "spouse" }),
    ]);
    expect(run.files("form-4835")).toBe(false);
  });
});

describe("Schedule E", () => {
  it("jasin: line 40 is line 32, line 42 is line 7", () => {
    const run = evaluate(jasinScenario, jasinScenario.facts);
    expect(run.value("schedule-e", LINE_40)).toBe(21812);
    expect(run.value("schedule-e", LINE_41)).toBe(21812);
    expect(run.value("schedule-e", "1.line.42_farming_fishing_reconciliation")).toBe(71550);
    expect(
      run.value("schedule-e", "1.line.43_real_estate_professional_reconciliation"),
    ).toBeUndefined();
  });

  it("keille: line 40 is the deductible loss, and line 43 takes it", () => {
    const run = evaluate(keilleScenario, keilleScenario.facts);
    expect(run.value("form-4835", "0.line.32_net_farm_rental_income_loss")).toBeUndefined();
    expect(run.value("schedule-e", LINE_40)).toBe(-11000);
    expect(run.value("schedule-e", "1.line.43_real_estate_professional_reconciliation")).toBe(
      -11000,
    );
  });

  it("two farm rentals: every line and Schedule E lines 40 and 41 are unsupported", () => {
    const facts = [...jasinScenario.facts, withFarm(jasinScenario, {}, "second-farm")];
    const run = evaluate(jasinScenario, facts);
    expect(run.isUnsupported("form-4835", "0.line.1_income_from_production")).toBe(true);
    expect(run.isUnsupported("schedule-e", LINE_40)).toBe(true);
    expect(run.isUnsupported("schedule-e", LINE_41)).toBe(true);
  });

  it("Schedule F on the return makes line 10 a gap; Part I and line 42 still print", () => {
    const run = evaluate(jasinScenario, jasinScenario.facts, [
      decision(jasinScenario, "decisions.scope.must_file_schedule_f", true),
    ]);
    expect(run.isUnsupported("form-4835", "0.line.10_conservation_expenses")).toBe(true);
    expect(run.isUnsupported("form-4835", "0.line.32_net_farm_rental_income_loss")).toBe(true);
    expect(run.value("form-4835", "0.line.7_gross_farm_rental_income")).toBe(71550);
    expect(run.value("schedule-e", "1.line.42_farming_fishing_reconciliation")).toBe(71550);
  });

  it("Form 8582 filing for the return makes a passive farm rental's line 32 a gap", () => {
    const run = evaluate(jasinScenario, jasinScenario.facts, [
      decision(jasinScenario, "decisions.scope.must_file_8582", true),
      // jasin states no professional answer: the farm rental is passive.
    ]);
    const withAnswer = evaluate(
      jasinScenario,
      [
        ...jasinScenario.facts,
        {
          ...farmOf(jasinScenario),
          id: "f-rep",
          key: RENTAL_KEYS.realEstateProfessional,
          value: false,
        },
      ],
      [decision(jasinScenario, "decisions.scope.must_file_8582", true)],
    );
    expect(run.pending.pendingFacts).toContain(RENTAL_KEYS.realEstateProfessional);
    expect(withAnswer.isUnsupported("form-4835", "0.line.32_net_farm_rental_income_loss")).toBe(
      true,
    );
    expect(withAnswer.isUnsupported("schedule-e", LINE_41)).toBe(true);
  });
});

describe("answers line 34 asks for", () => {
  const notProfessional = (base: Scenario): TaxFactRow[] =>
    base.facts.map((fact) =>
      fact.key === RENTAL_KEYS.realEstateProfessional ? { ...fact, value: false } : fact,
    );

  it("a passive loss asks whether Form 8582 files (the Schedule E exception)", () => {
    const run = evaluate(keilleScenario, notProfessional(keilleScenario));
    expect(run.pending.pendingDecisions).toContain("decisions.scope.must_file_8582");
    expect(run.value("schedule-e", LINE_40)).toBeUndefined();
  });

  it("the exception decided: the whole loss with active participation", () => {
    const run = evaluate(keilleScenario, notProfessional(keilleScenario), [
      decision(keilleScenario, "decisions.scope.must_file_8582", false),
    ]);
    expect(run.value("form-4835", "0.line.34c_deductible_loss")).toBe(-11000);
    expect(
      run.value("schedule-e", "1.line.43_real_estate_professional_reconciliation"),
    ).toBeUndefined();
  });

  it("Form 8582 decided to file: line 34c is a gap", () => {
    const run = evaluate(keilleScenario, notProfessional(keilleScenario), [
      decision(keilleScenario, "decisions.scope.must_file_8582", true),
    ]);
    expect(run.isUnsupported("form-4835", "0.line.34c_deductible_loss")).toBe(true);
  });

  it("an unstated line A or at-risk answer asks for the farm rental fact again", () => {
    const facts = [
      ...otherFacts(keilleScenario),
      withFarm(keilleScenario, { activelyParticipated: undefined, allInvestmentAtRisk: undefined }),
    ];
    const run = evaluate(keilleScenario, facts);
    expect(run.pending.pendingFacts).toContain(farmOf(keilleScenario).key);
    expect(run.value("form-4835", "0.line.34c_deductible_loss")).toBeUndefined();
  });

  it("a market gain with no stated election asks for the fact again; line 7 waits", () => {
    const facts = [
      ...otherFacts(jasinScenario),
      withFarm(jasinScenario, {
        cccLoanElection: undefined,
        cccLoansReportedUnderElection: undefined,
      }),
    ];
    const run = evaluate(jasinScenario, facts);
    expect(run.pending.pendingFacts).toContain(farmOf(jasinScenario).key);
    expect(run.value("form-4835", "0.line.7_gross_farm_rental_income")).toBeUndefined();
  });
});

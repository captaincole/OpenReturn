/*
 * FTB 3801 and a Form 4835 farm rental: the form files only for a passive loss
 * or a prior-year unallowed loss (ca-3801-inst-2025::sec::b-who-must-file::b01).
 * The made-up jasin (net income) and keille (a professional's loss) landowners,
 * as California full-year residents.
 */

import { describe, expect, it } from "vitest";
import {
  isFarmRentalFactKey,
  RENTAL_KEYS,
  type FarmRentalFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { FARM_GAP } from "../../../../../src/state/ca/3801/formScope.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { jasinScenario } from "../../../../scenarios/synthetic/jasin/index.js";
import { keilleScenario } from "../../../../scenarios/synthetic/keille/index.js";
import type { Scenario } from "../../../../types.js";

const CALIFORNIA: Record<string, unknown> = {
  "decisions.scope.must_file_ca_540": true,
  "decisions.scope.ca_residency": "full_year",
};

function californiaDecisions(base: Scenario, extra: Record<string, unknown>): AIDecisionRow[] {
  const replaced = { ...CALIFORNIA, ...extra };
  const kept = base.decisions.filter((row) => !(row.decisionKey in replaced));
  const added = Object.entries(replaced).map(([key, value]) =>
    decisionRow({
      userId: base.userId,
      taxYear: base.taxYear,
      key,
      decision: value,
      rationale: "test",
    }),
  );
  return [...kept, ...added];
}

const withFarm = (base: Scenario, value: Partial<FarmRentalFactValue>): TaxFactRow[] =>
  base.facts.map((fact) =>
    isFarmRentalFactKey(fact.key)
      ? { ...fact, value: { ...(fact.value as FarmRentalFactValue), ...value } }
      : fact,
  );

function evaluate(base: Scenario, facts: TaxFactRow[], extra: Record<string, unknown> = {}) {
  const result = evaluateScenario({
    filing: { id: "form-3801-farm-test", taxYear: base.taxYear },
    facts,
    decisions: californiaDecisions(base, extra),
    authEmail: null,
  });
  const form = result.forms.get("form-3801");
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const gapReason = (formId: string, id: string) => {
    const outcome = field(formId, id) as { reason?: string; unsupported?: boolean } | undefined;
    return outcome?.unsupported === true ? outcome.reason : undefined;
  };
  return { files3801: form?.mustFile.ok ? form.mustFile.value : undefined, gapReason };
}

describe("FTB 3801 with a farm rental", () => {
  it("net income and no other passive activity: FTB 3801 does not file", () => {
    const run = evaluate(jasinScenario, jasinScenario.facts);
    expect(run.files3801).toBe(false);
    expect(run.gapReason("schedule-ca", "0.line.b5_subtractions")).toBeUndefined();
    expect(run.gapReason("schedule-ca", "0.line.b5_additions")).toBeUndefined();
  });

  it("a prior-year unallowed loss files FTB 3801 with its farm gap", () => {
    const run = evaluate(jasinScenario, withFarm(jasinScenario, { priorYearUnallowedLoss: 500 }));
    expect(run.files3801).toBe(true);
    expect(run.gapReason("schedule-ca", "0.line.b5_subtractions")).toBe(FARM_GAP);
  });

  it("a passive loss under the Schedule E exception files FTB 3801", () => {
    const facts = keilleScenario.facts.map((fact) =>
      fact.key === RENTAL_KEYS.realEstateProfessional ? { ...fact, value: false } : fact,
    );
    const run = evaluate(keilleScenario, facts, { "decisions.scope.must_file_8582": false });
    expect(run.files3801).toBe(true);
  });

  it("a professional's farm rental they materially participated in is not passive", () => {
    const run = evaluate(keilleScenario, keilleScenario.facts);
    expect(run.files3801).toBe(false);
  });
});

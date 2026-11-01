import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { decisionsWithPreparerStyle } from "../helpers/preparer";
import { SCENARIOS } from "../scenarios/index";
import type { Scenario } from "../types";

/*
 * On a failure, add a missingInputs entry in the form's resolver, or list the
 * input here with the reason it is optional.
 * Document facts are skipped: the scope decisions cover whether they exist.
 */
const OPTIONAL: Array<[RegExp, string]> = [
  [/^decisions\.scope\.must_file_schedule_ca$/, "Schedule CA files with the 540 unless set false"],
  [
    /^decisions\.trade\..+\.form_8949_box$/,
    "override; the default box comes from the 1099-B facts",
  ],
  [/^identity\.address\.apt$/, "not every address has an apartment"],
  [/^identity\.email$/, "Cade records the login email at doc-gen time"],
  [
    /^prior_year\.ca_tax$/,
    "KNOWN GAP: decides whether FTB 5805 files. Needed only when the CA balance due is " +
      "$500 or more, which the resolver cannot see before evaluation.",
  ],
];

const isDocument = (key: string) => /^(employer|account|payer|employee|vendor)\./.test(key);
const isOptional = (key: string) => OPTIONAL.some(([pattern]) => pattern.test(key));

interface Outcome {
  values: Map<string, string>;
  pending: Set<string>;
}

function evaluate(
  baseScenario: Scenario,
  facts: TaxFactRow[],
  decisions: AIDecisionRow[],
): Outcome {
  const scenario = evaluateScenario({
    filing: { id: baseScenario.name, taxYear: baseScenario.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const values = new Map<string, string>();
  for (const [formId, form] of scenario.forms) {
    values.set(`${formId}.mustFile`, JSON.stringify(form.mustFile.ok && form.mustFile.value));
    if (!form.mustFile.ok || !form.mustFile.value) continue;
    for (const field of form.fields) {
      values.set(field.fieldId, field.result.ok ? JSON.stringify(field.result.value) : "(blank)");
    }
  }
  const { pendingDecisions, pendingFacts } = pendingInputs(scenario);
  return { values, pending: new Set([...pendingDecisions, ...pendingFacts]) };
}

function unreported(base: Outcome, dropped: Outcome): string[] {
  if ([...dropped.pending].some((key) => !base.pending.has(key))) return [];
  const ids = new Set([...base.values.keys(), ...dropped.values.keys()]);
  return [...ids]
    .filter((id) => base.values.get(id) !== dropped.values.get(id))
    .map((id) => `${id}: ${base.values.get(id)} → ${dropped.values.get(id)}`);
}

describe.each(SCENARIOS)("required inputs: $name", (scenario) => {
  const decisions = decisionsWithPreparerStyle(scenario);
  const base = evaluate(scenario, scenario.facts, decisions);
  const answers = [
    ...decisions.map((decision) => ({
      key: decision.decisionKey,
      drop: () =>
        evaluate(
          scenario,
          scenario.facts,
          decisions.filter((other) => other !== decision),
        ),
    })),
    ...scenario.facts
      .filter((fact) => !isDocument(fact.key))
      .map((fact) => ({
        key: fact.key,
        drop: () =>
          evaluate(
            scenario,
            scenario.facts.filter((other) => other !== fact),
            decisions,
          ),
      })),
  ].filter((input) => !isOptional(input.key));

  it.each(answers)("missing $key is reported", ({ drop }) => {
    expect(unreported(base, drop()).slice(0, 3)).toEqual([]);
  });
});

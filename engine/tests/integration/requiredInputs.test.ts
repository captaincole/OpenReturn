import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { decisionsWithPreparerStyle } from "../helpers/preparer";
import { SCENARIOS } from "../scenarios/index";
import type { Scenario } from "../types";

/*
 * Every input a filed form reads must be reported when it is missing.
 * For each scenario, drop one answer (a decision, or a fact that is not a
 * document) and re-evaluate. When a filed form's output changes, the
 * pending lists must name a new key. Otherwise the form computes without
 * the input (a blank line, or a wrong but plausible number) and nothing
 * tells Cade to ask. Fix that with a missingInputs entry in the form's
 * resolver, or list the input below with the reason it is optional.
 *
 * Document facts (employer.*, account.*, payer.*, employee.*, vendor.*)
 * are skipped: dropping
 * one removes income, and the scope decisions cover whether it exists.
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

function evaluate(s: Scenario, facts: TaxFactRow[], decisions: AIDecisionRow[]): Outcome {
  const scenario = evaluateScenario({
    filing: { id: s.name, taxYear: s.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const values = new Map<string, string>();
  for (const [formId, form] of scenario.forms) {
    values.set(`${formId}.mustFile`, JSON.stringify(form.mustFile.ok && form.mustFile.value));
    if (!form.mustFile.ok || !form.mustFile.value) continue;
    for (const f of form.fields) {
      values.set(f.fieldId, f.result.ok ? JSON.stringify(f.result.value) : "(blank)");
    }
  }
  const { pendingDecisions, pendingFacts } = pendingInputs(scenario);
  return { values, pending: new Set([...pendingDecisions, ...pendingFacts]) };
}

/* Fields whose value changed, when no new pending key explains the change. */
function unreported(base: Outcome, dropped: Outcome): string[] {
  if ([...dropped.pending].some((key) => !base.pending.has(key))) return [];
  const ids = new Set([...base.values.keys(), ...dropped.values.keys()]);
  return [...ids]
    .filter((id) => base.values.get(id) !== dropped.values.get(id))
    .map((id) => `${id}: ${base.values.get(id)} → ${dropped.values.get(id)}`);
}

describe.each(SCENARIOS)("required inputs: $name", (s) => {
  const decisions = decisionsWithPreparerStyle(s);
  const base = evaluate(s, s.facts, decisions);
  const answers = [
    ...decisions.map((d) => ({
      key: d.decisionKey,
      drop: () =>
        evaluate(
          s,
          s.facts,
          decisions.filter((x) => x !== d),
        ),
    })),
    ...s.facts
      .filter((f) => !isDocument(f.key))
      .map((f) => ({
        key: f.key,
        drop: () =>
          evaluate(
            s,
            s.facts.filter((x) => x !== f),
            decisions,
          ),
      })),
  ].filter((a) => !isOptional(a.key));

  it.each(answers)("missing $key is reported", ({ drop }) => {
    expect(unreported(base, drop()).slice(0, 3)).toEqual([]);
  });
});

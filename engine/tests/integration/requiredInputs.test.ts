import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { decisionsWithPreparerStyle } from "../helpers/preparer";
import { loadScenarios } from "../scenarios/index";
import type { Scenario } from "../types";

/*
 * On a failure, add a missingInputs entry in the form's resolver, or list the
 * input here with the reason it is optional.
 * Document facts are skipped: the scope decisions cover whether they exist.
 * A business fact (Schedule C), a dependent fact and a rental property fact
 * (Schedule E) are skipped too: each is the whole business, person or property,
 * and whether one exists is Cade's question.
 */
const OPTIONAL: Array<[RegExp, string]> = [
  [/^decisions\.scope\.must_file_schedule_ca$/, "Schedule CA files with the 540 unless set false"],
  [
    /^decisions\.trade\..+\.form_8949_box$/,
    "override; the default box comes from the 1099-B facts",
  ],
  [/^identity\.address\.apt$/, "not every address has an apartment"],
  [
    /^hsa\.distributions_rolled_over$/,
    "Form 8889 line 14b, recorded only when the user rolled a distribution over or took out " +
      "an excess contribution by the due date; blank otherwise",
  ],
  [
    /^decisions\.scope\.must_file_schedule_a$/,
    "close-deductions records it when California itemizes and federal takes the standard " +
      "deduction (cade deductions/closing.ts); absent, Schedule A follows decisions.itemize_vs_standard",
  ],
  [
    /^capital_gains\.(short|long)_term_loss_carryover$/,
    "a prior-year answer Cade records when last year's return carried a capital loss over " +
      "(last year's return is not read, #79); Schedule D files with it",
  ],
  [
    /^decisions\.scope\.must_file_8995(_a)?$/,
    "override; the QBI form follows the taxable income upper bound (federal/qbi/whichForm.ts)",
  ],
  [
    /^gambling\.winnings_not_on_w2g$/,
    "an answer Cade records only when the user reports winnings with no W-2G; " +
      "otherwise line 8b comes from the W-2G facts",
  ],
  [
    /^other_income\.alaska_permanent_fund_dividends$/,
    "an answer Cade records only when the user received the dividend (Schedule 1 line 8g)",
  ],
  [
    /^casualty\.[^.]+$/,
    "each fact is a whole casualty event (Form 4684); whether one happened is Cade's question",
  ],
  [
    /^dependent_care\.(provider|qualifying_person)\.[^.]+$/,
    "each fact is a whole care provider or qualifying person (Form 2441 lines 1 and 2); " +
      "whether one exists is Cade's question",
  ],
  [
    /^gambling\.losses$/,
    "an answer Cade records only when the user reports gambling losses (Schedule A line 16)",
  ],
  [
    /^adjustments\.educator_expenses\.(taxpayer|spouse)$/,
    "an answer Cade records only for an eligible K-12 educator (Schedule 1 line 11)",
  ],
  [
    /^identity\.(spouse\.)?blind$/,
    "KNOWN GAP: Cade asks once and records it; absent counts as not visually impaired " +
      "(CA 540 line 8). Federal 1040 line 12d does not read it yet.",
  ],
  [
    /^ca_payments\.(estimated_tax|prior_year_overpayment_applied|extension_payment)$/,
    "an answer Cade records only when the user made that California payment (Form 540 line 72)",
  ],
  [/^identity\.email$/, "Cade records the login email at doc-gen time"],
  [/^identity\.(spouse\.)?name\.middle_initial$/, "printed when stated; not every name has one"],
  [
    /^amt\.iso_exercise_spread$/,
    "an answer Cade records only when the user exercised incentive stock options; " +
      "Schedule P (540) and Form 6251 read it (a spread above 0 files Form 6251)",
  ],
  [
    /^mortgage\.origination_date_form_1098$/,
    "the 1098's box 3, read only to pick the $1,000,000 limit for a loan from 2017 or earlier",
  ],
  [
    /^investment_interest\.ca_elected_net_capital_gain$/,
    "a separate California election on FTB 3526 line 4e, recorded only when the user states one",
  ],
  [
    /^investment_income\.niit_additional_modifications$/,
    "Form 8960 line 10, recorded only when the user states additional modifications; blank otherwise",
  ],
  [
    /^decisions\.scope\.must_file_6251$/,
    "KNOWN GAP: an incentive stock option spread files Form 6251; a filer who owes AMT " +
      "for another reason (line 7 more than line 10) needs the explicit decision.",
  ],
  [
    /^prior_year\.ca_tax$/,
    "KNOWN GAP: decides whether FTB 5805 files. Needed only when the CA balance due is " +
      "$500 or more, which the resolver cannot see before evaluation.",
  ],
];

const isDocument = (key: string) =>
  /^(employer|account|payer|employee|vendor|business|dependent|rental\.property|marketplace)\./.test(
    key,
  );
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

const SCENARIOS = await loadScenarios();

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

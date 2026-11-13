/*
 * Alex (single, one W-2, California) as the base of the deductions tests. His
 * scenario records "Schedule CA does not file"; the California comparison
 * needs the form, so these tests leave that decision out.
 */

import { evaluateScenario } from "@openreturn/engine";
import { loadScenario } from "@openreturn/engine/scenarios";

const alexScenario = await loadScenario("alex");

export const YEAR = 2025;

export type FactRow = (typeof alexScenario.facts)[number];
export type DecisionRow = (typeof alexScenario.decisions)[number];

export const alexFacts = alexScenario.facts;
export const alexDecisions = alexScenario.decisions.filter(
  (decision) => decision.decisionKey !== "decisions.scope.must_file_schedule_ca",
);

export const fact = (key: string, value: unknown, category = "other"): FactRow => ({
  ...alexFacts[0],
  id: `test-${key}`,
  category,
  key,
  value,
  sourceNote: `${key}, verbal`,
});

export const decision = (decisionKey: string, value: unknown): DecisionRow => ({
  ...alexDecisions[0],
  id: `test-${decisionKey}`,
  decisionKey,
  decision: value,
});

/* Rows are newest first: a row here supersedes Alex's row for the same key. */
export const alex = (
  facts: FactRow[] = [],
  decisions: DecisionRow[] = [],
  assumptions: FactRow[] = [],
) =>
  evaluateScenario({
    filing: { id: "alex", taxYear: YEAR },
    facts: [...facts, ...alexFacts],
    assumptions,
    decisions: [...decisions, ...alexDecisions],
    authEmail: "alex@example.com",
  });

/* A no to every life question, as facts. */
export const EVERY_NO = [
  "itemized_last_year",
  "owns_home",
  "ca_vehicle",
  "gave_money",
  "gave_things",
  "gift_carryover",
  "medical",
  "margin_loan",
  "investment_fees",
].map((id) => fact(`deductions.life.${id}`, false));

/* The facts of 0 those answers record, less the home's two. */
export const NOTHING_BUT_A_HOME = [
  fact("state_local_tax.personal_property", 0, "state_local_tax"),
  fact("charitable.cash", 0, "charitable"),
  fact("charitable.noncash", 0, "charitable"),
  fact("charitable.carryover", 0, "charitable"),
  fact("medical.expenses_total", 0, "medical"),
  fact("investment_interest.expense_paid", 0, "investment_income"),
  fact("investment_interest.disallowed_carryover", 0, "investment_income"),
  fact("misc_deductions.investment_fees", 0),
];

/* The open door is closed: the taxpayer said that nothing else is left. */
export const NOTHING_ELSE = fact("deductions.nothing_else", true);

export const RENTER = [
  NOTHING_ELSE,
  ...EVERY_NO,
  fact("mortgage.interest_form_1098", 0, "mortgage"),
  fact("state_local_tax.real_estate", 0, "state_local_tax"),
  ...NOTHING_BUT_A_HOME,
];

/* Mortgage interest and real estate tax: under the federal standard deduction, over California's. */
export const HOME_AMOUNTS = [
  fact("mortgage.interest_form_1098", 7000, "mortgage"),
  fact("mortgage.outstanding_principal_form_1098", 300000, "mortgage"),
  fact("state_local_tax.real_estate", 3000, "state_local_tax"),
];

export const HOMEOWNER = [
  NOTHING_ELSE,
  fact("deductions.life.owns_home", true),
  ...EVERY_NO,
  ...HOME_AMOUNTS,
  ...NOTHING_BUT_A_HOME,
];

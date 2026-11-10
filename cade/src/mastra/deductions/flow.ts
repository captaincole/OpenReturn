/*
 * The next step of the deductions conversation, derived from the engine's item
 * states. Cade never keeps his own place in the flow: a fact that arrives
 * early (a Form 1098 before "do you own your home?") moves the step on, and
 * the question is never asked. Pure.
 */

import {
  ASSUMABLE_KEYS,
  type EvaluatedScenario,
  type ItemId,
  type ItemState,
} from "@openreturn/engine";
import { MORTGAGE_KEYS } from "@openreturn/engine/facts";
import { planClosing } from "./closing";
import {
  LIFE_QUESTIONS,
  lifeQuestionStatus,
  type LifeQuestionId,
  type LifeQuestionStatus,
} from "./lifeQuestions";

export interface AmountAsk {
  item: ItemId;
  title: string;
  /** The facts to ask for. A rough amount (an assumption) is allowed only where marked. */
  keys: { key: string; category: string; roughAllowed: boolean }[];
}

/* The category each amount is recorded under: the life questions name it for their facts of 0. */
const CATEGORY_BY_KEY = new Map<string, string>([
  ...LIFE_QUESTIONS.flatMap((question) =>
    question.zeroFacts.map(({ key, category }) => [key, category] as const),
  ),
  [MORTGAGE_KEYS.outstandingPrincipalForm1098, "mortgage"],
]);

export type NextStep =
  /** Ask these yes/no questions; they can go in one message. */
  | { step: "ask_life_questions"; questions: { id: LifeQuestionId; ask: string }[] }
  /** Ask each item's amounts: exact when the taxpayer knows it, rough when not. */
  | { step: "ask_amounts"; items: AmountAsk[] }
  /** The comparison needs the return's income and filing status: the return's conversation supplies them. */
  | { step: "wait_for_return"; why: string }
  /** These rough amounts can change the result or go on an itemized return: get each document or exact amount. */
  | { step: "get_exact_amounts"; items: AmountAsk[] }
  /** Everything is in: call close-deductions. */
  | { step: "close" }
  /** Closed, and the recorded decisions still match the comparison. */
  | { step: "closed" };

export interface LifeQuestionState {
  id: LifeQuestionId;
  ask: string;
  status: LifeQuestionStatus;
}

export interface DeductionsFlow {
  lifeQuestions: LifeQuestionState[];
  next: NextStep;
}

export const valuesByKey = (rows: readonly { key: string; value: unknown }[]) =>
  new Map(rows.map((row) => [row.key, row.value]));

function lifeQuestionStates(scenario: EvaluatedScenario): LifeQuestionState[] {
  const facts = valuesByKey(scenario.facts);
  return LIFE_QUESTIONS.map((question) => ({
    id: question.id,
    ask: question.ask(scenario.filing.taxYear),
    status: lifeQuestionStatus(question, facts, scenario.deductions.items),
  }));
}

function amountAsk(item: ItemState, assumedKeys: ReadonlySet<string>, exact: boolean): AmountAsk {
  // Asking amounts skips a key a rough amount already fills; getting exact amounts asks only those.
  const unstated = item.missing.filter((key) => !assumedKeys.has(key));
  const keys = exact || unstated.length === 0 ? item.missing : unstated;
  return {
    item: item.id,
    title: item.title,
    keys: keys.map((key) => ({
      key,
      category: CATEGORY_BY_KEY.get(key) ?? "other",
      roughAllowed: !exact && ASSUMABLE_KEYS.includes(key),
    })),
  };
}

/* Items whose amounts Cade asks now: open ones, and unasked ones their life question opened. */
function itemsToAsk(scenario: EvaluatedScenario, questions: LifeQuestionState[]): ItemState[] {
  const opened = new Set(
    LIFE_QUESTIONS.filter((question) => {
      const status = questions.find((state) => state.id === question.id)!.status;
      return status === "yes" || status === "settled";
    }).flatMap((question) => question.items),
  );
  return scenario.deductions.items.filter(
    (item) => item.status === "open" || (item.status === "unasked" && opened.has(item.id)),
  );
}

/*
 * Rough amounts that need their exact amount before closing: all of them when
 * a return itemizes (the amount goes on the return), else only the ones whose
 * 0 or double flips the result.
 */
function itemsToMakeExact(scenario: EvaluatedScenario): ItemState[] {
  const { comparison, items } = scenario.deductions;
  const sides = [comparison?.federal, comparison?.ca];
  const either = sides.some((side) => side?.recommendation === "itemize");
  const deciding = new Set(sides.flatMap((side) => side?.decidingItems ?? []));
  return items.filter((item) => item.status === "assumed" && (either || deciding.has(item.id)));
}

function nextStep(scenario: EvaluatedScenario, questions: LifeQuestionState[]): NextStep {
  const unasked = questions.filter((question) => question.status === "unasked");
  if (unasked.length > 0) {
    return { step: "ask_life_questions", questions: unasked.map(({ id, ask }) => ({ id, ask })) };
  }
  const assumedKeys = new Set(scenario.assumptionsInUse.map((assumption) => assumption.key));
  const toAsk = itemsToAsk(scenario, questions);
  if (toAsk.length > 0) {
    return { step: "ask_amounts", items: toAsk.map((item) => amountAsk(item, assumedKeys, false)) };
  }
  const closing = planClosing(scenario);
  if (!closing) {
    return {
      step: "wait_for_return",
      why: "The comparison needs the return's income and filing status. They come from the return's conversation: the income documents and the filing status.",
    };
  }
  const toMakeExact = itemsToMakeExact(scenario);
  if (toMakeExact.length > 0) {
    return {
      step: "get_exact_amounts",
      items: toMakeExact.map((item) => amountAsk(item, assumedKeys, true)),
    };
  }
  return { step: closing.decisions.length === 0 ? "closed" : "close" };
}

export function deductionsFlow(scenario: EvaluatedScenario): DeductionsFlow {
  const lifeQuestions = lifeQuestionStates(scenario);
  return { lifeQuestions, next: nextStep(scenario, lifeQuestions) };
}

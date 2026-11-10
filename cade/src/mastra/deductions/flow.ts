/*
 * The next step of the deductions conversation, derived from the engine's item
 * states. Cade never keeps his own place in the flow: a fact that arrives
 * early (a Form 1098 before "do you own your home?") moves the step on, and
 * the question is never asked. Pure.
 */

import {
  ASSUMABLE_KEYS,
  DEDUCTION_ITEMS,
  type EvaluatedScenario,
  type ItemId,
  type ItemState,
} from "@openreturn/engine";
import { categoryOf } from "./categories";
import { planClosing } from "./closing";
import {
  LIFE_QUESTIONS,
  lifeFactKey,
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

const askFor = (key: string, roughAllowed: boolean) => ({
  key,
  category: categoryOf(key),
  roughAllowed: roughAllowed && ASSUMABLE_KEYS.includes(key),
});

function amountAsk(item: ItemState, assumedKeys: ReadonlySet<string>, exact: boolean): AmountAsk {
  // Asking amounts skips a key a rough amount already fills; getting exact amounts asks only those.
  const unstated = item.missing.filter((key) => !assumedKeys.has(key));
  const keys = exact || unstated.length === 0 ? item.missing : unstated;
  return { item: item.id, title: item.title, keys: keys.map((key) => askFor(key, !exact)) };
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
 * A yes after an earlier no: the facts of 0 the no recorded are older than the
 * yes, and no longer say what the taxpayer said.
 */
function staleZeroKeys(scenario: EvaluatedScenario): Set<string> {
  const rows = new Map(scenario.facts.map((row) => [row.key, row]));
  return new Set(
    LIFE_QUESTIONS.flatMap((question) => {
      const answer = rows.get(lifeFactKey(question.id));
      if (answer?.value !== true) return [];
      return question.zeroKeys.filter((key) => {
        const zero = rows.get(key);
        return zero?.value === 0 && zero.createdAt < answer.createdAt;
      });
    }),
  );
}

const amountKeysOf = (id: ItemId) => DEDUCTION_ITEMS.find((item) => item.id === id)!.amountKeys;

/*
 * The amounts Cade asks now, by item. A stale 0 is asked again as an exact
 * amount only: the fact of 0 is still there, and a rough amount never replaces
 * a fact.
 */
function amountAsks(scenario: EvaluatedScenario, questions: LifeQuestionState[]): AmountAsk[] {
  const assumedKeys = new Set(scenario.assumptionsInUse.map((assumption) => assumption.key));
  const toAsk = new Set(itemsToAsk(scenario, questions).map((item) => item.id));
  const stale = staleZeroKeys(scenario);
  return scenario.deductions.items.flatMap((item) => {
    const again = amountKeysOf(item.id).filter((key) => stale.has(key));
    const missing = toAsk.has(item.id) ? amountAsk(item, assumedKeys, false).keys : [];
    const keys = [...again.map((key) => askFor(key, false)), ...missing];
    return keys.length > 0 ? [{ item: item.id, title: item.title, keys }] : [];
  });
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
  const toAsk = amountAsks(scenario, questions);
  if (toAsk.length > 0) return { step: "ask_amounts", items: toAsk };
  const closing = planClosing(scenario);
  if (!closing) {
    return {
      step: "wait_for_return",
      why: "The comparison needs the return's income and filing status. They come from the return's conversation: the income documents and the filing status.",
    };
  }
  const toMakeExact = itemsToMakeExact(scenario);
  if (toMakeExact.length > 0) {
    const assumedKeys = new Set(scenario.assumptionsInUse.map((assumption) => assumption.key));
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

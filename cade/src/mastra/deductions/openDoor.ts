/*
 * The open door of the deductions conversation: after the life questions, Cade
 * asks what else the taxpayer paid that might count, in their own words. Each
 * expense they name gets one of four outcomes. The outcome is a decision, so
 * it gets the background grounding review; the taxpayer's words are the fact
 * the decision cites. The door never writes an amount: nothing free-form
 * reaches a form line. Pure: the tool does the writes.
 */

import type { ItemId } from "@openreturn/engine";
import {
  LIFE_QUESTIONS,
  type LifeQuestionId,
  type LifeQuestionStatus,
  planLifeAnswers,
  type PlannedFact,
  type StatedAmounts,
} from "./lifeQuestions";

export const OUTCOMES = ["counts_here", "counts_elsewhere", "does_not_count", "not_sure"] as const;
export type Outcome = (typeof OUTCOMES)[number];

/* The items an expense can count under: each has a life question that opens it. */
export const DOOR_ITEMS = LIFE_QUESTIONS.flatMap((question) => question.items) as [
  ItemId,
  ...ItemId[],
];

/* The fact that closes the door: the taxpayer said that nothing else is left. */
export const NOTHING_ELSE_KEY = "deductions.nothing_else";

const NAMED = "deductions.named.";
export const namedFactKey = (slug: string): string => `${NAMED}${slug}`;
export const namedDecisionKey = (slug: string): string => `decisions.${NAMED}${slug}`;

/* Common expenses no life question covers; the web app offers them as quick replies. */
const SUGGESTIONS = [
  "Home office",
  "Tax prep fee",
  "Union dues",
  "Gambling losses",
  "Student loan interest",
  "Commuting",
];

export type OpenDoorAsk = {
  /** The question, in the words to use. */
  ask: string;
  /** What Cade does with an answer; on the first ask only. */
  why?: string;
  suggestions: string[];
  /** The reply that closes the door. */
  done: string;
};

/* The door's question now. Undefined once the taxpayer said that nothing else is left. */
export function openDoorAsk(
  year: number,
  facts: ReadonlyMap<string, unknown>,
): OpenDoorAsk | undefined {
  if (facts.get(NOTHING_ELSE_KEY) === true) return undefined;
  const namedBefore = [...facts.keys()].some((key) => key.startsWith(NAMED));
  if (namedBefore) return { ask: "Anything else?", suggestions: SUGGESTIONS, done: "That's all" };
  return {
    ask: `Anything else you paid for in ${year} that you think might count? Say it in your own words.`,
    why: "I will check whether it counts here, counts somewhere else on your return, or does not count. If I am not sure, I will pass it to your CPA instead of guessing.",
    suggestions: SUGGESTIONS,
    done: "Nothing else",
  };
}

export interface NamedExpense {
  /** The expense in a few plain words ("home office"). */
  name: string;
  /** The name as a key part ("home-office"); empty when the name has no letter or digit. */
  slug: string;
  /** What the taxpayer said about it, word for word. */
  taxpayerWords: string;
  outcome: Outcome;
  /** counts_here: the catalog item it counts under. */
  item?: ItemId;
  /** counts_elsewhere: where on the return it may count. */
  where?: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
}

export interface PlannedExpense {
  name: string;
  outcome: Outcome;
  /** The taxpayer's words, as the fact the decision cites. */
  fact: Omit<PlannedFact, "value"> & { value: string };
  decision: {
    decisionKey: string;
    decision: { outcome: Outcome; item?: ItemId; where?: string };
    rationale: string;
    supportingFactKeys: string[];
    confidence: NamedExpense["confidence"];
  };
  /** counts_here under an item whose life question is not a yes: the yes to record, so the flow asks the amount. */
  opens?: LifeQuestionId;
  /** The open question to note: for the return's conversation (counts_elsewhere) or the CPA (not_sure). */
  question?: { question: string; context: string };
}

export interface DoorPlan {
  expenses: PlannedExpense[];
  /** The facts to write after the expenses: each yes that opens an item, and the fact that closes the door. */
  facts: PlannedFact[];
  /** An expense the call must send again: nothing is recorded for it. */
  problems: { name: string; problem: string }[];
}

/* One answer at the door, and what was known before it. */
export interface DoorAnswer {
  year: number;
  /** How and when the taxpayer said it. */
  sourceNote: string;
  /** The taxpayer said that nothing else is left. */
  nothingElse: boolean;
  statuses: ReadonlyMap<LifeQuestionId, LifeQuestionStatus>;
  stated: StatedAmounts;
}

function problemWith(expense: NamedExpense, slugsBefore: ReadonlySet<string>): string | undefined {
  if (expense.slug === "") return "The name needs a letter or a digit.";
  if (slugsBefore.has(expense.slug)) {
    return "An expense earlier in this call has the same name: the two would share one record. Give each expense its own name.";
  }
  if (expense.outcome === "counts_here" && !expense.item) {
    return "counts_here needs `item`. An expense that no item covers is not_sure.";
  }
  if (expense.outcome === "counts_elsewhere" && !expense.where) {
    return "counts_elsewhere needs `where`.";
  }
  return undefined;
}

function questionFor(expense: NamedExpense, sourceNote: string) {
  const context = `"${expense.taxpayerWords}" (${sourceNote})`;
  if (expense.outcome === "counts_elsewhere") {
    return {
      question: `The taxpayer named "${expense.name}" in the deductions conversation. It is not an itemized deduction, and it may count here: ${expense.where}. Take it up in the return's conversation.`,
      context,
    };
  }
  if (expense.outcome === "not_sure") {
    return {
      question: `For the CPA: the taxpayer named "${expense.name}" in the deductions conversation, and Cade could not say whether it counts.`,
      context,
    };
  }
  return undefined;
}

/* The life question to answer yes, when the expense counts under an item no yes has opened. */
function questionToOpen(
  expense: NamedExpense,
  statuses: ReadonlyMap<LifeQuestionId, LifeQuestionStatus>,
): LifeQuestionId | undefined {
  if (expense.outcome !== "counts_here" || !expense.item) return undefined;
  const question = LIFE_QUESTIONS.find((each) => each.items.includes(expense.item!));
  if (!question) return undefined;
  const status = statuses.get(question.id);
  return status === "no" || status === "unasked" ? question.id : undefined;
}

/* One expense: the fact that holds the taxpayer's words, and the decision that cites it. */
function planExpense(expense: NamedExpense, answer: DoorAnswer): PlannedExpense {
  const factKey = namedFactKey(expense.slug);
  const { outcome } = expense;
  const { sourceNote } = answer;
  return {
    name: expense.name,
    outcome,
    fact: { category: "other", key: factKey, value: expense.taxpayerWords, sourceNote },
    decision: {
      decisionKey: namedDecisionKey(expense.slug),
      decision: {
        outcome,
        ...(outcome === "counts_here" && { item: expense.item }),
        ...(outcome === "counts_elsewhere" && { where: expense.where }),
      },
      rationale: expense.rationale,
      supportingFactKeys: [factKey],
      confidence: expense.confidence,
    },
    opens: questionToOpen(expense, answer.statuses),
    question: questionFor(expense, sourceNote),
  };
}

/* One yes per life question the expenses open: the flow then asks the item's exact amount. */
function yesFacts(expenses: readonly PlannedExpense[], answer: DoorAnswer): PlannedFact[] {
  const firstToOpen = new Map<LifeQuestionId, string>();
  for (const { opens, name } of expenses) {
    if (opens && !firstToOpen.has(opens)) firstToOpen.set(opens, name);
  }
  const answers = [...firstToOpen].map(([id, name]) => ({
    id,
    answer: true,
    sourceNote: `The open door: the taxpayer named "${name}". ${answer.sourceNote}`,
  }));
  return planLifeAnswers(answer.year, answers, answer.stated).facts;
}

/* The door closes when the taxpayer said so, the call has no problem, and it is not closed already. */
function closingFacts(plan: DoorPlan, answer: DoorAnswer): PlannedFact[] {
  const closes =
    answer.nothingElse &&
    plan.problems.length === 0 &&
    answer.stated.facts.get(NOTHING_ELSE_KEY) !== true;
  if (!closes) return [];
  const sourceNote = `The open door: the taxpayer said that nothing else is left. ${answer.sourceNote}`;
  return [{ category: "other", key: NOTHING_ELSE_KEY, value: true, sourceNote }];
}

/*
 * What one answer at the door writes: for each expense, the fact that holds
 * the taxpayer's words and the decision that cites it; then the yes for each
 * item an expense opens; then the fact that closes the door.
 */
export function planNamedExpenses(expenses: readonly NamedExpense[], answer: DoorAnswer): DoorPlan {
  const plan: DoorPlan = { expenses: [], facts: [], problems: [] };
  const slugs = new Set<string>();
  for (const expense of expenses) {
    const problem = problemWith(expense, slugs);
    if (problem) {
      plan.problems.push({ name: expense.name, problem });
      continue;
    }
    slugs.add(expense.slug);
    plan.expenses.push(planExpense(expense, answer));
  }
  plan.facts = [...yesFacts(plan.expenses, answer), ...closingFacts(plan, answer)];
  return plan;
}

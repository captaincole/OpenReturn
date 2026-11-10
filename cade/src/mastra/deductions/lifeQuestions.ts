/*
 * The life questions that open the deductions conversation: yes/no questions
 * about the taxpayer's year, not about form lines. They are Cade's; the engine
 * asks only line-level amounts (its deductions catalog). A no becomes facts of
 * 0, which close the question's items (a renter: mortgage interest 0). A yes
 * leads to the amounts of the items it opens.
 */

import type { ItemId, ItemState } from "@openreturn/engine";
import { INVESTMENT_INTEREST_KEYS, MORTGAGE_KEYS } from "@openreturn/engine/facts";
import type { CATEGORIES } from "../tools/taxFacts";

type Category = (typeof CATEGORIES)[number];

export const LIFE_QUESTION_IDS = [
  "itemized_last_year",
  "owns_home",
  "ca_vehicle",
  "gave_money",
  "gave_things",
  "medical",
  "margin_loan",
] as const;
export type LifeQuestionId = (typeof LIFE_QUESTION_IDS)[number];

export interface LifeQuestion {
  id: LifeQuestionId;
  /** The question in plain words. */
  ask: (year: number) => string;
  /** The catalog items a yes opens. Empty for a question that only gives context. */
  items: ItemId[];
  /** The facts a no records as 0: each closes one of the items. */
  zeroFacts: { category: Category; key: string }[];
}

export const LIFE_QUESTIONS: readonly LifeQuestion[] = [
  {
    id: "itemized_last_year",
    ask: () => "Did you itemize deductions on last year's return?",
    items: [],
    zeroFacts: [],
  },
  {
    id: "owns_home",
    ask: (year) => `Did you own your home in ${year}?`,
    items: ["mortgage_interest", "real_estate_tax"],
    zeroFacts: [
      { category: "mortgage", key: MORTGAGE_KEYS.interestForm1098 },
      { category: "state_local_tax", key: "state_local_tax.real_estate" },
    ],
  },
  {
    id: "ca_vehicle",
    ask: (year) => `Did you pay to register a car or other vehicle in California in ${year}?`,
    items: ["personal_property_tax"],
    zeroFacts: [{ category: "state_local_tax", key: "state_local_tax.personal_property" }],
  },
  {
    id: "gave_money",
    ask: (year) => `Did you give money to a charity in ${year}?`,
    items: ["gifts_cash"],
    zeroFacts: [{ category: "charitable", key: "charitable.cash" }],
  },
  {
    id: "gave_things",
    ask: (year) =>
      `Did you give things to a charity in ${year}: clothes, furniture, a car, shares of stock?`,
    items: ["gifts_property"],
    zeroFacts: [{ category: "charitable", key: "charitable.noncash" }],
  },
  {
    id: "medical",
    ask: (year) =>
      `Was ${year} a big year for medical or dental bills you paid yourself: more than about 7.5% of your income?`,
    items: ["medical"],
    zeroFacts: [{ category: "medical", key: "medical.expenses_total" }],
  },
  {
    id: "margin_loan",
    ask: (year) =>
      `Did you pay interest in ${year} on a margin loan or other money you borrowed to buy investments, or carry such interest over from last year's Form 4952?`,
    items: ["investment_interest"],
    zeroFacts: [
      { category: "investment_income", key: INVESTMENT_INTEREST_KEYS.expensePaid },
      { category: "investment_income", key: INVESTMENT_INTEREST_KEYS.disallowedCarryover },
    ],
  },
];

/* Each answer is a fact: the taxpayer said it, and the source note holds their words. */
export const lifeFactKey = (id: LifeQuestionId): string => `deductions.life.${id}`;

export type LifeQuestionStatus =
  /** Cade asks it. */
  | "unasked"
  | "yes"
  | "no"
  /** Never asked: a fact that arrived early (a Form 1098) already opened one of its items. */
  | "settled";

const itemsOf = (question: LifeQuestion, items: readonly ItemState[]) =>
  items.filter((item) => question.items.includes(item.id));

export function lifeQuestionStatus(
  question: LifeQuestion,
  facts: ReadonlyMap<string, unknown>,
  items: readonly ItemState[],
): LifeQuestionStatus {
  const answer = facts.get(lifeFactKey(question.id));
  if (answer === true) return "yes";
  if (answer === false) return "no";
  return itemsOf(question, items).some((item) => item.status !== "unasked") ? "settled" : "unasked";
}

export interface LifeAnswer {
  id: LifeQuestionId;
  answer: boolean;
  /** The taxpayer's words and the date. */
  sourceNote: string;
}

export interface PlannedFact {
  category: Category;
  key: string;
  value: boolean | number;
  sourceNote: string;
}

export interface AnswerPlan {
  /** The answer facts, and the facts of 0 for each no. */
  facts: PlannedFact[];
  /** A no against an amount already stated above 0: nothing is recorded for the question. */
  conflicts: { id: LifeQuestionId; key: string; stated: number }[];
  /** A yes whose items are at 0 (an earlier no): Cade asks their amounts. */
  atZero: { id: LifeQuestionId; items: ItemId[] }[];
}

export interface StatedAmounts {
  /** The facts, one value per key. */
  facts: ReadonlyMap<string, unknown>;
  /** The assumptions in use, one value per key. */
  assumptions: ReadonlyMap<string, unknown>;
}

const above0 = (value: unknown): value is number => typeof value === "number" && value > 0;

function planNo(question: LifeQuestion, answer: LifeAnswer, year: number, stated: StatedAmounts) {
  const conflicts = question.zeroFacts.flatMap(({ key }) => {
    const amount = [stated.facts.get(key), stated.assumptions.get(key)].find(above0);
    return amount === undefined ? [] : [{ id: question.id, key, stated: amount }];
  });
  if (conflicts.length > 0) return { facts: [], conflicts };
  const sourceNote = `"${question.ask(year)}" No. ${answer.sourceNote}`;
  const zeros = question.zeroFacts
    // A fact of 0 is already there: the audit log needs no second row.
    .filter(({ key }) => stated.facts.get(key) !== 0)
    .map((zero) => ({ ...zero, value: 0, sourceNote }));
  return { facts: zeros, conflicts };
}

/* What a batch of answers writes. Pure: the tool does the writes. */
export function planLifeAnswers(
  year: number,
  answers: readonly LifeAnswer[],
  stated: StatedAmounts,
  items: readonly ItemState[],
): AnswerPlan {
  const plan: AnswerPlan = { facts: [], conflicts: [], atZero: [] };
  for (const answer of answers) {
    const question = LIFE_QUESTIONS.find((candidate) => candidate.id === answer.id)!;
    const answerFact: PlannedFact = {
      category: "other",
      key: lifeFactKey(question.id),
      value: answer.answer,
      sourceNote: answer.sourceNote,
    };
    if (answer.answer) {
      const closed = itemsOf(question, items).filter((item) => item.status === "closed");
      if (closed.length > 0) {
        plan.atZero.push({ id: question.id, items: closed.map((item) => item.id) });
      }
      plan.facts.push(answerFact);
      continue;
    }
    const no = planNo(question, answer, year, stated);
    plan.conflicts.push(...no.conflicts);
    if (no.conflicts.length === 0) plan.facts.push(answerFact, ...no.facts);
  }
  return plan;
}

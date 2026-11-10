/*
 * The deductions conversation's state, as /app/state sends it, and the plain
 * words the web app shows for it. Keep the types in sync by hand with
 * deductionsView in cade/src/mastra/deductions/state.ts.
 */

export type ItemStatus =
  "unasked" | "closed" | "open" | "assumed" | "exact" | "below_floor" | "for_cpa";

export interface DeductionItem {
  id: string;
  title: string;
  status: ItemStatus;
  amount: number | null;
  /** The amount rests on a rough number the taxpayer gave. */
  assumed: boolean;
  missing: string[];
}

export interface JurisdictionComparison {
  itemized: number;
  standard: number;
  /** Itemized less standard: positive means itemizing wins. */
  margin: number;
  recommendation: "itemize" | "standard";
  decidingItems: string[];
}

export interface LifeQuestion {
  id: string;
  ask: string;
  status: "unasked" | "yes" | "no" | "settled";
}

interface AmountAsk {
  item: string;
  title: string;
  keys: { key: string; category: string; roughAllowed: boolean }[];
}

/* The one step the conversation takes now: the answers to tap come from it. */
export type NextStep =
  | { step: "ask_life_questions"; questions: { id: string; ask: string }[] }
  | { step: "ask_anything_else"; ask: string; why?: string; suggestions: string[]; done: string }
  | { step: "ask_amounts"; items: AmountAsk[] }
  | { step: "wait_for_return"; why: string }
  | { step: "get_exact_amounts"; items: AmountAsk[] }
  | { step: "close" }
  | { step: "closed" };

export type NamedOutcome = "counts_here" | "counts_elsewhere" | "does_not_count" | "not_sure";

export interface NamedExpense {
  slug: string;
  /** What the taxpayer said, word for word. */
  words: string;
  outcome: NamedOutcome | null;
  where: string | null;
}

export interface DeductionRecord {
  item: string;
  title: string;
  amount: number;
  sourceNotes: string[];
}

export interface DeductionsView {
  taxYear: number;
  lifeQuestions: LifeQuestion[];
  next: NextStep;
  items: DeductionItem[];
  comparison: { federal: JurisdictionComparison | null; ca: JurisdictionComparison | null };
  recordedDecisions: { itemizeOrStandard: unknown; scheduleAFiles: unknown };
  namedExpenses: NamedExpense[];
  /** Cade's closing paragraph. Null until the conversation is closed. */
  summary: string | null;
  records: DeductionRecord[];
}

const STEP_LABELS: Record<NextStep["step"], string> = {
  ask_life_questions: "Cade asks about your year",
  ask_anything_else: "Cade asks what else you paid",
  ask_amounts: "Cade asks the amounts",
  wait_for_return: "Waits for the income and filing status on your return",
  get_exact_amounts: "Cade needs exact amounts or documents",
  close: "Ready for Cade to close",
  closed: "Done",
};

export const stepLabel = (next: NextStep): string => STEP_LABELS[next.step];

const STATUS_LABELS: Record<ItemStatus, string> = {
  unasked: "Not asked yet",
  closed: "Nothing to deduct",
  open: "Amount needed",
  assumed: "Rough amount",
  exact: "Exact amount",
  below_floor: "Under the income floor",
  for_cpa: "For the CPA",
};

export const statusLabel = (status: ItemStatus): string => STATUS_LABELS[status];

const OUTCOME_LABELS: Record<NamedOutcome, string> = {
  counts_here: "Counts here",
  counts_elsewhere: "Counts elsewhere on the return",
  does_not_count: "Does not count",
  not_sure: "For the CPA",
};

export const outcomeLabel = (outcome: NamedOutcome | null): string =>
  outcome ? OUTCOME_LABELS[outcome] : "Cade is checking";

const LIFE_ANSWER_LABELS: Record<LifeQuestion["status"], string> = {
  unasked: "Not asked yet",
  yes: "Yes",
  no: "No",
  settled: "From your documents",
};

export const lifeAnswerLabel = (status: LifeQuestion["status"]): string =>
  LIFE_ANSWER_LABELS[status];

export const dollars = (amount: number): string => `$${amount.toLocaleString("en-US")}`;

/* A difference: the sign shows which side is larger. */
export const signedDollars = (amount: number): string =>
  amount < 0 ? `-${dollars(-amount)}` : `+${dollars(amount)}`;

/*
 * The message a set of tapped answers sends. One open question: the bare
 * answer. Several: each answer names its question, so Cade cannot attach a
 * "Yes" to the wrong one.
 */
export function lifeAnswersMessage(
  open: readonly { id: string; ask: string }[],
  answers: ReadonlyMap<string, boolean>,
): string {
  const word = (answer: boolean) => (answer ? "Yes" : "No");
  const answered = open.filter((question) => answers.has(question.id));
  if (open.length === 1 && answered.length === 1) return word(answers.get(open[0].id)!);
  return answered
    .map((question) => `${question.ask} ${word(answers.get(question.id)!)}.`)
    .join("\n");
}

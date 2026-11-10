/*
 * The deductions conversation's tools. The engine holds the state (item states
 * and the comparison); these tools read it, record the life answers as facts,
 * record what the open door finds as decisions, and close the conversation
 * with the decisions the comparison gives.
 */

import { createTool } from "@mastra/core/tools";
import type { EvaluatedScenario } from "@openreturn/engine";
import { z } from "zod";
import { noteQuestion, recordFacts } from "../db/taxFacts";
import { ITEMIZE_KEY, planClosing, SCHEDULE_A_KEY } from "../deductions/closing";
import { deductionsFlow, valuesByKey } from "../deductions/flow";
import {
  LIFE_QUESTION_IDS,
  planLifeAnswers,
  type PlannedFact,
  type StatedAmounts,
} from "../deductions/lifeQuestions";
import {
  DOOR_ITEMS,
  OUTCOMES,
  planNamedExpenses,
  type PlannedExpense,
} from "../deductions/openDoor";
import { loadAndEvaluateScenario } from "../loadScenario";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordAndReview } from "./aiDecisions";
import { slugify } from "./ingestShared";
import { requireUserContext, type UserContext } from "./userContext";

const loadScenario = ({ scope, filingId, taxYear, authEmail }: UserContext) =>
  loadAndEvaluateScenario(scope, { id: filingId, taxYear }, authEmail);

const statedAmounts = (scenario: EvaluatedScenario): StatedAmounts => ({
  facts: valuesByKey(scenario.facts),
  assumptions: valuesByKey(scenario.assumptionsInUse),
});

const writeFacts = (
  user: UserContext,
  facts: readonly (Omit<PlannedFact, "value"> & { value: unknown })[],
) =>
  recordFacts(
    user.scope,
    facts.map((fact) => ({
      id: crypto.randomUUID(),
      userId: user.userId,
      filingId: user.filingId,
      taxYear: user.taxYear,
      ...fact,
    })),
  );

const nextStep = z
  .looseObject({
    step: z.enum([
      "ask_life_questions",
      "ask_anything_else",
      "ask_amounts",
      "wait_for_return",
      "get_exact_amounts",
      "close",
      "closed",
    ]),
  })
  .describe(
    "What to do now. ask_life_questions: ask the listed yes/no questions. ask_anything_else: ask `ask` (the open door) and record what the taxpayer names with record-named-expenses. ask_amounts: ask each key of each item; a rough amount is allowed only where roughAllowed is true. wait_for_return: the comparison needs income and filing status from the return's conversation. get_exact_amounts: get the document or exact amount behind each rough amount listed. close: call close-deductions. closed: nothing to do.",
  );

/* What Cade reads at the start of a turn. Every number is the engine's. */
export function deductionsState(scenario: EvaluatedScenario) {
  const { items, comparison } = scenario.deductions;
  const recorded = (decisionKey: string) =>
    scenario.decisions.find((decision) => decision.decisionKey === decisionKey)?.decision ?? null;
  return {
    taxYear: scenario.filing.taxYear,
    ...deductionsFlow(scenario),
    items: items.map(({ id, title, status, amount, assumed, missing }) => ({
      id,
      title,
      status,
      amount: amount ?? null,
      assumed,
      missing,
    })),
    comparison: { federal: comparison?.federal ?? null, ca: comparison?.ca ?? null },
    recordedDecisions: {
      itemizeOrStandard: recorded(ITEMIZE_KEY),
      scheduleAFiles: recorded(SCHEDULE_A_KEY),
    },
  };
}

export const getDeductions = createTool({
  id: "get-deductions",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Returns the live state of the deductions conversation: each life question and its status (unasked, yes, no, or settled by a fact that arrived early), each deduction item with its status and amount, the itemized-or-standard comparison for the federal and California returns (null until the return has income and a filing status), the recorded decisions, and `next`: the one step to take now. Call at the start of every turn and follow `next`. Never compute a total or a comparison yourself.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    taxYear: z.number().describe("The return's tax year: pass it as `year` to the record tools"),
    lifeQuestions: z.array(z.object({ id: z.string(), ask: z.string(), status: z.string() })),
    items: z.array(z.any()),
    comparison: z.object({ federal: z.any().nullable(), ca: z.any().nullable() }),
    recordedDecisions: z.object({ itemizeOrStandard: z.any(), scheduleAFiles: z.any() }),
    next: nextStep,
  }),
  execute: async (_input, context) =>
    deductionsState(await loadScenario(await requireUserContext(context))),
});

const lifeAnswer = z.object({
  id: z.enum(LIFE_QUESTION_IDS).describe("The life question's id, from get-deductions"),
  answer: z.boolean().describe("true for yes, false for no"),
  sourceNote: z
    .string()
    .describe("The taxpayer's words and the date, e.g. 'I rent, verbal, 2026-11-08'"),
});

export const answerLifeQuestions = createTool({
  id: "answer-life-questions",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Record the taxpayer's yes or no to one or more life questions. Each answer becomes a fact. A no also records a fact of 0 for each amount the question covers (a renter: mortgage interest 0, real estate tax 0), which closes those items. A yes records only the answer: `next` then asks the amounts, also the ones an earlier no recorded as 0. Returns `conflicts` when a no disagrees with an amount already stated above 0: nothing was recorded for that question, so ask the taxpayer which is right. Record only what the taxpayer said; an unclear answer is not a no.",
  inputSchema: z.object({
    // No .max(): Anthropic rejects maxItems on a tool schema.
    answers: z.array(lifeAnswer).describe("One entry per question the taxpayer answered"),
  }),
  outputSchema: z.object({
    recorded: z.array(z.string()).describe("The fact keys written"),
    conflicts: z.array(z.object({ id: z.string(), key: z.string(), stated: z.number() })),
    next: nextStep,
  }),
  execute: async (input, context) => {
    const user = await requireUserContext(context);
    const stated = statedAmounts(await loadScenario(user));
    const plan = planLifeAnswers(user.taxYear, input.answers, stated);
    if (plan.facts.length > 0) await writeFacts(user, plan.facts);
    return {
      recorded: plan.facts.map((fact) => fact.key),
      conflicts: plan.conflicts,
      next: deductionsFlow(await loadScenario(user)).next,
    };
  },
});

const namedExpense = z.object({
  name: z.string().describe("The expense in a few plain words, e.g. 'home office'"),
  taxpayerWords: z.string().describe("What the taxpayer said about it, word for word"),
  outcome: z
    .enum(OUTCOMES)
    .describe(
      "counts_here: one of the deduction items covers it. counts_elsewhere: it is not an itemized deduction, and it may count in a different place on the return. does_not_count: it is not deductible anywhere on the return. not_sure: it might count and no item covers it, or you cannot say; the CPA gets it.",
    ),
  item: z
    .enum(DOOR_ITEMS)
    .optional()
    .describe("counts_here only: the id of the item that covers it, from get-deductions"),
  where: z
    .string()
    .optional()
    .describe("counts_elsewhere only: the place, e.g. 'Schedule 1, student loan interest'"),
  rationale: z.string().describe("Why this outcome, in plain words"),
  confidence: z.enum(["low", "medium", "high"]),
});

const DOOR_SOURCE_NOTE =
  "The open door of the deductions conversation: Cade's classification of an expense the taxpayer named.";

/* One named expense: the taxpayer's words, the decision that cites them, and the open question, when it has one. */
async function recordExpense(user: UserContext, expense: PlannedExpense): Promise<void> {
  const { userId, filingId, taxYear } = user;
  await writeFacts(user, [expense.fact]);
  const decision = await recordAndReview(user.scope, {
    id: crypto.randomUUID(),
    userId,
    filingId,
    taxYear,
    sourceNote: DOOR_SOURCE_NOTE,
    ...expense.decision,
  });
  if (!expense.question) return;
  await noteQuestion(user.scope, {
    id: crypto.randomUUID(),
    userId,
    filingId,
    decisionId: decision.id,
    ...expense.question,
  });
}

export const recordNamedExpenses = createTool({
  id: "record-named-expenses",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Record what the taxpayer answered at the open door ('anything else you paid that might count?'). For each expense they name, record their words and your classification: one of four outcomes. The classification is a decision, so it gets the background grounding review. counts_here opens the item: after the door closes, `next` asks its amount. When the item already has an amount, ask whether that amount includes this expense, and record a new total with record-tax-facts. counts_elsewhere leaves a note for the return's conversation. not_sure leaves the taxpayer's words for the CPA: use it for an expense that might count and that no item covers. This tool never records an amount. Set `nothingElse` when the taxpayer says that nothing else is left: it closes the door. Returns `problems` for each expense to send again; nothing was recorded for those.",
  inputSchema: z.object({
    // No .max(): Anthropic rejects maxItems on a tool schema.
    expenses: z.array(namedExpense).describe("One entry per expense named; empty when none"),
    nothingElse: z.boolean().describe("true when the taxpayer said that nothing else is left"),
    sourceNote: z.string().describe("How and when the taxpayer said it, e.g. 'verbal, 2026-11-09'"),
  }),
  outputSchema: z.object({
    recorded: z.array(z.string()).describe("The fact keys written"),
    decisions: z.array(z.string()).describe("The decision keys written"),
    problems: z.array(z.object({ name: z.string(), problem: z.string() })),
    next: nextStep,
  }),
  execute: async (input, context) => {
    const user = await requireUserContext(context);
    const before = await loadScenario(user);
    const statuses = new Map(
      deductionsFlow(before).lifeQuestions.map((question) => [question.id, question.status]),
    );
    const named = input.expenses.map((expense) => ({ ...expense, slug: slugify(expense.name) }));
    const plan = planNamedExpenses(named, {
      year: user.taxYear,
      sourceNote: input.sourceNote,
      nothingElse: input.nothingElse,
      statuses,
      stated: statedAmounts(before),
    });
    for (const expense of plan.expenses) await recordExpense(user, expense);
    if (plan.facts.length > 0) await writeFacts(user, plan.facts);
    return {
      recorded: [
        ...plan.expenses.map((expense) => expense.fact.key),
        ...plan.facts.map((fact) => fact.key),
      ],
      decisions: plan.expenses.map((expense) => expense.decision.decisionKey),
      problems: plan.problems,
      next: deductionsFlow(await loadScenario(user)).next,
    };
  },
});

const CLOSING_SOURCE_NOTE =
  "The deductions comparison at closing: Schedule A line 17 and Schedule CA line 29 against each return's standard deduction.";

export const closeDeductions = createTool({
  id: "close-deductions",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Close the deductions conversation. Call only when get-deductions says next.step is 'close'. Records the decision to itemize or take the standard deduction from the engine's comparison, and that Schedule A files when the California return itemizes although the federal return does not. Each decision gets the background grounding review. Returns `summary`, the one paragraph to give the taxpayer word for word, and `records`, the amounts on an itemized return the CPA checks against the taxpayer's records. When the conversation is not ready, it records nothing and returns closed=false with `next`.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    closed: z.boolean(),
    summary: z.string().optional(),
    records: z
      .array(
        z.object({
          item: z.string(),
          title: z.string(),
          amount: z.number(),
          sourceNotes: z.array(z.string()),
        }),
      )
      .optional(),
    recorded: z.array(z.string()).describe("The decision keys written by this call"),
    next: nextStep,
  }),
  execute: async (_input, context) => {
    const user = await requireUserContext(context);
    const scenario = await loadScenario(user);
    const { next } = deductionsFlow(scenario);
    const plan = planClosing(scenario);
    if (!plan || (next.step !== "close" && next.step !== "closed")) {
      return { closed: false, recorded: [], next };
    }
    // Already closed: the plan holds no decision, so nothing is written twice.
    for (const decision of plan.decisions) {
      await recordAndReview(user.scope, {
        id: crypto.randomUUID(),
        userId: user.userId,
        filingId: user.filingId,
        taxYear: user.taxYear,
        sourceNote: CLOSING_SOURCE_NOTE,
        ...decision,
      });
    }
    return {
      closed: true,
      summary: plan.summary,
      records: plan.records,
      recorded: plan.decisions.map((decision) => decision.decisionKey),
      next: { step: "closed" as const },
    };
  },
});

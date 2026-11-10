/*
 * The deductions conversation's tools. The engine holds the state (item states
 * and the comparison); these tools read it, record the life answers as facts,
 * and close the conversation with the decisions the comparison gives.
 */

import { createTool } from "@mastra/core/tools";
import type { EvaluatedScenario } from "@openreturn/engine";
import { z } from "zod";
import { recordFacts } from "../db/taxFacts";
import { ITEMIZE_KEY, planClosing, SCHEDULE_A_KEY } from "../deductions/closing";
import { deductionsFlow, valuesByKey } from "../deductions/flow";
import { LIFE_QUESTION_IDS, planLifeAnswers } from "../deductions/lifeQuestions";
import { loadAndEvaluateScenario } from "../loadScenario";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordAndReview } from "./aiDecisions";
import { requireUserContext, type UserContext } from "./userContext";

const loadScenario = ({ scope, filingId, taxYear, authEmail }: UserContext) =>
  loadAndEvaluateScenario(scope, { id: filingId, taxYear }, authEmail);

const nextStep = z
  .looseObject({
    step: z.enum([
      "ask_life_questions",
      "ask_amounts",
      "wait_for_return",
      "get_exact_amounts",
      "close",
      "closed",
    ]),
  })
  .describe(
    "What to do now. ask_life_questions: ask the listed yes/no questions. ask_amounts: ask each key of each item; a rough amount is allowed only where roughAllowed is true. wait_for_return: the comparison needs income and filing status from the return's conversation. get_exact_amounts: get the document or exact amount behind each rough amount listed. close: call close-deductions. closed: nothing to do.",
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
    "Record the taxpayer's yes or no to one or more life questions. Each answer becomes a fact. A no also records a fact of 0 for each amount the question covers (a renter: mortgage interest 0, real estate tax 0), which closes those items. A yes records only the answer: `next` then asks the amounts. Returns `conflicts` when a no disagrees with an amount already stated above 0: nothing was recorded for that question, so ask the taxpayer which is right. Returns `atZero` when a yes meets items an earlier no closed at 0: ask their amounts and record them. Record only what the taxpayer said; an unclear answer is not a no.",
  inputSchema: z.object({
    // No .max(): Anthropic rejects maxItems on a tool schema.
    answers: z.array(lifeAnswer).describe("One entry per question the taxpayer answered"),
  }),
  outputSchema: z.object({
    recorded: z.array(z.string()).describe("The fact keys written"),
    conflicts: z.array(z.object({ id: z.string(), key: z.string(), stated: z.number() })),
    atZero: z.array(z.object({ id: z.string(), items: z.array(z.string()) })),
    next: nextStep,
  }),
  execute: async (input, context) => {
    const user = await requireUserContext(context);
    const before = await loadScenario(user);
    const stated = {
      facts: valuesByKey(before.facts),
      assumptions: valuesByKey(before.assumptionsInUse),
    };
    const plan = planLifeAnswers(user.taxYear, input.answers, stated, before.deductions.items);
    if (plan.facts.length > 0) {
      await recordFacts(
        user.scope,
        plan.facts.map((fact) => ({
          id: crypto.randomUUID(),
          userId: user.userId,
          filingId: user.filingId,
          taxYear: user.taxYear,
          ...fact,
        })),
      );
    }
    return {
      recorded: plan.facts.map((fact) => fact.key),
      conflicts: plan.conflicts,
      atZero: plan.atZero,
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

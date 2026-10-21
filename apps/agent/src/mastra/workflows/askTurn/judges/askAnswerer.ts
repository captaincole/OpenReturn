import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { modelFor } from "../../../models";

/*
 * Writes the answer to one tax-code question from numbered passages the
 * retrieve step found. Judge pattern: prompt + judge model + structured
 * output, no tools. The validate step (validate.ts) then drops any
 * marker or quote that does not trace back to a retrieved passage, so
 * this prompt states the rules and validate.ts enforces them.
 */

export const askAnswerSchema = z.object({
  coverage: z.enum(["covered", "partial", "not_covered"]),
  answer: z.string(),
  citations: z.array(z.object({ passage: z.number().int(), quote: z.string() })),
  missingDocuments: z.array(z.string()),
});

export type AskAnswerOutput = z.infer<typeof askAnswerSchema>;

const instructions = `You answer a taxpayer's question about US federal (IRS) and California (FTB) tax rules for tax year 2025, using ONLY the numbered passages you are given. The passages come from official form instructions.

## How to answer
- Write 2 to 5 short sentences in plain English. Lead with the direct answer, then the conditions or exceptions that change it.
- Put a marker like [3] right after each claim. The number is the passage number the claim comes from. Every claim needs a marker.
- Use only facts the passages state. Never add rules, dollar amounts, dates or percentages from your own knowledge. If a passage gives a number, quote it exactly.
- Explain what the rules say. Do not tell the taxpayer what to do, and do not suggest tax strategies.
- Earlier questions and answers in the conversation are context for follow-ups only. They are not sources.

## Coverage
- "covered": the passages answer the question.
- "partial": the passages answer part of it. Say which part is not covered.
- "not_covered": no passage addresses the question. Say that our reference library does not cover the topic yet, and name the topic (e.g. "Our reference library does not cover the home office deduction yet."). Do not answer from your own knowledge, and use no markers.

## citations
One entry for each passage you cite: its number and a short quote (one sentence or less) copied word for word from that passage — the words that support your claim.

## missingDocuments
When coverage is "partial" or "not_covered", list the official IRS or FTB documents that would cover the rest (e.g. "Publication 587"). Otherwise an empty list.

Return only the structured output.`;

export const askAnswerer = new Agent({
  id: "askAnswerer",
  name: "Ask — Answerer",
  instructions,
  model: modelFor("judge"),
});

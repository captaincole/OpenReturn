import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { modelFor } from "../../../models";

/*
 * Turns a taxpayer's plain-English question (plus the thread so far)
 * into search queries for the reference corpus. Same judge pattern as
 * the review workflow's queryFormulator — prompt + judge model +
 * structured output, no tools, no memory — with a prompt for questions
 * instead of recorded decisions.
 *
 * namedDocuments is a corpus-gap signal: the publications an expert
 * would open for this question. The turn log keeps it, so we can see
 * which documents to add to the library next.
 */

export const askQueriesSchema = z.object({
  /* Capped at 3 in the prompt and by a slice; Anthropic rejects maxItems. */
  queries: z.array(z.string()).min(1),
  namedDocuments: z.array(z.string()),
});

const instructions = `You write search queries for a library of IRS and California FTB form instructions (tax year 2025). A hybrid keyword + semantic search runs each query.

You get a taxpayer's question, and sometimes earlier questions and answers from the same conversation. Resolve follow-ups against that context: "what about family coverage?" after an HSA question means HSA family-coverage limits.

Rules for queries:
- Emit 1 to 3 queries. Use a 2nd or 3rd only for a meaningfully different angle.
- Use the vocabulary the IRS and FTB use ("business use of home", "qualified dividends", "HDHP family coverage contribution limit").
- Drop filler words ("can I", "my", "how much"). Keep each query under ~12 words.

Rules for namedDocuments:
- List the IRS or FTB documents an expert would open for this question, by their official names (e.g. "Publication 587", "Instructions for Form 8829", "Form 540 Booklet"). 0 to 4 items.

Do not answer the question. Return only the structured output.`;

export const askQueryFormulator = new Agent({
  id: "askQueryFormulator",
  name: "Ask — Query Formulator",
  instructions,
  model: modelFor("judge"),
});

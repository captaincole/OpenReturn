import { z } from "zod";
import type { SourceFormat } from "../../../db/corpusStore";

/*
 * The Ask The Tax Code contract. Canon is stateless: a question and the
 * earlier turns go in, an answer with citations comes out. Threads (who
 * asked what, when) belong to the caller, so Cade keeps them in app.db
 * and passes the completed Q&A pairs back as `history`.
 */

export type { SourceFormat };
export type AskCoverage = "covered" | "partial" | "not_covered";
/** Which pipeline step is running; the caller may show it as progress. */
export type AskStage = "formulating" | "retrieving" | "answering";

/** One numbered reference behind an `[n]` marker in the answer. */
export interface AskCitation {
  n: number;
  blockId: string;
  docId: string;
  documentTitle: string;
  /** Missing on citations saved before HTML documents existed: read it as "pdf". */
  format?: SourceFormat;
  sectionHeading: string | null;
  pageNum: number;
  quote: string;
}

/** A completed earlier turn of the same conversation, oldest first. */
export interface AskHistoryTurn {
  question: string;
  answer: string;
}

export const askCitationSchema = z.object({
  n: z.number().int(),
  blockId: z.string(),
  docId: z.string(),
  documentTitle: z.string(),
  format: z.enum(["pdf", "html"]).optional(),
  sectionHeading: z.string().nullable(),
  pageNum: z.number(),
  quote: z.string(),
});

export const askInputSchema = z.object({
  question: z.string().min(1).max(2000).describe("The tax-code question."),
  history: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .default([])
    .describe("Completed earlier turns of the same conversation, oldest first."),
});

export const askResultSchema = z.object({
  answer: z.string(),
  coverage: z.enum(["covered", "partial", "not_covered"]),
  citations: z.array(askCitationSchema),
  /** Documents the question names that the library does not hold. */
  missingDocuments: z.array(z.string()),
  /** Each step's input, output and timing: the query log. */
  log: z.object({ steps: z.array(z.record(z.unknown())) }),
});

export type AskInput = z.infer<typeof askInputSchema>;
export type AskResult = z.infer<typeof askResultSchema>;

/*
 * What the `ask` workflow (and so run_ask) returns: the result, or the
 * failure with the query log up to it, so the caller keeps the log.
 */
export const askRunResultSchema = z.discriminatedUnion("status", [
  askResultSchema.extend({ status: z.literal("ok") }),
  z.object({
    status: z.literal("failed"),
    error: z.string(),
    log: z.object({ steps: z.array(z.record(z.unknown())) }),
  }),
]);
export type AskRunResult = z.infer<typeof askRunResultSchema>;

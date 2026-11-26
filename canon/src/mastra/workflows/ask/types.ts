import { z } from "zod";
import type { CorpusFormat, SourceFormat } from "../../../db/corpusStore";
import { conflictSchema, statuteBlockSchema } from "../statute";

// Canon is stateless: Cade keeps the threads in app.db and sends `history`.
export type { SourceFormat };
export type AskCoverage = "covered" | "partial" | "not_covered";
export type AskStage = "formulating" | "retrieving" | "answering";

export interface AskCitation {
  n: number;
  blockId: string;
  docId: string;
  documentTitle: string;
  /** Missing on citations saved before HTML documents existed: read it as "pdf". */
  format?: CorpusFormat;
  sectionHeading: string | null;
  pageNum: number;
  quote: string;
  /** A statute passage only: "26 U.S.C. § 469(g)(1)". */
  citation?: string;
}

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
  citation: z.string().optional(),
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
  missingDocuments: z.array(z.string()),
  // The statute passages the answerer saw; empty when the statute was not searched.
  statutePassages: z.array(statuteBlockSchema).default([]),
  statuteConsulted: z.boolean().default(false),
  // Passages that disagree, with both quotes; nothing picks a winner.
  conflicts: z.array(conflictSchema).default([]),
  log: z.object({ steps: z.array(z.record(z.string(), z.unknown())) }),
});

export type AskInput = z.infer<typeof askInputSchema>;
export type AskResult = z.infer<typeof askResultSchema>;

// A failure still returns the query log, so the caller keeps it.
export const askRunResultSchema = z.discriminatedUnion("status", [
  askResultSchema.extend({ status: z.literal("ok") }),
  z.object({
    status: z.literal("failed"),
    error: z.string(),
    log: z.object({ steps: z.array(z.record(z.string(), z.unknown())) }),
  }),
]);
export type AskRunResult = z.infer<typeof askRunResultSchema>;

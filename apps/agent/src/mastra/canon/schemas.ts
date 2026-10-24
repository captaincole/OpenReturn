import { z } from "zod";

/*
 * Cade's view of Canon's contract: the shapes it sends over MCP and the
 * shapes it parses on the way back. Canon owns the contract
 * (canon/src/mastra/workflows/{ask,ground}); this file is the consumer's
 * copy, so a change on Canon's side that Cade does not expect fails at
 * the parse, not deep in a step. Only the fields Cade uses are declared;
 * zod drops the rest.
 */

/* ---------- search ---------- */

export const searchHitSchema = z.object({
  blockId: z.string(),
  docId: z.string(),
  text: z.string(),
  score: z.number(),
});
export const searchResultSchema = z.object({ results: z.array(searchHitSchema) });
export type SearchHit = z.infer<typeof searchHitSchema>;

/* ---------- ask ---------- */

export type AskCoverage = "covered" | "partial" | "not_covered";
/** Which pipeline step a running turn is in; the page shows it as progress. */
export type AskStage = "formulating" | "retrieving" | "answering";
export type SourceFormat = "pdf" | "html";

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

export const askResultSchema = z.object({
  answer: z.string(),
  coverage: z.enum(["covered", "partial", "not_covered"]),
  citations: z.array(askCitationSchema),
  missingDocuments: z.array(z.string()),
  /** The query log: each step's input, output and timing. */
  log: z.object({ steps: z.array(z.record(z.unknown())) }),
});
export type AskResult = z.infer<typeof askResultSchema>;

/* run_ask: the result, or the failure with the query log up to it. */
export const askRunResultSchema = z.discriminatedUnion("status", [
  askResultSchema.extend({ status: z.literal("ok") }),
  z.object({
    status: z.literal("failed"),
    error: z.string(),
    log: z.object({ steps: z.array(z.record(z.unknown())) }),
  }),
]);
export type AskRunResult = z.infer<typeof askRunResultSchema>;

/* ---------- ground ---------- */

export const groundDecisionSchema = z.object({
  taxYear: z.number().int(),
  decisionKey: z.string(),
  decision: z.unknown(),
  rationale: z.string(),
  confidence: z.string(),
  dissentingConsiderations: z.string().nullable(),
  supportingFactKeys: z.array(z.string()),
});

export const taxFactSnapshotSchema = z.object({
  key: z.string(),
  category: z.string(),
  value: z.unknown(),
  sourceNote: z.string().nullable(),
});

export const groundInputSchema = z.object({
  decision: groundDecisionSchema,
  facts: z.array(taxFactSnapshotSchema),
  /** Retrieval rounds the judges may take (Canon's default: 3). */
  maxIterations: z.number().int().optional(),
});
export type GroundInput = z.infer<typeof groundInputSchema>;

export const authorityCitationSchema = z.object({
  blockId: z.string(),
  quote: z.string().optional(),
});

export const groundStepLogSchema = z.object({
  iteration: z.number().int(),
  kind: z.enum(["gather", "assess", "rule"]),
  durationMs: z.number(),
  input: z.unknown(),
  output: z.unknown(),
});
export type GroundStepLog = z.infer<typeof groundStepLogSchema>;

export const groundResultSchema = z.object({
  verdict: z.enum(["accurate", "inaccurate", "needs_more_facts"]),
  reason: z.string(),
  citations: z.array(authorityCitationSchema),
  riskTier: z.enum(["low", "medium", "high"]).nullable(),
  iterationCount: z.number().int(),
  whatsMissing: z.string().optional(),
  log: z.object({ steps: z.array(groundStepLogSchema) }),
});
export type GroundResult = z.infer<typeof groundResultSchema>;

/* run_ground: the result, or the failure with the judge steps that ran. */
export const groundRunResultSchema = z.discriminatedUnion("status", [
  groundResultSchema.extend({ status: z.literal("ok") }),
  z.object({
    status: z.literal("failed"),
    error: z.string(),
    log: z.object({ steps: z.array(groundStepLogSchema) }),
  }),
]);
export type GroundRunResult = z.infer<typeof groundRunResultSchema>;

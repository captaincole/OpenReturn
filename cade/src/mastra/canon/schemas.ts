import { z } from "zod";
import { jurisdictionSchema } from "./jurisdictions";

/*
 * Cade's copy of Canon's MCP contract, so an unexpected change on Canon's side
 * fails at the parse, not deep in a step.
 */

export type AskCoverage = "covered" | "partial" | "not_covered";
export type AskStage = "formulating" | "retrieving" | "answering";
export type SourceFormat = "pdf" | "html";

export interface AskCitation {
  n: number;
  blockId: string;
  docId: string;
  documentTitle: string;
  /** Missing on older saved citations: read it as "pdf". */
  format?: SourceFormat;
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

/* Two texts that disagree, each quoted word for word; Canon picks no winner. */
const conflictSideSchema = z.object({
  blockId: z.string(),
  quote: z.string(),
  /** A statute block only: "26 U.S.C. § 461(l)(3)(B)". */
  citation: z.string().optional(),
});
export const conflictSchema = z.object({
  kind: z.enum(["instruction_vs_instruction", "instruction_vs_statute", "statute_vs_statute"]),
  a: conflictSideSchema,
  b: conflictSideSchema,
  note: z.string(),
});
export type Conflict = z.infer<typeof conflictSchema>;

const statutePassageSchema = z.object({
  blockId: z.string(),
  citation: z.string(),
  text: z.string(),
});

export const askResultSchema = z.object({
  answer: z.string(),
  coverage: z.enum(["covered", "partial", "not_covered"]),
  citations: z.array(askCitationSchema),
  missingDocuments: z.array(z.string()),
  // Defaults: a Canon from before the statute sends none of these.
  statutePassages: z.array(statutePassageSchema).default([]),
  statuteConsulted: z.boolean().default(false),
  conflicts: z.array(conflictSchema).default([]),
  // The jurisdictions searched. Optional: a Canon from before the list sends none.
  jurisdictions: z.array(jurisdictionSchema).optional(),
  log: z.object({ steps: z.array(z.record(z.string(), z.unknown())) }),
});
export type AskResult = z.infer<typeof askResultSchema>;

export const askRunResultSchema = z.discriminatedUnion("status", [
  askResultSchema.extend({ status: z.literal("ok") }),
  z.object({
    status: z.literal("failed"),
    error: z.string(),
    log: z.object({ steps: z.array(z.record(z.string(), z.unknown())) }),
  }),
]);
export type AskRunResult = z.infer<typeof askRunResultSchema>;

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
  maxIterations: z.number().int().optional(),
  /** The jurisdictions to search; Canon searches all of them when unset. */
  jurisdictions: z.array(jurisdictionSchema).min(1).optional(),
});
export type GroundInput = z.infer<typeof groundInputSchema>;

export const authorityCitationSchema = z.object({
  blockId: z.string(),
  quote: z.string().optional(),
});

export const groundStepLogSchema = z.object({
  iteration: z.number().int(),
  kind: z.enum(["gather", "assess", "rule", "statute"]),
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
  conflicts: z.array(conflictSchema).default([]),
  statuteConsulted: z.boolean().default(false),
  // The jurisdictions searched. Optional: a Canon from before the list sends none.
  jurisdictions: z.array(jurisdictionSchema).optional(),
  log: z.object({ steps: z.array(groundStepLogSchema) }),
});
export type GroundResult = z.infer<typeof groundResultSchema>;

export const groundRunResultSchema = z.discriminatedUnion("status", [
  groundResultSchema.extend({ status: z.literal("ok") }),
  z.object({
    status: z.literal("failed"),
    error: z.string(),
    log: z.object({ steps: z.array(groundStepLogSchema) }),
  }),
]);
export type GroundRunResult = z.infer<typeof groundRunResultSchema>;

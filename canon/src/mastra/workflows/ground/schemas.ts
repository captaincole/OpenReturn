import { z } from "zod";
import { jurisdictionSchema, jurisdictionsInputSchema } from "../../../jurisdiction";
import { conflictOutputSchema, conflictSchema, statuteBlockSchema } from "../statute";

// Canon is stateless: the caller (Cade) owns the filing and stores the verdict.
export const DEFAULT_MAX_ITERATIONS = 3;
export const MAX_ITERATIONS_CAP = 5;

export const groundDecisionSchema = z.object({
  taxYear: z.number().int(),
  decisionKey: z.string(),
  decision: z.unknown().describe("The decision's value (boolean, string, object…)."),
  rationale: z.string(),
  confidence: z.string(),
  dissentingConsiderations: z.string().nullable().default(null),
  supportingFactKeys: z.array(z.string()).default([]),
});
export type GroundDecision = z.infer<typeof groundDecisionSchema>;

export const taxFactSnapshotSchema = z.object({
  key: z.string(),
  category: z.string(),
  value: z.unknown(),
  sourceNote: z.string().nullable(),
});
export type TaxFactSnapshot = z.infer<typeof taxFactSnapshotSchema>;

export const groundInputSchema = z.object({
  decision: groundDecisionSchema,
  facts: z
    .array(taxFactSnapshotSchema)
    .default([])
    .describe("The facts the decision cites, as the caller recorded them."),
  maxIterations: z
    .number()
    .int()
    .min(1)
    .max(MAX_ITERATIONS_CAP)
    .default(DEFAULT_MAX_ITERATIONS)
    .describe("How many gather → assess → rule rounds the judges may take before they must rule."),
  jurisdictions: jurisdictionsInputSchema,
});
export type GroundInput = z.input<typeof groundInputSchema>;

export const authorityCitationSchema = z.object({
  blockId: z.string(),
  quote: z.string().optional(),
});
export type AuthorityCitation = z.infer<typeof authorityCitationSchema>;

export const irsBlockSnapshotSchema = z.object({
  blockId: z.string(),
  docId: z.string(),
  text: z.string(),
  score: z.number().optional(),
});

export const evidenceBundleSchema = z.object({
  facts: z.array(taxFactSnapshotSchema),
  irsBlocks: z.array(irsBlockSnapshotSchema),
  // Empty until the rule judge consults the statute; then kept for the rest of the run.
  statuteBlocks: z.array(statuteBlockSchema).default([]),
  queriesUsed: z.array(z.string()),
  iteration: z.number().int().min(1),
});
export type EvidenceBundle = z.infer<typeof evidenceBundleSchema>;

export const riskTierSchema = z.enum(["low", "medium", "high"]);
export type RiskTier = z.infer<typeof riskTierSchema>;

export const riskAssessmentSchema = z.object({
  riskTier: riskTierSchema,
  rationale: z
    .string()
    .describe(
      "Why this tier — refer to specific facts and the consequence if the decision is wrong.",
    ),
  consequenceNotes: z
    .string()
    .describe(
      "What the downstream impact looks like if this decision is wrong (e.g. wrong state-of-residence => owe state tax in two states; wrong filing status => bracket and standard-deduction wrong).",
    ),
  // Default []: the model may leave the field out when it has nothing to add.
  dissentingConsiderations: z
    .array(z.string())
    .default([])
    .describe(
      "Things that could push this risk higher (or change the tier) that the assessor noticed but didn't have evidence to act on.",
    ),
});
export type RiskAssessment = z.infer<typeof riskAssessmentSchema>;

export const verdictSchema = z.enum(["accurate", "inaccurate", "needs_more_facts"]);
export type GroundVerdict = z.infer<typeof verdictSchema>;

export const ruleVerdictOutputSchema = z.object({
  kind: z.literal("verdict"),
  verdict: verdictSchema,
  reason: z.string(),
  citations: z.array(authorityCitationSchema),
  conflicts: z
    .array(conflictOutputSchema)
    .default([])
    .describe("Two retrieved passages that disagree on the deciding point. Empty when none."),
});

export const ruleNeedMoreOutputSchema = z.object({
  kind: z.literal("need_more_evidence"),
  reason: z.string().describe("Why current evidence is insufficient for this risk tier."),
  suggestedQueries: z
    .array(z.string())
    .min(1)
    .describe(
      "Search-ref-docs queries to run on the next iteration — phrased the way a tax professional would describe the gap.",
    ),
});

export const ruleConsultStatuteOutputSchema = z.object({
  kind: z.literal("consult_statute"),
  reason: z
    .string()
    .describe("Which passages conflict, or which rule of law they name without stating it."),
  // Capped at 3 in the prompt and by a slice; Anthropic rejects maxItems.
  statuteQueries: z
    .array(z.string())
    .default([])
    .describe("Queries for the statute, in the terms the passages use."),
});

export const ruleOutputSchema = z.discriminatedUnion("kind", [
  ruleVerdictOutputSchema,
  ruleNeedMoreOutputSchema,
  ruleConsultStatuteOutputSchema,
]);
export type RuleOutput = z.infer<typeof ruleOutputSchema>;
export type ConsultStatuteOutput = z.infer<typeof ruleConsultStatuteOutputSchema>;
// After the code handles a consult_statute, the loop sees only these two.
export type SettledRuleOutput = Exclude<RuleOutput, ConsultStatuteOutput>;

/*
 * Anthropic refuses a top-level anyOf (a discriminated union) as an output
 * schema, so the rule step asks for this wrapper and unwraps `result`.
 */
export const ruleStructuredOutputSchema = z.object({ result: ruleOutputSchema });

export const loopCarrierSchema = z.object({
  decision: groundDecisionSchema,
  facts: z.array(taxFactSnapshotSchema),
  maxIterations: z.number().int().min(1).max(MAX_ITERATIONS_CAP),
  // Every retrieval of the run searches these, and the statute round their statutes.
  jurisdictions: z.array(jurisdictionSchema),

  // Can pass maxIterations by one, to stop the loop; the reported count clamps back.
  iteration: z.number().int().min(1),
  queries: z.array(z.string()),

  needMoreReasons: z.array(z.string()),
  // At most one statute search per run.
  statuteConsulted: z.boolean(),

  evidence: evidenceBundleSchema.optional(),
  riskAssessment: riskAssessmentSchema.optional(),
  ruleOutput: ruleOutputSchema.optional(),
});
export type LoopCarrier = z.infer<typeof loopCarrierSchema>;

export const groundStepLogSchema = z.object({
  iteration: z.number().int().min(1),
  kind: z.enum(["gather", "assess", "rule", "statute"]),
  durationMs: z.number(),
  input: z.unknown(),
  output: z.unknown(),
});
export type GroundStepLog = z.infer<typeof groundStepLogSchema>;

export const groundResultSchema = z.object({
  verdict: verdictSchema,
  reason: z.string(),
  citations: z.array(authorityCitationSchema),
  riskTier: riskTierSchema.nullable(),
  iterationCount: z.number().int().min(1),
  whatsMissing: z.string().optional(),
  // Passages that disagree, with both quotes. The verdict still follows the instructions.
  conflicts: z.array(conflictSchema).default([]),
  statuteConsulted: z.boolean().default(false),
  // The jurisdictions searched: every one when the input named none.
  jurisdictions: z.array(jurisdictionSchema),
  log: z.object({ steps: z.array(groundStepLogSchema) }),
});
export type GroundResult = z.infer<typeof groundResultSchema>;

// A judge that throws must not take the step log with it.
export const groundRunResultSchema = z.discriminatedUnion("status", [
  groundResultSchema.extend({ status: z.literal("ok") }),
  z.object({
    status: z.literal("failed"),
    error: z.string(),
    log: z.object({ steps: z.array(groundStepLogSchema) }),
  }),
]);
export type GroundRunResult = z.infer<typeof groundRunResultSchema>;

import { z } from "zod";

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

export const ruleOutputSchema = z.discriminatedUnion("kind", [
  ruleVerdictOutputSchema,
  ruleNeedMoreOutputSchema,
]);
export type RuleOutput = z.infer<typeof ruleOutputSchema>;

/*
 * Anthropic refuses a top-level anyOf (a discriminated union) as an output
 * schema, so the rule step asks for this wrapper and unwraps `result`.
 */
export const ruleStructuredOutputSchema = z.object({ result: ruleOutputSchema });

export const loopCarrierSchema = z.object({
  decision: groundDecisionSchema,
  facts: z.array(taxFactSnapshotSchema),
  maxIterations: z.number().int().min(1).max(MAX_ITERATIONS_CAP),

  // Can pass maxIterations by one, to stop the loop; the reported count clamps back.
  iteration: z.number().int().min(1),
  queries: z.array(z.string()),

  needMoreReasons: z.array(z.string()),

  evidence: evidenceBundleSchema.optional(),
  riskAssessment: riskAssessmentSchema.optional(),
  ruleOutput: ruleOutputSchema.optional(),
});
export type LoopCarrier = z.infer<typeof loopCarrierSchema>;

export const groundStepLogSchema = z.object({
  iteration: z.number().int().min(1),
  kind: z.enum(["gather", "assess", "rule"]),
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

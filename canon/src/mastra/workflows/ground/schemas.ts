import { z } from "zod";

/*
 * The grounding contract: what a caller sends Canon to ground one
 * decision, what the judges pass between them, and what comes back.
 * Canon is stateless here too: the decision and the facts it cites come
 * in, a verdict with citations and the step log go out. Who recorded the
 * decision, which filing it belongs to and where the verdict is stored
 * are the caller's business (Cade keeps them in app.db).
 */

export const DEFAULT_MAX_ITERATIONS = 3;
export const MAX_ITERATIONS_CAP = 5;

/*
 * ---------------------------------------------------------------------------
 * Input
 * ---------------------------------------------------------------------------
 */

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

/*
 * ---------------------------------------------------------------------------
 * Building blocks the judges share
 * ---------------------------------------------------------------------------
 */

export const authorityCitationSchema = z.object({
  blockId: z.string(),
  quote: z.string().optional(),
});
export type AuthorityCitation = z.infer<typeof authorityCitationSchema>;

export const irsBlockSnapshotSchema = z.object({
  blockId: z.string(),
  docId: z.string(),
  text: z.string(),
  /*
   * Score from the retrieval call (reciprocal rank fusion; higher is better).
   * Persisted so future evals can compare retrieval strategies.
   */
  score: z.number().optional(),
});

export const evidenceBundleSchema = z.object({
  facts: z.array(taxFactSnapshotSchema),
  irsBlocks: z.array(irsBlockSnapshotSchema),
  queriesUsed: z.array(z.string()),
  iteration: z.number().int().min(1),
});
export type EvidenceBundle = z.infer<typeof evidenceBundleSchema>;

/*
 * ---------------------------------------------------------------------------
 * assessRisk output
 * ---------------------------------------------------------------------------
 */

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

/*
 * ---------------------------------------------------------------------------
 * rule output — discriminated union on `kind`.
 * ---------------------------------------------------------------------------
 */

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
 * Anthropic sends a structured-output schema as a tool input schema, and
 * a tool input schema must be a top-level object. A discriminated union
 * is a top-level anyOf, which the API refuses. The rule step therefore
 * asks for this wrapper and unwraps `result`.
 */
export const ruleStructuredOutputSchema = z.object({ result: ruleOutputSchema });

/*
 * ---------------------------------------------------------------------------
 * Loop carrier — the shape that flows through gather → assess → rule on
 * every iteration. Each judge takes it in and returns it with one more
 * field populated.
 * ---------------------------------------------------------------------------
 */

export const loopCarrierSchema = z.object({
  decision: groundDecisionSchema,
  facts: z.array(taxFactSnapshotSchema),
  maxIterations: z.number().int().min(1).max(MAX_ITERATIONS_CAP),

  /*
   * Iteration state. rule bumps this when it emits need_more_evidence;
   * the loop stops once it passes maxIterations, and the reported count
   * clamps back to maxIterations.
   */
  iteration: z.number().int().min(1),
  queries: z.array(z.string()),

  /*
   * Reasons accumulated across iterations when rule sends the loop back to
   * gather. They become the whatsMissing summary when the last iteration
   * ends without a verdict.
   */
  needMoreReasons: z.array(z.string()),

  /* gather / assess / rule populate these respectively. */
  evidence: evidenceBundleSchema.optional(),
  riskAssessment: riskAssessmentSchema.optional(),
  ruleOutput: ruleOutputSchema.optional(),
});
export type LoopCarrier = z.infer<typeof loopCarrierSchema>;

/*
 * ---------------------------------------------------------------------------
 * Result
 * ---------------------------------------------------------------------------
 */

/** One judge step: what it saw, what it said, how long it took. The caller persists these. */
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
  /** Set when the judges ran out of iterations without a verdict. */
  whatsMissing: z.string().optional(),
  log: z.object({ steps: z.array(groundStepLogSchema) }),
});
export type GroundResult = z.infer<typeof groundResultSchema>;

/*
 * What the `ground` workflow (and so run_ground) returns: the result, or
 * the failure with the steps that ran before it. A judge that throws
 * must not take the step log with it; the caller persists both.
 */
export const groundRunResultSchema = z.discriminatedUnion("status", [
  groundResultSchema.extend({ status: z.literal("ok") }),
  z.object({
    status: z.literal("failed"),
    error: z.string(),
    log: z.object({ steps: z.array(groundStepLogSchema) }),
  }),
]);
export type GroundRunResult = z.infer<typeof groundRunResultSchema>;

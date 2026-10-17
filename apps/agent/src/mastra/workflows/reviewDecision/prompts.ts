import type { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { modelFor } from "../../models";
import type { EvidenceBundle, LoopCarrier } from "./schemas";

/*
 * Prompt rendering for the review-decision judges, plus the iteration-1
 * query formulation. Pure string-building except formulateQueries, which
 * calls the queryFormulator judge it is given. The step orchestration lives in
 * steps.ts.
 */

/** The decision fields the judges see (and the step log records). */
export function decisionSummary(carrier: LoopCarrier) {
  return {
    decisionKey: carrier.decisionKey,
    decision: carrier.decisionValue,
    rationale: carrier.rationale,
    confidence: carrier.confidence,
    dissentingConsiderations: carrier.dissentingConsiderationsInput,
    supportingFactKeys: carrier.supportingFactKeys,
  };
}

export async function formulateQueries(queryFormulator: Agent, c: LoopCarrier): Promise<string[]> {
  const prompt = [
    `Decision to ground:`,
    `  decisionKey: ${c.decisionKey}`,
    `  value: ${JSON.stringify(c.decisionValue)}`,
    `  rationale: ${c.rationale}`,
    `  supportingFactKeys: ${c.supportingFactKeys.join(", ") || "(none)"}`,
    ``,
    `Emit 1–2 search queries that would surface the IRS guidance governing this kind of decision.`,
  ].join("\n");

  const result = await queryFormulator.generate(prompt, {
    structuredOutput: {
      /*
       * Anthropic's native structured-output endpoint rejects `maxItems` on
       * array properties. The 1–2 cap therefore lives in the prompt and the
       * slice below, not in the schema.
       */
      schema: z.object({ queries: z.array(z.string()).min(1) }),
      model: modelFor("judge"),
      errorStrategy: "strict",
    },
  });
  const obj = (result as { object?: { queries?: string[] } }).object;
  if (!obj?.queries || obj.queries.length === 0) {
    /*
     * Fallback: synthesize a query from the decisionKey itself. Better
     * than a throw — the workflow stays alive, and the step log still
     * records which queries ran.
     */
    return [c.decisionKey.replace(/^decisions\./, "").replace(/_/g, " ")];
  }
  return obj.queries.slice(0, 2);
}

export function renderAssessPrompt(c: LoopCarrier): string {
  return [
    `Decision under review:`,
    JSON.stringify(decisionSummary(c), null, 2),
    ``,
    `Supporting facts (from tax_facts):`,
    factLines(c.evidence!.facts),
    ``,
    `Retrieved IRS passages (top hits across ${c.evidence!.queriesUsed.length} query/queries):`,
    blockLines(c.evidence!.irsBlocks),
    ``,
    `Assess the risk tier of this decision per your instructions.`,
  ].join("\n");
}

export function renderRulePrompt(c: LoopCarrier): string {
  const evidence = c.evidence!;
  const risk = c.riskAssessment!;
  return [
    `Decision under review:`,
    JSON.stringify(decisionSummary(c), null, 2),
    ``,
    `Risk tier: ${risk.riskTier}`,
    `  rationale: ${risk.rationale}`,
    `  consequence: ${risk.consequenceNotes}`,
    risk.dissentingConsiderations.length
      ? `  dissenting: ${risk.dissentingConsiderations.join("; ")}`
      : "",
    ``,
    `Supporting facts (from tax_facts):`,
    factLines(evidence.facts),
    ``,
    `Retrieved IRS passages (this iteration: ${c.iteration}, queries: ${evidence.queriesUsed.join(" | ")}):`,
    blockLines(evidence.irsBlocks),
    ``,
    c.needMoreReasons.length
      ? `Previous iterations asked for more evidence with these reasons:\n${c.needMoreReasons.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}\n`
      : "",
    `You are on iteration ${c.iteration} of 3. Decide: commit to a verdict, or request more evidence (with suggested queries).`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function factLines(facts: EvidenceBundle["facts"]): string {
  if (!facts.length) return "  (none)";
  return facts
    .map(
      (f) =>
        `  - ${f.key} (${f.category}): ${JSON.stringify(f.value)}` +
        (f.sourceNote ? ` [source: ${f.sourceNote}]` : ""),
    )
    .join("\n");
}

function blockLines(blocks: EvidenceBundle["irsBlocks"]): string {
  if (!blocks.length) return "  (no IRS passages retrieved)";
  return blocks
    .map(
      (b) =>
        `  [${b.blockId}] ${b.text.replace(/\s+/g, " ").slice(0, 600)}${b.text.length > 600 ? "…" : ""}`,
    )
    .join("\n");
}

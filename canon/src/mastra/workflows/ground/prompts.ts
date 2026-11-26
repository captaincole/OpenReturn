import type { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { judge } from "../../judge";
import type { EvidenceBundle, LoopCarrier } from "./schemas";

export function decisionSummary(carrier: LoopCarrier) {
  const decision = carrier.decision;
  return {
    decisionKey: decision.decisionKey,
    decision: decision.decision,
    rationale: decision.rationale,
    confidence: decision.confidence,
    dissentingConsiderations: decision.dissentingConsiderations,
    supportingFactKeys: decision.supportingFactKeys,
  };
}

export async function formulateQueries(
  queryFormulator: Agent,
  carrier: LoopCarrier,
): Promise<string[]> {
  const decision = carrier.decision;
  const prompt = [
    `Decision to ground:`,
    `  decisionKey: ${decision.decisionKey}`,
    `  value: ${JSON.stringify(decision.decision)}`,
    `  rationale: ${decision.rationale}`,
    `  supportingFactKeys: ${decision.supportingFactKeys.join(", ") || "(none)"}`,
    ``,
    `Emit 1–2 search queries that would surface the IRS guidance governing this kind of decision.`,
  ].join("\n");

  // Anthropic rejects `maxItems`, so the prompt and the slice cap the count.
  const { queries } = await judge(
    queryFormulator,
    prompt,
    z.object({ queries: z.array(z.string()).min(1) }),
  );
  return queries.slice(0, 2);
}

export function renderAssessPrompt(carrier: LoopCarrier): string {
  return [
    `Decision under review:`,
    JSON.stringify(decisionSummary(carrier), null, 2),
    ``,
    `Supporting facts (from tax_facts):`,
    factLines(carrier.evidence!.facts),
    ``,
    `Retrieved IRS passages (top hits across ${carrier.evidence!.queriesUsed.length} query/queries):`,
    blockLines(carrier.evidence!.irsBlocks),
    ``,
    `Assess the risk tier of this decision per your instructions.`,
  ].join("\n");
}

/* note: one sentence for the call after a statute round that did not run. */
export function renderRulePrompt(carrier: LoopCarrier, note?: string): string {
  const evidence = carrier.evidence!;
  const risk = carrier.riskAssessment!;
  return [
    `Decision under review:`,
    JSON.stringify(decisionSummary(carrier), null, 2),
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
    `Retrieved IRS passages (this iteration: ${carrier.iteration}, queries: ${evidence.queriesUsed.join(" | ")}):`,
    blockLines(evidence.irsBlocks),
    ``,
    statuteSection(evidence.statuteBlocks),
    carrier.needMoreReasons.length
      ? `Previous iterations asked for more evidence with these reasons:\n${carrier.needMoreReasons.map((reason, i) => `  ${i + 1}. ${reason}`).join("\n")}\n`
      : "",
    note ?? "",
    `You are on iteration ${carrier.iteration} of ${carrier.maxIterations}. Decide: commit to a verdict, or request more evidence (with suggested queries).`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function factLines(facts: EvidenceBundle["facts"]): string {
  if (!facts.length) return "  (none)";
  return facts
    .map(
      (fact) =>
        `  - ${fact.key} (${fact.category}): ${JSON.stringify(fact.value)}` +
        (fact.sourceNote ? ` [source: ${fact.sourceNote}]` : ""),
    )
    .join("\n");
}

// The deciding words often sit late in a subsection, so a statute block shows more text.
const STATUTE_CHARS = 1200;

// Empty when the statute was not consulted, so the prompt is the same as before.
function statuteSection(blocks: EvidenceBundle["statuteBlocks"]): string {
  if (!blocks.length) return "";
  const lines = blocks.map((block) => {
    const text = block.text.replace(/\s+/g, " ");
    const clipped = text.length > STATUTE_CHARS ? `${text.slice(0, STATUTE_CHARS)}…` : text;
    return `  [${block.blockId}] ${block.citation}: ${clipped}`;
  });
  return `Statute passages (26 U.S.C., the law the IRS passages explain; consulted once in this review):\n${lines.join("\n")}\n`;
}

function blockLines(blocks: EvidenceBundle["irsBlocks"]): string {
  if (!blocks.length) return "  (no IRS passages retrieved)";
  return blocks
    .map(
      (block) =>
        `  [${block.blockId}] ${block.text.replace(/\s+/g, " ").slice(0, 600)}${block.text.length > 600 ? "…" : ""}`,
    )
    .join("\n");
}

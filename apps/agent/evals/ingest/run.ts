/*
 * Document-ingest eval: each model reads every scenario source document
 * and calls the production ingest tools, which write facts to a
 * throwaway app.db. The scorer compares those facts to the scenario's
 * ground truth, field by field.
 *
 *   npx tsx --env-file=.env evals/ingest/run.ts [model…] [--full] [--runs=N] [--doc=…]   (from apps/agent)
 *
 * Default is the quick tier (one document per type, 2 runs). --full runs
 * every document 5 times, with local models on the PC only (see
 * lib/models.ts). --doc=<substring> runs only matching documents and does
 * not publish a report.
 *
 * Writes .scratch/evals/ingest/<runId>/results.json and
 * docs/evals/ingest[-quick].md.
 */
import { Agent } from "@mastra/core/agent";
import { extractTrajectory } from "@mastra/core/evals";
import { MASTRA_RESOURCE_ID_KEY, RequestContext } from "@mastra/core/request-context";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ingestingDocuments } from "../../src/mastra/agents/luca.instructions";
import { PdfAttachmentRasterizer } from "../../src/mastra/agents/pdfAttachments";
import { createOwnerFiling } from "../../src/mastra/db/filings";
import { listFacts } from "../../src/mastra/db/taxFacts";
import { modelFor } from "../../src/mastra/models";
import { DEMO_TAX_YEAR } from "../../src/mastra/server/demoSession";
import { INGEST_MAX_OUTPUT_TOKENS, ingestTools } from "../../src/mastra/tools/ingestTools";
import { modelsFromArgs, tierFromArgs, useModel, type EvalModel } from "../lib/models";
import "../lib/tempDb";
import { loadCases, type IngestCase } from "./cases";
import { publishReport, type IngestResult } from "./report";
import { scoreDoc } from "./score";

const REPO = path.resolve(__dirname, "../../../..");

/* Luca's own document rules, without the conversation around them. */
const INSTRUCTIONS = `You ingest tax documents. The user uploads one document. Read it and call the matching ingest tools with every value on it.

${ingestingDocuments}

Use plain numbers for dollar amounts (79000.00, not "$79,000.00"). Do not ask the user questions and do not record other facts. After the ingest calls, reply with one short sentence.`;

function agentFor(model: EvalModel): Agent {
  useModel("LUCA", model);
  return new Agent({
    id: "ingest-eval",
    name: "Ingest eval",
    instructions: INSTRUCTIONS,
    model: modelFor("luca"),
    tools: ingestTools,
    inputProcessors: [new PdfAttachmentRasterizer()],
  });
}

/* The same message shape the web app sends (useLucaChat.buildPayload). */
const toMessages = (c: IngestCase) => [
  {
    role: "user" as const,
    content: [
      { type: "text" as const, text: "Here is one of my tax documents." },
      {
        type: "file" as const,
        data: readFileSync(c.pdf).toString("base64"),
        mediaType: "application/pdf",
        filename: path.basename(c.pdf),
      },
    ],
  },
];

/* Every run gets its own user and filing, so its facts start empty. */
let runCounter = 0;
async function freshScope() {
  const userId = `eval-${++runCounter}`;
  const filingId = crypto.randomUUID();
  await createOwnerFiling({ filingId, userId, taxYear: DEMO_TAX_YEAR });
  const requestContext = new RequestContext();
  requestContext.set(MASTRA_RESOURCE_ID_KEY, userId);
  return { scope: { userId, filingId }, requestContext };
}

const ingestCalls = (messages: unknown) =>
  extractTrajectory(messages as never)
    .steps.filter((s) => s.stepType === "tool_call" && s.name.startsWith("ingest"))
    .map((s) => s.name);

async function evalDoc(
  agent: Agent,
  model: EvalModel,
  c: IngestCase,
  run: number,
): Promise<IngestResult> {
  const base = { model: model.label, doc: c.doc, type: c.type, run };
  const started = Date.now();
  const { scope, requestContext } = await freshScope();
  try {
    /*
     * Luca's output limit, not the SDK's 4,096. A consolidated 1099 takes
     * one call per form and one per 20 trades (5 for jordan's), and a
     * model can make them one step at a time.
     */
    const result = await agent.generate(toMessages(c), {
      requestContext,
      maxSteps: 8,
      modelSettings: { maxOutputTokens: INGEST_MAX_OUTPUT_TOKENS },
    });
    const usage = result.totalUsage ?? result.usage;
    const written = await listFacts(scope);
    return {
      ...base,
      toolCalls: ingestCalls(result.messages),
      latencyMs: Date.now() - started,
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
      score: scoreDoc(c.expected, written),
      replyText: result.text,
    };
  } catch (err) {
    const cause = (err as { cause?: { cause?: unknown } }).cause?.cause ?? err;
    return {
      ...base,
      toolCalls: [],
      latencyMs: Date.now() - started,
      inputTokens: 0,
      outputTokens: 0,
      score: scoreDoc(c.expected, []),
      replyText: "",
      error: String((cause as Error).message ?? cause).slice(0, 200),
    };
  }
}

async function main() {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(REPO, ".scratch/evals/ingest", runId);
  mkdirSync(outDir, { recursive: true });
  const docFilter = process.argv.find((a) => a.startsWith("--doc="))?.slice(6);
  const tier = tierFromArgs(process.argv);
  const cases = loadCases(tier).filter((c) => !docFilter || c.doc.includes(docFilter));
  const models = modelsFromArgs(process.argv.slice(2));
  console.log(
    `${tier} tier: ${cases.length} documents, ${models.map((m) => `${m.label} ×${m.runs}`).join(", ")}`,
  );

  const results: IngestResult[] = [];
  for (const model of models) {
    console.log(`\n${model.label} (${model.id})`);
    const agent = agentFor(model);
    for (const c of cases) {
      for (let run = 1; run <= model.runs; run++) {
        const r = await evalDoc(agent, model, c, run);
        console.log(
          `  ${c.doc} #${run}: ${r.error ? `ERROR ${r.error}` : r.score.score.toFixed(2)}`,
        );
        results.push(r);
        writeFileSync(
          path.join(outDir, "results.json"),
          JSON.stringify({ tier, models, results }, null, 2),
        );
      }
    }
    /* Publish after each model, so a long run shows results early. */
    if (!docFilter) console.log(`Report: ${publishReport(tier, [{ tier, models, results }])}`);
  }
  console.log(`\nResults: ${path.relative(REPO, outDir)}/results.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

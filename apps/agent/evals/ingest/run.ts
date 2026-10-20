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
import { ingest1099Consolidated } from "../../src/mastra/tools/ingest1099Consolidated";
import { ingest1099R } from "../../src/mastra/tools/ingest1099R";
import { ingest1099SA } from "../../src/mastra/tools/ingest1099SA";
import { ingestEnergyInvoice } from "../../src/mastra/tools/ingestEnergyInvoice";
import { ingestHouseholdW2 } from "../../src/mastra/tools/ingestHouseholdW2";
import { ingestSsa1099 } from "../../src/mastra/tools/ingestSsa1099";
import { ingestW2 } from "../../src/mastra/tools/ingestW2";
import { modelsFromArgs, tierFromArgs, useModel, type EvalModel } from "../lib/models";
import "../lib/tempDb";
import { loadCases, type IngestCase } from "./cases";
import { publishReport, type IngestResult } from "./report";
import { scoreDoc } from "./score";

const REPO = path.resolve(__dirname, "../../../..");

/* Luca's own document rules, without the conversation around them. */
const INSTRUCTIONS = `You ingest tax documents. The user uploads one document. Read it and call the matching ingest tool with every value on it.

${ingestingDocuments}

For a W-2: if box f line 1 holds "Apt N", "# N", "Unit N", or "Ste N", split it: the bare street in line1, the apt in line2.
Use plain numbers for dollar amounts (79000.00, not "$79,000.00"). Do not ask the user questions and do not record other facts. After the ingest call, reply with one short sentence.`;

const TOOLS = {
  ingestW2,
  ingest1099Consolidated,
  ingest1099R,
  ingest1099SA,
  ingestSsa1099,
  ingestHouseholdW2,
  ingestEnergyInvoice,
};

function agentFor(model: EvalModel): Agent {
  useModel("LUCA", model);
  return new Agent({
    id: "ingest-eval",
    name: "Ingest eval",
    instructions: INSTRUCTIONS,
    model: modelFor("luca"),
    tools: TOOLS,
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
    const result = await agent.generate(toMessages(c), { requestContext, maxSteps: 3 });
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

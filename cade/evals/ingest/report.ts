/* Re-render the full report from saved results: npx tsx evals/ingest/report.ts <results.json>… */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { avg, scoreCell, table } from "../lib/markdown";
import { forDisplay, type EvalModel, type Tier } from "../lib/models";
import { publishOverview } from "../lib/overview";
import { loadCases } from "./cases";
import { ingestFlowScores } from "./flow";
import { formScores, missesForm, type DocScore } from "./score";

export interface IngestResult {
  model: string;
  doc: string;
  type: string;
  run: number;
  toolCalls: string[];
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  score: DocScore;
  replyText: string;
  error?: string;
}

export interface IngestRun {
  tier?: Tier;
  models: EvalModel[];
  results: IngestResult[];
}

const REPO = path.resolve(__dirname, "../../..");
const OUT = path.join(REPO, "docs/evals/ingest.md");
const TOP_FIELDS = 15;

const scored = (rs: IngestResult[]) =>
  rs.filter((result) => !result.error && result.toolCalls.length > 0);
const failed = (rs: IngestResult[]) => rs.length - scored(rs).length;
const perfect = (rs: IngestResult[]) => rs.filter((result) => result.score.score === 1).length;

function cell(rs: IngestResult[]): string {
  const ok = scored(rs);
  if (!rs.length) return "—";
  if (!ok.length) return `no ingest call (${rs.length})`;
  const dropped = failed(rs);
  return `${scoreCell(ok.map((result) => result.score.score))}${dropped ? ` · ${dropped} failed` : ""}`;
}

const tokensPerSecond = (rs: IngestResult[]) => {
  const secs = rs.reduce((total, result) => total + result.latencyMs, 0) / 1000;
  return secs
    ? (rs.reduce((total, result) => total + result.outputTokens, 0) / secs).toFixed(0)
    : "—";
};

function summaryTable(models: EvalModel[], results: IngestResult[]): string {
  const rows = models.map((model) => {
    const mine = results.filter((result) => result.model === model.label);
    const ok = scored(mine);
    return [
      model.label,
      String(model.runs),
      ok.length ? scoreCell(ok.map((result) => result.score.score)) : "—",
      `${perfect(ok)}/${ok.length}`,
      `${mine.filter((result) => !result.error && missesForm(result.score)).length}/${mine.length}`,
      `${mine.filter((result) => result.error).length}/${mine.length}`,
      `${(avg(mine.map((result) => result.latencyMs)) / 1000).toFixed(1)}s`,
      tokensPerSecond(mine),
    ];
  });
  return table(
    [
      "Model",
      "Runs per doc",
      "Field accuracy (min–max)",
      "Perfect runs",
      "Missing a form",
      "Errors",
      "Avg latency",
      "Output tokens/s",
    ],
    rows,
  );
}

function groupTable(
  head: string,
  keyOf: (r: IngestResult) => string,
  models: EvalModel[],
  results: IngestResult[],
) {
  const keys = [...new Set(results.map(keyOf))];
  const rows = keys.map((key) => [
    key,
    ...models.map((model) =>
      cell(results.filter((result) => result.model === model.label && keyOf(result) === key)),
    ),
  ]);
  return table([head, ...models.map((model) => model.label)], rows);
}

/* Every run without an error counts here, so a skipped form scores 0 in that run. */
function formTable(models: EvalModel[], results: IngestResult[]): string {
  const consolidated = results.filter(
    (result) => result.type === "Consolidated 1099" && !result.error,
  );
  const rows = [...new Set(consolidated.map((result) => result.doc))].flatMap((doc) => {
    const runs = consolidated.filter((result) => result.doc === doc);
    const forms = [...new Set(runs.flatMap((run) => [...formScores(run.score).keys()]))];
    return forms.map((form) => [
      `${doc} ${form}`,
      ...models.map((model) => {
        const scores = runs
          .filter((run) => run.model === model.label)
          .map((run) => formScores(run.score).get(form) ?? 0);
        return scores.length ? scoreCell(scores) : "—";
      }),
    ]);
  });
  return rows.length
    ? table(["Statement and form", ...models.map((model) => model.label)], rows)
    : "None.";
}

function fieldMissTable(models: EvalModel[], results: IngestResult[]): string {
  const ok = scored(results);
  const fieldsOf = (result: IngestResult) =>
    result.score.facts.flatMap((fact) =>
      fact.fields.map((field) => ({
        key: `${result.doc.split("/")[0]}: ${fact.key} ${field.field}`,
        ok: field.ok,
      })),
    );
  const tally = new Map<string, Map<string, { miss: number; n: number }>>();
  for (const result of ok)
    for (const field of fieldsOf(result)) {
      const byModel = tally.get(field.key) ?? new Map();
      const counts = byModel.get(result.model) ?? { miss: 0, n: 0 };
      byModel.set(result.model, { miss: counts.miss + (field.ok ? 0 : 1), n: counts.n + 1 });
      tally.set(field.key, byModel);
    }
  const misses = (key: string) =>
    [...tally.get(key)!.values()].reduce((total, counts) => total + counts.miss, 0);
  const rows = [...tally.keys()]
    .filter((key) => misses(key) > 0)
    .sort((left, right) => misses(right) - misses(left))
    .slice(0, TOP_FIELDS)
    .map((key) => [
      key.replace(/^(\w+): /, "$1: `").concat("`"),
      ...models.map((model) => {
        const counts = tally.get(key)!.get(model.label);
        return counts ? `${counts.miss}/${counts.n}` : "—";
      }),
    ]);
  return rows.length ? table(["Field", ...models.map((model) => model.label)], rows) : "No misses.";
}

export function renderReport(models: EvalModel[], results: IngestResult[]): string {
  const docs = new Set(results.map((result) => result.doc)).size;
  return [
    "# Document-ingest eval",
    `_Generated by \`cade/evals/ingest\` on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand._`,
    `Each model reads ${docs} source documents from the engine scenarios (W-2s, 1099s, SSA-1099, household W-2, energy invoices) and calls Cade's production ingest tools. The tools write facts to a throwaway database. The score is the share of ground-truth fields (from each scenario's \`facts.ts\`) that the written facts match. Local models run several times per document because their output varies.`,
    'A run that makes no ingest call, or that fails with an error, is counted but not scored. "Missing a form" counts runs that wrote nothing for a form on the document: no call at all, or a skipped call on a consolidated 1099. Accuracy is the mean over scored runs; the range is the worst and best single run. Latency and output tokens per second depend on the machine as much as the model: the labels say which machine ran each local model.',
    "**Full tier:** every scenario document, 5 runs per local model. The lite tier (`npm run evals:lite`) runs one document per type once and publishes no report.",
    `Models: ${models.map((model) => `${model.label} (\`${model.id}\`)`).join(", ")}.`,
    "## Summary",
    summaryTable(models, results),
    "## By document type",
    groupTable("Type", (result) => result.type, models, results),
    "## By document",
    groupTable("Document", (result) => result.doc, models, results),
    "## Consolidated 1099s by form",
    "A consolidated statement holds several forms, and each form is its own ingest call.",
    formTable(models, results),
    "## Most-missed fields",
    `The ${TOP_FIELDS} most-missed fields: misses / scored runs.`,
    fieldMissTable(models, results),
    "## Run it",
    "From `cade`, with Ollama running for the local models:\n\n```bash\nEVAL_PC_OLLAMA_URL=http://<host>:11434/v1 \\\n  npx tsx --env-file=.env evals/ingest/run.ts --full [model…]   # Haiku and the second-machine models\n```\n\nThe lite tier is `npm run evals:lite` from the repo root.",
  ].join("\n\n");
}

/* A later run replaces a model's results for the documents it ran, so one can rerun alone. */
export function publishReport(runs: IngestRun[]): string {
  const docs = new Set(loadCases("full").map((testCase) => testCase.doc));
  const models = new Map<string, EvalModel>();
  const results = new Map<string, IngestResult[]>();
  for (const run of runs) {
    for (const model of run.models) models.set(model.label, model);
    const fresh = new Map<string, IngestResult[]>();
    for (const result of run.results.filter((candidate) => docs.has(candidate.doc))) {
      const key = `${result.model}\u0000${result.doc}`;
      fresh.set(key, [...(fresh.get(key) ?? []), result]);
    }
    for (const [key, rs] of fresh) results.set(key, rs);
  }
  const all = [...results.values()].flat();
  const used = [...models.values()].filter((model) =>
    all.some((result) => result.model === model.label),
  );
  const shown = forDisplay(used, all);
  writeFileSync(OUT, renderReport(shown.models, shown.results) + "\n");
  publishOverview(ingestFlowScores(shown.models, shown.results, docs.size));
  return path.relative(REPO, OUT);
}

if (require.main === module) {
  const runs = process.argv
    .slice(2)
    .map((file) => JSON.parse(readFileSync(file, "utf8")) as IngestRun);
  console.log(publishReport(runs));
}

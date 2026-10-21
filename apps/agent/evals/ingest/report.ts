/*
 * Renders the ingest eval: docs/evals/ingest.md for the full tier and
 * docs/evals/ingest-quick.md for the quick tier. The full tier also
 * writes the ingest flow's row in the eval overview (docs/evals/README.md,
 * lib/overview.ts). Run directly to re-render from saved results, for example to
 * combine a new model's run with earlier runs (a later file replaces a
 * model's rows for the documents it ran; only the tier's documents are
 * kept):
 *
 *   npx tsx evals/ingest/report.ts [--full] <results.json>…   (from apps/agent)
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { avg, scoreCell, table } from "../lib/markdown";
import { forDisplay, tierFromArgs, type EvalModel, type Tier } from "../lib/models";
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

const REPO = path.resolve(__dirname, "../../../..");
const OUT: Record<Tier, string> = {
  full: path.join(REPO, "docs/evals/ingest.md"),
  quick: path.join(REPO, "docs/evals/ingest-quick.md"),
};
const TOP_FIELDS = 15;

/* A run with no ingest call (or an error) is counted, not scored. */
const scored = (rs: IngestResult[]) => rs.filter((r) => !r.error && r.toolCalls.length > 0);
const failed = (rs: IngestResult[]) => rs.length - scored(rs).length;
const perfect = (rs: IngestResult[]) => rs.filter((r) => r.score.score === 1).length;

function cell(rs: IngestResult[]): string {
  const ok = scored(rs);
  if (!rs.length) return "—";
  if (!ok.length) return `no ingest call (${rs.length})`;
  const dropped = failed(rs);
  return `${scoreCell(ok.map((r) => r.score.score))}${dropped ? ` · ${dropped} failed` : ""}`;
}

/* End to end: output tokens over wall time, so it includes reading the input. */
const tokensPerSecond = (rs: IngestResult[]) => {
  const secs = rs.reduce((n, r) => n + r.latencyMs, 0) / 1000;
  return secs ? (rs.reduce((n, r) => n + r.outputTokens, 0) / secs).toFixed(0) : "—";
};

function summaryTable(models: EvalModel[], results: IngestResult[]): string {
  const rows = models.map((m) => {
    const mine = results.filter((r) => r.model === m.label);
    const ok = scored(mine);
    return [
      m.label,
      String(m.runs),
      ok.length ? scoreCell(ok.map((r) => r.score.score)) : "—",
      `${perfect(ok)}/${ok.length}`,
      `${mine.filter((r) => !r.error && missesForm(r.score)).length}/${mine.length}`,
      `${mine.filter((r) => r.error).length}/${mine.length}`,
      `${(avg(mine.map((r) => r.latencyMs)) / 1000).toFixed(1)}s`,
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
  const rows = keys.map((k) => [
    k,
    ...models.map((m) => cell(results.filter((r) => r.model === m.label && keyOf(r) === k))),
  ]);
  return table([head, ...models.map((m) => m.label)], rows);
}

/*
 * Consolidated statements, one row per form on each. Every run without an
 * error counts here, so a form the model skipped scores 0 in that run.
 */
function formTable(models: EvalModel[], results: IngestResult[]): string {
  const consolidated = results.filter((r) => r.type === "Consolidated 1099" && !r.error);
  const rows = [...new Set(consolidated.map((r) => r.doc))].flatMap((doc) => {
    const runs = consolidated.filter((r) => r.doc === doc);
    const forms = [...new Set(runs.flatMap((r) => [...formScores(r.score).keys()]))];
    return forms.map((form) => [
      `${doc} ${form}`,
      ...models.map((m) => {
        const scores = runs
          .filter((r) => r.model === m.label)
          .map((r) => formScores(r.score).get(form) ?? 0);
        return scores.length ? scoreCell(scores) : "—";
      }),
    ]);
  });
  return rows.length ? table(["Statement and form", ...models.map((m) => m.label)], rows) : "None.";
}

/* How often each field was wrong, over scored runs. */
function fieldMissTable(models: EvalModel[], results: IngestResult[]): string {
  const ok = scored(results);
  const fieldsOf = (r: IngestResult) =>
    r.score.facts.flatMap((f) =>
      f.fields.map((x) => ({ key: `${r.doc.split("/")[0]}: ${f.key} ${x.field}`, ok: x.ok })),
    );
  const tally = new Map<string, Map<string, { miss: number; n: number }>>();
  for (const r of ok)
    for (const f of fieldsOf(r)) {
      const byModel = tally.get(f.key) ?? new Map();
      const t = byModel.get(r.model) ?? { miss: 0, n: 0 };
      byModel.set(r.model, { miss: t.miss + (f.ok ? 0 : 1), n: t.n + 1 });
      tally.set(f.key, byModel);
    }
  const misses = (k: string) => [...tally.get(k)!.values()].reduce((s, t) => s + t.miss, 0);
  const rows = [...tally.keys()]
    .filter((k) => misses(k) > 0)
    .sort((a, b) => misses(b) - misses(a))
    .slice(0, TOP_FIELDS)
    .map((k) => [
      k.replace(/^(\w+): /, "$1: `").concat("`"),
      ...models.map((m) => {
        const t = tally.get(k)!.get(m.label);
        return t ? `${t.miss}/${t.n}` : "—";
      }),
    ]);
  return rows.length ? table(["Field", ...models.map((m) => m.label)], rows) : "No misses.";
}

const TIER_NOTE: Record<Tier, string> = {
  full: "**Full tier:** every scenario document, 5 runs per local model. The [quick tier](ingest-quick.md) is a smaller, faster subset.",
  quick:
    "**Quick tier:** one document per type, 2 runs per local model, for everyday checks. The [full tier](ingest.md) has every document and 5 runs.",
};

export function renderReport(tier: Tier, models: EvalModel[], results: IngestResult[]): string {
  const docs = new Set(results.map((r) => r.doc)).size;
  return [
    `# Document-ingest eval${tier === "quick" ? " (quick)" : ""}`,
    `_Generated by \`apps/agent/evals/ingest\` on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand._`,
    `Each model reads ${docs} source documents from the engine scenarios (W-2s, 1099s, SSA-1099, household W-2, energy invoices) and calls Luca's production ingest tools. The tools write facts to a throwaway database. The score is the share of ground-truth fields (from each scenario's \`facts.ts\`) that the written facts match. Local models run several times per document because their output varies.`,
    'A run that makes no ingest call, or that fails with an error, is counted but not scored. "Missing a form" counts runs that wrote nothing for a form on the document: no call at all, or a skipped call on a consolidated 1099. Accuracy is the mean over scored runs; the range is the worst and best single run. Latency and output tokens per second depend on the machine as much as the model: the full tier ran local models on one desktop GPU (RTX 4090), the quick tier on a MacBook (Apple M4).',
    TIER_NOTE[tier],
    `Models: ${models.map((m) => `${m.label} (\`${m.id}\`)`).join(", ")}.`,
    "## Summary",
    summaryTable(models, results),
    "## By document type",
    groupTable("Type", (r) => r.type, models, results),
    "## By document",
    groupTable("Document", (r) => r.doc, models, results),
    "## Consolidated 1099s by form",
    "A consolidated statement holds several forms, and each form is its own ingest call.",
    formTable(models, results),
    "## Most-missed fields",
    `The ${TOP_FIELDS} most-missed fields: misses / scored runs.`,
    fieldMissTable(models, results),
    "## Run it",
    "From `apps/agent`, with Ollama running for the local models:\n\n```bash\nnpx tsx --env-file=.env evals/ingest/run.ts [model…]          # quick tier\nEVAL_PC_OLLAMA_URL=http://<host>:11434/v1 \\\n  npx tsx --env-file=.env evals/ingest/run.ts --full [model…]   # full tier: Haiku + second-machine models\n```",
  ].join("\n\n");
}

/*
 * Merge runs: a later run replaces a model's results for the documents it
 * ran, so one document can be rerun on its own. Keep the tier's documents,
 * write the doc (and the overview, for the full tier), and return the
 * doc's repo path.
 */
export function publishReport(tier: Tier, runs: IngestRun[]): string {
  const docs = new Set(loadCases(tier).map((c) => c.doc));
  const models = new Map<string, EvalModel>();
  const results = new Map<string, IngestResult[]>();
  for (const run of runs) {
    for (const model of run.models) models.set(model.label, model);
    const fresh = new Map<string, IngestResult[]>();
    for (const r of run.results.filter((x) => docs.has(x.doc))) {
      const key = `${r.model}\u0000${r.doc}`;
      fresh.set(key, [...(fresh.get(key) ?? []), r]);
    }
    for (const [key, rs] of fresh) results.set(key, rs);
  }
  const all = [...results.values()].flat();
  const used = [...models.values()].filter((m) => all.some((r) => r.model === m.label));
  const shown = forDisplay(used, all);
  writeFileSync(OUT[tier], renderReport(tier, shown.models, shown.results) + "\n");
  if (tier === "full") publishOverview(ingestFlowScores(shown.models, shown.results, docs.size));
  return path.relative(REPO, OUT[tier]);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const runs = args
    .filter((a) => !a.startsWith("--"))
    .map((f) => JSON.parse(readFileSync(f, "utf8")) as IngestRun);
  console.log(publishReport(tierFromArgs(args), runs));
}

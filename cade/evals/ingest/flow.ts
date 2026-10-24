/*
 * The ingest flow's scores for the eval overview (lib/overview.ts). A
 * document scores the mean of its runs, where a run with no ingest call
 * or an error scores 0. Each capability is the mean over its documents,
 * and the flow score is the mean of the capabilities, so the columns add
 * up to it.
 */
import { avg } from "../lib/markdown";
import type { EvalModel } from "../lib/models";
import type { FlowScores, ModelScores } from "../lib/overview";
import type { IngestResult } from "./report";

/* Capability → which document types it covers (IngestCase.type). The first match wins. */
const CAPABILITIES: [string, (type: string) => boolean][] = [
  ["W-2", (t) => t.includes("W-2")],
  ["1099", (t) => t.includes("1099")],
  ["Invoices", (t) => t.includes("invoice")],
];
const capabilityOf = (type: string) => CAPABILITIES.find(([, has]) => has(type))?.[0] ?? "Other";

function modelScores(model: EvalModel, results: IngestResult[], docCount: number): ModelScores {
  const docs = new Map<string, { type: string; scores: number[] }>();
  for (const r of results.filter((x) => x.model === model.label)) {
    const d = docs.get(r.doc) ?? { type: r.type, scores: [] };
    d.scores.push(r.score.score);
    docs.set(r.doc, d);
  }
  const docScores = [...docs.values()].map((d) => ({
    cap: capabilityOf(d.type),
    score: avg(d.scores),
  }));
  const capabilities: Record<string, number> = {};
  for (const [cap] of CAPABILITIES) {
    const mine = docScores.filter((d) => d.cap === cap);
    if (mine.length) capabilities[cap] = avg(mine.map((d) => d.score));
  }
  return {
    label: model.label,
    id: model.id,
    score: avg(Object.values(capabilities)),
    capabilities,
    partial: docs.size < docCount ? `${docs.size}/${docCount} documents` : undefined,
  };
}

export function ingestFlowScores(
  models: EvalModel[],
  results: IngestResult[],
  docCount: number,
): FlowScores {
  return {
    flow: "ingest",
    title: "Ingest",
    definition:
      "Each model reads every scenario source document and calls Cade's ingest tools. A document scores the share of ground-truth fields its runs wrote correctly; a run with no ingest call scores 0. Each capability is the mean over its documents; the flow score is the mean of the capabilities.",
    report: "ingest.md",
    capabilities: CAPABILITIES.map(([cap]) => cap),
    models: models.map((m) => modelScores(m, results, docCount)),
  };
}

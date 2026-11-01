import { avg } from "../lib/markdown";
import type { EvalModel } from "../lib/models";
import type { FlowScores, ModelScores } from "../lib/overview";
import type { IngestResult } from "./report";

const CAPABILITIES: [string, (type: string) => boolean][] = [
  ["W-2", (docType) => docType.includes("W-2")],
  ["1099", (docType) => docType.includes("1099")],
  ["Invoices", (docType) => docType.includes("invoice")],
];
const capabilityOf = (type: string) => CAPABILITIES.find(([, has]) => has(type))?.[0] ?? "Other";

function modelScores(model: EvalModel, results: IngestResult[], docCount: number): ModelScores {
  const docs = new Map<string, { type: string; scores: number[] }>();
  for (const result of results.filter((candidate) => candidate.model === model.label)) {
    const entry = docs.get(result.doc) ?? { type: result.type, scores: [] };
    entry.scores.push(result.score.score);
    docs.set(result.doc, entry);
  }
  const docScores = [...docs.values()].map((entry) => ({
    cap: capabilityOf(entry.type),
    score: avg(entry.scores),
  }));
  const capabilities: Record<string, number> = {};
  for (const [cap] of CAPABILITIES) {
    const mine = docScores.filter((docScore) => docScore.cap === cap);
    if (mine.length) capabilities[cap] = avg(mine.map((docScore) => docScore.score));
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
    models: models.map((model) => modelScores(model, results, docCount)),
  };
}

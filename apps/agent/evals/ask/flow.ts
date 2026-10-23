/*
 * The Ask flow's scores for the eval overview (lib/overview.ts). The flow
 * score is the share of correct runs. Each capability is a share of runs
 * over the cases it applies to, and shows where the wrong runs went wrong.
 */
import type { EvalModel } from "../lib/models";
import type { FlowScores, ModelScores } from "../lib/overview";
import { CASES } from "./cases";
import type { AskResult } from "./report";

export const coverageOk = (r: AskResult) =>
  r.coverage !== null && r.expectedCoverage.includes(r.coverage);
/* Grounding applies where an answer is expected: the case has authority and should be covered. */
export const shouldGround = (r: AskResult) =>
  r.citedAuthority !== null && r.expectedCoverage.includes("covered");
export const groundedOk = (r: AskResult) => r.citedAuthority === true;
/* Correct: the right coverage label, the labeled passage cited, and every key fact stated. */
export const correct = (r: AskResult) =>
  coverageOk(r) && (!shouldGround(r) || groundedOk(r)) && r.factsOk !== false;
/* Confidently wrong: the answer says the library covers it, but the run is not correct. */
export const coveredButWrong = (r: AskResult) => r.coverage === "covered" && !correct(r);

const share = (rs: AskResult[], pred: (r: AskResult) => boolean) =>
  rs.length ? rs.filter(pred).length / rs.length : 0;

export function capabilities(rs: AskResult[]): Record<string, number> {
  return {
    Coverage: share(rs, coverageOk),
    Grounding: share(rs.filter(shouldGround), groundedOk),
    Retrieval: share(
      rs.filter((r) => r.retrievedAuthority !== null),
      (r) => r.retrievedAuthority === true,
    ),
    Facts: share(
      rs.filter((r) => r.factsOk !== null),
      (r) => r.factsOk === true,
    ),
  };
}

function modelScores(model: EvalModel, results: AskResult[]): ModelScores {
  const mine = results.filter((r) => r.model === model.label);
  const cases = new Set(mine.map((r) => r.case)).size;
  const caps = capabilities(mine);
  return {
    label: model.label,
    id: model.id,
    score: share(mine, correct),
    capabilities: caps,
    partial: cases < CASES.length ? `${cases}/${CASES.length} cases` : undefined,
  };
}

export function askFlowScores(models: EvalModel[], results: AskResult[]): FlowScores {
  return {
    flow: "ask",
    title: "Ask",
    definition:
      "Each case asks one tax-code question through the production Ask The Tax Code pipeline (query formulator, hybrid retrieval, answerer, citation check). The flow score is the share of correct runs: the covered / partial / not-covered label is right, the answer cites the labeled passage, and it states every key fact. The capabilities show where runs went wrong: Coverage (the label is right, including a question the library cannot answer), Grounding (an answer cites the labeled passage), Retrieval (the search, from the model's own queries, found it) and Facts (the answer states the key amount).",
    report: "ask.md",
    capabilities: ["Coverage", "Grounding", "Retrieval", "Facts"],
    models: models.map((m) => modelScores(m, results)),
  };
}

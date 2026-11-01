import { avg } from "../lib/markdown";
import type { EvalModel } from "../lib/models";
import type { FlowScores, ModelScores } from "../lib/overview";
import { CASES } from "./cases";
import type { ReviewResult } from "./report";

export const verdictOk = (result: ReviewResult) => result.verdict === result.expectedVerdict;
/* Graded only on an "accurate" verdict: that is when the workflow stores citations. */
export const groundedOk = (result: ReviewResult) =>
  result.expectedVerdict === "accurate" && result.verdict === "accurate" && result.citedAuthority;

const share = (rs: ReviewResult[], pred: (r: ReviewResult) => boolean) =>
  rs.length ? rs.filter(pred).length / rs.length : 0;

function modelScores(model: EvalModel, results: ReviewResult[]): ModelScores {
  const mine = results.filter((result) => result.model === model.label);
  const cases = new Set(mine.map((result) => result.case)).size;
  const capabilities = {
    Verdict: share(mine, verdictOk),
    Grounding: share(
      mine.filter((result) => result.expectedVerdict === "accurate"),
      groundedOk,
    ),
    Retrieval: share(mine, (result) => result.retrievedAuthority),
    Citations: share(mine, (result) => result.invalidCitations.length === 0),
  };
  return {
    label: model.label,
    id: model.id,
    score: avg(Object.values(capabilities)),
    capabilities,
    partial: cases < CASES.length ? `${cases}/${CASES.length} cases` : undefined,
  };
}

export function reviewFlowScores(models: EvalModel[], results: ReviewResult[]): FlowScores {
  return {
    flow: "review",
    title: "Review",
    definition:
      "Each case runs the production review-decision workflow on one AI decision, in a correct and a wrong version. The flow score is the mean of four shares of runs: Verdict (the verdict matches), Grounding (on a correct decision, the judge cites the expected authority), Retrieval (the search, from the model's own queries, found the authority) and Citations (the judge cites only blocks it retrieved).",
    report: "review.md",
    capabilities: ["Verdict", "Grounding", "Retrieval", "Citations"],
    models: models.map((model) => modelScores(model, results)),
  };
}

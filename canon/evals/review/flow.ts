import { avg } from "../lib/markdown";
import type { EvalModel } from "../lib/models";
import type { FlowScores, ModelScores } from "../lib/overview";
import { CASES } from "./cases";
import type { ReviewResult } from "./report";

export const verdictOk = (r: ReviewResult) => r.verdict === r.expectedVerdict;
/* Graded only on an "accurate" verdict: that is when the workflow stores citations. */
export const groundedOk = (r: ReviewResult) =>
  r.expectedVerdict === "accurate" && r.verdict === "accurate" && r.citedAuthority;

const share = (rs: ReviewResult[], pred: (r: ReviewResult) => boolean) =>
  rs.length ? rs.filter(pred).length / rs.length : 0;

function modelScores(model: EvalModel, results: ReviewResult[]): ModelScores {
  const mine = results.filter((r) => r.model === model.label);
  const cases = new Set(mine.map((r) => r.case)).size;
  const capabilities = {
    Verdict: share(mine, verdictOk),
    Grounding: share(
      mine.filter((r) => r.expectedVerdict === "accurate"),
      groundedOk,
    ),
    Retrieval: share(mine, (r) => r.retrievedAuthority),
    Citations: share(mine, (r) => r.invalidCitations.length === 0),
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
    models: models.map((m) => modelScores(m, results)),
  };
}

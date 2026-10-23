/*
 * @openreturn/canon — what Cade and the engine builder import while they
 * still call Canon in-process. The MCP server (mastra/mcp.ts) is the
 * contract this surface shrinks to; keep new consumers on MCP.
 *
 * Nothing here opens app.db or depends on the form engine
 * (tests/unit/boundary.test.ts).
 */

export { getBlock, hybridSearchRefDocs } from "./db/corpusSearch";
export type { BlockDetail, HybridSearchOpts, SearchHit } from "./db/corpusSearch";
export { getDocument } from "./db/corpusStore";
export type { SourceFormat } from "./db/corpusStore";
export { ensureCorpusSchema, getCorpusDb } from "./db/libsql";
export { citeRefDocTool, searchRefDocsTool } from "./mastra/tools/refDocs";

export { answerQuestion, askWorkflow } from "./mastra/workflows/ask";
export type { AnswerQuestionInput } from "./mastra/workflows/ask";
export { askAnswerer } from "./mastra/workflows/ask/judges/askAnswerer";
export { askQueryFormulator } from "./mastra/workflows/ask/judges/askQueryFormulator";
export type {
  AskCitation,
  AskCoverage,
  AskHistoryTurn,
  AskResult,
  AskStage,
} from "./mastra/workflows/ask/types";

/* The grounding judges and their prompt/schema contract (Cade's review workflow runs the loop). */
export { assessRiskAgent } from "./mastra/workflows/ground/judges/assessRiskAgent";
export { queryFormulator } from "./mastra/workflows/ground/judges/queryFormulator";
export { ruleAgent } from "./mastra/workflows/ground/judges/ruleAgent";
export {
  decisionSummary,
  formulateQueries,
  renderAssessPrompt,
  renderRulePrompt,
} from "./mastra/workflows/ground/prompts";
export * from "./mastra/workflows/ground/schemas";

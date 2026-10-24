/*
 * @openreturn/canon — Canon's in-process API: the corpus, the two
 * pipelines (ask, ground) and their contracts. Cade and the web app
 * reach Canon over MCP and HTTP instead (mastra/mcp.ts, the reference
 * library routes); this surface is for tooling that runs inside Canon's
 * process, such as canon/evals.
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
export type { AnswerQuestionInput, AskStepLog } from "./mastra/workflows/ask";
export type {
  AskCitation,
  AskCoverage,
  AskHistoryTurn,
  AskResult,
  AskStage,
} from "./mastra/workflows/ask/types";

export { groundDecision, groundWorkflow } from "./mastra/workflows/ground";
export type { GroundDecisionOptions } from "./mastra/workflows/ground";
export type {
  AuthorityCitation,
  GroundDecision,
  GroundInput,
  GroundResult,
  GroundStepLog,
  GroundVerdict,
  RiskTier,
  TaxFactSnapshot,
} from "./mastra/workflows/ground/schemas";

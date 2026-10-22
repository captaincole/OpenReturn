import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { modelFor } from "../models";
import { mastraDbUrl } from "../server/storage";
import { listAIDecisions, recordAIDecision } from "../tools/aiDecisions";
import { getCaseState } from "../tools/caseState";
import { dismissRequestedAction } from "../tools/dismissRequestedAction";
import { generateTaxDocuments } from "../tools/generateTaxDocuments";
import { INGEST_MAX_OUTPUT_TOKENS, ingestTools } from "../tools/ingestTools";
import { requestDocumentUpload } from "../tools/requestDocument";
import { listOpenQuestionsTool, recordTaxFacts, resolveOpenQuestion } from "../tools/taxFacts";
import { cadeInstructions } from "./cade.instructions";
import { cadeWorkingMemorySchema } from "./cade.workingMemory";
import { PdfAttachmentRasterizer } from "./pdfAttachments";

export const cade = new Agent({
  id: "cade",
  name: "Cade",
  instructions: cadeInstructions,
  model: modelFor("cade"),
  inputProcessors: [new PdfAttachmentRasterizer()],
  /*
   * Multi-step: get-case-state + maybe one ingest + a record-ai-decision
   * + optionally generate-tax-documents is ~5 steps per turn. 20 leaves
   * headroom for batched scope decisions on a single turn. The output
   * limit is what an ingest call needs (tools/ingestTools.ts).
   */
  defaultOptions: { maxSteps: 20, modelSettings: { maxOutputTokens: INGEST_MAX_OUTPUT_TOKENS } },
  defaultGenerateOptionsLegacy: { maxSteps: 20 },
  defaultStreamOptionsLegacy: { maxSteps: 20 },
  tools: {
    // Primary tools Cade uses every turn
    getCaseState,
    ...ingestTools,
    recordTaxFacts,
    recordAIDecision,
    // Surface specific document requests to the dashboard as action cards.
    requestDocumentUpload,
    // Close a card after successful ingest of the uploaded document.
    dismissRequestedAction,
    // End-of-session artifact generation
    generateTaxDocuments,
    /*
     * Secondary: listOpenQuestions/resolveOpenQuestion remain so Cade can
     * see and clear rows that the review workflow writes. He no longer
     * authors his own open questions; those live in working memory now.
     */
    listOpenQuestions: listOpenQuestionsTool,
    resolveOpenQuestion,
    listAIDecisions,
  },
  memory: new Memory({
    /*
     * Same mastra.db file as the main runtime store. A separate store
     * instance because Memory owns its storage lifecycle; the same
     * database because threads/messages belong with the rest of the
     * runtime state.
     */
    storage: new LibSQLStore({
      id: "cade-memory",
      url: mastraDbUrl(),
    }),
    options: {
      /*
       * Thread-scoped: there is one thread per user × return year
       * (threadIdFor in the web app), so working memory follows each
       * filing's conversation. Mastra auto-registers updateWorkingMemory
       * as a tool; cade.workingMemory.ts documents the schema shape.
       */
      workingMemory: {
        enabled: true,
        scope: "thread",
        schema: cadeWorkingMemorySchema,
      },
    },
  }),
});

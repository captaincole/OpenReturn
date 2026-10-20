import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { modelFor } from "../models";
import { mastraDbUrl } from "../server/storage";
import { listAIDecisions, recordAIDecision } from "../tools/aiDecisions";
import { getCaseState } from "../tools/caseState";
import { dismissRequestedAction } from "../tools/dismissRequestedAction";
import { generateTaxDocuments } from "../tools/generateTaxDocuments";
import { ingest1099Consolidated } from "../tools/ingest1099Consolidated";
import { ingest1099R } from "../tools/ingest1099R";
import { ingest1099SA } from "../tools/ingest1099SA";
import { ingestEnergyInvoice } from "../tools/ingestEnergyInvoice";
import { ingestHouseholdW2 } from "../tools/ingestHouseholdW2";
import { ingestSsa1099 } from "../tools/ingestSsa1099";
import { ingestW2 } from "../tools/ingestW2";
import { requestDocumentUpload } from "../tools/requestDocument";
import { listOpenQuestionsTool, recordTaxFacts, resolveOpenQuestion } from "../tools/taxFacts";
import { lucaInstructions } from "./luca.instructions";
import { lucaWorkingMemorySchema } from "./luca.workingMemory";
import { PdfAttachmentRasterizer } from "./pdfAttachments";

export const luca = new Agent({
  id: "luca",
  name: "Luca",
  instructions: lucaInstructions,
  model: modelFor("luca"),
  inputProcessors: [new PdfAttachmentRasterizer()],
  /*
   * Multi-step: get-case-state + maybe one ingest + a record-ai-decision
   * + optionally generate-tax-documents is ~5 steps per turn. 20 leaves
   * headroom for batched scope decisions on a single turn.
   *
   * maxOutputTokens doubles the 4,096 default. One ingest call carries a
   * whole statement: the 21 trades on jordan's consolidated 1099 take
   * about 4,500 tokens, and at 4,096 the call came back with no trades.
   */
  defaultOptions: { maxSteps: 20, modelSettings: { maxOutputTokens: 8192 } },
  defaultGenerateOptionsLegacy: { maxSteps: 20 },
  defaultStreamOptionsLegacy: { maxSteps: 20 },
  tools: {
    // Primary tools Luca uses every turn
    getCaseState,
    ingestW2,
    ingest1099Consolidated,
    ingest1099R,
    ingest1099SA,
    ingestSsa1099,
    ingestHouseholdW2,
    ingestEnergyInvoice,
    recordTaxFacts,
    recordAIDecision,
    // Surface specific document requests to the dashboard as action cards.
    requestDocumentUpload,
    // Close a card after successful ingest of the uploaded document.
    dismissRequestedAction,
    // End-of-session artifact generation
    generateTaxDocuments,
    /*
     * Secondary: listOpenQuestions/resolveOpenQuestion remain so Luca can
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
      id: "luca-memory",
      url: mastraDbUrl(),
    }),
    options: {
      /*
       * Thread-scoped: there is one thread per user × return year
       * (threadIdFor in the web app), so working memory follows each
       * filing's conversation. Mastra auto-registers updateWorkingMemory
       * as a tool; luca.workingMemory.ts documents the schema shape.
       */
      workingMemory: {
        enabled: true,
        scope: "thread",
        schema: lucaWorkingMemorySchema,
      },
    },
  }),
});

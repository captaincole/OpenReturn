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
  /* A turn is about 5 steps; 20 leaves room for batched scope decisions. */
  defaultOptions: { maxSteps: 20, modelSettings: { maxOutputTokens: INGEST_MAX_OUTPUT_TOKENS } },
  defaultGenerateOptionsLegacy: { maxSteps: 20 },
  defaultStreamOptionsLegacy: { maxSteps: 20 },
  tools: {
    getCaseState,
    ...ingestTools,
    recordTaxFacts,
    recordAIDecision,
    requestDocumentUpload,
    dismissRequestedAction,
    generateTaxDocuments,
    listOpenQuestions: listOpenQuestionsTool,
    resolveOpenQuestion,
    listAIDecisions,
  },
  memory: new Memory({
    /* Same mastra.db file, separate store instance: Memory owns its storage lifecycle. */
    storage: new LibSQLStore({
      id: "cade-memory",
      url: mastraDbUrl(),
    }),
    options: {
      /* One thread per user and return year, so working memory follows each filing. */
      workingMemory: {
        enabled: true,
        scope: "thread",
        schema: cadeWorkingMemorySchema,
      },
    },
  }),
});

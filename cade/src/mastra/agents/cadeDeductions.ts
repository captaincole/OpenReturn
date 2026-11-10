import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { modelFor } from "../models";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordAssumptions } from "../tools/assumptions";
import {
  answerLifeQuestions,
  closeDeductions,
  getDeductions,
  recordNamedExpenses,
} from "../tools/deductions";
import { dismissRequestedAction } from "../tools/dismissRequestedAction";
import { ingest1098 } from "../tools/ingest1098";
import { INGEST_MAX_OUTPUT_TOKENS } from "../tools/ingestTools";
import { offerQuickReplies } from "../tools/quickReplies";
import { requestDocumentUpload } from "../tools/requestDocument";
import { recordTaxFacts } from "../tools/taxFacts";
import { cadeDeductionsInstructions } from "./cadeDeductions.instructions";
import { PdfAttachmentRasterizer } from "./pdfAttachments";
import { QuickReplyResolver } from "./quickReplyResolver";

/*
 * Cade in the deductions conversation: the same persona and model as the main
 * agent, with the short instructions and the few tools of this one job. It
 * runs on the filing's second thread (threads.ts); the main thread's long
 * instructions never load here.
 */
export const cadeDeductions = new Agent({
  id: "cade-deductions",
  name: "Cade",
  instructions: cadeDeductionsInstructions,
  model: modelFor("cade"),
  requestContextSchema: cadeRequestContextSchema,
  inputProcessors: [new QuickReplyResolver(), new PdfAttachmentRasterizer()],
  defaultOptions: { maxSteps: 20, modelSettings: { maxOutputTokens: INGEST_MAX_OUTPUT_TOKENS } },
  tools: {
    getDeductions,
    answerLifeQuestions,
    recordNamedExpenses,
    offerQuickReplies,
    recordTaxFacts,
    recordAssumptions,
    ingest1098,
    requestDocumentUpload,
    dismissRequestedAction,
    closeDeductions,
  },
  /* No working memory: the engine's item states hold this conversation's place. */
  memory: new Memory(),
});

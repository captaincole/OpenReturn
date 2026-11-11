import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { modelFor } from "../models";
import { cadeRequestContextSchema } from "../server/requestContext";
import { deductionsTools } from "../tools/deductionsTools";
import { INGEST_MAX_OUTPUT_TOKENS } from "../tools/ingestTools";
import { cadeDeductionsInstructions } from "./cadeDeductions.instructions";
import { PdfAttachmentRasterizer } from "./pdfAttachments";

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
  inputProcessors: [new PdfAttachmentRasterizer()],
  defaultOptions: { maxSteps: 20, modelSettings: { maxOutputTokens: INGEST_MAX_OUTPUT_TOKENS } },
  tools: deductionsTools,
  /* No working memory: the engine's item states hold this conversation's place. */
  memory: new Memory(),
});

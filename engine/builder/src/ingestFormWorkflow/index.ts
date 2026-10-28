import { createWorkflow } from "@mastra/core/workflows";
import {
  workflowInputSchema,
  workflowOutputSchema,
  type WorkflowInput,
  type WorkflowOutput,
} from "./schemas.js";
import { classifyStep, extractStep, persistStep } from "./steps.js";

export const ingestFormWorkflow = createWorkflow({
  id: "ingest-form",
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
})
  .then(extractStep)
  .then(classifyStep)
  .then(persistStep)
  .commit();

export type { WorkflowInput, WorkflowOutput };

export async function runIngestForm(input: WorkflowInput): Promise<WorkflowOutput> {
  const run = await ingestFormWorkflow.createRun();
  const result = await run.start({ inputData: input });
  if (result.status === "success") {
    return result.result;
  }
  if (result.status === "failed") {
    throw result.error;
  }
  throw new Error(`ingest-form: unexpected workflow status '${result.status}'`);
}

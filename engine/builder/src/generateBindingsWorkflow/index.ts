import { createWorkflow } from "@mastra/core/workflows";
import {
  workflowInputSchema,
  workflowOutputSchema,
  type WorkflowInput,
  type WorkflowOutput,
} from "./schemas.js";
import { classifyStep, prepareStep, retrieveStep, writeStep } from "./steps.js";

export const generateBindingsWorkflow = createWorkflow({
  id: "generate-bindings",
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
})
  .then(prepareStep)
  .then(retrieveStep)
  .then(classifyStep)
  .then(writeStep)
  .commit();

export type { WorkflowInput, WorkflowOutput };

export async function runGenerateBindings(input: WorkflowInput): Promise<WorkflowOutput> {
  const run = await generateBindingsWorkflow.createRun();
  const result = await run.start({ inputData: input });
  if (result.status === "success") return result.result;
  if (result.status === "failed") throw result.error;
  throw new Error(`generate-bindings: unexpected workflow status '${result.status}'`);
}

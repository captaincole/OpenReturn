import type { Agent } from "@mastra/core/agent";
import type { z } from "zod";

/*
 * One request with the schema as response format. No tools and no second
 * structuring pass: on a local model that pass cost more than the judging
 * and could run away. "outputFormat" forces native structured output: for
 * Claude models Mastra does not know, it falls back to a JSON tool call that
 * sometimes sends an array as a string.
 */
export async function judge<S extends z.ZodTypeAny>(
  agent: Agent,
  prompt: string,
  schema: S,
): Promise<z.infer<S>> {
  const result = await agent.generate(prompt, {
    structuredOutput: { schema, errorStrategy: "strict" },
    providerOptions: { anthropic: { structuredOutputMode: "outputFormat" } },
  });
  const obj = (result as { object?: unknown }).object;
  if (!obj) throw new Error(`${agent.name}: no structured output`);
  return schema.parse(obj) as z.infer<S>;
}

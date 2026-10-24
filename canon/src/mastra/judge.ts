import type { Agent } from "@mastra/core/agent";
import type { z } from "zod";

/*
 * One judge call: a prompt in, the schema's object out, in a single
 * model request. The schema goes to the model as its response format,
 * so the provider constrains decoding to it and generation ends when
 * the JSON closes. No tools, no second "structuring" pass: on a local
 * model that pass cost more than the judging and could run away.
 *
 * The Anthropic provider bundled with Mastra uses native structured
 * output only for the Claude models it knows; for newer ones it falls
 * back to a JSON tool call, where Claude sometimes sends an array as a
 * string. "outputFormat" forces the native mode. Other providers ignore
 * the option.
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

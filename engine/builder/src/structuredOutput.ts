import type Anthropic from "@anthropic-ai/sdk";

/*
 * Structured output for the forms pipeline. The 5.5 models reject a
 * forced tool_choice ({type: "tool"} or "any"), so the pipeline asks for
 * JSON through output_config.format instead. The call sites keep their
 * tool definitions: the tool's input_schema becomes the JSON schema and
 * its description goes into the system prompt.
 *
 * Returns the parsed JSON (the old tool_use.input), or null when the
 * response has no parseable text block.
 */

/* Structured outputs require additionalProperties: false on every object. */
function strictSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(strictSchema);
  if (schema === null || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema)) out[k] = strictSchema(v);
  if (out.type === "object" && out.additionalProperties === undefined) {
    out.additionalProperties = false;
  }
  return out;
}

export async function createStructured(
  client: Anthropic,
  params: {
    model: string;
    max_tokens: number;
    system: string;
    tool: Anthropic.Tool;
    messages: Anthropic.MessageParam[];
  },
): Promise<{ input: unknown; response: Anthropic.Message }> {
  const response = await client.messages.create({
    model: params.model,
    max_tokens: params.max_tokens,
    system: `${params.system}\n\nOutput: ${params.tool.description ?? ""}`,
    messages: params.messages,
    output_config: {
      format: {
        type: "json_schema",
        schema: strictSchema(params.tool.input_schema) as Record<string, unknown>,
      },
    },
  });
  const text = response.content.find((c) => c.type === "text");
  if (!text || text.type !== "text") return { input: null, response };
  try {
    return { input: JSON.parse(text.text) as unknown, response };
  } catch {
    return { input: null, response };
  }
}

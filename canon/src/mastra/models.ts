import type { MastraModelConfig } from "@mastra/core/llm";

/*
 * JUDGE_MODEL ("provider/model") is required: no in-code default, so a
 * missing var fails at startup. JUDGE_MODEL_URL points the role at an
 * OpenAI-compatible endpoint (Ollama, vLLM, …); JUDGE_MODEL_API_KEY is its
 * optional bearer token.
 */

export type ModelRole = "judge";

export function modelFor(role: ModelRole): MastraModelConfig {
  const prefix = role.toUpperCase();
  const id = process.env[`${prefix}_MODEL`];
  if (!id || !/^[^/]+\/.+$/.test(id)) {
    throw new Error(
      `${prefix}_MODEL is ${id ? `"${id}"` : "not set"} — expected a ` +
        `"provider/model" string (e.g. anthropic/claude-haiku-5-5, or ` +
        `ollama/gemma4:31b with ${prefix}_MODEL_URL pointing at your ` +
        `server). Set it in canon/.env.development.`,
    );
  }
  const url = process.env[`${prefix}_MODEL_URL`];
  if (url) {
    return {
      id: id as `${string}/${string}`,
      url,
      apiKey: process.env[`${prefix}_MODEL_API_KEY`],
    };
  }
  return id as `${string}/${string}`;
}

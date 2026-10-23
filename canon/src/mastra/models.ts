import type { MastraModelConfig } from "@mastra/core/llm";

/*
 * Canon has one model role:
 *
 *   judge     — the grounding judges (workflows/ground/judges: assess,
 *               rule, queryFormulator) and the Ask The Tax Code judges
 *               (workflows/ask/judges: askQueryFormulator, askAnswerer).
 *               Text-only, narrow tasks with structured output.
 *
 * Retrieval embeddings are not a chat model: they route through
 * src/refdocs/embeddings.ts (EMBEDDINGS_MODEL, local Ollama) with a
 * keyword-only fallback when Ollama is down. The ingest contextualizer
 * (REFDOCS_MODEL) is operator tooling whose output ships prebuilt.
 *
 * Configuration contract (JUDGE_*):
 *
 *   JUDGE_MODEL          REQUIRED. "provider/model". Without a URL it
 *                        resolves through Mastra's provider registry
 *                        (cloud, keyed by the provider's *_API_KEY env).
 *   JUDGE_MODEL_URL      When set, the role talks to this
 *                        OpenAI-compatible endpoint instead (Ollama,
 *                        vLLM, LM Studio, llama.cpp, …).
 *   JUDGE_MODEL_API_KEY  Optional bearer token for that endpoint.
 *
 * No in-code default: a missing var is a startup failure, not a silent
 * fallback. Cade resolves its own copy of this role for the grounding
 * steps it still runs in-process.
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

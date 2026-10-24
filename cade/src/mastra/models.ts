import type { MastraModelConfig } from "@mastra/core/llm";

/*
 * Cade has exactly one model role:
 *
 *   cade      — the conversation agent. Must be multimodal (reads
 *               W-2/1099 images inline) and handle multi-step tool
 *               orchestration.
 *
 * The judges (grounding, Ask The Tax Code) and the retrieval embeddings
 * are Canon's models, configured in canon/.env.development (JUDGE_*,
 * EMBEDDINGS_*); Cade reaches them over MCP.
 *
 * Configuration contract (CADE_*):
 *
 *   <ROLE>_MODEL          REQUIRED. "provider/model" string. Without a
 *                         URL it resolves through Mastra's provider
 *                         registry (cloud, keyed by the provider's
 *                         *_API_KEY env).
 *   <ROLE>_MODEL_URL      When set, the role talks to this
 *                         OpenAI-compatible endpoint instead (Ollama,
 *                         vLLM, LM Studio, llama.cpp, HF endpoint, …).
 *   <ROLE>_MODEL_API_KEY  Optional bearer token for that endpoint.
 *
 * There are deliberately NO in-code defaults. The operator decides in
 * the env file which model reads the user's tax data, so a missing var
 * is a startup failure, not a silent fallback. The first-run bootstrap
 * (scripts/bootstrap-env.mjs) writes Anthropic values into the generated
 * .env.development, so a fresh clone still boots without research.
 */

export type ModelRole = "cade";

/*
 * Providers whose APIs accept PDF file parts directly. Everything else
 * (notably any OpenAI-compatible URL) gets PDF attachments rasterized to
 * images first — see agents/pdfAttachments.ts.
 */
const PDF_NATIVE_PROVIDERS = new Set(["anthropic", "google", "vertex"]);

export function modelReadsPdf(role: ModelRole): boolean {
  const prefix = role.toUpperCase();
  if (process.env[`${prefix}_MODEL_URL`]) return false;
  const id = process.env[`${prefix}_MODEL`] ?? "";
  return PDF_NATIVE_PROVIDERS.has(id.split("/")[0]);
}

export function modelFor(role: ModelRole): MastraModelConfig {
  const prefix = role.toUpperCase();
  const id = process.env[`${prefix}_MODEL`];
  if (!id || !/^[^/]+\/.+$/.test(id)) {
    throw new Error(
      `${prefix}_MODEL is ${id ? `"${id}"` : "not set"} — expected a ` +
        `"provider/model" string (e.g. anthropic/claude-sonnet-4-6, or ` +
        `ollama/qwen3-vl:8b with ${prefix}_MODEL_URL pointing at your ` +
        `server). Set it in cade/.env.development. The app refuses ` +
        `to guess which model handles ${role} conversations.`,
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

import type { MastraModelConfig } from "@mastra/core/llm";

/*
 * CADE_MODEL ("provider/model") is required. CADE_MODEL_URL points it at an OpenAI-compatible
 * endpoint, with CADE_MODEL_API_KEY as its bearer token. No in-code defaults on purpose:
 * the operator chooses which model reads tax data. The judges are Canon's models.
 */

export type ModelRole = "cade";

/* Every other provider, and any OpenAI-compatible URL, gets PDFs rasterized (pdfAttachments.ts). */
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

/*
 * A model change invalidates every stored vector. After a switch, run
 * `npm run corpus -- reembed --all`.
 */
export interface EmbeddingsConfig {
  provider: "ollama";
  model: string;
  /** "provider/model", stamped into ref_meta on write. */
  id: string;
  url: string;
}

const DEFAULT_EMBEDDINGS_MODEL = "ollama/embeddinggemma-2";

export function resolveEmbeddings(): EmbeddingsConfig {
  const raw = process.env.EMBEDDINGS_MODEL ?? DEFAULT_EMBEDDINGS_MODEL;
  const slash = raw.indexOf("/");
  const provider = slash > 0 ? raw.slice(0, slash) : "";
  const model = slash > 0 ? raw.slice(slash + 1) : "";
  if (provider !== "ollama" || !model) {
    throw new Error(
      `EMBEDDINGS_MODEL is "${raw}" — expected "ollama/<model>" ` +
        `(e.g. ${DEFAULT_EMBEDDINGS_MODEL}); embeddings run locally via Ollama.`,
    );
  }
  return {
    provider: "ollama",
    model,
    id: raw,
    url: process.env.EMBEDDINGS_MODEL_URL ?? "http://localhost:11434",
  };
}

/*
 * The EmbeddingGemma model card requires these task prefixes. Without them
 * retrieval precision silently drops.
 */
function isEmbeddingGemma(model: string): boolean {
  return model.startsWith("embeddinggemma");
}

function gemmaDocument(text: string): string {
  return `title: none | text: ${text}`;
}

function gemmaQuery(text: string): string {
  return `task: search result | query: ${text}`;
}

interface OllamaEmbedResponse {
  embeddings: number[][];
}

const OLLAMA_BATCH = 32;

async function ollamaEmbed(cfg: EmbeddingsConfig, inputs: string[]): Promise<number[][]> {
  const res = await fetch(`${cfg.url}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: cfg.model, input: inputs }),
  }).catch((err: unknown) => {
    throw new Error(
      `Ollama unreachable at ${cfg.url} (${err instanceof Error ? err.message : String(err)}) — ` +
        `is ollama running? Install: https://ollama.com, then \`ollama pull ${cfg.model}\`.`,
    );
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Ollama /api/embed ${res.status}: ${text.slice(0, 300)} ` +
        `(model=${cfg.model} — pulled? \`ollama pull ${cfg.model}\`)`,
    );
  }
  const body = (await res.json()) as OllamaEmbedResponse;
  if (!Array.isArray(body.embeddings) || body.embeddings.length !== inputs.length) {
    throw new Error(
      `Ollama /api/embed returned ${body.embeddings?.length ?? 0} vectors for ${inputs.length} inputs`,
    );
  }
  return body.embeddings;
}

export async function embedDocuments(
  cfg: EmbeddingsConfig,
  inputs: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const prefixed = isEmbeddingGemma(cfg.model) ? inputs.map(gemmaDocument) : inputs;
  const vectors: number[][] = [];
  for (let i = 0; i < prefixed.length; i += OLLAMA_BATCH) {
    const vecs = await ollamaEmbed(cfg, prefixed.slice(i, i + OLLAMA_BATCH));
    vectors.push(...vecs);
    onProgress?.(vectors.length, inputs.length);
  }
  return vectors;
}

export async function embedQuery(cfg: EmbeddingsConfig, query: string): Promise<number[]> {
  const input = isEmbeddingGemma(cfg.model) ? gemmaQuery(query) : query;
  const [vec] = await ollamaEmbed(cfg, [input]);
  return vec;
}

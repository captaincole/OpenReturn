/*
 * The size of each prompt the agent sent, from Mastra's traces (kept in the
 * agent's memory until it stops). A local model has a small context: Ollama
 * cuts a longer prompt without an error, so the run reports the largest one.
 *
 * Mastra asks an OpenAI-compatible server (Ollama) for no token counts, so for
 * a local model the size is an estimate from the prompt's characters.
 */

import { note } from "./summary";

const AGENT_URL = "http://127.0.0.1:4111/api/observability";
/*
 * Checked against Gemma 4's own count on a replayed deductions prompt: 7,802
 * estimated, 7,883 counted. Plain prose runs about 3.6 characters a token.
 */
const CHARS_PER_TOKEN = 4;
/* The trace keeps an attachment's place, not its data. */
const IMAGE_MARK = "[file]";

interface Span {
  traceId: string;
  spanType?: string;
  entityId?: string | null;
  input?: Array<{ role?: string }>;
  attributes?: { usage?: { inputTokens?: number }; tools?: unknown } | null;
}

interface PromptSize {
  tokens: number;
  exact: boolean;
  images: number;
  /** Estimated tokens of each part: what to cut when the prompt grows too big. */
  parts: { instructions: number; tools: number; messages: number };
}

async function json<T>(path: string): Promise<T> {
  const res = await fetch(`${AGENT_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return (await res.json()) as T;
}

/* One root span per trace: an agent turn, a workflow or a tool. */
async function rootSpans(): Promise<Span[]> {
  const spans: Span[] = [];
  for (let page = 0; ; page++) {
    const list = await json<{ spans: Span[]; pagination?: { hasMore: boolean } }>(
      `/traces?page=${page}&perPage=100`,
    );
    spans.push(...list.spans);
    if (!list.pagination?.hasMore) return spans;
  }
}

const estimate = (value: unknown) =>
  Math.round(JSON.stringify(value ?? "").length / CHARS_PER_TOKEN);

/* One model call: the messages and the tool definitions the model got. */
function promptSize(span: Span): PromptSize {
  const input = span.input ?? [];
  const parts = {
    instructions: estimate(input.filter((message) => message.role === "system")),
    tools: estimate(span.attributes?.tools),
    messages: estimate(input.filter((message) => message.role !== "system")),
  };
  const images = JSON.stringify(input).split(IMAGE_MARK).length - 1;
  const counted = span.attributes?.usage?.inputTokens;
  const total = parts.instructions + parts.tools + parts.messages;
  return { tokens: counted ?? total, exact: counted !== undefined, images, parts };
}

type Largest = PromptSize & { calls: number };

/* The largest prompt of each agent, and its number of model calls. */
async function largestPrompts(): Promise<Map<string, Largest>> {
  const byAgent = new Map<string, Largest>();
  for (const root of await rootSpans()) {
    if (!root.entityId) continue;
    const trace = await json<{ spans: Span[] }>(`/traces/${root.traceId}`);
    for (const span of trace.spans.filter((each) => each.spanType === "model_inference")) {
      const size = promptSize(span);
      const largest = byAgent.get(root.entityId);
      const calls = (largest?.calls ?? 0) + 1;
      const kept = largest && largest.tokens >= size.tokens ? largest : size;
      byAgent.set(root.entityId, { ...kept, calls });
    }
  }
  return byAgent;
}

/* A note for the summary: it never fails the run. */
export async function notePromptSizes() {
  try {
    const sizes = await largestPrompts();
    if (sizes.size === 0) note("prompt sizes: the traces hold no model calls");
    for (const [agent, { tokens, exact, images, parts, calls }] of sizes) {
      const amount = `${exact ? "" : "about "}${tokens.toLocaleString("en-US")} tokens`;
      const split = `instructions ${parts.instructions}, tools ${parts.tools}, messages ${parts.messages}`;
      const how = exact ? split : `${split}, estimated at ${CHARS_PER_TOKEN} characters a token`;
      note(
        `largest prompt: ${agent} ${amount} and ${images} images (${how}; ${calls} model calls)`,
      );
    }
  } catch (err) {
    note(`prompt sizes: ${(err as Error).message}`);
  }
}

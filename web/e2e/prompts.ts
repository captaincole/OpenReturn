/*
 * The size of each prompt the agent sent, from Mastra's traces (kept in the
 * agent's memory until it stops). A local model has a small context: Ollama
 * cuts a longer prompt without an error, so the run reports the largest one.
 */

import { note } from "./summary";

const AGENT_URL = "http://127.0.0.1:4111/api/observability";

interface Span {
  traceId: string;
  spanType?: string;
  entityId?: string | null;
  attributes?: { usage?: { inputTokens?: number } } | null;
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

/* The largest prompt of each agent, in tokens, and its number of model steps. */
async function largestPrompts(): Promise<Map<string, { max: number; steps: number }>> {
  const byAgent = new Map<string, { max: number; steps: number }>();
  for (const root of await rootSpans()) {
    if (!root.entityId) continue;
    const trace = await json<{ spans: Span[] }>(`/traces/${root.traceId}`);
    for (const span of trace.spans) {
      const tokens = span.attributes?.usage?.inputTokens;
      if (span.spanType !== "model_step" || tokens === undefined) continue;
      const agent = byAgent.get(root.entityId) ?? { max: 0, steps: 0 };
      byAgent.set(root.entityId, { max: Math.max(agent.max, tokens), steps: agent.steps + 1 });
    }
  }
  return byAgent;
}

/* A note for the summary: it never fails the run. */
export async function notePromptSizes() {
  try {
    const sizes = await largestPrompts();
    if (sizes.size === 0) note("prompt sizes: the traces hold no token counts");
    for (const [agent, { max, steps }] of sizes) {
      note(`largest prompt: ${agent} ${max.toLocaleString("en-US")} tokens (${steps} model steps)`);
    }
  } catch (err) {
    note(`prompt sizes: ${(err as Error).message}`);
  }
}

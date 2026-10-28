/*
 * Adapted from Anthropic's Contextual Retrieval cookbook, which caches the
 * whole document. The 1040 instructions alone exceed Haiku's 200k context,
 * so the cached block is the block's section instead.
 */

import { createHash } from "node:crypto";

const ANTHROPIC_BASE = "https://api.anthropic.com/v1";
const ANTHROPIC_VERSION = "2023-06-01";

/*
 * A published corpus uses one model end to end: after a switch, rebuild with
 * `corpus sync --force`. Read at call time: the CLI loads env after imports.
 */
const summarizerModel = () => process.env.REFDOCS_MODEL ?? "claude-haiku-5-5";

const PROMPT_INSTRUCTION = `The chunk above lives in a larger document. Here is the chunk we want to situate within the document:
<chunk>
{chunk}
</chunk>

Please give a short succinct context (50-100 tokens) to situate this chunk within the overall document for the purposes of improving search retrieval. Mention the document, the section, and what tax question or rule the chunk addresses. Answer only with the succinct context and nothing else.`;

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return key;
}

interface MessagesResponse {
  content: { type: "text"; text: string }[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

async function callMessages(body: unknown, attempt = 0): Promise<MessagesResponse> {
  const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey(),
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.ok) return (await res.json()) as MessagesResponse;
  const retryable = res.status === 429 || res.status >= 500;
  if (retryable && attempt < 4) {
    const wait = 500 * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, wait));
    return callMessages(body, attempt + 1);
  }
  const text = await res.text().catch(() => "");
  throw new Error(`Anthropic /messages ${res.status}: ${text.slice(0, 500)}`);
}

export interface SummarizeOpts {
  documentTitle: string;
  sectionHeading: string | null;
  sectionText: string;
  blockText: string;
  maxTokens?: number;
}

export async function summarizeBlock(opts: SummarizeOpts): Promise<string> {
  const sectionLine = opts.sectionHeading
    ? `Section: § ${opts.sectionHeading}`
    : "Section: (preamble — top-level document content)";

  const res = await callMessages({
    model: summarizerModel(),
    max_tokens: opts.maxTokens ?? 200,
    system: `You are summarizing chunks of "${opts.documentTitle}" for a tax-law retrieval index. Each summary must let a future search find the chunk by topic, not just by keyword.`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${sectionLine}\n\n<section>\n${opts.sectionText}\n</section>`,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: PROMPT_INSTRUCTION.replace("{chunk}", opts.blockText),
          },
        ],
      },
    ],
  });
  const summary = res.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("")
    .trim();
  return summary;
}

export interface BlockToSummarize {
  blockId: string;
  text: string;
  sectionHeading: string | null;
  sectionText: string;
}

export interface SummarizedBlock {
  blockId: string;
  summary: string;
  contextualizedText: string;
  blockTextSha1: string;
}

export function sha1(text: string): string {
  return createHash("sha1").update(text).digest("hex");
}

export interface SummarizeAllOpts {
  documentTitle: string;
  blocks: BlockToSummarize[];
  /** 5 stays under Anthropic's default tier-1 rate limits. */
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}

export async function summarizeBlocks(opts: SummarizeAllOpts): Promise<SummarizedBlock[]> {
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 5, 16));
  // Same-section blocks run together so the rest hit the first one's prompt cache.
  const ordered = opts.blocks
    .map((b, i) => ({ b, i }))
    .sort((a, b) => {
      const ka = a.b.sectionHeading ?? "";
      const kb = b.b.sectionHeading ?? "";
      if (ka < kb) return -1;
      if (ka > kb) return 1;
      return a.i - b.i;
    });

  const results: SummarizedBlock[] = new Array(opts.blocks.length);
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= ordered.length) return;
      const { b, i: origIndex } = ordered[i];
      const summary = await summarizeBlock({
        documentTitle: opts.documentTitle,
        sectionHeading: b.sectionHeading,
        sectionText: b.sectionText,
        blockText: b.text,
      });
      const contextualizedText = `${summary}\n\n${b.text}`;
      results[origIndex] = {
        blockId: b.blockId,
        summary,
        contextualizedText,
        blockTextSha1: sha1(b.text),
      };
      done += 1;
      opts.onProgress?.(done, ordered.length);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

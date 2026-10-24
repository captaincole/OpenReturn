import { MCPClient } from "@mastra/mcp";
import type { z } from "zod";
import {
  askResultSchema,
  groundResultSchema,
  searchResultSchema,
  type AskHistoryTurn,
  type AskResult,
  type GroundInput,
  type GroundResult,
  type SearchHit,
} from "./schemas";

/*
 * Cade's MCP client for Canon. Canon runs as its own process (port 4112)
 * and this is the only way Cade reaches the reference library: no
 * in-process import, no shared database. Three calls:
 *
 *   searchCanon   hybrid retrieval (the forms pipeline's labeling step)
 *   askCanon      Ask The Tax Code, one turn
 *   groundCanon   ground one decision: verdict, citations, step log
 *
 * Failure comes in two kinds, and the review workflow stamps them
 * differently:
 *
 *   CanonUnreachableError — the call never reached Canon or never came
 *       back (connection refused, timeout, a lost session). The work was
 *       not done; a retry is the fix.
 *   CanonToolError — Canon ran the tool and reported a failure (a judge
 *       threw, a schema did not match). A retry will likely fail again.
 *
 * Configuration: CANON_URL (default http://127.0.0.1:4112) and, when
 * Canon enforces one, CANON_API_TOKEN. CANON_TIMEOUT_MS caps one call
 * (default 5 min). A ground call that needs longer is the signal to cut
 * its iterations or use a faster judge, not to raise the cap: a timed-out
 * review is stamped review_unreached and retried.
 */

export class CanonUnreachableError extends Error {
  readonly name = "CanonUnreachableError";
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

export class CanonToolError extends Error {
  readonly name = "CanonToolError";
}

/** True when the error, or anything in its cause chain, is a CanonUnreachableError. */
export function isCanonUnreachable(err: unknown): boolean {
  for (let e = err; e; e = (e as { cause?: unknown }).cause) {
    if ((e as { name?: string }).name === "CanonUnreachableError") return true;
  }
  return false;
}

const DEFAULT_URL = "http://127.0.0.1:4112";
const DEFAULT_TIMEOUT_MS = 300_000;

/* The MCP client's tools, narrowed to what we call: execute(input). */
type CanonTool = { execute?: (input: unknown, context?: never) => Promise<unknown> };

let client: MCPClient | undefined;
let tools: Promise<Record<string, CanonTool>> | undefined;

/* Env is read at first use, not at import: dotenv may load after this module. */
function getClient(): MCPClient {
  if (client) return client;
  const token = process.env.CANON_API_TOKEN;
  client = new MCPClient({
    id: "cade-canon",
    servers: {
      canon: {
        url: new URL("/api/mcp/canon/mcp", process.env.CANON_URL ?? DEFAULT_URL),
        timeout: Number(process.env.CANON_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
        enableServerLogs: false,
        ...(token ? { requestInit: { headers: { Authorization: `Bearer ${token}` } } } : {}),
      },
    },
  });
  return client;
}

export const errorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  const m = (err as { message?: unknown } | null)?.message;
  return typeof m === "string" ? m : String(err);
};

/*
 * The tool list is fetched once and cached; a failed fetch is not cached,
 * so the next call tries Canon again. MCPClient does not throw when a
 * server is down (it logs and returns no tools), so the errors map is
 * what says "unreachable".
 */
async function canonTool(name: string): Promise<CanonTool> {
  tools ??= getClient()
    .listToolsetsWithErrors()
    .then(({ toolsets, errors }) => {
      const canon = toolsets.canon as Record<string, CanonTool> | undefined;
      if (errors.canon || !canon) {
        throw new CanonUnreachableError(
          `Canon is not reachable: ${errors.canon ?? "no tools listed"}`,
        );
      }
      return canon;
    })
    .catch((err: unknown) => {
      tools = undefined;
      if (isCanonUnreachable(err)) throw err;
      throw new CanonUnreachableError(`Canon is not reachable: ${errorMessage(err)}`, {
        cause: err,
      });
    });
  const tool = (await tools)[name];
  if (!tool?.execute) throw new CanonToolError(`Canon has no tool "${name}"`);
  return tool;
}

type McpResult = { isError?: boolean; content?: { type?: string; text?: string }[] };

/* An MCP tool result that reports failure instead of throwing. */
function toolErrorText(raw: unknown): string | null {
  const r = raw as McpResult | null;
  if (!r?.isError) return null;
  return r.content?.map((c) => c.text ?? "").join("\n") || "unknown error";
}

/*
 * What the client hands back: a tool with an output schema arrives as
 * its structured object; a workflow tool has none, so its run result
 * arrives as JSON text in `content`. Unwrap the text, then the run:
 * { status: "success", result } carries the workflow's output, any
 * other status is Canon reporting a failure.
 */
function unwrap(name: string, raw: unknown): unknown {
  const r = raw as McpResult | null;
  let value = raw;
  if (r && typeof r === "object" && Array.isArray(r.content)) {
    const text = r.content
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");
    try {
      value = JSON.parse(text);
    } catch {
      throw new CanonToolError(`Canon ${name} returned non-JSON content: ${text.slice(0, 200)}`);
    }
  }
  if (!name.startsWith("run_")) return value;
  const run = value as { status?: string; result?: unknown; error?: unknown } | null;
  if (!run || typeof run !== "object" || !("status" in run)) return value;
  if (run.status === "success") return run.result;
  throw new CanonToolError(`Canon ${name} ${run.status}: ${errorMessage(run.error)}`);
}

export async function callCanon<S extends z.ZodTypeAny>(
  name: string,
  input: unknown,
  schema: S,
): Promise<z.infer<S>> {
  const tool = await canonTool(name);
  let raw: unknown;
  try {
    raw = await tool.execute?.(input);
  } catch (err) {
    throw new CanonUnreachableError(`Canon ${name}: ${errorMessage(err)}`, { cause: err });
  }
  const failure = toolErrorText(raw);
  if (failure) throw new CanonToolError(`Canon ${name} failed: ${failure}`);
  const parsed = schema.safeParse(unwrap(name, raw));
  if (!parsed.success) {
    throw new CanonToolError(`Canon ${name} returned an unexpected shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function searchCanon(input: {
  query: string;
  limit?: number;
  docId?: string;
}): Promise<SearchHit[]> {
  return (await callCanon("searchRefDocs", input, searchResultSchema)).results;
}

export async function askCanon(input: {
  question: string;
  history: AskHistoryTurn[];
}): Promise<AskResult> {
  return callCanon("run_ask", input, askResultSchema);
}

export async function groundCanon(input: GroundInput): Promise<GroundResult> {
  return callCanon("run_ground", input, groundResultSchema);
}

/** For scripts that exit: close the MCP session. */
export async function disconnectCanon(): Promise<void> {
  await client?.disconnect();
  client = undefined;
  tools = undefined;
}

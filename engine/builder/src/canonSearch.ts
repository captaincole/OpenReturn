import { MCPClient } from "@mastra/mcp";
import { z } from "zod";

/*
 * The builder's one call to Canon: hybrid search over the reference
 * corpus, over MCP (Canon's searchRefDocs tool). Canon must be running
 * (npm run dev:canon). Configuration: CANON_URL (default
 * http://127.0.0.1:4112) and, when Canon enforces one, CANON_API_TOKEN.
 */

const DEFAULT_URL = "http://127.0.0.1:4112";

const searchResultSchema = z.object({
  results: z.array(
    z.object({ blockId: z.string(), docId: z.string(), text: z.string(), score: z.number() }),
  ),
});
export type SearchHit = z.infer<typeof searchResultSchema>["results"][number];

type SearchTool = { execute?: (input: unknown) => Promise<unknown> };

let client: MCPClient | undefined;
let search: Promise<SearchTool> | undefined;

/* Env is read at first use, not at import: dotenv loads after this module. */
function getClient(): MCPClient {
  const token = process.env.CANON_API_TOKEN;
  client ??= new MCPClient({
    id: "builder-canon",
    servers: {
      canon: {
        url: new URL("/api/mcp/canon/mcp", process.env.CANON_URL ?? DEFAULT_URL),
        enableServerLogs: false,
        ...(token ? { requestInit: { headers: { Authorization: `Bearer ${token}` } } } : {}),
      },
    },
  });
  return client;
}

/* MCPClient does not throw for a down server; its errors map says so. */
async function searchTool(): Promise<SearchTool> {
  const { toolsets, errors } = await getClient().listToolsetsWithErrors();
  const tool = (toolsets.canon as Record<string, SearchTool> | undefined)?.searchRefDocs;
  if (!tool?.execute) {
    throw new Error(
      `Canon is not reachable (${errors.canon ?? "no searchRefDocs tool"}). Run npm run dev:canon.`,
    );
  }
  return tool;
}

type McpResult = { isError?: boolean; content?: { type?: string; text?: string }[] } | null;

/*
 * A result arrives as the structured object, or as JSON text in `content`.
 * A failed tool call arrives as `isError` with the error text in `content`.
 */
function unwrap(raw: unknown): unknown {
  const r = raw as McpResult;
  const text = r?.content?.map((c) => (c.type === "text" ? (c.text ?? "") : "")).join("") ?? "";
  if (r?.isError) throw new Error(`Canon searchRefDocs failed: ${text || "unknown error"}`);
  if (!Array.isArray(r?.content)) return raw;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Canon searchRefDocs returned non-JSON content: ${text.slice(0, 200)}`);
  }
}

export async function searchCanon(input: { query: string; limit?: number }): Promise<SearchHit[]> {
  search ??= searchTool().catch((err: unknown) => {
    search = undefined;
    throw err;
  });
  const raw = await (await search).execute?.(input);
  return searchResultSchema.parse(unwrap(raw)).results;
}

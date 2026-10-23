# Canon

Canon is the tax attorney: the IRS and FTB reference library, and the judges that read it. It is a Mastra project with no conversational agent and no user data.

What it owns:

- **`.data/corpus.db`** — the library: every ingested document's text, sections, blocks, embeddings and source file. Prebuilt; `npm run corpus -- fetch` installs it.
- **`src/refdocs/`** — the ingest pipeline (parse, contextualize, embed) and **`scripts/corpus/`**, the `corpus` CLI that runs it from the sidecars in `packages/sources`.
- **`src/db/`** — the corpus schema, store and hybrid search (FTS5 + local embeddings, rank fusion).
- **`src/mastra/workflows/ask/`** — Ask The Tax Code: formulate → retrieve → answer → validate. Stateless; the caller keeps threads.
- **`src/mastra/workflows/ground/`** — the grounding judges, prompts and schemas Cade's review workflow uses.
- **`src/mastra/mcp.ts`** — the MCP server: `searchRefDocs`, `citeRefDoc`, `run_ask`.

## Running it

```bash
npm run dev:canon          # from the repo root: Mastra on :4112, Studio included
npm run corpus -- status   # the corpus CLI (no args lists subcommands)
```

MCP clients connect to `http://localhost:4112/api/mcp/canon/mcp` (streamable HTTP) or `/api/mcp/canon/sse`. The web app reads the reference library through its `/api/canon` proxy.

Configuration lives in `canon/.env.development` (generated on first `npm run dev`, see `.env.example`): `JUDGE_MODEL`, the embeddings model, and `CORPUS_DB_PATH`.

## Boundary

`tests/unit/boundary.test.ts` fails if anything under `src/` or `scripts/` imports Cade's code, app.db, the form engine or agent memory. Consumers reach Canon through `@openreturn/canon` (in-process, for now) or MCP.

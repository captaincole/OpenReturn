# Canon

Canon is the tax attorney: the IRS and FTB reference library, and the judges that read it. It is a Mastra project with no conversational agent and no user data.

What it owns:

- **`.data/corpus.db`** — the library: every ingested document's text, sections, blocks, embeddings and source file. Prebuilt; `npm run corpus -- fetch` installs it.
- **`src/refdocs/`** — the ingest pipeline (parse, contextualize, embed) and **`scripts/corpus/`**, the `corpus` CLI that runs it from the sidecars in `sources`.
- **`src/db/`** — the corpus schema, store and hybrid search (FTS5 + local embeddings, rank fusion).
- **`src/mastra/workflows/ask/`** — Ask The Tax Code: formulate → retrieve → answer → validate. Stateless; the caller keeps threads.
- **`src/mastra/workflows/ground/`** — ground one decision: (gather → assess → rule) × up to `maxIterations` (default 3). The decision and its facts come in; the verdict, citations and the judges' step log go out. Stateless; the caller keeps the decision and the verdict.
- **`src/mastra/mcp.ts`** — the MCP server: `searchRefDocs`, `citeRefDoc`, `run_ask`, `run_ground`.
- **`evals/`** — the review (ground) and ask evals: `npx tsx --env-file=.env.development evals/review/run.ts <model>` from this folder; reports in `docs/evals`.

## Running it

```bash
npm run dev:canon          # from the repo root: Mastra on :4112, Studio included
npm run corpus -- status   # the corpus CLI (no args lists subcommands)
```

MCP clients connect to `http://localhost:4112/api/mcp/canon/mcp` (streamable HTTP) or `/api/mcp/canon/sse`; Cade's client is `apps/agent/src/mastra/canon/client.ts`. The web app reads the reference library through its `/api/canon` proxy.

Configuration lives in `canon/.env.development` (generated on first `npm run dev`, see `.env.example`): `JUDGE_MODEL`, the embeddings model, and `CORPUS_DB_PATH`.

## Boundary

`tests/unit/boundary.test.ts` fails if anything under `src/` or `scripts/` imports Cade's code, app.db, the form engine or agent memory. Consumers reach Canon over MCP; `@openreturn/canon` (`src/index.ts`) is the in-process API for tooling that runs inside Canon, such as its evals.

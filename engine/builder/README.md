# Builder (`@openreturn/builder`)

[← Back to the README](../../README.md) · [the engine](../README.md)

Dev-time tooling (`@openreturn/builder`) that turns a blank IRS/FTB PDF
into the assets the form engine consumes. Nothing here runs in production — the engine reads the
finished artifacts (`catalog.json`, data tables), never this code.

NOTE: This is still a work in progress. I use this part of the project to get started, specifically to create typed fields for all forms I want to ingest. The rules part (bindings) of this form engine doesn't work well yet and still needs to be hand verified after generation but the types are normally pretty good. 

```
blank.pdf ──ingest──► catalog.json ──promote──► runtime copy ──bind──► bindings.ts draft
```

## Pieces (`src/`)

- **`ingestFormWorkflow/`** — Mastra workflow (run standalone from the CLI,
  not registered on the production instance): extract AcroForm widgets from
  the PDF (`extractFormFields.ts`), AI-label and classify each field
  (`visionLabel.ts`, `classifyFields.ts`), persist a `catalog.json` to
  the engine, next to the form's bindings
  (`engine/src/<jurisdiction>/<short>/`).
- **`generateBindingsWorkflow/`** — drafts a `bindings.ts` skeleton for a
  cataloged form: retrieves instruction context through Canon's MCP
  search (`retrieveContext.ts`; run `npm run dev:canon` first),
  classifies which fields are derivable (`classifyBindings.ts`),
  renders the draft (`renderBindings.ts`). Output is a starting point —
  a human finishes and owns the bindings.
- **`tables/`** — parsers for official rate/tax tables (IRS HTML, FTB PDF)
  into the JSON the engine's `data/` modules load.
- **`renderPageWithOverlay.ts`** — debug renders with widget boxes drawn on
  the page, for eyeballing label↔widget alignment.

## Commands (from repo root)

```bash
npm run form-engine -- generate-catalog           # PDF → catalog.json (Anthropic calls, costs money)
npm run form-engine -- generate-bindings          # catalog → bindings.ts draft
npm run form-engine -- ingest-federal-tax-table   # refresh the federal tax table JSON
```

## Setup

Set `ANTHROPIC_API_KEY` in `.env.development` here
(`generate-catalog` and `generate-bindings` call Anthropic). The first
`npm run form-engine` writes that file; `.env.example` lists every
setting. As in Canon and Cade, a `.env` file overrides it.
`generate-bindings` also searches Canon over MCP (`src/canonSearch.ts`),
so start it first with `npm run dev:canon`.

Run `npm run form-engine` with no arguments for the full command list
(including `generate-types` and `ingest-ca-tax-table`), and
`-- <command> --help` for a command's options.

Inputs come from `sources/<year>/forms/` (the source documents); outputs
go to `engine/src/`. A new catalog reaches the runtime in the
same commit as its tests: the engine imports it directly. AI labeling
fence-posts on dense widget clusters — hand-verified corrections live in
`engine/src/render/verifiedWidgets.ts` and take precedence over
catalog widget names at render time.

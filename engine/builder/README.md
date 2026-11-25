# Builder (`@openreturn/builder`)

[← Back to the README](../../README.md) · [the engine](../README.md)

Dev-time tooling (`@openreturn/builder`) that turns a blank IRS/FTB PDF
into the assets the form engine consumes. Nothing here runs in production — the engine reads the
finished artifacts (`catalog.json`, data tables), never this code.

The builder calls no model and has no env file. The judgment steps belong to the
Claude Code skills in `.claude/skills/`: `catalog-form-fields` labels the fields,
and `write-binding-rules` drafts the rules in `bindings.ts`. The builder does the
steps around them that need no judgment.

```
blank.pdf ──extract-widgets──► widgets.json + tiles ──labels.json──► write-catalog ──► catalog.json
```

## Pieces (`src/`)

- **`extractWidgets.ts`** — the fillable widgets of a blank PDF: name, kind,
  position, radio options, and the form author's /TU label when the PDF has one.
- **`overlayTiles.ts`** — a page with a numbered box on each widget, cut into
  bands that stay readable.
- **`labelsFile.ts`** — the schema of `labels.json`: the fieldId, label, category
  and value type that the labeler decides for each widget.
- **`seedLabels.ts`** — `labels.json` from a committed catalog, so a rebuild
  keeps every fieldId that `bindings.ts` refers to.
- **`catalogFromLabels.ts`**, **`catalogRows.ts`** — check every widget against
  `labels.json`, then build the catalog rows.
- **`workFiles.ts`**, **`formTarget.ts`** — where a form's files are: the work
  files in `.scratch/forms/<year>/<subpath>/`, the blank PDF, the catalog.
- **`formStatus.ts`** — which steps of a form are done.
- **`tables/`** — parsers for official rate/tax tables (IRS HTML, FTB PDF)
  into the JSON the engine's `data/` modules load.

## Commands (from repo root)

```bash
npm run form-engine -- form-status federal/8959     # which steps of a form are done, what is next, and its instructions doc
npm run form-engine -- extract-widgets federal/8959 # PDF → .scratch/forms/…/widgets.json + numbered overlay tiles
npm run form-engine -- seed-labels federal/8959     # catalog.json → labels.json; lists the widgets left to label
npm run form-engine -- write-catalog federal/8959   # widgets.json + labels.json → catalog.json, every widget checked
npm run form-engine -- ingest-federal-tax-table     # refresh the federal tax table JSON
npm run form-engine -- ingest-exchange-rates        # refresh the H.10, G.5A and Treasury rate tables (engine/src/data/exchange-rates/)
```

Run `npm run form-engine` with no arguments for the full command list
(including `generate-types`, `ingest-ca-tax-table` and `ingest-ca-eitc-table`), and
`-- <command> --help` for a command's options.

Inputs come from `sources/<year>/forms/` (the source documents); outputs
go to `engine/src/`. A new catalog reaches the runtime in the
same commit as its tests: the engine imports it directly. A label can land on
the wrong widget in a dense cluster — hand-verified corrections live in
`engine/src/render/verifiedWidgets.ts` and take precedence over
catalog widget names at render time.

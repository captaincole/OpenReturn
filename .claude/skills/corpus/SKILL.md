---
name: corpus
description: Add or update a reference document (IRS/FTB instructions, publications) and run the corpus CLI (status, sync, reembed, fetch, search). Use for any change to canon/.data/corpus.db or a sources/**/*.meta.json sidecar.
---

# Corpus: reference documents and the `corpus` CLI

Each form's instructions are described by `sources/<year>/forms/<jurisdiction>/<short>/instructions.meta.json`. Publications (IRS/FTB guides to a topic across forms) are described by `sources/<year>/publications/<jurisdiction>/<pub>/publication.meta.json`, and their docIds start `irs-pub-` / `ftb-pub-`. The sidecar names the source file by `sourceUrl` and `sha256` (plus `"format": "html"` for a web page); only the sidecar is committed:

```json
{
  "docId": "irs-1040-inst-2025",
  "title": "Instructions for Form 1040 (2025)",
  "publisher": "IRS",
  "taxYear": 2025,
  "sourceUrl": "https://www.irs.gov/pub/irs-pdf/i1040gi.pdf",
  "sha256": "<sha256 of the PDF>"
}
```

When sync needs a source file that is not on disk, it takes it from corpus.db (every ingested file is stored there), else downloads `sourceUrl` (and cleans it, for HTML) and checks `sha256`. Publishers replace files at the same URL with new editions, so the stored copy is what keeps re-ingests working; a mismatch error names the fix (`canon/src/refdocs/fetchSource.ts`).

Each document has a publication date (`ref_documents.published`, `refdocs/published.ts`). The Ask answerer sees it in each passage header and prefers the newer document when two passages disagree; the library shows it. A PDF's date is its creation date, read at ingest; a sidecar's optional `"published": "YYYY-MM[-DD]"` overrides it (set it when the PDF's metadata is older than its revision, e.g. 3921 "Rev. April 2025"). `add-html` records an FTB page's "Revised" date; FTB's tax-year pages show none, so they have no date.

## Operator flow

The `corpus` CLI: `npm run corpus` with no args lists all subcommands, `-- <cmd> --help` shows options. It lives under `canon/scripts/corpus/`; run it from the repo root, and `--` passes args through both npm layers.

```bash
# 1. Download the PDF and write its sidecar (docId, title, publisher, taxYear, sourceUrl,
#    sha256) as instructions.meta.json in sources/<year>/forms/<jurisdiction>/<short>/,
#    or publication.meta.json in sources/<year>/publications/<jurisdiction>/<pub>/.
#    Leave the PDF beside it; it is gitignored. For an FTB web page instead:
npm run corpus -- add-html <url> --dir 2025/forms/state/ca/540 --doc-id ca-540-inst-2025
# 2. See what's drifted vs the corpus DB:
npm run corpus -- status            # diff: present / missing / sha-drift / extra / unconfigured / no source
npm run corpus -- status --strict   # exit non-zero on any drift (for CI/pre-push later)

# 3. Sync changes into corpus.db (idempotent, sha-skips already-ingested docs):
npm run corpus -- sync              # ~$0.50 + a few min per new/changed doc

# 3b. Publish: corpus.db is a GitHub Release asset (canon/seed/corpus.manifest.json);
#     a new release is how other clones get the new documents.

# 4. If a previous sync wrote rows but embeddings failed (Ollama down),
#    re-embed without re-paying for Haiku contextualization:
npm run corpus -- reembed
#    After switching EMBEDDINGS_MODEL (or fetching a corpus built with a
#    different model), rebuild every vector:
npm run corpus -- reembed --all
```

Cost: ~$0.50 Haiku contextualization per doc; embeddings are local and free (EmbeddingGemma 2 via Ollama). Sha-skip means re-runs are free.

## Subcommands

| subcommand | use |
|---|---|
| `fetch` | install the prebuilt corpus.db (local seed or sha-verified release download) |
| `sync` | idempotent corpus sync from the `sources/**/{instructions,publication}.meta.json` sidecars; fetches source files as needed |
| `add-html <url> --dir …` | fetch + clean a publisher web page into a sources folder (HTML file + sidecar); re-run to refresh the sha256 |
| `status [--strict]` | diff repo sidecars vs corpus.db (no source file needed) |
| `ingest` | manual single-doc ingest (any PDF or HTML path; debug flags) |
| `reembed [--all]` | re-embed NULL blocks; `--all` after a model switch |
| `check` | row counts + per-doc embedding coverage |
| `search "q" [--mode …]` | invoke the production search tool |

## Rebuilding

To rebuild the corpus, delete `canon/.data/corpus.db` and run `npm run corpus -- sync` (or `npm run corpus -- fetch` for the prebuilt release). After any parser change: `corpus sync --force`, then re-point code citations to block ids. The corpus and `sources/` survive `npm run reset`.

## Verify your change

- `npm run corpus -- status --strict` exits 0: the sidecars and corpus.db agree.
- `npm run corpus -- check` shows every document with full embedding coverage.
- `npm run corpus -- search "<a phrase from the new or changed document>"` returns a block from it. Run it again with `--mode fts` and with `--mode vector`: both legs must find it, or one leg is broken.
- `npm run test:unit` for Canon: the parser, the search merge and the Ask validation tests.
- A parser, chunking or search change: `npm run evals:lite -- --flow=ask,review` (about 20 minutes with the 31b, 5 with Haiku alone). It prints the cases that flipped since the last lite run; a flip or two on the local model is normal, a Haiku flip or several flips in one flow is a regression. The full eval (`docs/evals/ask.md`) is for prompt work.
- A change to what the judges read: with `npm run dev:canon` up, `npm run smoke:review` passes 3/3, then run the `e2e` skill with reviews on.

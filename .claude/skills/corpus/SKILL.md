---
name: corpus
description: Add or update a reference document (IRS/FTB instructions, publications) and run the corpus CLI (status, sync, reembed, fetch, search, outline, read). Use for any change to canon/.data/corpus.db or a sources/**/*.meta.json sidecar.
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

## The form face

The text printed on the form itself is in the corpus too, so a rule that only the form states has a block id.

- A form whose instructions are a separate document gets a second sidecar, `blank.meta.json`, next to its committed `blank.pdf`. Its docId takes `-face-` for `-inst-` (`irs-8824-face-2025`). `npm run corpus -- add-face --dir 2025/forms/federal/8824` writes it. It needs no `sourceUrl`.
- A PDF that holds the form and its instructions (`irs-6252-form-2025`) needs nothing more. Ingest finds the face in it.
- The face is the leading run of pages with fill-in widgets. It ends at a page with none, or at the first line that starts the instructions ("General Instructions", "Purpose of Form", FTB's "General Information"). Instructions below the form on the same page are parsed as instructions.
- One section is one part of the form as printed: `face-header` (above Part I), `face-part-i`, `face-part-ii`. A form with no parts gets `face-page-1`, `face-page-2`. Each heading starts "Form face:".
- The face text is rebuilt from the text positions, one form line per row: "14 Subtract line 13 from line 5". Dot leaders and the repeated box number are dropped. A long part splits between rows, never inside one.
- Face blocks have block type `form_face`. `corpus read` marks them "(printed on the form)"; `corpus search` marks them too.
- The instruction blocks of a combined PDF keep their ids and text: the prose parser still reads every page, and only its blocks on the face are replaced. After a change to the face parser, re-ingest the documents that have a face (`corpus sync --force --doc …`) and re-point citations to the face blocks that moved.
- Column tables (Form 8949 rows, Form 8283, Form 3800) and the left-margin labels of Forms 1040 and 540 come out readable but not exact.

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
| `sync [--doc <docId>…]` | idempotent corpus sync from the `sources/**/{instructions,publication,blank}.meta.json` sidecars; fetches source files as needed. `--doc` limits it to those documents |
| `add-html <url> --dir …` | fetch + clean a publisher web page into a sources folder (HTML file + sidecar); re-run to refresh the sha256 |
| `add-face --dir …` | write `blank.meta.json` so a form's face (its `blank.pdf`) enters the corpus; refuses a PDF that is already the instructions document |
| `status [--strict]` | diff repo sidecars vs corpus.db (no source file needed) |
| `ingest` | manual single-doc ingest (any PDF or HTML path; debug flags) |
| `reembed [--all]` | re-embed NULL blocks; `--all` after a model switch |
| `check` | row counts + per-doc embedding coverage |
| `search "q" [--mode …]` | invoke the production search tool |
| `outline <docId>` | list a document's sections, with first page and size; fails when the document is not in corpus.db |
| `read <blockId>` or `read <docId> <section> [--through <section>]` | print whole sections with block ids. Search with Canon (`mcp__canon__searchRefDocs`); when a hit needs more context, read its block's whole section, or a part with `--through` |

## The law library (`law.db`)

The law is a second file, `canon/.data/law.db` (`LAW_DB_PATH`). The plain `corpus` commands never read it. It holds three documents, each with a sidecar under `sources/2025/law/`: the Internal Revenue Code (`federal/usc-26/law.meta.json`, one zip named by `sourceUrl` and `sha256`), the Treasury regulations, 26 CFR Parts 1 and 301 (`federal/cfr-26/law.meta.json`, `"format": "ecfr"`, with a `files` entry of `sourceUrl` and `sha256` for each part, from the eCFR's dated API), and California's Revenue and Taxation Code, Division 2, Parts 10 and 10.2, and Part 11 Chapter 17 (Allocation of Income) (`state/ca/rtc/law.meta.json`, `"format": "caml"`).

California's source is the Legislature's session archive (`sourceUrl`, about 1.3 GB), a rolling file. The sidecar pins a small extract of it (`law.zip` next to the sidecar, about 1 MB, gitignored): `sha256` is the extract's, `releasePoint` the archive's date, `archiveSha256` the archive the extract came from (for the record only). `law sync` reads the extract from disk, else from law.db. With neither, download the archive to a folder of its own and run `law extract-ca <zip>`: it writes the extract and prints its sha256 and date. A different sha256 means the archive holds newer text, or the scope changed; to move to it, copy the printed values into the sidecar. The scope is `CA_LIBRARY_SCOPE` in `canon/src/law/caScope.ts`: each part is taken whole, or only the chapters it lists (Part 11 lists `"17."`). To add a chapter, add it to that list, run `law extract-ca`, copy the new sha256 into the sidecar, and run `law sync --doc ca-rtc-2025`. The extract stores its scope (`EXTRACT_SCOPE.json`), and a part taken by chapters says so in its heading ("PART 11. CORPORATION TAX LAW (only Chapter 17 is in the library)"). A California citation names its code (`CA 17041(a)`, `R&TC 17041`); a bare number is the Internal Revenue Code.

| subcommand | use |
|---|---|
| `law fetch` | install the prebuilt law.db (`canon/seed/law.manifest.json`) |
| `law sync [--force] [--doc <docId>]` | build it from the sidecars: no model call, only local embedding (about 17 minutes for the Code, about 1 hour 40 minutes for the regulations). `--doc` limits it to one document |
| `law check` | row counts and embedding coverage |
| `law search "q" [--mode …] [--limit n] [--source statute\|regulations\|california] [--jurisdiction federal\|CA\|federal,CA]` | search the law; `--jurisdiction` searches the sources of each jurisdiction named (federal: the statute and the regulations; CA: California's code), taking turns; with neither flag the statute and the regulations take turns in the results, and California is left out |
| `law read <citation>` | print a section or subdivision with block ids: `469`, `"469(g)(1)(A)"`, a regulation `"1.469-5T(a)(1)"`, California's `"CA 17041(a)"`, or a block id |
| `law extract-ca <zip>` | cut California's extract out of the Legislature's session archive into `law.zip` next to its sidecar |
| `law reembed [--all]` | embed the blocks that have no vector; `--all` after a model switch |

To move to a newer release, change `sourceUrl`, `sha256` and `releasePoint` (and `published` for the Code) in the sidecar, then run `law sync`. Do not read `law.db` (a search, an eval) while `law sync` or `law reembed` writes it: the write stops with SQLITE_BUSY, and `law reembed` then finishes the vectors. After a change to the parser (`canon/src/law/`), run `law sync --force` and `npm run evals:law`.

## In a git worktree

A worktree has no `canon/.data/`, so `read`, `search` and `outline` stop with "has no documents". Set `CORPUS_DB_PATH` in the worktree's `canon/.env` to the main checkout's `canon/.data/corpus.db`, or search with Canon MCP. Do not `fetch` a second copy.

## Rebuilding

To rebuild the corpus, delete `canon/.data/corpus.db` and run `npm run corpus -- sync` (or `npm run corpus -- fetch` for the prebuilt release). After a parser change, find the documents whose sections change: run the old and the new `parseDoc` over the PDFs stored in `ref_document_files`, and compare. Re-ingest only those: `corpus sync --force --doc <docId> --doc …` (Haiku cost is one call per block of each document). Then re-point code citations to block ids that went away. The corpus and `sources/` survive `npm run reset`.

## Verify your change

- `npm run corpus -- status --strict` exits 0: the sidecars and corpus.db agree.
- `npm run corpus -- check` shows every document with full embedding coverage.
- `npm run corpus -- search "<a phrase from the new or changed document>"` returns a block from it. Run it again with `--mode fts` and with `--mode vector`: both legs must find it, or one leg is broken.
- `npm run test:unit` for Canon: the parser, the search merge and the Ask validation tests.
- A parser, chunking or search change: `npm run evals:lite -- --flow=ask,review` (about 20 minutes with the 31b, 5 with Haiku alone). It prints the cases that flipped since the last lite run; a flip or two on the local model is normal, a Haiku flip or several flips in one flow is a regression. The full eval (`docs/evals/ask.md`) is for prompt work.
- A change to what the judges read: with `npm run dev:canon` up, `npm run smoke:review` passes 3/3, then run the `e2e` skill with reviews on.

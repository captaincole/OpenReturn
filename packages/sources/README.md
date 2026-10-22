# @summa/sources

The documents the IRS and FTB publish, stored by tax year and then by document type. We download these files and do not edit them. The one exception is an FTB web page: we keep a cleaned copy of it (see below).

```
<year>/forms/federal/<short>/        blank.pdf, instructions.meta.json
<year>/forms/state/<st>/<short>/
<year>/forms/federal/tax-table.source.html
<year>/forms/state/ca/tax-table.source.pdf
<year>/publications/federal/<pub>/   publication.meta.json
<year>/publications/state/<st>/<pub>/
```

- `blank.pdf`: the fillable form. The engine fills it. A form's folder path below `forms/` (`federal/1040`) is the form's `relativeDir` in the engine.
- `instructions.meta.json`: the sidecar for the form's instructions — docId, title, publisher, taxYear, `sourceUrl`, the source file's `sha256`, and `format` (`pdf`, the default, or `html`). A form folder can hold only this, for a form the engine does not fill yet.
- FTB publishes most instructions only as web pages. Use the page when FTB has one, and the PDF when it does not. `npm run corpus -- add-html <url> --dir 2025/forms/state/ca/540` fetches the page, keeps only its article (headings, paragraphs, lists, tables, images), and writes `instructions.html` with its sidecar.
- `publication.meta.json`: the same for an IRS or FTB publication (e.g. `publications/federal/p587/` for Pub 587). Publications explain rules across forms. Their docIds start `irs-pub-` / `ftb-pub-`, so a consumer that needs only form instructions (for example binding generation) can filter them out.
- The instruction and publication files (PDF or HTML) are **not committed**. `corpus.db` stores them with the extracted text (it ships as a release asset), and `npm run corpus -- sync` restores or downloads a file when it has to ingest. A source file or `*.canonical.txt` next to a sidecar is a gitignored build file.
- `tax-table.source.*`: the published tax table. `form-engine ingest-*-tax-table` parses it into the engine's `src/data/`.

Files we generate do not go here. A form's `catalog.json` sits next to its bindings in `packages/engine/src/<relativeDir>/`.

For a new tax year, add a `<year>/` folder. For a new state, add `<year>/forms/state/<st>/` (and `<year>/publications/state/<st>/` for its publications).

# @summa/forms

The documents the IRS and FTB publish, stored by tax year. We download these files and do not edit them.

```
<year>/federal/<short>/   blank.pdf, instructions.pdf, instructions.meta.json, instructions.canonical.txt
<year>/state/<st>/<short>/
<year>/federal/publications/<pub>/   publication.pdf, publication.meta.json, publication.canonical.txt
<year>/federal/tax-table.source.html
<year>/state/ca/tax-table.source.pdf
```

- `blank.pdf`: the fillable form. The engine fills it.
- `instructions.*`: the booklet, its corpus metadata, and its extracted text. `npm run corpus -- sync` ingests them. A form folder can hold only instructions, for a form the engine does not fill yet.
- `publication.*`: an IRS or FTB publication (e.g. `publications/p587/` for Pub 587). Publications explain rules across forms; the corpus ingests them like instructions. Their docIds start `irs-pub-` / `ftb-pub-`, so a consumer that needs only form instructions (for example binding generation) can filter them out.
- `tax-table.source.*`: the published tax table. `form-engine ingest-*-tax-table` parses it into the engine's `src/data/`.

Files we generate do not go here. A form's `catalog.json` sits next to its bindings in `packages/engine/src/<relativeDir>/`.

For a new tax year, add a `<year>/` folder. For a new state, add `<year>/state/<st>/`.

# @summa/sources

The documents the IRS and FTB publish, stored by tax year and then by document type. We download these files and do not edit them.

```
<year>/forms/federal/<short>/        blank.pdf, instructions.pdf, instructions.meta.json, instructions.canonical.txt
<year>/forms/state/<st>/<short>/
<year>/forms/federal/tax-table.source.html
<year>/forms/state/ca/tax-table.source.pdf
<year>/publications/federal/<pub>/   publication.pdf, publication.meta.json, publication.canonical.txt
<year>/publications/<st>/<pub>/
```

- `blank.pdf`: the fillable form. The engine fills it. A form's folder path below `forms/` (`federal/1040`) is the form's `relativeDir` in the engine.
- `instructions.*`: the form's instructions, their corpus metadata, and their extracted text. `npm run corpus -- sync` ingests them. A form folder can hold only instructions, for a form the engine does not fill yet.
- `publication.*`: an IRS or FTB publication (e.g. `publications/federal/p587/` for Pub 587). Publications explain rules across forms; the corpus ingests them like instructions. Their docIds start `irs-pub-` / `ftb-pub-`, so a consumer that needs only form instructions (for example binding generation) can filter them out.
- `tax-table.source.*`: the published tax table. `form-engine ingest-*-tax-table` parses it into the engine's `src/data/`.

Files we generate do not go here. A form's `catalog.json` sits next to its bindings in `packages/engine/src/<relativeDir>/`.

For a new tax year, add a `<year>/` folder. For a new state, add `<year>/forms/state/<st>/` (and `<year>/publications/<st>/` for its publications).

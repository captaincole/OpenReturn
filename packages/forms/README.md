# @summa/forms

The documents the IRS and FTB publish, stored by tax year. We download these files and do not edit them.

```
<year>/federal/<short>/   blank.pdf, instructions.pdf, instructions.meta.json, instructions.canonical.txt
<year>/state/<st>/<short>/
<year>/federal/tax-table.source.html
<year>/state/ca/tax-table.source.pdf
```

- `blank.pdf`: the fillable form. The engine fills it.
- `instructions.*`: the booklet, its corpus metadata, and its extracted text. `npm run corpus -- sync` ingests them.
- `tax-table.source.*`: the published tax table. `form-engine ingest-*-tax-table` parses it into the engine's `src/data/`.

Files we generate do not go here. A form's `catalog.json` sits next to its bindings in `packages/engine/src/<relativeDir>/`.

For a new tax year, add a `<year>/` folder. For a new state, add `<year>/state/<st>/`.

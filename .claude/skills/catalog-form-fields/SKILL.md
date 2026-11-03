---
name: catalog-form-fields
description: Build or rebuild a form's catalog.json (one row per PDF widget, with its fieldId, label, category and valueType) from the blank PDF, with no API calls, and regenerate its types.ts. Use for a new form, or when the IRS or FTB publishes a new blank PDF for a form the engine has.
argument-hint: <form> [--title="<official form title>"]  e.g. federal/8959
---

# Catalog form fields

A form's `catalog.json` maps each PDF widget to a catalog field: its fieldId, label, category and valueType. `bindings.ts` and `types.ts` use the fieldIds, so a rebuild keeps every fieldId the catalog has now.

Arguments: `$ARGUMENTS`. The first is the form (`federal/<short>` or `state/<st>/<short>`). A new form also needs `--title`.

## 1. Read the widgets

1. Run `npm run form-engine -- form-status <form> --json`. It needs `blankPdf: true`.
2. Run `npm run form-engine -- extract-widgets <form>` (add `--title="…"` for a new form). It writes `widgets.json` and the page tiles to `.scratch/forms/<year>/<form>/`, the work folder.
3. Delete any `labels.json` and `labels.page-*.json` in the work folder from an earlier run.

## 2. Start the labels

- **The form has a catalog:** run `npm run form-engine -- seed-labels <form> --json`. It writes `labels.json` from the catalog and prints:
  - `unlabeled`: the widgets with no catalog row, by page. Only these need a labeler.
  - `stale`: catalog rows whose widget is gone. If the list is not empty, stop. Grep `engine/src` and `engine/tests` for each fieldId and report which ones the code uses. A person decides what replaces them.
- **A new form:** every page needs a labeler.

## 3. Label the pages

Start one `form-labeler` per page that needs labels, all at once: each writes its own `labels.page-<n>.json`. Give each one the form, the formId, the page, the work folder, its widgets (the `unlabeled` list, or all), and the fieldIds already in `labels.json`.

## 4. Write the catalog

1. Run `npm run form-engine -- write-catalog <form>`. It reads `labels.json` and every page file, checks that each widget appears once, and writes `catalog.json`.
2. If it lists problems, send each page's problems to a new `form-labeler` for that page. After two failed tries, stop and report the problems.
3. A form that had a catalog: `git diff` the catalog. Rows may be added; no fieldId may change or go away.
4. Regenerate the types: `npm run form-engine -- generate-types --catalog=<form>/catalog.json --output=<form>/types.ts --interface=Form<Short>`. Use the interface name already in `types.ts`.

## 5. Check and commit

1. A form the engine has: run `npm -w @openreturn/engine run typecheck` and `npm test`. If the catalog-fill check fails, a widget moved. From `engine/`, run `npx tsx tests/golden/catalogFill.ts --form-id=<formId> --update`, read the PDF whose path it prints, and check that each value is in its box.
2. A new form: the catalog-fill golden comes in `register-form`, after the form is registered.
3. Commit with the subject `<Form>: catalog`. In the body, list the fields added and the widgets skipped, with reasons.

Next: `register-form` for a new form, or `write-binding-rules` for new fields.

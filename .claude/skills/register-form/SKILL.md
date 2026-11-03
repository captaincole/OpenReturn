---
name: register-form
description: Connect a newly cataloged form to the engine (filingInfo.ts, its must-file resolver, an empty bindings.ts, the registry entry and the catalog-fill golden), so write-binding-rules can draft its lines. Use after catalog-form-fields on a new form.
argument-hint: <form>  e.g. federal/8959
---

# Register a form

The engine evaluates a form only when it is registered and has a resolver that says when the form must be filed. This skill adds those parts, with no bindings yet. `engine/README.md` ("Adding a form", steps 2–4) explains each part; Form 8959 is a short example to copy.

Arguments: `$ARGUMENTS`, the form (`federal/<short>` or `state/<st>/<short>`).

## 1. Check

Run `npm run form-engine -- form-status <form> --json`. It needs a catalog and `types.ts` (from `catalog-form-fields`), and `registered: false`.

## 2. Add the parts

1. **`filingInfo.ts`** in the form's folder: `export interface Form<Short>FilingInfo extends BaseFilingInfo {}`. `write-binding-rules` adds the slots.
2. **The resolver:** `resolve<Short>Info` in the form's `resolveInfo.ts` (copy `engine/src/federal/8889/resolveInfo.ts`). It returns `mustFile: { "<formId>": resolveMustFile(…) }`.
   - The explicit key is `decisions.scope.must_file_<short>`.
   - The fallbacks come from the instructions' "Who must file". Search Canon (`mcp__canon__searchRefDocs`) with the `instructionsDocId` from form-status, and read the section with `npm run corpus -- read <blockId>`. Put the blockId in the comment above the resolver.
   - A fallback reads facts the engine has (`engine/src/facts/kinds/`). If the rule needs an answer the engine does not have, leave that fallback out and say so in the comment.
3. **`resolveFilingInfo`** in `engine/src/filingInfo.ts`: add the resolver to the list, and the FilingInfo type to the intersection.
4. **`bindings.ts`:** a `register()` function that calls `defineForm<Form<Short>, Form<Short>FilingInfo>("<formId>", { bindings: {} })`. Its header comment: `Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.`
5. **The registry:** in the jurisdiction's `index.ts`, import `register` and `catalog.json`, add the catalog to the catalogs list, and add a `makeFormSpec` entry in line with the other forms.

## 3. Check and commit

1. Run `npm -w @openreturn/engine run typecheck` and `npm -w @openreturn/engine run test:integration`. `requiredInputs.test.ts` fails when a form reads an answer that is not in `missingInputs`.
2. Make the catalog-fill golden: from `engine/`, run `npx tsx tests/golden/catalogFill.ts --form-id=<formId> --update`. Read the PDF whose path it prints, and check that each value is in its box. A value in the wrong box means a wrong label: run `catalog-form-fields` again for that page.
3. Run `npm test`.
4. Commit with the subject `<Form>: wiring`.

Next: `write-binding-rules <form>`.

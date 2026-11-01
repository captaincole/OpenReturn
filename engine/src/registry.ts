/*
 * Federal comes first: state forms read federal results, so the fixpoint
 * converges in fewer passes. Order affects pass count, never correctness.
 */

import { buildCatalogFromFixtures, type Catalog } from "./catalog.js";
import { FEDERAL_CATALOGS, FEDERAL_FORMS } from "./federal/index.js";
import type { FormSpec } from "./formSpec.js";
import { STATE_CATALOGS, STATE_FORMS } from "./state/index.js";

export { makeFormSpec, type FormSpec } from "./formSpec.js";

export const FORMS: FormSpec[] = [...FEDERAL_FORMS, ...STATE_FORMS];

export function getFormSpec(formId: string): FormSpec {
  const spec = FORMS.find((candidate) => candidate.formId === formId);
  if (!spec) {
    throw new Error(
      `No FormSpec registered for formId "${formId}". ` +
        `Known formIds: ${FORMS.map((form) => form.formId).join(", ")}. ` +
        `Add an entry to the form's jurisdiction registry ` +
        `(src/federal/index.ts or src/state/<st>/index.ts) to support it.`,
    );
  }
  return spec;
}

export function registerAllForms(): void {
  for (const spec of FORMS) spec.register?.();
}

export const catalog: Catalog = buildCatalogFromFixtures([...FEDERAL_CATALOGS, ...STATE_CATALOGS]);

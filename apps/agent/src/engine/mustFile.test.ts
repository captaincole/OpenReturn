import { describe, expect, it } from "vitest";
import { resolveFilingInfo } from "./filingInfo.js";
import { FORMS } from "./registry.js";

/*
 * Every form with bindings needs a must-file entry, or the engine blocks
 * it with "No must-file rule resolved". The resolvers key the entries by
 * formId string, so this catches a typo or a resolver missing from
 * resolveFilingInfo.
 */
describe("FilingInfo.mustFile", () => {
  const info = resolveFilingInfo({ facts: [], decisions: [] });
  const bound = FORMS.filter((spec) => spec.register).map((spec) => spec.formId);

  it.each(bound)("%s has a must-file entry", (formId) => {
    expect(info.mustFile?.[formId]?.decisionKey).toMatch(/^decisions\.scope\.must_file_/);
  });

  it("has no entry for an unregistered form", () => {
    expect(Object.keys(info.mustFile ?? {}).sort()).toEqual([...bound].sort());
  });
});

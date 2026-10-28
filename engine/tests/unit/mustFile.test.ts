import { describe, expect, it } from "vitest";
import { resolveFilingInfo } from "../../src/filingInfo.js";
import { FORMS } from "../../src/registry.js";

/* Must-file entries are keyed by formId string, so a typo blocks the form. */
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

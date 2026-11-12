/*
 * The binding contract (defineForm.ts): a binding may return unsupported(reason)
 * for one case the engine does not handle, and the field is then an engine gap
 * with that reason, not a value.
 */

import { describe, expect, it } from "vitest";
import { buildCatalogFromFixtures } from "../../src/catalog.js";
import { defineForm } from "../../src/defineForm.js";
import { evaluateForm } from "../../src/engine.js";
import { unsupported, type DerivationContext } from "../../src/types.js";

const FORM_ID = "test-unsupported-binding";
const REASON = "No fact gives this case.";

defineForm<{ "0.line.1": number | undefined; "0.line.2": number | undefined }, never>(FORM_ID, {
  bindings: {
    "0.line.1": () => unsupported(REASON),
    "0.line.2": () => 7,
  },
});

const catalog = buildCatalogFromFixtures([
  {
    form: { formId: FORM_ID, taxYear: 2025, jurisdiction: "federal", title: "Test" },
    fields: ["0.line.1", "0.line.2"].map((line) => ({
      fieldId: `${FORM_ID}.${line}`,
      label: line,
      category: "other" as const,
      valueType: "numeric" as const,
    })),
  },
]);

const ctx = {
  taxYear: 2025,
  filingInfo: { mustFile: { [FORM_ID]: { decisionKey: "test", value: true } } },
} as unknown as DerivationContext;

describe("a binding that returns unsupported(reason)", () => {
  it("gives an unsupported field with that reason; other bindings keep their values", () => {
    const form = evaluateForm(FORM_ID, ctx, catalog);
    const result = (line: string) =>
      form.fields.find((field) => field.fieldId === `${FORM_ID}.${line}`)?.result;
    expect(result("0.line.1")).toEqual({ ok: false, reason: REASON, unsupported: true });
    expect(result("0.line.2")).toMatchObject({ ok: true, value: 7 });
  });
});

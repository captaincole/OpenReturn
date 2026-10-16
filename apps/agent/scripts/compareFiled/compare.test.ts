import { describe, expect, it } from "vitest";
import { buildCatalogFromFixtures } from "../../src/engine/catalog.js";
import type { AnyFormField, DerivationResult, EvaluatedForm } from "../../src/engine/types.js";
import { compareFiled } from "./compare.js";

const LINES = ["a", "b", "c", "d", "e", "f", "g"];

const catalog = buildCatalogFromFixtures([
  {
    form: { formId: "f1", taxYear: 2025, jurisdiction: "federal", title: "F1" },
    fields: LINES.map((id) => ({
      fieldId: `f1.${id}`,
      label: `Line ${id}`,
      category: "income" as const,
      valueType: "numeric" as const,
    })),
  },
]);

const ok = (value: number): DerivationResult<number> => ({
  ok: true,
  value,
  rationale: "",
  supportingFactKeys: [],
});

function form(results: Record<string, DerivationResult<number>>): EvaluatedForm<AnyFormField> {
  return {
    formId: "f1",
    jurisdiction: "federal",
    title: "F1",
    taxYear: 2025,
    mustFile: { ok: true, value: true, rationale: "", supportingFactKeys: [] },
    fields: Object.entries(results).map(([id, result]) => ({
      fieldId: `f1.${id}`,
      label: id,
      category: "income",
      valueType: "numeric",
      result,
    })) as AnyFormField[],
  } as EvaluatedForm<AnyFormField>;
}

describe("compareFiled", () => {
  const forms = new Map([
    [
      "f1",
      form({
        a: ok(100),
        b: ok(101),
        c: ok(105),
        d: ok(500),
        e: { ok: false, reason: "no rule", unsupported: true },
        f: ok(0),
        g: ok(7),
      }),
    ],
  ]);
  const filed = { f1: { "f1.a": 100, "f1.b": 100, "f1.c": 100, "f1.d": 100, "f1.e": 9 } };
  const result = compareFiled({ formOrder: ["f1"], forms, filed, catalog });
  const status = Object.fromEntries(result.diffs.map((d) => [d.fieldId, d.status]));

  it("buckets drift by size", () => {
    expect(status["f1.b"]).toBe("drift_1");
    expect(status["f1.c"]).toBe("drift_10");
    expect(status["f1.d"]).toBe("wrong");
  });

  it("reports a filled line with no rule as not modeled", () => {
    expect(status["f1.e"]).toBe("not_modeled");
  });

  it("treats blank and 0 as equal, and flags engine-only values", () => {
    expect(status["f1.f"]).toBeUndefined();
    expect(status["f1.g"]).toBe("engine_only");
    expect(result.matches.f1).toEqual(["f1.a"]);
  });

  it("keeps calculation order and flags unknown field ids", () => {
    expect(result.diffs.map((d) => d.fieldId)).toEqual(["f1.b", "f1.c", "f1.d", "f1.e", "f1.g"]);
    const typo = compareFiled({ formOrder: ["f1"], forms, filed: { f1: { "f1.zz": 1 } }, catalog });
    expect(typo.unknownFields).toEqual(["[f1] f1.zz"]);
  });
});

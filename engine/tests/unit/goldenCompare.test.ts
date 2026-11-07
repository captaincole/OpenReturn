import { describe, expect, it } from "vitest";
import type { RenderedWidget } from "../../src/render/fillFromCatalog.js";
import { assertMatchesGolden, type KnownWidgets } from "../helpers/assertions.js";
import type { GoldenValue } from "../helpers/goldenPdf.js";

const rendered = new Map<string, RenderedWidget[]>([
  ["schedule-ca.0.line.3a_federal", [{ widgetName: "w-3a", text: "381" }]],
  ["schedule-ca.0.line.3b_federal", [{ widgetName: "w-3b", text: "385" }]],
]);
const golden = new Map<string, GoldenValue>([
  ["w-3a", { widgetName: "w-3a", kind: "text", value: "" }],
  ["w-3b", { widgetName: "w-3b", kind: "text", value: "385" }],
]);

describe("assertMatchesGolden", () => {
  it("fails on a widget the golden PDF leaves blank", () => {
    const failures: string[] = [];
    assertMatchesGolden(rendered, golden, failures, "schedule-ca");
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("widget w-3a");
  });

  it("routes a listed widget's mismatch to the known hits, with its cause", () => {
    const failures: string[] = [];
    const known: KnownWidgets = {
      widgets: new Map([
        ["w-3a", { fieldId: "schedule-ca.0.line.3a_federal", cause: "the CPA left it blank" }],
      ]),
      hits: [],
    };
    assertMatchesGolden(rendered, golden, failures, "schedule-ca", known);
    expect(failures).toEqual([]);
    expect(known.hits).toEqual([
      "[schedule-ca] schedule-ca.0.line.3a_federal — the CPA left it blank",
    ]);
  });
});

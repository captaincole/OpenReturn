import { describe, expect, it } from "vitest";
import type { LineDiff } from "../../../../scripts/compareFiled/compare.js";
import { groupRootCauses } from "../../../../scripts/compareFiled/rootCauses.js";

const diff = (fieldId: string): LineDiff => ({
  formId: "f",
  fieldId,
  label: fieldId,
  status: "drift_1",
  filed: 0,
  engine: 0,
});

describe("groupRootCauses", () => {
  /* a → b → d, c → d, e alone. x matches, so it is not a diff. */
  const reads: Record<string, string[]> = { b: ["a", "x"], d: ["b", "c"], c: ["x"] };
  const groups = groupRootCauses(["a", "b", "c", "d", "e"].map(diff), (id) => reads[id]);

  it("finds the lines whose inputs all match", () => {
    expect(groups.map((group) => group.root.fieldId)).toEqual(["a", "c", "e"]);
  });

  it("lists every downstream line under each of its roots", () => {
    const down = Object.fromEntries(
      groups.map((group) => [group.root.fieldId, group.downstream.map((entry) => entry.fieldId)]),
    );
    expect(down).toEqual({ a: ["b", "d"], c: ["d"], e: [] });
  });
});

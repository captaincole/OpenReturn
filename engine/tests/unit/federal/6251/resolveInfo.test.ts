/* Source: irs-6251-inst-2025::sec::who-must-file::b01 (Who Must File; the engine sees only the ISO spread). */

import { describe, expect, it } from "vitest";
import { AMT_KEYS } from "../../../../src/facts/index.js";
import { resolve6251Info } from "../../../../src/federal/6251/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const spread = (value: number) => ({
  key: AMT_KEYS.isoExerciseSpread,
  category: "other",
  value,
});
const mustFile6251 = (decision: boolean) => ({
  decisionKey: "decisions.scope.must_file_6251",
  decision,
});

const files = (
  facts: ReturnType<typeof spread>[],
  decisions: ReturnType<typeof mustFile6251>[] = [],
) => resolve6251Info(makeResolverInputs({ facts, decisions })).mustFile?.["form-6251"]?.value;

describe("resolve6251Info", () => {
  it("files when the ISO spread is above 0", () => {
    expect(files([spread(275000)])).toBe(true);
  });

  it("does not file when the ISO spread is 0", () => {
    expect(files([spread(0)])).toBe(false);
  });

  it("does not file with no ISO spread on record", () => {
    expect(files([])).toBe(false);
  });

  it("follows an explicit false decision over a spread above 0", () => {
    expect(files([spread(275000)], [mustFile6251(false)])).toBe(false);
  });

  it("follows an explicit true decision with no spread", () => {
    expect(files([], [mustFile6251(true)])).toBe(true);
  });
});

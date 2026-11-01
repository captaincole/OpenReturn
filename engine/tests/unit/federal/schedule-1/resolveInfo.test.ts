import { describe, expect, it } from "vitest";
import { HSA_COVERAGE_KEYS, makeDividendFactKey } from "../../../../src/facts/index.js";
import { resolveSchedule1Info, resolveScheduleDInfo } from "../../../../src/filingInfoResolvers.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const inputs = (facts: Array<{ key: string; category: string; value: unknown }>) =>
  makeResolverInputs({ facts, decisions: [] });

describe("Schedule 1 must-file", () => {
  it("files with Form 8889 and no 1099-MISC", () => {
    const info = resolveSchedule1Info(
      inputs([{ key: HSA_COVERAGE_KEYS.coverageType, category: "hsa", value: "self-only" }]),
    );
    expect(info.mustFile?.["schedule-1"]?.value).toBe(true);
  });

  it("does not file with neither", () => {
    expect(resolveSchedule1Info(inputs([])).mustFile?.["schedule-1"]?.value).toBe(false);
  });
});

describe("Schedule D line 13 slot", () => {
  it("sums 1099-DIV box 2a", () => {
    const div = (slug: string, box2a: number) => ({
      key: makeDividendFactKey(slug),
      category: "investment_income",
      value: { payerName: slug, box2a },
    });
    const info = resolveScheduleDInfo(inputs([div("fund-a", 1200.4), div("fund-b", 300)]));
    expect(info.capitalGainDistributions).toBeCloseTo(1500.4);
  });
});

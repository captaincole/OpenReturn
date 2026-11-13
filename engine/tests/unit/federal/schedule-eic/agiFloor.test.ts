/* agiFloor is a lower bound on Form 1040 line 11b (possible.ts). */

import { describe, expect, it } from "vitest";
import {
  ADJUSTMENT_KEYS,
  makeBusinessFactKey,
  makeW2FactKey,
} from "../../../../src/facts/index.js";
import { agiFloor } from "../../../../src/federal/schedule-eic/possible.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const w2 = { key: makeW2FactKey("acme"), category: "wages", value: { box1: 30000 } };
const business = (grossReceipts: number) => ({
  key: makeBusinessFactKey("consulting"),
  category: "self_employment",
  value: { activity: "Consulting", grossReceipts, sellsGoods: false, materiallyParticipated: true },
});
const floor = (facts: Array<{ key: string; category: string; value: unknown }>) =>
  agiFloor(
    makeResolverInputs({
      facts,
      decisions: [
        { decisionKey: "decisions.scope.filing_status", decision: "single" },
        { decisionKey: "decisions.scope.must_file_8889", decision: false },
      ],
    }),
    false,
  );

describe("agiFloor", () => {
  it("takes the stated adjustments off", () => {
    const alimony = { key: ADJUSTMENT_KEYS.alimonyPaid, category: "other", value: 5000 };
    expect(floor([w2, alimony])).toBe(25000);
  });
  it("counts a profit less the most its half of SE tax can be", () => {
    const value = floor([w2, business(10000)])!;
    expect(value).toBeGreaterThan(39000);
    expect(value).toBeLessThan(40000);
  });
});

/* Source: irs-8960-inst-2025::sec::who-must-file::b01 (MAGI over the threshold, with investment income). */

import { describe, expect, it } from "vitest";
import { GAMBLING_KEYS, makeInterestFactKey, makeW2FactKey } from "../../../../src/facts/index.js";
import { magiUpperBound } from "../../../../src/federal/8960/mustFile.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

type Fact = { key: string; category: string; value: unknown };

const w2: Fact = {
  key: makeW2FactKey("acme"),
  category: "wages",
  value: { employerName: "Acme", employerEin: "00-0000001", box1: 190000, box2: 0 },
};
const interest: Fact = {
  key: makeInterestFactKey("bank"),
  category: "investment_income",
  value: { payerName: "Bank", box1: 500 },
};
const winnings: Fact = { key: GAMBLING_KEYS.winningsNotOnW2G, category: "other", value: 20000 };

const bound = (facts: Fact[]) =>
  magiUpperBound(makeResolverInputs({ facts, decisions: [] }), false);

describe("Form 8960 MAGI upper bound", () => {
  it("adds wages and interest", () => {
    expect(bound([w2, interest])).toBe(190500);
  });

  it("adds gambling winnings reported without a W-2G (Schedule 1 line 8b)", () => {
    expect(bound([w2, interest, winnings])).toBe(210500);
  });
});

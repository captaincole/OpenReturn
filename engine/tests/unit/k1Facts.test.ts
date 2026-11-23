import { describe, expect, it } from "vitest";
import {
  isK1FactKey,
  isK1HoldingFactKey,
  k1EntityIdOf,
  k1FormOfKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeSCorporationK1FactKey,
  makeTrustK1FactKey,
  readK1Facts,
  readK1HoldingFacts,
} from "../../src/facts/index.js";
import {
  passThroughEntitiesOnReturn,
  passThroughIncomeUpperBound,
  passThroughLossFloor,
} from "../../src/federal/passThrough/items.js";

const sCorpKey = makeSCorporationK1FactKey("harbor");
const k1 = {
  form: "1120-S",
  entityName: "Harbor Tile, Inc.",
  entityEin: "00-0000001",
  boxes: [{ box: "1", amount: 15000 }],
};

describe("K-1 fact keys", () => {
  it("names the form in the key and shares the id with the holding", () => {
    expect(sCorpKey).toBe("k1.s_corporation.harbor");
    expect(makePartnershipK1FactKey("oak")).toBe("k1.partnership.oak");
    expect(makeTrustK1FactKey("ash")).toBe("k1.trust.ash");
    expect(k1FormOfKey(sCorpKey)).toBe("1120-S");
    expect(k1FormOfKey("k1.trust.ash")).toBe("1041");
    expect(k1EntityIdOf(sCorpKey)).toBe("harbor");
    expect(makeK1HoldingFactKey("harbor")).toBe("k1.holding.harbor");
  });

  it("does not read a holding key or a nested key as a K-1", () => {
    expect(isK1FactKey("k1.holding.harbor")).toBe(false);
    expect(isK1FactKey("k1.s_corporation.harbor.extra")).toBe(false);
    expect(isK1FactKey("k1.s_corporation.")).toBe(false);
    expect(isK1HoldingFactKey("k1.holding.harbor")).toBe(true);
    expect(isK1HoldingFactKey("k1.holding.")).toBe(false);
  });
});

describe("reading K-1 and holding facts", () => {
  it("lists a K-1 whose form does not match its key, or whose box has no number, as malformed", () => {
    const { k1s, malformedKeys } = readK1Facts([
      { key: sCorpKey, category: "k1", value: k1 },
      { key: "k1.partnership.oak", category: "k1", value: { ...k1, form: "1120-S" } },
      {
        key: "k1.trust.ash",
        category: "k1",
        value: { ...k1, form: "1041", boxes: [{ box: "1", amount: "ten" }] },
      },
    ]);
    expect(k1s.map((row) => row.key)).toEqual([sCorpKey]);
    expect(malformedKeys).toEqual(["k1.partnership.oak", "k1.trust.ash"]);
  });

  it("lists a holding with a negative basis as malformed", () => {
    const { holdings, malformedKeys } = readK1HoldingFacts([
      { key: "k1.holding.harbor", category: "k1", value: { materiallyParticipated: true } },
      { key: "k1.holding.oak", category: "k1", value: { stockBasisAtStart: -5 } },
    ]);
    expect([...holdings.keys()]).toEqual(["k1.holding.harbor"]);
    expect(malformedKeys).toEqual(["k1.holding.oak"]);
  });
});

describe("K-1s on the return", () => {
  const facts = [
    { key: sCorpKey, category: "k1", value: k1 },
    { key: "k1.holding.harbor", category: "k1", value: { owner: "spouse" } },
    {
      key: "k1.partnership.oak",
      category: "k1",
      value: { ...k1, form: "1065", boxes: [{ box: "1", amount: -2000 }] },
    },
  ];

  it("keeps a spouse's K-1 on a joint return and waits on a missing holding", () => {
    const { entities, spouseKeys, missingHoldingKeys } = passThroughEntitiesOnReturn(facts, true);
    expect(entities.map((entity) => entity.key)).toEqual([sCorpKey, "k1.partnership.oak"]);
    expect(spouseKeys).toEqual([]);
    expect(missingHoldingKeys).toEqual(["k1.holding.oak"]);
  });

  it("leaves a spouse's K-1 off a separate return and lists its key", () => {
    const { entities, spouseKeys } = passThroughEntitiesOnReturn(facts, false);
    expect(entities.map((entity) => entity.key)).toEqual(["k1.partnership.oak"]);
    expect(spouseKeys).toEqual([sCorpKey]);
  });

  it("bounds what the K-1s add to AGI from above and below", () => {
    expect(passThroughIncomeUpperBound(facts)).toBe(15000);
    expect(passThroughLossFloor(facts)).toBe(-2000);
  });
});

import { describe, expect, it } from "vitest";
import type { K1Box, K1FactValue, K1HoldingFactValue } from "../../../../src/facts/index.js";
import { itemsOf, type PassThroughEntity } from "../../../../src/federal/passThrough/items.js";
import {
  applyLossLimits,
  atRiskLimit,
  basisLimit,
  excessBusinessLossLimit,
  LIMIT_STAGES,
  passiveLimit,
} from "../../../../src/federal/passThrough/limits.js";
import { routeEntities } from "../../../../src/federal/passThrough/routing.js";

const CONTEXT = { filingStatus: "married_filing_jointly" as const };

function sCorp(
  boxes: K1Box[],
  holding: K1HoldingFactValue | undefined = { materiallyParticipated: true },
  extra: Partial<K1FactValue> = {},
): PassThroughEntity {
  const k1 = {
    form: "1120-S",
    entityName: "Harbor Tile, Inc.",
    entityEin: "00-0000001",
    boxes,
    ...extra,
  } as K1FactValue;
  return {
    key: "k1.s_corporation.harbor",
    holdingKey: "k1.holding.harbor",
    form: "1120-S",
    name: k1.entityName,
    ein: k1.entityEin,
    k1,
    holding,
    items: itemsOf("k1.s_corporation.harbor", k1),
  };
}

const outcome = (stage: typeof basisLimit, entity: PassThroughEntity) =>
  stage([{ entity, items: entity.items }], CONTEXT).get(entity.key);

describe("the order of the loss limits", () => {
  it("is basis, at-risk, passive, then the excess business loss cap", () => {
    expect(LIMIT_STAGES.map(([name]) => name)).toEqual([
      "basis",
      "atRisk",
      "passive",
      "excessBusinessLoss",
    ]);
  });

  it("stops a loss at the first stage that limits it: basis", () => {
    const [limited] = applyLossLimits([sCorp([{ box: "1", amount: -4000 }])], CONTEXT);
    expect(limited.kind).toBe("unsupported");
    if (limited.kind === "unsupported") {
      expect(limited.limit).toBe("basis");
      expect(limited.reason).toContain("Harbor Tile, Inc. (S corporation K-1)");
      expect(limited.reason).toContain("ordinary business income (loss) (box 1)");
    }
  });
});

describe("income only passes every stage", () => {
  const income = sCorp([{ box: "1", amount: 15000 }]);

  it.each([
    ["basis", basisLimit],
    ["at-risk", atRiskLimit],
    ["passive", passiveLimit],
    ["excess business loss", excessBusinessLossLimit],
  ])("%s passes the items with nothing carried", (_, stage) => {
    expect(outcome(stage, income)).toEqual({
      kind: "applied",
      allowed: income.items,
      carried: [],
    });
  });

  it("is routed to Schedule E Part II", () => {
    const [routed] = routeEntities([income], CONTEXT);
    expect(routed.kind).toBe("routed");
  });
});

describe("basis", () => {
  it("reports a distribution: above basis it is a gain (Form 7203)", () => {
    const result = outcome(
      basisLimit,
      sCorp([
        { box: "1", amount: 15000 },
        { box: "16", code: "D", amount: 9000 },
      ]),
    );
    expect(result?.kind).toBe("unsupported");
  });

  it("reports a loss carried from an earlier year and an ended interest", () => {
    const carried = sCorp([{ box: "1", amount: 100 }], {
      materiallyParticipated: true,
      carriedLosses: { basis: 2500 },
    });
    expect(outcome(basisLimit, carried)?.kind).toBe("unsupported");
    const ended = sCorp([{ box: "1", amount: 100 }], {
      materiallyParticipated: true,
      disposedOfEntirely: true,
    });
    expect(outcome(basisLimit, ended)?.kind).toBe("unsupported");
  });
});

describe("passive", () => {
  it("waits for the material participation answer on a business item", () => {
    const entity = sCorp([{ box: "1", amount: 15000 }], {});
    expect(outcome(passiveLimit, entity)).toEqual({
      kind: "waiting",
      factKeys: ["k1.holding.harbor"],
    });
  });

  it("skips portfolio items: interest needs no participation answer", () => {
    const entity = sCorp([{ box: "4", amount: 300 }], {});
    expect(outcome(passiveLimit, entity)?.kind).toBe("applied");
  });

  it("reports a business the owner did not materially participate in", () => {
    const entity = sCorp([{ box: "1", amount: 15000 }], { materiallyParticipated: false });
    expect(outcome(passiveLimit, entity)?.kind).toBe("unsupported");
  });

  it("reports rental real estate income, which is passive for most owners", () => {
    const entity = sCorp([{ box: "2", amount: 5000 }]);
    expect(outcome(passiveLimit, entity)?.kind).toBe("unsupported");
  });

  it("reports more than one activity, since the holding answers for one", () => {
    const entity = sCorp([{ box: "1", amount: 15000 }], { materiallyParticipated: true }, {
      moreThanOnePassiveActivity: true,
    } as Partial<K1FactValue>);
    expect(outcome(passiveLimit, entity)?.kind).toBe("unsupported");
  });
});

describe("routing", () => {
  it("reports every unrouted item with its entity and type", () => {
    const [routed] = routeEntities(
      [
        sCorp([
          { box: "1", amount: 15000 },
          { box: "4", amount: 120 },
          { box: "17", code: "AC", amount: 900000 },
        ]),
      ],
      CONTEXT,
    );
    expect(routed.kind).toBe("unsupported");
    if (routed.kind === "unsupported") {
      const text = routed.reasons.join(" ");
      expect(text).toContain("Harbor Tile, Inc. (S corporation K-1)");
      expect(text).toContain("interest income (box 4)");
      expect(text).toContain("other information (box 17 code AC)");
      expect(text).not.toContain("box 1)");
    }
  });

  it("waits for the statement when box 17 code V is listed without it", () => {
    const [routed] = routeEntities(
      [
        sCorp([
          { box: "1", amount: 3200 },
          { box: "17", code: "V" },
        ]),
      ],
      CONTEXT,
    );
    expect(routed).toMatchObject({ kind: "waiting", factKeys: ["k1.s_corporation.harbor"] });
  });

  it("reports section 199A dividends on the statement", () => {
    const entity = sCorp(
      [{ box: "1", amount: 3200 }],
      { materiallyParticipated: true },
      {
        section199A: { qualifiedBusinessIncome: 3200, section199ADividends: 40 },
      },
    );
    expect(routeEntities([entity], CONTEXT)[0].kind).toBe("unsupported");
  });

  it("drops a box printed as 0, and keeps a statement box with no amount", () => {
    const entity = sCorp([
      { box: "1", amount: 3200 },
      { box: "4", amount: 0 },
      { box: "17", code: "V" },
    ]);
    expect(entity.items.map((item) => item.type)).toEqual([
      "ordinary_business_income",
      "section_199a_information",
    ]);
  });
});

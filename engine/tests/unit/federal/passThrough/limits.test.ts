import { describe, expect, it } from "vitest";
import type { K1Box, K1FactValue, K1HoldingFactValue } from "../../../../src/facts/index.js";
import {
  excessBusinessLossThreshold,
  form461Required,
} from "../../../../src/federal/passThrough/excessBusinessLoss.js";
import {
  itemsOf,
  priorYearItemsOf,
  type PassThroughEntity,
} from "../../../../src/federal/passThrough/items.js";
import {
  applyLossLimits,
  atRiskLimit,
  basisLimit,
  businessLossesBeforeExcessBusinessLoss,
  excessBusinessLossLimit,
  LIMIT_STAGES,
  passiveLimit,
  type LimitContext,
} from "../../../../src/federal/passThrough/limits.js";
import { routeEntities } from "../../../../src/federal/passThrough/routing.js";

const CONTEXT = {
  filingStatus: "married_filing_jointly" as const,
  otherBusinessLosses: { scheduleCLosses: 0, rentalLosses: 0, unknownKeys: [] },
};

/* A shareholder who works in the company, all of whose money in it is at risk, with $50,000 of stock basis. */
const OWNER: K1HoldingFactValue = {
  materiallyParticipated: true,
  allInvestmentAtRisk: true,
  stockBasisAtStart: 50000,
};

function sCorp(
  boxes: K1Box[],
  holding: K1HoldingFactValue | undefined = OWNER,
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
    priorYearItems: priorYearItemsOf("k1.s_corporation.harbor", holding),
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

  it("stops a loss at the first stage that limits it: basis waits for the stock basis", () => {
    const [limited] = applyLossLimits(
      [sCorp([{ box: "1", amount: -4000 }], { materiallyParticipated: true })],
      CONTEXT,
    );
    expect(limited).toMatchObject({ kind: "waiting", factKeys: ["k1.holding.harbor"] });
  });

  it("allows a loss within basis through every stage", () => {
    const [limited] = applyLossLimits([sCorp([{ box: "1", amount: -4000 }])], CONTEXT);
    expect(limited.kind).toBe("allowed");
    if (limited.kind === "allowed") {
      expect(limited.allowed.map((item) => item.amount)).toEqual([-4000]);
      expect(limited.carried.basis).toEqual([]);
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
  it("passes a distribution within basis, and reports one above it (a capital gain)", () => {
    const within = sCorp([
      { box: "1", amount: 15000 },
      { box: "16", code: "D", amount: 9000 },
    ]);
    expect(outcome(basisLimit, within)?.kind).toBe("applied");
    const above = sCorp(
      [
        { box: "1", amount: 15000 },
        { box: "16", code: "D", amount: 70000 },
      ],
      { ...OWNER, stockBasisAtStart: 50000 },
    );
    const result = outcome(basisLimit, above);
    expect(result?.kind).toBe("unsupported");
    if (result?.kind === "unsupported") expect(result.reason).toContain("$5000 above basis");
  });

  it("limits a loss to basis and carries the rest by item", () => {
    const entity = sCorp([{ box: "1", amount: -80000 }]);
    expect(outcome(basisLimit, entity)).toMatchObject({
      kind: "applied",
      allowed: [{ type: "ordinary_business_income", amount: -50000 }],
      carried: [{ type: "ordinary_business_income", amount: -30000 }],
    });
  });

  it("allows a loss carried from an earlier year, marked as from that year", () => {
    const carried = sCorp([{ box: "1", amount: 100 }], {
      ...OWNER,
      stockBasisAtStart: 0,
      carriedLosses: { basis: { ordinaryBusinessLoss: 2500 } },
    });
    const result = outcome(basisLimit, carried);
    expect(result?.kind).toBe("applied");
    if (result?.kind === "applied") {
      expect(result.allowed).toMatchObject([
        { type: "ordinary_business_income", amount: 100 },
        { type: "ordinary_business_income", amount: -100, fromPriorYear: true },
      ]);
      expect(result.carried).toMatchObject([{ amount: -2400, fromPriorYear: true }]);
    }
  });

  it("reports an ended interest", () => {
    const ended = sCorp([{ box: "1", amount: 100 }], { ...OWNER, disposedOfEntirely: true });
    expect(outcome(basisLimit, ended)?.kind).toBe("unsupported");
  });

  it("reports a loan repayment: the gain on it is not modeled", () => {
    const repaid = sCorp([
      { box: "1", amount: 100 },
      { box: "16", code: "E", amount: 1000 },
    ]);
    const result = outcome(basisLimit, repaid);
    expect(result?.kind).toBe("unsupported");
    if (result?.kind === "unsupported") expect(result.reason).toContain("Section C");
  });

  it("reports a sale of part of the stock: fewer shares at the end than at the start", () => {
    const shares = (sharesAtStart: number, sharesAtEnd: number) =>
      sCorp([{ box: "1", amount: 100 }], OWNER, {
        sharesAtStart,
        sharesAtEnd,
      } as Partial<K1FactValue>);
    const sold = outcome(basisLimit, shares(250, 200));
    expect(sold?.kind).toBe("unsupported");
    if (sold?.kind === "unsupported") expect(sold.reason).toContain("Form 7203");
    expect(outcome(basisLimit, shares(250, 250))?.kind).toBe("applied");
    expect(outcome(basisLimit, shares(250, 300))?.kind).toBe("applied");
  });
});

describe("at-risk", () => {
  const loss = (holding: K1HoldingFactValue) => sCorp([{ box: "1", amount: -4000 }], holding);

  it("passes a loss when all of the investment is at risk", () => {
    expect(outcome(atRiskLimit, loss(OWNER))?.kind).toBe("applied");
  });

  it("waits for the answer, and with amounts not at risk waits for Form 6198's amounts", () => {
    expect(outcome(atRiskLimit, loss({ materiallyParticipated: true }))).toEqual({
      kind: "waiting",
      factKeys: ["k1.holding.harbor"],
    });
    const notAtRisk = outcome(atRiskLimit, loss({ ...OWNER, allInvestmentAtRisk: false }));
    expect(notAtRisk).toEqual({ kind: "waiting", factKeys: ["at_risk.k1.s_corporation.harbor"] });
  });

  it("passes a charitable contribution and a capital loss: they are not from the activity", () => {
    const entity = sCorp(
      [
        { box: "8a", amount: -300 },
        { box: "12", code: "A", amount: 200 },
      ],
      { materiallyParticipated: true },
    );
    expect(outcome(atRiskLimit, entity)?.kind).toBe("applied");
  });
});

describe("excess business loss", () => {
  const none = { scheduleCLosses: 0, rentalLosses: 0, unknownKeys: [] };
  const context = (filingStatus: "single" | "married_filing_jointly") => ({
    filingStatus,
    otherBusinessLosses: none,
  });
  const loss = (amount: number) =>
    sCorp([{ box: "1", amount: -amount }], { ...OWNER, stockBasisAtStart: 1_000_000 });
  const run = (entity: PassThroughEntity, limitContext: LimitContext) =>
    excessBusinessLossLimit([{ entity, items: entity.items }], limitContext).get(entity.key);
  const form461 = (entity: PassThroughEntity, limitContext: LimitContext) =>
    form461Required(
      businessLossesBeforeExcessBusinessLoss([entity], limitContext),
      none,
      0,
      limitContext.filingStatus,
    );

  it("passes a joint loss of $300,000 in full, with Form 461 required (over $156,500 on line 5)", () => {
    const entity = loss(300_000);
    expect(run(entity, context("married_filing_jointly"))).toMatchObject({
      kind: "applied",
      allowed: [{ amount: -300_000 }],
    });
    expect(form461(entity, context("married_filing_jointly"))).toBe(true);
  });

  it("passes a joint loss of $700,000 in full: Form 461 figures the limit off Schedule E", () => {
    const result = run(loss(700_000), context("married_filing_jointly"));
    expect(result).toMatchObject({ kind: "applied", allowed: [{ amount: -700_000 }], carried: [] });
  });

  it("passes a loss of $100,000 with no Form 461", () => {
    const entity = loss(100_000);
    expect(run(entity, context("single"))?.kind).toBe("applied");
    expect(form461(entity, context("single"))).toBe(false);
  });

  it("uses the lower threshold for an unknown filing status", () => {
    expect(excessBusinessLossThreshold(undefined)).toBe(313_000);
    expect(run(loss(400_000), { otherBusinessLosses: none })?.kind).toBe("applied");
  });

  it("passes the items whatever the return's other business losses", () => {
    const entity = loss(200_000);
    const withScheduleC = {
      filingStatus: "single" as const,
      otherBusinessLosses: { ...none, scheduleCLosses: 120_000 },
    };
    expect(run(entity, withScheduleC)?.kind).toBe("applied");
    expect(run(entity, { filingStatus: "single" })?.kind).toBe("applied");
  });

  it("requires Form 461 for a loss over $156,500 on one line", () => {
    expect(form461Required(0, { ...none, scheduleCLosses: 156_501 }, 0, "single")).toBe(true);
    expect(form461Required(0, none, 156_501, "single")).toBe(true);
    expect(form461Required(100_000, { ...none, scheduleCLosses: 100_000 }, 0, "single")).toBe(
      false,
    );
  });

  it("requires Form 461 for losses over the threshold in all, each line under $156,500", () => {
    const lines = { ...none, scheduleCLosses: 150_000 };
    expect(form461Required(150_000, lines, 14_000, "single")).toBe(true);
    expect(form461Required(150_000, lines, 13_000, "single")).toBe(false);
    expect(form461Required(150_000, lines, 14_000, "married_filing_jointly")).toBe(false);
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

  it("passes a beneficiary's income in boxes 6 to 8, and reports a carried passive loss", () => {
    const trust = (holding: K1HoldingFactValue) => {
      const k1 = {
        form: "1041",
        entityName: "Ash Family Trust",
        entityEin: "00-0001041",
        boxes: [{ box: "7", amount: 1200 }],
      } as K1FactValue;
      return {
        key: "k1.trust.ash",
        holdingKey: "k1.holding.ash",
        form: "1041",
        name: k1.entityName,
        ein: k1.entityEin,
        k1,
        holding,
        items: itemsOf("k1.trust.ash", k1),
        priorYearItems: [],
      } as PassThroughEntity;
    };
    expect(outcome(passiveLimit, trust({}))?.kind).toBe("applied");
    expect(outcome(passiveLimit, trust({ carriedLosses: { passive: 500 } }))?.kind).toBe(
      "unsupported",
    );
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
          { box: "6", amount: 120 },
          { box: "17", code: "C", amount: 900 },
        ]),
      ],
      CONTEXT,
    );
    expect(routed.kind).toBe("unsupported");
    if (routed.kind === "unsupported") {
      const text = routed.reasons.join(" ");
      expect(text).toContain("Harbor Tile, Inc. (S corporation K-1)");
      expect(text).toContain("royalties (box 6)");
      expect(text).toContain("other information (box 17 code C)");
      expect(text).not.toContain("box 1)");
      // The limits let box 1 through, so it still reaches its line.
      expect(routed.allowed.map((item) => item.box)).toContain("1");
    }
  });

  it("gives gross receipts for section 448(c) no line, so the K-1 stays routed", () => {
    const [routed] = routeEntities(
      [
        sCorp([
          { box: "1", amount: 15000 },
          { box: "17", code: "AC", amount: 900000 },
        ]),
      ],
      CONTEXT,
    );
    expect(routed.kind).toBe("routed");
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

  it("routes section 199A dividends on the statement, and reports qualified PTP income", () => {
    const withStatement = (statement: K1FactValue["section199A"]) =>
      routeEntities(
        [
          sCorp(
            [
              { box: "1", amount: 3200 },
              { box: "17", code: "V" },
            ],
            { materiallyParticipated: true },
            { section199A: statement },
          ),
        ],
        CONTEXT,
      )[0];
    expect(withStatement({ qualifiedBusinessIncome: 3200, section199ADividends: 40 }).kind).toBe(
      "routed",
    );
    expect(withStatement({ qualifiedBusinessIncome: 3200, qualifiedPtpIncome: 40 }).kind).toBe(
      "unsupported",
    );
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

import { describe, expect, it } from "vitest";
import type {
  K1Box,
  K1HoldingFactValue,
  PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { PassiveActivity } from "../../../../src/federal/8582/activities.js";
import { form8582K1Activities } from "../../../../src/federal/passThrough/form8582Rows.js";
import {
  itemsOf,
  priorYearItemsOf,
  type PassThroughEntity,
} from "../../../../src/federal/passThrough/items.js";
import {
  applyLossLimits,
  basisLimit,
  type LimitContext,
  type LimitedEntity,
} from "../../../../src/federal/passThrough/limits.js";
import { figurePartnerBasis } from "../../../../src/federal/passThrough/partnerBasis.js";
import { prorateDollars, sum } from "../../../../src/money.js";

const NO_RENTALS = { part4: [], part5: [], waitingKeys: [] };

const CONTEXT: LimitContext = {
  filingStatus: "single",
  otherBusinessLosses: { scheduleCLosses: 0, rentalLosses: 0, unknownKeys: [] },
  passiveRentals: NO_RENTALS,
};

/* A limited partner who does not work in the business, all at risk, with $10,000 of basis. */
const INVESTOR: K1HoldingFactValue = {
  materiallyParticipated: false,
  realEstateProfessional: false,
  allInvestmentAtRisk: true,
  partnershipBasisAtStart: 10000,
};

function partnership(
  id: string,
  boxes: K1Box[],
  holding: K1HoldingFactValue | undefined = INVESTOR,
  extra: Partial<PartnershipK1FactValue> = {},
): PassThroughEntity {
  const k1: PartnershipK1FactValue = {
    form: "1065",
    entityName: `${id} LP`,
    entityEin: "00-0001065",
    partnerType: "limited",
    boxes,
    ...extra,
  };
  const key = `k1.partnership.${id}`;
  return {
    key,
    holdingKey: `k1.holding.${id}`,
    form: "1065",
    name: k1.entityName,
    ein: k1.entityEin,
    k1,
    holding,
    items: itemsOf(key, k1),
    priorYearItems: priorYearItemsOf(key, holding, "1065"),
  };
}

const limited = (entities: PassThroughEntity[], context = CONTEXT) =>
  new Map(applyLossLimits(entities, context).map((entry) => [entry.entity.key, entry]));

const allowedOf = (entry: LimitedEntity | undefined) =>
  entry?.kind === "allowed" ? entry.allowed : [];

const amounts = (entry: LimitedEntity | undefined) =>
  allowedOf(entry).map((item) => ({ type: item.type, amount: item.amount }));

describe("the partner's basis (the Partner's Basis Worksheet)", () => {
  const basisOutcome = (entity: PassThroughEntity) =>
    basisLimit([{ entity, items: entity.items }], CONTEXT).get(entity.key);
  const owner = (basis: number): K1HoldingFactValue => ({
    materiallyParticipated: true,
    allInvestmentAtRisk: true,
    partnershipBasisAtStart: basis,
  });

  it("allows a loss equal to the basis in full, and carries nothing", () => {
    const entity = partnership("edge", [{ box: "1", amount: -10000 }], owner(10000));
    const result = basisOutcome(entity);
    expect(result).toMatchObject({ kind: "applied", carried: [] });
    if (result?.kind === "applied") expect(result.allowed[0].amount).toBe(-10000);
  });

  it("carries one dollar of a loss one dollar over the basis, in proportion over two items", () => {
    const entity = partnership(
      "over",
      [
        { box: "1", amount: -8001 },
        { box: "9a", amount: -2000 },
      ],
      owner(10000),
    );
    const result = basisOutcome(entity);
    expect(result?.kind).toBe("applied");
    if (result?.kind !== "applied") return;
    expect(sum(...result.allowed.map((item) => item.amount))).toBe(-10000);
    expect(sum(...result.carried.map((item) => item.amount))).toBe(-1);
  });

  it("adds an increase in the share of liabilities and takes off a decrease (lines 3c, 3e and 9a)", () => {
    const up = partnership("up", [{ box: "1", amount: -12000 }], owner(10000), {
      liabilitiesAtStart: { recourse: 1000 },
      liabilitiesAtEnd: { recourse: 3000 },
    });
    const figured = figurePartnerBasis(up);
    expect(figured.kind).toBe("figured");
    if (figured.kind === "figured") {
      expect(figured.figures.lines.line3e).toBe(2000);
      expect(figured.figures.lines.line16).toBe(12000);
      expect(figured.figures.lines.line18).toBe(0);
    }
    const down = partnership("down", [{ box: "19", code: "A", amount: 1000 }], owner(10000), {
      liabilitiesAtStart: { nonrecourse: 4000 },
      liabilitiesAtEnd: { nonrecourse: 1000 },
    });
    const lines = figurePartnerBasis(down);
    if (lines.kind === "figured") {
      expect(lines.figures.lines.line9a).toBe(3000);
      expect(lines.figures.lines.line11a).toBe(6000);
    }
  });

  it("waits for the K-1 when it gives the liabilities at one end of the year only", () => {
    const entity = partnership("half", [{ box: "1", amount: -100 }], owner(10000), {
      liabilitiesAtEnd: { recourse: 3000 },
    });
    expect(basisOutcome(entity)).toEqual({ kind: "waiting", factKeys: [entity.key] });
  });

  it("waits for the basis at the start, and reports a distribution above the basis", () => {
    const noBasis = partnership("open", [{ box: "1", amount: -100 }], {
      materiallyParticipated: true,
    });
    expect(basisOutcome(noBasis)).toEqual({ kind: "waiting", factKeys: [noBasis.holdingKey] });
    const above = partnership("above", [{ box: "19", code: "A", amount: 12500 }], owner(10000));
    const result = basisOutcome(above);
    expect(result?.kind).toBe("unsupported");
    if (result?.kind === "unsupported") expect(result.reason).toContain("$2500 above basis");
  });

  it("allows a basis loss carried from an earlier year when the basis covers it", () => {
    const entity = partnership("carried", [{ box: "1", amount: 3000 }], {
      ...owner(0),
      carriedLosses: { basis: { ordinaryBusinessLoss: 2000 } },
    });
    const result = basisOutcome(entity);
    expect(result?.kind).toBe("applied");
    if (result?.kind === "applied") {
      expect(result.allowed).toMatchObject([
        { amount: 3000 },
        { amount: -2000, fromPriorYear: true },
      ]);
    }
  });

  it("reports a partial sale (item J) and a final K-1 with no disposition recorded", () => {
    const partial = partnership("partial", [{ box: "1", amount: 100 }], owner(1000), {
      decreasedBySale: true,
    });
    expect(basisOutcome(partial)?.kind).toBe("unsupported");
    const final = partnership("final", [{ box: "1", amount: 100 }], owner(1000), {
      finalK1: true,
    });
    expect(basisOutcome(final)?.kind).toBe("unsupported");
  });
});

describe("the passive stage and Form 8582", () => {
  it("allows a passive loss in full when passive income equals it, and carries nothing", () => {
    const loss = partnership("loss", [{ box: "1", amount: -5000 }]);
    const income = partnership("income", [{ box: "2", amount: 5000 }]);
    const result = limited([loss, income]);
    expect(amounts(result.get(loss.key))).toEqual([
      { type: "ordinary_business_income", amount: -5000 },
    ]);
    const entry = result.get(loss.key);
    expect(entry?.kind === "allowed" && entry.carried.passive).toEqual([]);
  });

  it("allows a loss one dollar over the passive income less one dollar, and carries the dollar", () => {
    const loss = partnership("loss", [{ box: "1", amount: -5001 }]);
    const income = partnership("income", [{ box: "2", amount: 5000 }]);
    const entry = limited([loss, income]).get(loss.key);
    expect(amounts(entry)).toEqual([{ type: "ordinary_business_income", amount: -5000 }]);
    expect(entry?.kind === "allowed" && entry.carried.passive.map((item) => item.amount)).toEqual([
      -1,
    ]);
  });

  /*
   * A second computation by hand, without Form 8582's code: each losing
   * activity is allowed its share of the passive income, in proportion to its
   * loss (irs-8582-inst-2025::sec::part-vii-allocation-of-unallowed-losses::b02,
   * ::part-viii-allowed-losses::b01).
   */
  it("shares the passive income among two losing K-1s in proportion to their losses", () => {
    const losses = [-30000, -10000];
    const income = 20000;
    const entities = [
      partnership("alpha", [{ box: "1", amount: losses[0] }], {
        ...INVESTOR,
        partnershipBasisAtStart: 50000,
      }),
      partnership("beta", [{ box: "3", amount: losses[1] }], {
        ...INVESTOR,
        partnershipBasisAtStart: 50000,
      }),
      partnership("gamma", [{ box: "1", amount: income }]),
    ];
    const totalLoss = -sum(...losses);
    const byHand = losses.map((loss) => (-loss * income) / totalLoss);
    expect(byHand).toEqual([15000, 5000]);
    const result = limited(entities);
    expect(amounts(result.get(entities[0].key))[0].amount).toBe(-byHand[0]);
    expect(amounts(result.get(entities[1].key))[0].amount).toBe(-byHand[1]);
    expect(amounts(result.get(entities[2].key))[0].amount).toBe(income);
  });

  it("frees a carried passive loss in full when the activity has an overall gain", () => {
    const entity = partnership("gain", [{ box: "1", amount: 8000 }], {
      ...INVESTOR,
      carriedLosses: { passive: 3000 },
    });
    expect(allowedOf(limited([entity]).get(entity.key))).toMatchObject([
      { amount: 8000 },
      { amount: -3000, fromPriorYear: true, passiveCarryover: true },
    ]);
  });

  it("shares the allowed loss between this year's loss and the carried one", () => {
    const loss = partnership("loss", [{ box: "1", amount: -6000 }], {
      ...INVESTOR,
      carriedLosses: { passive: 2000 },
    });
    const income = partnership("income", [{ box: "1", amount: 4000 }]);
    const entry = limited([loss, income]).get(loss.key);
    expect(allowedOf(entry).map((item) => item.amount)).toEqual(
      prorateDollars(-4000, [6000, 2000]),
    );
  });

  it("releases every loss of an entire disposition with an overall loss, off Form 8582", () => {
    const sold = partnership("sold", [{ box: "1", amount: -6000 }], {
      ...INVESTOR,
      partnershipBasisAtStart: 20000,
      carriedLosses: { passive: 9000 },
      disposedOfEntirely: true,
      gainOnDisposition: 4000,
    });
    expect(allowedOf(limited([sold]).get(sold.key)).map((item) => item.amount)).toEqual([
      -6000, -9000,
    ]);
    expect(form8582K1Activities([sold], CONTEXT)).toEqual({ rows: [], settled: true });
  });

  it("puts an entire disposition with an overall gain on Form 8582, its gain in column (a)", () => {
    const sold = partnership("sold", [{ box: "1", amount: -6000 }], {
      ...INVESTOR,
      partnershipBasisAtStart: 20000,
      carriedLosses: { passive: 1000 },
      disposedOfEntirely: true,
      gainOnDisposition: 9000,
    });
    const other = partnership("other", [{ box: "1", amount: -2000 }]);
    const rows = form8582K1Activities([sold, other], CONTEXT)?.rows;
    expect(rows?.[0]).toMatchObject({ netIncome: 9000, netLoss: 6000, priorUnallowedLoss: 1000 });
    const result = limited([sold, other]);
    // The gain's 2,000 of overall gain frees the other K-1's loss in full.
    expect(amounts(result.get(other.key))[0].amount).toBe(-2000);
    expect(allowedOf(result.get(sold.key)).map((item) => item.amount)).toEqual([-6000, -1000]);
  });

  it("waits for the gain on an entire disposition", () => {
    const sold = partnership("sold", [{ box: "1", amount: -6000 }], {
      ...INVESTOR,
      disposedOfEntirely: true,
    });
    expect(limited([sold]).get(sold.key)).toMatchObject({ kind: "waiting" });
  });

  it("reports a loss when the return's rental real estate takes the special allowance", () => {
    const rental: PassiveActivity = {
      factKey: "rental.property.a",
      column: "a",
      part: "part4",
      name: "1 Main St",
      netIncome: 0,
      netLoss: 4000,
      priorUnallowedLoss: 0,
    };
    const context = { ...CONTEXT, passiveRentals: { ...NO_RENTALS, part4: [rental] } };
    const loss = partnership("loss", [{ box: "1", amount: -1000 }]);
    const result = limited([loss], context).get(loss.key);
    expect(result?.kind).toBe("unsupported");
    if (result?.kind === "unsupported") expect(result.reason).toContain("special allowance");
  });

  it("waits on the rentals while their rows wait, and passes an overall gain anyway", () => {
    const context = {
      ...CONTEXT,
      passiveRentals: { waitingKeys: ["rental.property.a"] },
    };
    const loss = partnership("loss", [{ box: "1", amount: -1000 }]);
    const income = partnership("income", [{ box: "1", amount: 500 }]);
    const result = limited([loss, income], context);
    expect(result.get(loss.key)).toEqual({
      entity: loss,
      kind: "waiting",
      factKeys: ["rental.property.a"],
    });
    expect(result.get(income.key)?.kind).toBe("allowed");
  });

  it("asks a general partner about active participation in rental real estate, and reports a yes", () => {
    const general = (activelyParticipated?: boolean) =>
      partnership(
        "general",
        [{ box: "2", amount: -500 }],
        { ...INVESTOR, activelyParticipated },
        { partnerType: "general" },
      );
    expect(limited([general()]).get("k1.partnership.general")?.kind).toBe("waiting");
    expect(limited([general(true)]).get("k1.partnership.general")?.kind).toBe("unsupported");
    expect(limited([general(false)]).get("k1.partnership.general")?.kind).toBe("allowed");
  });

  it("reports a publicly traded partnership and a business and a rental on one K-1", () => {
    const ptp = partnership("ptp", [{ box: "1", amount: -500 }], INVESTOR, {
      publiclyTraded: true,
    });
    expect(limited([ptp]).get(ptp.key)?.kind).toBe("unsupported");
    const mixed = partnership("mixed", [
      { box: "1", amount: -500 },
      { box: "2", amount: 900 },
    ]);
    expect(limited([mixed]).get(mixed.key)?.kind).toBe("unsupported");
  });

  it("passes a materially participating partner's business, and keeps the rental passive", () => {
    const worker = partnership(
      "worker",
      [
        { box: "1", amount: -4000 },
        { box: "2", amount: 1500 },
      ],
      { ...INVESTOR, materiallyParticipated: true },
    );
    expect(amounts(limited([worker]).get(worker.key))).toEqual([
      { type: "ordinary_business_income", amount: -4000 },
      { type: "net_rental_real_estate_income", amount: 1500 },
    ]);
    expect(form8582K1Activities([worker], CONTEXT)?.rows).toMatchObject([
      { netIncome: 1500, netLoss: 0 },
    ]);
  });
});

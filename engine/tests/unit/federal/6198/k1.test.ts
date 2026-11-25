/*
 * The at-risk stage of the K-1 loss limits (src/federal/passThrough/atRisk.ts):
 * Form 6198 for a partnership or S corporation K-1 with amounts not at risk.
 */

import { describe, expect, it } from "vitest";
import type {
  AtRiskAmounts,
  K1Box,
  K1FactValue,
  K1HoldingFactValue,
} from "../../../../src/facts/index.js";
import {
  atRiskLimit,
  figureK1Form6198,
  needsForm6198,
} from "../../../../src/federal/passThrough/atRisk.js";
import {
  itemsOf,
  priorYearItemsOf,
  type PassThroughEntity,
} from "../../../../src/federal/passThrough/items.js";
import { applyLossLimits, k1sOnForm6198 } from "../../../../src/federal/passThrough/limits.js";

const CONTEXT = {
  filingStatus: "single" as const,
  otherBusinessLosses: { scheduleCLosses: 0, rentalLosses: 0, unknownKeys: [] },
};

const KEY = "k1.partnership.ridge";
const AT_RISK_KEY = `at_risk.${KEY}`;

/* A general partner who works in the business, with basis enough for every loss. */
const OWNER: K1HoldingFactValue = {
  materiallyParticipated: true,
  allInvestmentAtRisk: false,
  partnershipBasisAtStart: 200000,
};

const PART_II: AtRiskAmounts = { simplified: { adjustedBasisAtStart: 10000 } };

function partnership(
  boxes: K1Box[],
  holding: K1HoldingFactValue | undefined = OWNER,
  atRisk: AtRiskAmounts | undefined = PART_II,
  extra: Partial<K1FactValue> = {},
): PassThroughEntity {
  const k1 = {
    form: "1065",
    entityName: "Ridge Orchards LLC",
    entityEin: "00-0006198",
    partnerType: "general",
    boxes,
    ...extra,
  } as K1FactValue;
  return {
    key: KEY,
    holdingKey: "k1.holding.ridge",
    form: "1065",
    name: k1.entityName,
    ein: k1.entityEin,
    k1,
    holding,
    items: itemsOf(KEY, k1),
    priorYearItems: priorYearItemsOf(KEY, holding, "1065"),
    atRisk,
  };
}

const stage = (entity: PassThroughEntity) =>
  atRiskLimit([{ entity, items: entity.items }], CONTEXT).get(entity.key);

describe("the at-risk stage with amounts not at risk", () => {
  it("allows the loss up to the amount at risk and carries the rest with its character", () => {
    const outcome = stage(partnership([{ box: "1", amount: -16000 }]));
    expect(outcome?.kind).toBe("applied");
    if (outcome?.kind !== "applied") return;
    expect(outcome.allowed.map((item) => [item.type, item.amount])).toEqual([
      ["ordinary_business_income", -10000],
    ]);
    expect(outcome.carried.map((item) => [item.type, item.amount])).toEqual([
      ["ordinary_business_income", -6000],
    ]);
  });

  it("passes portfolio items and gifts as they are: they are not from the activity", () => {
    const entity = partnership([
      { box: "1", amount: -16000 },
      { box: "5", amount: 900 },
      { box: "13", code: "A", amount: 400 },
    ]);
    const outcome = stage(entity);
    if (outcome?.kind !== "applied") throw new Error("expected applied");
    const types = outcome.allowed.map((item) => [item.type, item.amount]);
    expect(types).toContainEqual(["interest", 900]);
    expect(types).toContainEqual(["charitable_contribution", 400]);
    expect(types).toContainEqual(["ordinary_business_income", -10000]);
  });

  it("puts a section 179 deduction on line 4, prorated with the box 1 loss", () => {
    const entity = partnership([
      { box: "1", amount: -15000 },
      { box: "12", amount: 5000 },
    ]);
    const outcome = figureK1Form6198(entity, entity.items);
    expect(outcome.kind).toBe("figured");
    if (outcome.kind !== "figured") return;
    expect(outcome.figures.partI).toMatchObject({ line1: -15000, line4: -5000, line5: -20000 });
    expect(outcome.figures.entries.map((each) => each.allowed)).toEqual([-7500, -2500]);
  });

  it("puts rental income on line 3 and counts it against the loss", () => {
    const entity = partnership([
      { box: "1", amount: -16000 },
      { box: "3", amount: 4000 },
    ]);
    const outcome = figureK1Form6198(entity, entity.items);
    if (outcome.kind !== "figured") throw new Error("expected figured");
    expect(outcome.figures.partI).toMatchObject({ line3: 4000, line5: -12000 });
    expect(outcome.figures.line21).toBe(-10000);
    expect(outcome.figures.entries[0]).toMatchObject({ allowed: -14000, carried: -2000 });
  });

  it("allows everything with a line 5 profit", () => {
    const entity = partnership([
      { box: "1", amount: 6000 },
      { box: "12", amount: 1000 },
    ]);
    const outcome = stage(entity);
    expect(outcome).toEqual({ kind: "applied", allowed: entity.items, carried: [] });
  });

  /* An at-risk fact with neither part is no amount at risk yet. */
  it("waits on the at-risk fact, then on the holding's answer", () => {
    expect(stage(partnership([{ box: "1", amount: -100 }], OWNER, {}))).toEqual({
      kind: "waiting",
      factKeys: [AT_RISK_KEY],
    });
    const unanswered = { materiallyParticipated: true, partnershipBasisAtStart: 200000 };
    expect(stage(partnership([{ box: "1", amount: -100 }], unanswered))).toEqual({
      kind: "waiting",
      factKeys: ["k1.holding.ridge"],
    });
  });
});

describe("a loss the at-risk limit carried from an earlier year", () => {
  const carried = {
    ...OWNER,
    allInvestmentAtRisk: true,
    carriedLosses: { atRisk: { ordinaryBusinessLoss: 6000 } },
  };

  it("joins line 1 and shares the allowed loss in proportion (irs-6198-inst-2025::sec::part-i-2::b01)", () => {
    const entity = partnership([{ box: "1", amount: -40000 }], carried, {
      detailed: { start: "prior_year_form", priorYearAmountAtRisk: 0, increasesSince: 28000 },
    });
    const outcome = stage(entity);
    if (outcome?.kind !== "applied") throw new Error("expected applied");
    const allowed = outcome.allowed.map((item) => [item.amount, item.atRiskCarryover === true]);
    expect(allowed).toEqual([
      [-3652, true],
      [-24348, false],
    ]);
    expect(outcome.allowed[0]?.fromPriorYear).toBe(true);
    expect(outcome.carried.map((item) => item.amount)).toEqual([-2348, -15652]);
  });

  it("is allowed in full against this year's income", () => {
    const entity = partnership([{ box: "1", amount: 9000 }], carried, {});
    const outcome = stage(entity);
    if (outcome?.kind !== "applied") throw new Error("expected applied");
    expect(outcome.allowed.map((item) => item.amount)).toEqual([-6000, 9000]);
    expect(outcome.carried).toEqual([]);
  });

  it("files Form 6198 even with all of the investment at risk now", () => {
    expect(needsForm6198(partnership([], carried), [])).toBe(true);
  });

  it("keeps each carried item's kind: a section 179 deduction on line 4 (::part-i::b01, ::line-4::b01)", () => {
    const byItem = {
      ...OWNER,
      carriedLosses: { atRisk: { ordinaryBusinessLoss: 1000, section179Deduction: 500 } },
    };
    const entity = partnership([{ box: "1", amount: -2000 }], byItem);
    const outcome = figureK1Form6198(entity, entity.items);
    if (outcome.kind !== "figured") throw new Error("expected figured");
    expect([outcome.figures.partI.line1, outcome.figures.partI.line4]).toEqual([-3000, -500]);
    const allowed = stage(entity);
    if (allowed?.kind !== "applied") throw new Error("expected applied");
    expect(allowed.allowed.map((item) => [item.type, item.amount, item.atRiskCarryover])).toEqual([
      ["ordinary_business_income", -1000, true],
      ["section_179_deduction", 500, true],
      ["ordinary_business_income", -2000, undefined],
    ]);
  });
});

describe("recapture in a profit year (irs-6198-inst-2025::sec::line-5::b01)", () => {
  const DISTRIBUTION: K1Box = { box: "19", code: "A", amount: 3000 };
  const BELOW_ZERO: AtRiskAmounts = { simplified: { adjustedBasisAtStart: 1000, decreases: 3000 } };
  /* The K-1 with no at-risk fact recorded. */
  const unanswered = (entity: PassThroughEntity): PassThroughEntity => ({
    ...entity,
    atRisk: undefined,
  });

  it("waits on the amounts at risk when the K-1 shows a distribution", () => {
    const entity = unanswered(partnership([{ box: "1", amount: 5000 }, DISTRIBUTION]));
    expect(stage(entity)).toEqual({ kind: "waiting", factKeys: [AT_RISK_KEY] });
  });

  it("waits when the partner's share of recourse debt fell", () => {
    const entity = unanswered(
      partnership([{ box: "1", amount: 5000 }], OWNER, PART_II, {
        liabilitiesAtStart: { recourse: 10000 },
        liabilitiesAtEnd: { recourse: 2000 },
      }),
    );
    expect(stage(entity)).toEqual({ kind: "waiting", factKeys: [AT_RISK_KEY] });
  });

  it("is a gap when the amounts at risk end below zero", () => {
    const entity = partnership([{ box: "1", amount: 5000 }, DISTRIBUTION], OWNER, BELOW_ZERO);
    const outcome = stage(entity);
    expect(outcome?.kind === "unsupported" && outcome.reason).toContain("recaptured");
  });

  it("is a gap on Form 6198 too when a deduction files it with a profit", () => {
    const boxes = [{ box: "1", amount: 5000 }, { box: "12", amount: 1000 }, DISTRIBUTION];
    const entity = partnership(boxes, OWNER, BELOW_ZERO);
    expect(needsForm6198(entity, entity.items)).toBe(true);
    expect(figureK1Form6198(entity, entity.items).kind).toBe("unsupported");
    const waiting = unanswered(entity);
    expect(figureK1Form6198(waiting, waiting.items).kind).toBe("waiting");
  });

  it("allows everything when the amount at risk stays above zero, or nothing shows a decrease", () => {
    const above = partnership([{ box: "1", amount: 5000 }, DISTRIBUTION]);
    expect(stage(above)?.kind).toBe("applied");
    const quiet = unanswered(partnership([{ box: "1", amount: 5000 }]));
    expect(stage(quiet)?.kind).toBe("applied");
  });
});

describe("cases the stage does not figure", () => {
  it.each([
    [
      "more than one activity (box 22)",
      partnership([{ box: "1", amount: -500 }], OWNER, PART_II, {
        moreThanOneAtRiskActivity: true,
      }),
    ],
    [
      "a disposition of the interest",
      partnership([{ box: "1", amount: -500 }], {
        ...OWNER,
        disposedOfEntirely: true,
        gainOnDisposition: 100,
      }),
    ],
    [
      "guaranteed payments",
      partnership([
        { box: "1", amount: -500 },
        { box: "4a", amount: 2000 },
      ]),
    ],
    [
      "investment interest expense (line 4 after Form 4952, irs-6198-inst-2025::sec::line-4::b01)",
      partnership([
        { box: "1", amount: -500 },
        { box: "13", code: "H", amount: 200 },
      ]),
    ],
    [
      "a carried at-risk capital loss, which has no Part I line here",
      partnership([{ box: "1", amount: -500 }], {
        ...OWNER,
        carriedLosses: { atRisk: { netLongTermCapitalLoss: 300 } },
      }),
    ],
  ])("reports %s as unsupported", (_, entity) => {
    expect(figureK1Form6198(entity, entity.items).kind).toBe("unsupported");
  });

  it("keeps a beneficiary's at-risk loss unsupported", () => {
    const k1 = {
      form: "1041",
      entityName: "Oak Trust",
      entityEin: "00-0000041",
      boxes: [{ box: "5", amount: -300 }],
    } as K1FactValue;
    const entity: PassThroughEntity = {
      key: "k1.trust.oak",
      holdingKey: "k1.holding.oak",
      form: "1041",
      name: "Oak Trust",
      ein: "00-0000041",
      k1,
      holding: { allInvestmentAtRisk: false },
      items: itemsOf("k1.trust.oak", k1),
      priorYearItems: [],
    };
    expect(needsForm6198(entity, entity.items)).toBe(false);
    const carried = {
      ...entity,
      items: [],
      holding: { carriedLosses: { atRisk: { ordinaryBusinessLoss: 100 } } },
    };
    expect(stage(carried)?.kind).toBe("unsupported");
  });
});

describe("Form 6198 files after the basis limit", () => {
  it("lists the K-1 when a loss reaches the at-risk stage", () => {
    const entity = partnership([{ box: "1", amount: -500 }]);
    expect(k1sOnForm6198([entity], CONTEXT).map((each) => each.entity.key)).toEqual([KEY]);
  });

  it("does not list a K-1 whose loss the basis limit holds back in full", () => {
    const entity = partnership([{ box: "1", amount: -500 }], {
      ...OWNER,
      partnershipBasisAtStart: 0,
    });
    expect(k1sOnForm6198([entity], CONTEXT)).toEqual([]);
  });

  it("routes the allowed loss through every stage, with all of the investment at risk untouched", () => {
    const atRisk = partnership([{ box: "1", amount: -16000 }], {
      ...OWNER,
      allInvestmentAtRisk: true,
    });
    const [limited] = applyLossLimits([atRisk], CONTEXT);
    expect(limited?.kind === "allowed" && limited.allowed.map((item) => item.amount)).toEqual([
      -16000,
    ]);
    expect(k1sOnForm6198([atRisk], CONTEXT)).toEqual([]);
  });
});

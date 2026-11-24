import { describe, expect, it } from "vitest";
import type { TrustK1FactValue } from "../../../../src/facts/index.js";
import { itemsOf, type PassThroughEntity } from "../../../../src/federal/passThrough/items.js";
import {
  withReceived,
  type Receipt,
  type ReceivedItem,
} from "../../../../src/federal/passThrough/receipts.js";
import { unsupported } from "../../../../src/types.js";

const k1: TrustK1FactValue = {
  form: "1041",
  entityName: "Two Rivers Trust",
  entityEin: "00-0000041",
  boxes: [{ box: "1", amount: 300 }],
};

const entity: PassThroughEntity = {
  key: "k1.trust.two-rivers",
  holdingKey: "k1.holding.two-rivers",
  form: "1041",
  name: k1.entityName,
  ein: k1.entityEin,
  k1,
  items: itemsOf("k1.trust.two-rivers", k1),
  priorYearItems: [],
};

/* A receipt of one interest item with the amount given (undefined: a statement-only item). */
const receiptOf = (...amounts: Array<number | undefined>): Receipt => ({
  kind: "received",
  items: amounts.map((amount): ReceivedItem => ({
    entity,
    item: { entityKey: entity.key, type: "interest", amount, box: "1", label: "Interest" },
  })),
});

describe("withReceived: the printed-zero rule", () => {
  it("adds the K-1 amounts to the return's own, cents kept", () => {
    expect(withReceived(100.25, receiptOf(300.5))).toBe(400.75);
    expect(withReceived(undefined, receiptOf(300))).toBe(300);
  });

  it("is blank, not 0, with no amount of its own and every K-1 amount 0 or absent", () => {
    expect(withReceived(undefined, receiptOf(0))).toBeUndefined();
    expect(withReceived(undefined, receiptOf(undefined, 0))).toBeUndefined();
    expect(withReceived(undefined, receiptOf())).toBeUndefined();
  });

  it("keeps the return's own amount, a 0 included, when the K-1 adds nothing", () => {
    expect(withReceived(0, receiptOf(0))).toBe(0);
    expect(withReceived(250, receiptOf(undefined))).toBe(250);
  });

  it("waits while a K-1 waits, and is the gap when one is unsupported", () => {
    expect(withReceived(100, { kind: "waiting", factKeys: ["k1.holding.two-rivers"] })).toBe(
      undefined,
    );
    expect(withReceived(100, { kind: "unsupported", reason: "a gap" })).toEqual(
      unsupported("a gap"),
    );
  });
});

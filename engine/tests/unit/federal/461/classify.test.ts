/*
 * Part II's sorting of Schedule E amounts into business and not business
 * (classify.ts): a property's answer, a royalty's activity, a K-1 item's type
 * and the entity's rental answer.
 */

import { describe, expect, it } from "vitest";
import type { RentalFactValue } from "../../../../src/facts/index.js";
import {
  propertyIsBusiness,
  sortK1Items,
  sortProperties,
} from "../../../../src/federal/461/classify.js";
import type { PassThroughEntity } from "../../../../src/federal/passThrough/items.js";
import type { ItemType } from "../../../../src/federal/passThrough/itemTypes.js";
import type { Receipt } from "../../../../src/federal/passThrough/receipts.js";
import type { RentalProperty } from "../../../../src/federal/schedule-e/filingInfo.js";

const property = (value: Partial<RentalFactValue>, column: "a" | "b" = "a"): RentalProperty => ({
  factKey: `rental.property.${column}`,
  column,
  value: { propertyType: "single_family", ...value },
});

const entity = (key: string): PassThroughEntity =>
  ({ key, holdingKey: `k1.holding.${key}` }) as PassThroughEntity;

/* The rental answers: "yes" and "no" stated, any other K-1 open. */
const ANSWERS: Record<string, boolean> = { yes: true, no: false };
const answer = (entityKey: string) => ANSWERS[entityKey];

const item = (owner: PassThroughEntity, type: ItemType, amount: number) => ({
  entity: owner,
  item: { entityKey: owner.key, type, amount, box: "1", label: type },
});

const received = (...items: ReturnType<typeof item>[]): Receipt => ({ kind: "received", items });

describe("Schedule E Part I properties", () => {
  it("reads the rental's trade or business answer", () => {
    expect(propertyIsBusiness(property({ tradeOrBusiness: true }))).toBe(true);
    expect(propertyIsBusiness(property({ tradeOrBusiness: false }))).toBe(false);
    expect(propertyIsBusiness(property({}))).toBeUndefined();
  });

  it("settles a royalty by its activity", () => {
    const royalty = (royaltyActivity?: RentalFactValue["royaltyActivity"]) =>
      property({ propertyType: "royalties", royaltyActivity });
    expect(propertyIsBusiness(royalty("portfolio"))).toBe(false);
    expect(propertyIsBusiness(royalty("passive"))).toBe(true);
    expect(propertyIsBusiness(royalty("nonpassive"))).toBe(true);
    expect(propertyIsBusiness(royalty(undefined))).toBeUndefined();
  });

  it("lists the nonbusiness columns, or the properties still open", () => {
    const sorted = sortProperties([
      property({ tradeOrBusiness: true }, "a"),
      property({ propertyType: "royalties", royaltyActivity: "portfolio" }, "b"),
    ]);
    expect(sorted).toEqual({ kind: "sorted", value: [{ column: "b", royalty: true }] });
    expect(sortProperties([property({}, "a")])).toEqual({
      kind: "waiting",
      factKeys: ["rental.property.a"],
    });
  });
});

describe("K-1 items on Schedule E", () => {
  const yes = entity("yes");
  const no = entity("no");
  const open = entity("open");

  it("counts ordinary business income and guaranteed payments as business", () => {
    const sorted = sortK1Items(
      [
        received(
          item(no, "ordinary_business_income", -500000),
          item(no, "guaranteed_payment_services", 40000),
        ),
      ],
      answer,
    );
    expect(sorted).toEqual({ kind: "sorted", value: { income: 0, losses: 0 } });
  });

  it("sorts rental items by the entity's answer, by K-1, rounded once", () => {
    const sorted = sortK1Items(
      [
        received(
          item(no, "net_rental_real_estate_income", -1200.4),
          item(no, "other_net_rental_income", 300.6),
          item(yes, "net_rental_real_estate_income", -9000),
        ),
      ],
      answer,
    );
    expect(sorted).toEqual({ kind: "sorted", value: { income: 301, losses: 1200 } });
  });

  it("takes a trust's box 5 as nonbusiness income", () => {
    const trust = entity("trust");
    expect(sortK1Items([received(item(trust, "other_portfolio_income", 2500))], answer)).toEqual({
      kind: "sorted",
      value: { income: 2500, losses: 0 },
    });
  });

  it("waits for a K-1 entity's rental answer", () => {
    expect(
      sortK1Items([received(item(open, "net_rental_real_estate_income", -100))], answer),
    ).toEqual({
      kind: "waiting",
      factKeys: ["business_loss_limit.k1_rental_trade_or_business.open"],
    });
  });

  it("passes on a K-1 that waits or is unsupported", () => {
    expect(sortK1Items([{ kind: "waiting", factKeys: ["k1.holding.x"] }], answer)).toEqual({
      kind: "waiting",
      factKeys: ["k1.holding.x"],
    });
    expect(sortK1Items([{ kind: "unsupported", reason: "gap" }], answer)).toEqual({
      kind: "unsupported",
      reason: "gap",
    });
  });
});

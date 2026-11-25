/*
 * Form 8824 arithmetic against every published example with numbers
 * (.scratch/evidence.md in the branch that added it): the instructions' Taylor
 * and Finley examples, Pub. 544's examples and Rev. Proc. 2005-14 Example 1,
 * then limit and edge tests that need no source.
 */

import { describe, expect, it } from "vitest";
import type { LikeKindExchangeFactValue } from "../../../../src/facts/index.js";
import { evaluateDivestiture } from "../../../../src/federal/8824/divestiture.js";
import { evaluateExchange, type ExchangeForm } from "../../../../src/federal/8824/exchange.js";
import { basisPart, partIVLines } from "../../../../src/federal/8824/lines.js";

type Overrides = Omit<Partial<LikeKindExchangeFactValue>, "givenUp" | "received"> & {
  givenUp?: Partial<LikeKindExchangeFactValue["givenUp"]>;
  received?: Partial<LikeKindExchangeFactValue["received"]>;
};

/* An exchange in 2025 of investment real property for real property, received the same day. */
function exchange(overrides: Overrides): LikeKindExchangeFactValue {
  return {
    ...overrides,
    givenUp: {
      description: "Apartment building",
      dateAcquired: "2015-01-10",
      dateTransferred: "2025-03-01",
      use: "business_or_rental",
      adjustedBasis: 0,
      ...overrides.givenUp,
    },
    received: {
      description: "Apartment building",
      dateReceived: "2025-03-01",
      fairMarketValue: 0,
      ...overrides.received,
    },
  };
}

function filed(value: LikeKindExchangeFactValue): ExchangeForm {
  const outcome = evaluateExchange({ key: "like_kind_exchange.test", value });
  if (outcome.kind !== "filed") throw new Error(`expected a filed form, got ${outcome.kind}`);
  return outcome.form;
}

const lines = (value: LikeKindExchangeFactValue) => {
  const form = filed(value);
  return { ...form.realized, ...form.recognized };
};

/* The instructions' example (irs-8824-inst-2025::sec::line-20::b01, summary-of-facts::b01). */
const taylor = (recapture?: number) =>
  exchange({
    givenUp: {
      adjustedBasis: 100000,
      liabilitiesAssumedByOtherParty: 80000,
      recapture: recapture === undefined ? undefined : { section1245Depreciation: recapture },
    },
    received: { fairMarketValue: 250000, liabilitiesAssumed: 150000, section1250Value: 250000 },
    cashReceived: 40000,
  });

const finley = (ordinaryIfSold?: number) =>
  exchange({
    givenUp: {
      adjustedBasis: 175000,
      liabilitiesAssumedByOtherParty: 150000,
      recapture:
        ordinaryIfSold === undefined ? undefined : { section1250OrdinaryIfSold: ordinaryIfSold },
    },
    received: {
      fairMarketValue: 220000,
      liabilitiesAssumed: 80000,
      section1250Value: 165000,
      section1245Value: 55000,
    },
    cashPaid: 40000,
  });

describe("Form 8824 instructions, the Taylor and Finley example", () => {
  it("Taylor: lines 15–20 (summary-of-facts::b01)", () => {
    expect(lines(taylor())).toMatchObject({
      line15: 40000,
      line16: 250000,
      line17: 290000,
      line18: 170000,
      line19: 120000,
      line20: 40000,
    });
  });

  it("Finley: lines 15–20 (summary-of-facts::b01, b02)", () => {
    expect(lines(finley())).toMatchObject({
      line15: 30000,
      line16: 220000,
      line17: 250000,
      line18: 175000,
      line19: 75000,
      line20: 30000,
    });
  });

  it("Taylor, section 1245 recapture of $35,000: lines 21–24 (line-24::b02, b03)", () => {
    expect(lines(taylor(35000))).toMatchObject({
      line21: 35000,
      line22: 5000,
      line23: 40000,
      line24: 80000,
    });
  });

  it("Taylor, the alternative with $50,000: line 22 is 0 (line-24::b03)", () => {
    expect(lines(taylor(50000))).toMatchObject({
      line21: 50000,
      line22: 0,
      line23: 50000,
      line24: 70000,
    });
  });

  it("Finley, section 1250 recapture of $35,000 limited to $30,000 (line-24::b04, b05)", () => {
    expect(lines(finley(35000))).toMatchObject({
      line21: 30000,
      line22: 0,
      line23: 30000,
      line24: 45000,
    });
  });

  it("Taylor: line 25 is $170,000, all of it on line 25a (lines-25a-25b-and-25c::b02)", () => {
    const form = filed(taylor(35000));
    expect(form.recognized?.line25).toBe(170000);
    expect(form.basisParts).toEqual({ section1250: 170000 });
  });

  it("Finley: line 25 $175,000, 25a $131,250, 25b $43,750 (lines-25a-25b-and-25c::b03)", () => {
    const form = filed(finley(35000));
    expect(form.recognized?.line25).toBe(175000);
    expect(form.basisParts).toEqual({ section1250: 131250, section1245: 43750 });
  });
});

describe("Pub. 544, partially nontaxable exchanges (irs-pub-544-2025::sec::partially-nontaxable-exchanges)", () => {
  const base = {
    givenUp: { use: "investment" as const, adjustedBasis: 80000 },
    received: { fairMarketValue: 100000 },
    cashReceived: 10000,
    exchangeExpenses: 5000,
  };

  it("cash and exchange expenses: realized $25,000, recognized $5,000 (b02)", () => {
    expect(lines(exchange(base))).toMatchObject({ line19: 25000, line20: 5000, line23: 5000 });
  });

  it("a $30,000 mortgage assumed: realized $55,000, recognized $35,000 (b03, b04)", () => {
    const value = exchange({
      ...base,
      givenUp: { ...base.givenUp, liabilitiesAssumedByOtherParty: 30000 },
    });
    expect(lines(value)).toMatchObject({ line15: 35000, line19: 55000, line20: 35000 });
  });

  it("both mortgages: realized $55,000, recognized $5,000 (b05, b06)", () => {
    const value = exchange({
      ...base,
      givenUp: { ...base.givenUp, liabilitiesAssumedByOtherParty: 30000 },
      received: { fairMarketValue: 140000, liabilitiesAssumed: 40000 },
    });
    expect(lines(value)).toMatchObject({
      line15: 5000,
      line18: 90000,
      line19: 55000,
      line20: 5000,
    });
  });

  it("stock given up: a $3,000 loss on line 14, realized $4,000, nothing recognized (b06, b07)", () => {
    const value = exchange({
      givenUp: { use: "investment", adjustedBasis: 15000 },
      received: { fairMarketValue: 20000 },
      otherPropertyGivenUp: {
        description: "Stock",
        fairMarketValue: 1000,
        adjustedBasis: 4000,
        dateAcquired: "2020-01-01",
        use: "investment",
      },
    });
    expect(lines(value)).toMatchObject({ line14: -3000, line19: 4000, line20: 0 });
  });

  it("other property received: realized $4,000, recognized $2,000 (b07, b08)", () => {
    const value = exchange({
      givenUp: { use: "investment", adjustedBasis: 16000 },
      received: { fairMarketValue: 18000 },
      otherPropertyReceived: { description: "Equipment", fairMarketValue: 2000 },
    });
    expect(lines(value)).toMatchObject({ line19: 4000, line20: 2000 });
  });
});

describe("Pub. 544, recapture in like-kind exchanges (irs-pub-544-2025::sec::ordinary-income-recapture-in)", () => {
  const section1245 = (cash: number, received1245: number) =>
    exchange({
      givenUp: { adjustedBasis: 50000, recapture: { section1245Depreciation: 10000 } },
      received: { fairMarketValue: 100000 - cash, section1245Value: received1245 },
      cashReceived: cash,
    });

  it("section 1245: recapture $10,000 within the $85,000 limit (b01, b02)", () => {
    expect(lines(section1245(40000, 15000))).toMatchObject({
      line19: 50000,
      line20: 40000,
      line21: 10000,
    });
  });

  it("section 1245 with no cash: $10,000 recaptured, $40,000 deferred (b02, b03)", () => {
    // The example's limit counts $45,000 of section 1250 property received, so $55,000 is section 1245.
    expect(lines(section1245(0, 55000))).toMatchObject({
      line21: 10000,
      line23: 10000,
      line24: 40000,
    });
  });

  const section1250 = (cash: number) =>
    exchange({
      givenUp: { adjustedBasis: 120000, recapture: { section1250OrdinaryIfSold: 10000 } },
      received: { fairMarketValue: 200000 - cash, section1250Value: 200000 - cash },
      cashReceived: cash,
    });

  it("section 1250: recapture $10,000 within the $40,000 limit (b03–b05)", () => {
    expect(lines(section1250(40000))).toMatchObject({ line20: 40000, line21: 10000 });
  });

  it("section 1250 with no cash: the limit is $0, nothing recaptured (b05, b06)", () => {
    expect(lines(section1250(0))).toMatchObject({ line19: 80000, line21: 0, line24: 80000 });
  });
});

describe("Pub. 544, an exchange with a sister (irs-pub-544-2025::sec::like-kind-exchanges-between-related::b02, b03)", () => {
  const related = { name: "Sister", relationship: "Sister", address: "1 Main St" };
  const december2024 = { dateAcquired: "2010-05-01", dateTransferred: "2024-12-10" };

  it("you: the $135,000 deferred gain is reported in 2025 after your sale", () => {
    const form = filed(
      exchange({
        givenUp: { ...december2024, adjustedBasis: 65000 },
        received: { fairMarketValue: 215000, dateReceived: "2024-12-10" },
        cashPaid: 15000,
        relatedParty: { ...related, relatedPartyDisposed: false, taxpayerDisposed: true },
      }),
    );
    expect(form.recognized).toMatchObject({ line23: 0, line24: 135000, line25: 80000 });
    expect(form.route.amounts.section1231).toBe(135000);
  });

  it("the sister: $130,000 reported in 2025, after the $15,000 of 2024", () => {
    const form = filed(
      exchange({
        givenUp: { ...december2024, adjustedBasis: 70000 },
        received: { fairMarketValue: 200000, dateReceived: "2024-12-10" },
        cashReceived: 15000,
        relatedParty: { ...related, relatedPartyDisposed: true, taxpayerDisposed: false },
      }),
    );
    expect(form.recognized).toMatchObject({ line23: 15000, line24: 130000, line25: 70000 });
    expect(form.route.amounts.section1231).toBe(130000);
  });
});

describe("Rev. Proc. 2005-14, Example 1 (a former home, section 121)", () => {
  it("no gain recognized; the replacement's basis is $430,000", () => {
    const form = filed(
      exchange({
        givenUp: { adjustedBasis: 190000 },
        received: { fairMarketValue: 460000 },
        cashReceived: 10000,
        section121Exclusion: 250000,
      }),
    );
    expect(form.realized).toMatchObject({ line19: 280000, line20: 0 });
    expect(form.recognized).toMatchObject({ line23: 0, line25: 430000 });
  });
});

describe("Form 8824 limits and edges (no source needed)", () => {
  const values = [
    taylor(35000),
    finley(35000),
    exchange({
      givenUp: { adjustedBasis: 300000 },
      received: { fairMarketValue: 200000 },
      cashReceived: 5000,
    }),
  ];

  it("line 20 is never below 0 nor above line 15 or line 19; lines 23 and 24 add up to line 19", () => {
    for (const value of values) {
      const all = lines(value);
      expect(all.line20).toBeGreaterThanOrEqual(0);
      expect(all.line20).toBeLessThanOrEqual(
        Math.max(0, Math.min(all.line15 ?? 0, all.line19 ?? 0)),
      );
      expect((all.line23 ?? 0) + (all.line24 ?? 0)).toBe(all.line19);
    }
  });

  it("a realized loss is deferred on line 24 and recognizes nothing", () => {
    expect(lines(values[2]!)).toMatchObject({
      line19: -95000,
      line20: 0,
      line23: 0,
      line24: -95000,
    });
  });

  it("lines 25a–25c never add up to more than line 25", () => {
    expect(basisPart(175000, 0, 220000)).toBeUndefined();
    const parts = [180000, 50000, 10000].map((part) => basisPart(60000, part, 260000) ?? 0);
    expect(parts.reduce((total, part) => total + part, 0)).toBeLessThanOrEqual(60000);
  });

  it("the 45-day identification: day 45 needs no notice, day 46 does", () => {
    const received = (date: string, identified?: string) =>
      evaluateExchange({
        key: "like_kind_exchange.test",
        value: exchange({
          received: { dateReceived: date, dateIdentified: identified, fairMarketValue: 1 },
        }),
      }).kind;
    expect(received("2025-04-15")).toBe("filed");
    expect(received("2025-04-16")).toBe("gap");
    expect(received("2025-05-01", "2025-04-15")).toBe("filed");
    expect(received("2025-05-01", "2025-04-16")).toBe("gap");
  });

  it("the 180-day receipt: day 180 qualifies, day 181 does not", () => {
    const received = (date: string) =>
      evaluateExchange({
        key: "like_kind_exchange.test",
        value: exchange({
          received: { dateReceived: date, dateIdentified: "2025-03-20", fairMarketValue: 1 },
        }),
      }).kind;
    expect(received("2025-08-28")).toBe("filed");
    expect(received("2025-08-29")).toBe("gap");
  });

  it("an exchange of an earlier year with no related party does not file", () => {
    const value = exchange({
      givenUp: { dateTransferred: "2024-06-01" },
      received: { dateReceived: "2024-06-01" },
    });
    expect(evaluateExchange({ key: "like_kind_exchange.test", value }).kind).toBe("not_this_year");
  });

  it("both section 1245 and section 1250 recapture: lines 21–25c are a gap", () => {
    const form = filed(
      exchange({
        givenUp: {
          adjustedBasis: 10,
          recapture: { section1245Depreciation: 5, section1250OrdinaryIfSold: 5 },
        },
        received: { fairMarketValue: 100 },
      }),
    );
    expect(form.line21Gap).toBeDefined();
    expect(form.recognized).toBeUndefined();
    expect(form.route.gap?.destinations).toContain("form_4797");
  });
});

describe("Form 8824 Part II branches (the form's text under lines 7 and 10; line-7::b02)", () => {
  const related = { name: "Parent", relationship: "Parent", address: "2 Oak St" };
  const prior = (party: Partial<LikeKindExchangeFactValue["relatedParty"]>) =>
    evaluateExchange({
      key: "like_kind_exchange.test",
      value: exchange({
        givenUp: { dateTransferred: "2024-02-01", adjustedBasis: 10 },
        received: { dateReceived: "2024-02-01", fairMarketValue: 100 },
        relatedParty: { ...related, ...party },
      }),
    });

  it("a later year with lines 9 and 10 No: Parts I and II only", () => {
    const outcome = prior({ relatedPartyDisposed: false, taxpayerDisposed: false });
    expect(outcome.kind === "filed" && outcome.form.realized).toBe(undefined);
  });

  it("a later year with a disposition an exception covers: line 11 checked, no Part III", () => {
    const outcome = prior({
      relatedPartyDisposed: true,
      taxpayerDisposed: false,
      exception: "death",
    });
    expect(outcome.kind === "filed" && [outcome.form.line11, outcome.form.realized]).toEqual([
      "death",
      undefined,
    ]);
  });

  it("lines 9 and 10 not answered: the exchange waits", () => {
    const outcome = prior({});
    expect(outcome.kind === "filed" && outcome.form.route.waits).toBe(true);
  });

  it("a third year after the exchange does not file", () => {
    const outcome = evaluateExchange({
      key: "like_kind_exchange.test",
      value: exchange({
        givenUp: { dateTransferred: "2022-12-31" },
        received: { dateReceived: "2022-12-31" },
        relatedParty: { ...related, relatedPartyDisposed: true, taxpayerDisposed: false },
      }),
    });
    expect(outcome.kind).toBe("not_this_year");
  });

  it("a deferred loss reported after a disposition is a gap (a related party loss)", () => {
    const outcome = prior({ relatedPartyDisposed: true, taxpayerDisposed: false });
    const form = evaluateExchange({
      key: "like_kind_exchange.test",
      value: exchange({
        givenUp: { dateTransferred: "2024-02-01", adjustedBasis: 500 },
        received: { dateReceived: "2024-02-01", fairMarketValue: 100 },
        relatedParty: { ...related, relatedPartyDisposed: true, taxpayerDisposed: false },
      }),
    });
    expect(outcome.kind).toBe("filed");
    expect(form.kind === "filed" && form.form.route.gap?.destinations).toEqual(["form_4797"]);
  });

  it("a related party sold the replacement property into the exchange: do not file", () => {
    const value = exchange({ relatedParty: { ...related, soldIntoExchange: true } });
    expect(evaluateExchange({ key: "like_kind_exchange.test", value }).kind).toBe("gap");
  });
});

describe("Form 8824 Part IV (the form's lines 30–38)", () => {
  const sale = {
    certificateNumber: "1-2",
    divestedDescription: "Stock",
    replacementDescription: "Treasury notes",
    dateAcquired: "2020-01-01",
    dateSold: "2025-06-01",
    amountReceived: 100000,
    sellingExpenses: 500,
    basis: 40000,
    replacementCost: 90000,
    use: "investment" as const,
  };

  it("lines 35–37 add up to line 32 and line 38 is line 33 less line 37", () => {
    const lines4 = partIVLines({ ...sale, recapture: 0 });
    expect(lines4).toMatchObject({
      line30: 99500,
      line32: 59500,
      line34: 9500,
      line36: 9500,
      line37: 50000,
    });
    expect(lines4.line35 + lines4.line36 + lines4.line37).toBe(lines4.line32);
    expect(lines4.line38).toBe(lines4.line33 - lines4.line37);
  });

  it("replacement cost more than line 30: nothing recognized, all deferred", () => {
    expect(partIVLines({ ...sale, replacementCost: 120000, recapture: 0 })).toMatchObject({
      line34: 0,
      line36: 0,
      line37: 59500,
    });
  });

  it("a capital asset held more than 1 year goes on Schedule D line 11", () => {
    const outcome = evaluateDivestiture({ key: "conflict_of_interest_sale.test", value: sale });
    expect(outcome.kind === "filed" && outcome.form.amounts.longTermCapital).toBe(9500);
  });

  it("cost of replacement not more than basis: Part IV is not used", () => {
    const outcome = evaluateDivestiture({
      key: "conflict_of_interest_sale.test",
      value: { ...sale, replacementCost: 40000 },
    });
    expect(outcome.kind).toBe("gap");
  });
});

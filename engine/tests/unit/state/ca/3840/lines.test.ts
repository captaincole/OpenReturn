/*
 * FTB 3840 arithmetic against the published examples with numbers
 * (.scratch/evidence.md in the branch that added it): FTB Pub. 1100 Example 16,
 * the Form 8824 Taylor and Finley example that Side 1 copies, and Pub. 544's
 * partially nontaxable exchanges for Schedule A lines 3–7. Then limit tests that
 * need no source.
 */

import { describe, expect, it } from "vitest";
import type {
  CaLikeKindExchangeFactValue,
  LikeKindExchangeFactValue,
} from "../../../../../src/facts/index.js";
import {
  filingTypeOf,
  line8Of,
  scheduleAOf,
  side1Of,
  type CaExchange,
} from "../../../../../src/state/ca/3840/exchange.js";
import {
  APPORTIONMENT_DECIMALS,
  OWNERSHIP_DECIMALS,
  californiaDeferredGain,
  percentBoxes,
  scheduleALines,
} from "../../../../../src/state/ca/3840/lines.js";

type Overrides = Omit<Partial<LikeKindExchangeFactValue>, "givenUp" | "received"> & {
  givenUp?: Partial<LikeKindExchangeFactValue["givenUp"]>;
  received?: Partial<LikeKindExchangeFactValue["received"]>;
};

/* An exchange in 2025 of investment real property, received the same day. */
function federal(overrides: Overrides): LikeKindExchangeFactValue {
  return {
    ...overrides,
    givenUp: {
      description: "Condominium, San Diego, CA",
      dateAcquired: "2015-01-10",
      dateTransferred: "2025-03-01",
      use: "investment",
      adjustedBasis: 0,
      ...overrides.givenUp,
    },
    received: {
      description: "Condominium, Austin, TX",
      dateReceived: "2025-03-01",
      fairMarketValue: 0,
      ...overrides.received,
    },
  };
}

function california(
  overrides: Partial<CaLikeKindExchangeFactValue["givenUp"]> = {},
  recognizedIn2025 = false,
): CaLikeKindExchangeFactValue {
  return {
    givenUp: {
      inCalifornia: true,
      ownershipPercent: 100,
      address: "1 Harbor Dr",
      city: "San Diego",
      state: "CA",
      zip: "92101",
      priorDeferredExchange: false,
      ...overrides,
    },
    received: {
      inCalifornia: false,
      ownershipPercent: 100,
      address: "9 Congress Ave",
      city: "Austin",
      state: "TX",
      zip: "78701",
    },
    recognizedIn2025,
  };
}

const pair = (
  federalValue: LikeKindExchangeFactValue,
  californiaValue = california(),
): CaExchange => ({
  federalKey: "like_kind_exchange.test",
  californiaKey: "ca_like_kind_exchange.test",
  federal: federalValue,
  california: californiaValue,
});

const line8 = (exchange: CaExchange) => line8Of(exchange, side1Of(exchange.federal!));

describe("FTB Pub. 1100, Example 16 (ftb-pub-1100-2025::sec::example-16::b01)", () => {
  // A California condominium for Texas property: a $15,000 realized gain, all deferred.
  const condo = federal({
    givenUp: { adjustedBasis: 85000 },
    received: { fairMarketValue: 100000 },
  });

  it("Side 1 line 19, the deferred gain, is $15,000", () => {
    expect(side1Of(condo).recognized?.line24).toBe(15000);
  });

  it("the $15,000 has a California source: Schedule A line 8 (and line 10, column D)", () => {
    expect(line8(pair(condo))).toEqual({ value: 15000 });
  });
});

describe("FTB 3840 instructions, Question B (general-question-a-through-question-c::b02)", () => {
  it("an exchange in July 2024 with nothing sold in 2025 files the Annual FTB 3840", () => {
    const july2024 = federal({
      givenUp: { dateTransferred: "2024-07-15", adjustedBasis: 50000 },
      received: { dateReceived: "2024-07-15", fairMarketValue: 80000 },
    });
    expect(filingTypeOf(pair(july2024))).toBe("annual");
  });

  it("an exchange of 2025 files the Initial FTB 3840; a recognized gain files the Final one", () => {
    const exchange = federal({ givenUp: { adjustedBasis: 50000 } });
    expect(filingTypeOf(pair(exchange))).toBe("initial");
    expect(filingTypeOf(pair(exchange, california({}, true)))).toBe("final");
  });
});

/* irs-8824-inst-2025::sec::summary-of-facts::b01, b02 and line-24::b02–b05: Side 1 lines 10–20 are 8824 lines 15–25. */
describe("Side 1 copies Form 8824's Taylor and Finley example", () => {
  const taylor = federal({
    givenUp: {
      use: "business_or_rental",
      adjustedBasis: 100000,
      liabilitiesAssumedByOtherParty: 80000,
      recapture: { section1245Depreciation: 35000 },
    },
    received: { fairMarketValue: 250000, liabilitiesAssumed: 150000, section1250Value: 250000 },
    cashReceived: 40000,
  });
  const finley = federal({
    givenUp: {
      use: "business_or_rental",
      adjustedBasis: 175000,
      liabilitiesAssumedByOtherParty: 150000,
      recapture: { section1250OrdinaryIfSold: 35000 },
    },
    received: {
      fairMarketValue: 220000,
      liabilitiesAssumed: 80000,
      section1250Value: 165000,
      section1245Value: 55000,
    },
    cashPaid: 40000,
  });

  it("Taylor: lines 10–20 are the example's 8824 lines 15–25", () => {
    const { realized, recognized } = side1Of(taylor);
    expect(realized).toMatchObject({
      line15: 40000,
      line16: 250000,
      line17: 290000,
      line18: 170000,
      line19: 120000,
      line20: 40000,
    });
    expect(recognized).toMatchObject({
      line21: 35000,
      line22: 5000,
      line23: 40000,
      line24: 80000,
      line25: 170000,
    });
  });

  it("Finley: lines 16–20 are 30,000; 0; 30,000; 45,000; 175,000", () => {
    expect(side1Of(finley).recognized).toMatchObject({
      line21: 30000,
      line22: 0,
      line23: 30000,
      line24: 45000,
      line25: 175000,
    });
  });

  it("Taylor in California: Schedule A line 7 is the realized gain and line 8 the deferred gain", () => {
    const exchange = pair(taylor);
    expect(scheduleAOf(taylor, exchange.california!).line7).toBe(120000);
    expect(line8(exchange)).toEqual({ value: 80000 });
  });
});

describe("Pub. 544, partially nontaxable exchanges: Schedule A line 7 = Side 1 line 14", () => {
  const base = { givenUp: { adjustedBasis: 80000 }, cashReceived: 10000, exchangeExpenses: 5000 };
  const cases: Array<[string, Overrides, number]> = [
    ["cash and expenses: $25,000 (b02)", { ...base, received: { fairMarketValue: 100000 } }, 25000],
    [
      "a $30,000 mortgage relieved: $55,000 (b03, b04)",
      {
        ...base,
        givenUp: { ...base.givenUp, liabilitiesAssumedByOtherParty: 30000 },
        received: { fairMarketValue: 100000 },
      },
      55000,
    ],
    [
      "both mortgages: $55,000 (b05, b06)",
      {
        ...base,
        givenUp: { ...base.givenUp, liabilitiesAssumedByOtherParty: 30000 },
        received: { fairMarketValue: 140000, liabilitiesAssumed: 40000 },
      },
      55000,
    ],
  ];

  it.each(cases)("%s", (_, overrides, realized) => {
    const value = federal(overrides);
    expect(side1Of(value).realized?.line19).toBe(realized);
    expect(scheduleAOf(value, california()).line7).toBe(realized);
  });
});

describe("Schedule A lines 3–7, the parts", () => {
  it("line 3 nets what the taxpayer gave; line 5 = 3 − 4; line 7 = 5 − 6", () => {
    expect(
      scheduleALines({
        receivedValue: 260000,
        cashReceived: 15000,
        otherReceivedValue: 0,
        liabilitiesRelieved: 30000,
        liabilitiesAssumed: 10000,
        cashPaid: 0,
        otherGivenUpValue: 9000,
        exchangeExpenses: 6000,
        californiaBasis: 150000,
      }),
    ).toEqual({ line3: 286000, line4: 6000, line5: 280000, line6: 150000, line7: 130000 });
  });

  it("the stated California basis replaces the federal one on line 6", () => {
    const value = federal({
      givenUp: { adjustedBasis: 80000 },
      received: { fairMarketValue: 100000 },
    });
    expect(scheduleAOf(value, california({ californiaAdjustedBasis: 92000 })).line6).toBe(92000);
    expect(scheduleAOf(value, california()).line6).toBe(80000);
  });
});

describe("Schedule A line 8, the California sourced deferred gain", () => {
  const value = federal({
    givenUp: { adjustedBasis: 80000 },
    received: { fairMarketValue: 100000 },
    cashReceived: 5000,
  });

  it("equals line 7 less Side 1 line 18 when the bases agree", () => {
    const exchange = pair(value);
    const line7 = scheduleAOf(value, exchange.california!).line7;
    expect(line8(exchange)).toEqual({ value: line7 - side1Of(value).recognized!.line23 });
  });

  it("a California basis $10,000 higher lowers it by $10,000", () => {
    expect(line8(pair(value, california({ californiaAdjustedBasis: 90000 })))).toEqual({
      value: 10000,
    });
    expect(californiaDeferredGain(20000, 80000, 90000)).toBe(10000);
  });

  it("a property given up outside California adds nothing (part-i-properties-given-up::b03)", () => {
    expect(line8(pair(value, california({ inCalifornia: false, state: "NV" })))).toEqual({
      value: 0,
    });
  });

  it("is a gap when the California basis changes the recognized gain", () => {
    // Federal: realized 25,000, recognized 5,000. California basis 104,000: realized 1,000, recognized 1,000.
    const result = line8(pair(value, california({ californiaAdjustedBasis: 104000 })));
    expect(result).toHaveProperty("gap");
  });

  it("is a gap when the California basis differs and the property given up has recapture", () => {
    const recapture = federal({
      givenUp: {
        use: "business_or_rental",
        adjustedBasis: 80000,
        recapture: { section1245Depreciation: 2000 },
      },
      received: { fairMarketValue: 100000 },
      cashReceived: 5000,
    });
    expect(line8(pair(recapture, california({ californiaAdjustedBasis: 85000 })))).toHaveProperty(
      "gap",
    );
  });

  it("a deferred loss stays a loss", () => {
    const loss = federal({
      givenUp: { adjustedBasis: 120000 },
      received: { fairMarketValue: 100000 },
    });
    expect(line8(pair(loss))).toEqual({ value: -20000 });
  });
});

describe("the printed percentages", () => {
  it("ownership: three places, the point, two decimals", () => {
    expect(percentBoxes(100, OWNERSHIP_DECIMALS)).toBe("100.00");
    expect(percentBoxes(50, OWNERSHIP_DECIMALS)).toBe("050.00");
    expect(percentBoxes(33.333, OWNERSHIP_DECIMALS)).toBe("033.33");
  });

  it("apportionment: four decimals", () => {
    expect(percentBoxes(12.5, APPORTIONMENT_DECIMALS)).toBe("012.5000");
    expect(percentBoxes(0.12345, APPORTIONMENT_DECIMALS)).toBe("000.1235");
  });
});

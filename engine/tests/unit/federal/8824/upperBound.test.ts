/*
 * Form 8824's share of the MAGI upper bound that decides whether Form 8960
 * files. A deferred gain (line 24) is not income this year, so it stays out
 * unless a related party disposition reports it.
 */

import { describe, expect, it } from "vitest";
import type { LikeKindExchangeFactValue } from "../../../../src/facts/index.js";
import { form8824GainUpperBound } from "../../../../src/federal/8824/upperBound.js";

/* Land for land in 2025: line 19 $250,000; $10,000 cash received (line 20). */
const land: LikeKindExchangeFactValue = {
  givenUp: {
    description: "Land",
    dateAcquired: "2012-04-01",
    dateTransferred: "2025-03-01",
    use: "investment",
    adjustedBasis: 50000,
  },
  received: { description: "Land", dateReceived: "2025-03-01", fairMarketValue: 290000 },
  cashReceived: 10000,
};

const bound = (value: LikeKindExchangeFactValue) =>
  form8824GainUpperBound([{ key: "like_kind_exchange.land", value, category: "other" }]);

const related = { name: "Brother", relationship: "Brother", address: "2 Oak St" };

describe("form8824GainUpperBound", () => {
  it("counts the recognized gain of the year, not the deferred gain", () => {
    expect(bound(land)).toBe(10000);
  });

  it("lines 9 and 10 not answered: the whole realized gain (line 19)", () => {
    expect(bound({ ...land, relatedParty: related })).toBe(250000);
  });

  it("a related party exchange of 2024 with no disposition in the window adds nothing", () => {
    const prior: LikeKindExchangeFactValue = {
      ...land,
      givenUp: { ...land.givenUp, dateTransferred: "2024-03-01" },
      received: { ...land.received, dateReceived: "2024-03-01" },
      relatedParty: { ...related, relatedPartyDisposed: false, taxpayerDisposed: false },
    };
    expect(bound(prior)).toBe(0);
  });

  it("a related party disposition reports line 24 too: line 23 + line 24 = line 19", () => {
    const disposed: LikeKindExchangeFactValue = {
      ...land,
      relatedParty: { ...related, relatedPartyDisposed: true, taxpayerDisposed: false },
    };
    expect(bound(disposed)).toBe(250000);
  });
});

/* Source: 2025 Instructions for Form 4562, the mid-quarter test (recovery-period-for-most-property::b02). */

import { describe, expect, it } from "vitest";
import {
  businessesOnReturn,
  makeBusinessFactKey,
  makeRentalFactKey,
  rentalsOnReturn,
  type DepreciableAsset,
} from "../../src/facts/index.js";

const equipment: DepreciableAsset = {
  description: "Equipment",
  placedInService: "2025-03-01",
  cost: 5000,
  recoveryClass: "5_year",
  method: "200DB",
  convention: "HY",
  acquiredAfterJanuary19: true,
};
const building: DepreciableAsset = {
  ...equipment,
  description: "Building",
  recoveryClass: "residential_rental",
  method: "SL",
  convention: "MM",
};

const business = (assets: DepreciableAsset[]) => ({
  key: makeBusinessFactKey("shop"),
  category: "self_employment",
  value: { activity: "Repairs", grossReceipts: 20000, depreciation: { assets } },
});
const rental = (assets: DepreciableAsset[]) => ({
  key: makeRentalFactKey("duplex"),
  category: "rental",
  value: {
    propertyType: "multi_family",
    fairRentalDays: 365,
    personalUseDays: 0,
    rentsReceived: 12000,
    depreciation: { assets },
  },
});

const marks = (facts: ReturnType<typeof business | typeof rental>[]) => ({
  business: businessesOnReturn(facts, false).businesses[0]?.value.depreciation
    ?.personalPropertyInOtherActivities,
  rental: rentalsOnReturn(facts, false).properties[0]?.value.depreciation
    ?.personalPropertyInOtherActivities,
});

describe("the return's depreciation scope", () => {
  it("marks both activities when each places personal property in service", () => {
    expect(marks([business([equipment]), rental([equipment])])).toEqual({
      business: true,
      rental: true,
    });
  });

  it("marks nothing when only one activity has personal property", () => {
    expect(marks([business([equipment]), rental([building])])).toEqual({
      business: undefined,
      rental: undefined,
    });
  });
});

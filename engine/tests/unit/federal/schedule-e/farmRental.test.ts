/*
 * Schedule E lines 40 and 42 from Form 4835 (farmRental.ts). Line 42's label
 * names Form 4835 line 7 and the K-1 codes for gross farming and fishing
 * income; no published example has numbers.
 */

import { describe, expect, it } from "vitest";
import type { PassThroughEntity } from "../../../../src/federal/passThrough/items.js";
import { line40, line42 } from "../../../../src/federal/schedule-e/farmRental.js";
import type { ScheduleEFilingInfo } from "../../../../src/federal/schedule-e/filingInfo.js";

const k1With = (amount: number | undefined): PassThroughEntity =>
  ({
    key: "k1",
    items: [
      {
        entityKey: "k1",
        type: "gross_farming_fishing_income",
        amount,
        box: "14",
        code: "B",
        label: "Gross farming or fishing income",
      },
    ],
  }) as unknown as PassThroughEntity;

const info = (extra: Partial<ScheduleEFilingInfo>): ScheduleEFilingInfo => extra;

describe("line 40", () => {
  it("is Form 4835's net; blank with no farm rental; unsupported with its gap", () => {
    expect(line40(info({ farmRentalNet: -2500 }))).toBe(-2500);
    expect(line40(info({}))).toBeUndefined();
    expect(line40(info({ farmRentalNet: { gap: "why" } }))).toMatchObject({ unsupported: true });
  });
});

describe("line 42", () => {
  it("adds Form 4835 line 7 and the K-1 gross farming income", () => {
    expect(line42(info({ farmRentalGross: 1000, passThroughEntities: [k1With(500)] }))).toBe(1500);
  });

  it("is the K-1 amount alone with no farm rental", () => {
    expect(line42(info({ passThroughEntities: [k1With(640)] }))).toBe(640);
  });

  it("is blank with neither", () => {
    expect(line42(info({}))).toBeUndefined();
  });

  it("is unsupported when a K-1 farming item has no amount", () => {
    expect(line42(info({ passThroughEntities: [k1With(undefined)] }))).toMatchObject({
      unsupported: true,
    });
  });
});

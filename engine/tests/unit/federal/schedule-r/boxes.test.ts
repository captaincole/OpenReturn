/* Source: 2025 Schedule R, Part I, and its instructions (qualified-individual::b01, married-persons::b01). */

import { describe, expect, it } from "vitest";
import { jointBox, partIBox, personStatus } from "../../../../src/federal/schedule-r/boxes.js";
import type { ScheduleRFilingInfo } from "../../../../src/federal/schedule-r/filingInfo.js";

describe("personStatus", () => {
  it.each([
    ["65 or older", true, undefined, undefined, "65"],
    ["under 65, retired on disability, with disability income", false, 11000, true, "disabled"],
    ["under 65, disability income, not retired on disability", false, 11000, false, "not"],
    ["under 65, no disability income", false, 0, undefined, "not"],
    ["the retired answer is missing", false, 11000, undefined, undefined],
    ["the date of birth is missing", undefined, 11000, true, undefined],
  ] as const)("%s", (_, over65, income, retired, status) => {
    expect(personStatus(over65, income, retired)).toBe(status);
  });
});

describe("jointBox", () => {
  it.each([
    ["65", "65", 3],
    ["disabled", "not", 4],
    ["disabled", "disabled", 5],
    ["65", "disabled", 6],
    ["not", "65", 7],
    ["not", "not", null],
  ] as const)("%s and %s: box %s", (taxpayer, spouse, box) => {
    expect(jointBox(taxpayer, spouse)).toBe(box);
  });
});

const SINGLE_DISABLED: ScheduleRFilingInfo = {
  filingStatus: "qualifying_surviving_spouse",
  taxpayerBornBeforeJan2_1961: false,
  scheduleRTaxpayerDisabilityIncome: 11000,
  scheduleRTaxpayerRetiredOnDisability: true,
};

describe("partIBox", () => {
  it("single, HOH or QSS: box 1 at 65, box 2 retired on disability", () => {
    expect(partIBox(SINGLE_DISABLED)).toBe(2);
    expect(partIBox({ filingStatus: "single", taxpayerBornBeforeJan2_1961: true })).toBe(1);
  });

  it("no box when no one qualifies, undefined while an answer is missing", () => {
    expect(partIBox({ ...SINGLE_DISABLED, scheduleRTaxpayerDisabilityIncome: 0 })).toBeNull();
    expect(
      partIBox({ ...SINGLE_DISABLED, scheduleRTaxpayerRetiredOnDisability: undefined }),
    ).toBeUndefined();
    expect(partIBox({ ...SINGLE_DISABLED, filingStatus: undefined })).toBeUndefined();
  });

  it("married filing separately: boxes 8 and 9 only after living apart all year", () => {
    const separate: ScheduleRFilingInfo = {
      filingStatus: "married_filing_separately",
      taxpayerBornBeforeJan2_1961: true,
    };
    expect(partIBox({ ...separate, livedApartFromSpouseAllYear: true })).toBe(8);
    expect(partIBox({ ...separate, livedApartFromSpouseAllYear: false })).toBeNull();
    expect(partIBox(separate)).toBeUndefined();
    expect(
      partIBox({
        ...SINGLE_DISABLED,
        ...{ filingStatus: "married_filing_separately" },
        livedApartFromSpouseAllYear: true,
      }),
    ).toBe(9);
  });

  it("married filing jointly: both spouses' statuses", () => {
    expect(
      partIBox({
        filingStatus: "married_filing_jointly",
        taxpayerBornBeforeJan2_1961: true,
        spouseBornBeforeJan2_1961: false,
        scheduleRSpouseDisabilityIncome: 4000,
        scheduleRSpouseRetiredOnDisability: true,
      }),
    ).toBe(6);
  });
});

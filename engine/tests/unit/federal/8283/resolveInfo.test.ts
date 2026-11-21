/*
 * Source: the 2025 Form 8283 header ("a total deduction of over $500 for all
 * contributed property"), irs-8283-inst-2025::sec::who-must-file::b01, and
 * irs-1040sa-inst-2025::sec::line-12::b01–b02 for Schedule A line 12.
 */

import { describe, expect, it } from "vitest";
import { makeNoncashGiftFactKey, type NoncashGiftFactValue } from "../../../../src/facts/index.js";
import { resolve8283Info } from "../../../../src/federal/8283/resolveInfo.js";
import { resolveScheduleAInfo } from "../../../../src/federal/schedule-a/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const gift = (fairMarketValue: number, overrides: Partial<NoncashGiftFactValue> = {}) => ({
  donee: { name: "Goodwill", street: "1 Main St", city: "Town", state: "TN", zip: "37922" },
  propertyType: "other" as const,
  description: "Household goods",
  contributionDate: "06/15/2025",
  dateAcquired: "03/01/2020",
  howAcquired: "Purchase",
  costBasis: 900,
  fairMarketValue,
  valuationMethod: "Thrift shop value",
  ...overrides,
});

const giftRow = (slug: string, value: NoncashGiftFactValue) => ({
  key: makeNoncashGiftFactKey(slug),
  value,
  category: "charitable",
});

const inputs = (
  facts: Array<{ key: string; value: unknown; category: string }>,
  decisions: Array<{ decisionKey: string; decision: unknown }> = [],
) => makeResolverInputs({ facts, decisions });

const mustFile = (facts: Array<{ key: string; value: unknown; category: string }>) =>
  resolve8283Info(inputs(facts)).mustFile?.["form-8283"]?.value;

describe("Form 8283 must-file", () => {
  it("one gift of exactly $500 does not file; $501 files", () => {
    expect(mustFile([giftRow("a", gift(500))])).toBe(false);
    expect(mustFile([giftRow("a", gift(501))])).toBe(true);
  });

  it("the form's header counts the total: two unlike gifts of $300 file", () => {
    expect(
      mustFile([giftRow("a", gift(300)), giftRow("b", gift(300, { propertyType: "art" }))]),
    ).toBe(true);
  });

  it("the deduction counts, not the FMV: stock held 5 months, FMV $600, basis $450, does not file", () => {
    const stock = gift(600, {
      propertyType: "publicly_traded_security",
      dateAcquired: "01/15/2025",
      costBasis: 450,
    });
    expect(mustFile([giftRow("a", stock)])).toBe(false);
  });

  it("a single total over $500 with no gift facts does not file", () => {
    expect(mustFile([{ key: "charitable.noncash", value: 5000, category: "charitable" }])).toBe(
      false,
    );
  });

  it("decisions.scope.must_file_8283 overrides", () => {
    const info = resolve8283Info(
      inputs(
        [giftRow("a", gift(900))],
        [{ decisionKey: "decisions.scope.must_file_8283", decision: false }],
      ),
    );
    expect(info.mustFile?.["form-8283"]?.value).toBe(false);
  });

  it("lists a gift whose required column is missing, so Cade asks for it", () => {
    const info = resolve8283Info(
      inputs([giftRow("a", gift(900, { howAcquired: undefined })), giftRow("b", gift(800))]),
    );
    expect(info.missingInputs?.["form-8283"]).toEqual([makeNoncashGiftFactKey("a")]);
  });
});

describe("Schedule A line 12 and the single total", () => {
  const total = { key: "charitable.noncash", value: 5000, category: "charitable" };

  it("with gift facts, the line is their total and the single total is not read", () => {
    const info = resolveScheduleAInfo(
      inputs([total, giftRow("a", gift(650)), giftRow("b", gift(350))]),
    );
    expect(info.giftsOtherThanCash).toBe(1000);
  });

  it("with no gift facts, the line is the single total", () => {
    expect(resolveScheduleAInfo(inputs([total])).giftsOtherThanCash).toBe(5000);
  });

  it("with gift facts, Schedule A does not ask for the single total", () => {
    const info = resolveScheduleAInfo(
      inputs(
        [giftRow("a", gift(650))],
        [{ decisionKey: "decisions.itemize_vs_standard", decision: "itemized" }],
      ),
    );
    const asked = info.missingInputs?.["schedule-a"] ?? [];
    expect(asked).not.toContain("charitable.noncash");
    expect(asked).not.toContain(makeNoncashGiftFactKey("a"));
  });

  it("asks for a gift whose deduction waits", () => {
    const waiting = gift(3000, {
      propertyType: "vehicle",
      vehicle: { acknowledgmentAttached: true, fmvException: false },
    });
    const info = resolveScheduleAInfo(
      inputs(
        [giftRow("car", waiting)],
        [{ decisionKey: "decisions.itemize_vs_standard", decision: "itemized" }],
      ),
    );
    expect(info.giftsOtherThanCash).toBeUndefined();
    expect(info.missingInputs?.["schedule-a"]).toContain(makeNoncashGiftFactKey("car"));
  });
});

/*
 * The must-file and slot rules that read business facts (Schedule C, SE, 1, 2
 * and Form 8995-A), by filing status, owner and the shape of the business.
 */
import { describe, expect, it } from "vitest";
import { makeBusinessFactKey, makePaymentTransactionsFactKey } from "../../../src/facts/index.js";
import { resolve8995AInfo } from "../../../src/federal/8995-a/resolveInfo.js";
import { resolveScheduleCInfo } from "../../../src/federal/schedule-c/resolveInfo.js";
import { resolveScheduleSEInfo } from "../../../src/federal/schedule-se/resolveInfo.js";
import { resolveSchedule1Info, resolveSchedule2Info } from "../../../src/filingInfoResolvers.js";
import { makeResolverInputs } from "../../../src/resolverInputs.js";

type Fact = { key: string; category: string; value: unknown };

/* A service business with line G "Yes"; its net profit is grossReceipts less expenses. */
const business = (id: string, value: Record<string, unknown> = {}): Fact => ({
  key: makeBusinessFactKey(id),
  category: "self_employment",
  value: {
    activity: id,
    grossReceipts: 10000,
    sellsGoods: false,
    materiallyParticipated: true,
    ...value,
  },
});

/* A 1099-K for the business businessId names, or for none. */
const form1099K = (formId: string, businessId?: string): Fact => ({
  key: makePaymentTransactionsFactKey("tin-00-0000006", formId),
  category: "self_employment",
  value: { filerName: "Platform", box1a: 10000, businessId },
});

const inputs = (facts: Fact[], status?: string, scheduleC?: boolean) =>
  makeResolverInputs({
    facts,
    decisions: [
      ...(status ? [{ decisionKey: "decisions.scope.filing_status", decision: status }] : []),
      ...(scheduleC === undefined
        ? []
        : [{ decisionKey: "decisions.scope.must_file_schedule_c", decision: scheduleC }]),
    ],
  });

const spouseBusiness = business("tutoring", { owner: "spouse" });
const malformed = business("bakery", { grossReceipts: "a lot" });

describe("Schedule C must-file", () => {
  const mustFile = (facts: Fact[], status?: string) =>
    resolveScheduleCInfo(inputs(facts, status)).mustFile?.["schedule-c"]?.value;

  it.each([
    ["no business", [], "single", false],
    ["one business", [business("rideshare")], "single", true],
    ["a business fact that cannot be read", [malformed], "single", undefined],
    [
      "a spouse's business, filing separately",
      [spouseBusiness],
      "married_filing_separately",
      false,
    ],
    ["a spouse's business, filing jointly", [spouseBusiness], "married_filing_jointly", true],
    ["a spouse's business, status unknown", [spouseBusiness], undefined, true],
  ])("%s", (_, facts, status, expected) => {
    expect(mustFile(facts, status)).toBe(expected);
  });
});

describe("Schedule C and a 1099-K", () => {
  const resolve = (facts: Fact[], scheduleC?: boolean) =>
    resolveScheduleCInfo(inputs(facts, "single", scheduleC));
  const linked = form1099K("a", "rideshare");
  const unlinked = form1099K("b");
  const unknownBusiness = form1099K("c", "bakery");

  it.each([
    ["linked to a business", [business("rideshare"), linked], undefined, true, []],
    ["no business named, no business", [unlinked], undefined, undefined, [unlinked.key]],
    ["a business that has no fact", [unknownBusiness], undefined, undefined, [unknownBusiness.key]],
    [
      "no business named, beside a business",
      [business("rideshare"), unlinked],
      undefined,
      true,
      [unlinked.key],
    ],
    ["no business named, Schedule C decided false", [unlinked], false, false, []],
    ["no business named, Schedule C decided true", [unlinked], true, true, [unlinked.key]],
  ])("%s", (_, facts, scheduleC, mustFile, missing) => {
    const info = resolve(facts, scheduleC);
    expect(info.mustFile?.["schedule-c"]?.value).toBe(mustFile);
    expect(info.missingInputs?.["schedule-c"]).toEqual(missing);
  });
});

describe("Schedule SE must-file", () => {
  const mustFile = (facts: Fact[], status?: string) =>
    resolveScheduleSEInfo(inputs(facts, status)).mustFile?.["schedule-se"]?.value;

  it.each([
    ["net earnings of $400 or more", [business("rideshare")], "single", true],
    // 92.35% of $433 is $400; 92.35% of $432 is $399.
    [
      "net earnings of exactly $400",
      [business("rideshare", { grossReceipts: 433 })],
      "single",
      true,
    ],
    ["net earnings under $400", [business("rideshare", { grossReceipts: 432 })], "single", false],
    [
      "a loss only (line 31 blank)",
      [business("rideshare", { grossReceipts: 0, expenses: { supplies: 500 } })],
      "single",
      false,
    ],
    [
      "line G unanswered",
      [business("rideshare", { materiallyParticipated: undefined })],
      "single",
      undefined,
    ],
    ["a business fact that cannot be read", [malformed], "single", undefined],
    [
      "a spouse's business, filing jointly",
      [business("rideshare"), spouseBusiness],
      "married_filing_jointly",
      undefined,
    ],
    [
      "a spouse's business, filing separately",
      [business("rideshare"), spouseBusiness],
      "married_filing_separately",
      true,
    ],
  ])("%s", (_, facts, status, expected) => {
    expect(mustFile(facts, status)).toBe(expected);
  });
});

describe("Schedule 2 must-file", () => {
  const mustFile = (facts: Fact[], status?: string) =>
    resolveSchedule2Info(inputs(facts, status)).mustFile?.["schedule-2"]?.value;

  it("files with Schedule SE", () => {
    expect(mustFile([business("rideshare")], "single")).toBe(true);
  });

  it("waits while Schedule SE is undecided", () => {
    expect(mustFile([business("rideshare", { materiallyParticipated: undefined })], "single")).toBe(
      undefined,
    );
  });

  it("does not file with no business and no other tax", () => {
    expect(mustFile([], "single")).toBe(false);
  });
});

describe("Schedule 1 line 3 (businessIncome)", () => {
  const line3 = (facts: Fact[], status?: string) =>
    resolveSchedule1Info(inputs(facts, status)).businessIncome;

  it.each([
    ["one business", [business("rideshare")], "single", 10000],
    [
      "two businesses on a joint return",
      [business("rideshare"), business("tutoring", { owner: "spouse", grossReceipts: 2500 })],
      "married_filing_jointly",
      12500,
    ],
    [
      "a loss (line 31 waits for the at-risk rules)",
      [business("rideshare", { grossReceipts: 0, expenses: { supplies: 500 } })],
      "single",
      undefined,
    ],
    [
      'line G "No"',
      [business("rideshare", { materiallyParticipated: false })],
      "single",
      undefined,
    ],
    [
      "a spouse's business, filing separately (community property is not modeled)",
      [business("rideshare"), spouseBusiness],
      "married_filing_separately",
      undefined,
    ],
    [
      "a business fact that cannot be read",
      [business("rideshare"), malformed],
      "single",
      undefined,
    ],
    ["no business", [], "single", undefined],
  ])("%s", (_, facts, status, expected) => {
    expect(line3(facts, status)).toBe(expected);
  });
});

describe("Form 8995-A must-file and businesses", () => {
  it("files for any business", () => {
    const info = resolve8995AInfo(inputs([business("rideshare")], "single"));
    expect(info.mustFile?.["form-8995-a"]?.value).toBe(true);
  });

  it("does not file with no business and no REIT dividends", () => {
    expect(resolve8995AInfo(inputs([], "single")).mustFile?.["form-8995-a"]?.value).toBe(false);
  });

  it("leaves a spouse's business off a separate return", () => {
    const info = resolve8995AInfo(
      inputs([business("rideshare"), spouseBusiness], "married_filing_separately"),
    );
    expect(info.qbiBusinesses?.map((qbi) => qbi.name)).toEqual(["rideshare"]);
  });
});

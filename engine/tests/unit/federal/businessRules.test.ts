/*
 * The must-file and slot rules that read business facts (Schedule C, SE, 1, 2
 * and Form 8995-A), by filing status, owner and the shape of the business.
 */
import { describe, expect, it } from "vitest";
import {
  makeBusinessFactKey,
  makeNonemployeeCompensationFactKey,
  makePaymentTransactionsFactKey,
  makeW2FactKey,
} from "../../../src/facts/index.js";
import { resolve8995AInfo } from "../../../src/federal/8995-a/resolveInfo.js";
import { resolve8995Info } from "../../../src/federal/8995/resolveInfo.js";
import { resolveQbiInfo } from "../../../src/federal/qbi/resolveInfo.js";
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
    ["no business named, Schedule C decided false", [unlinked], false, false, [unlinked.key]],
    ["no business named, Schedule C decided true", [unlinked], true, true, [unlinked.key]],
  ])("%s", (_, facts, scheduleC, mustFile, missing) => {
    const info = resolve(facts, scheduleC);
    expect(info.mustFile?.["schedule-c"]?.value).toBe(mustFile);
    expect(info.missingInputs?.["schedule-c"]).toEqual(missing);
  });
});

describe("Schedule C and a 1099-NEC", () => {
  const form1099Nec = (formId: string, businessId?: string): Fact => ({
    key: makeNonemployeeCompensationFactKey("tin-12-3456789", formId),
    category: "self_employment",
    value: { payerName: "Client", box1: 3882, businessId },
  });
  const linked = form1099Nec("a", "consulting");
  const unlinked = form1099Nec("b");

  it.each([
    ["linked to a business", [business("consulting"), linked], true, []],
    ["no business named, no business", [unlinked], undefined, [unlinked.key]],
    [
      "no business named, beside a business",
      [business("consulting"), unlinked],
      true,
      [unlinked.key],
    ],
  ])("%s", (_, facts, mustFile, missing) => {
    const info = resolveScheduleCInfo(inputs(facts, "single"));
    expect(info.mustFile?.["schedule-c"]?.value).toBe(mustFile);
    expect(info.missingInputs?.["schedule-c"]).toEqual(missing);
  });
});

describe("a 1099-K that names no business, with no business", () => {
  const facts = [form1099K("b")];

  it("leaves Schedule SE open", () => {
    expect(resolveScheduleSEInfo(inputs(facts, "single")).mustFile?.["schedule-se"]?.value).toBe(
      undefined,
    );
  });

  it("leaves Schedule 2 open", () => {
    expect(resolveSchedule2Info(inputs(facts, "single")).mustFile?.["schedule-2"]?.value).toBe(
      undefined,
    );
  });

  it("leaves Form 8995-A open", () => {
    expect(resolve8995AInfo(inputs(facts, "single")).mustFile?.["form-8995-a"]?.value).toBe(
      undefined,
    );
  });

  it("closes Schedule SE after a no-Schedule-C decision", () => {
    expect(
      resolveScheduleSEInfo(inputs(facts, "single", false)).mustFile?.["schedule-se"]?.value,
    ).toBe(false);
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
  it("files Form 8995, not 8995-A, for a business under the threshold", () => {
    const facts = [business("rideshare")];
    expect(resolve8995AInfo(inputs(facts, "single")).mustFile?.["form-8995-a"]?.value).toBe(false);
    expect(resolve8995Info(inputs(facts, "single")).mustFile?.["form-8995"]?.value).toBe(true);
  });

  it("files Form 8995-A when MAGI's upper bound is above the threshold", () => {
    const facts = [business("rideshare", { grossReceipts: 250000 })];
    expect(resolve8995AInfo(inputs(facts, "single")).mustFile?.["form-8995-a"]?.value).toBe(true);
    expect(resolve8995Info(inputs(facts, "single")).mustFile?.["form-8995"]?.value).toBe(false);
  });

  it("tests the married filing jointly threshold on a joint return", () => {
    const facts = [business("rideshare", { grossReceipts: 250000 })];
    const joint = inputs(facts, "married_filing_jointly");
    expect(resolve8995Info(joint).mustFile?.["form-8995"]?.value).toBe(true);
  });

  it("files Form 8995-A when it is decided, and then not Form 8995", () => {
    const decided = makeResolverInputs({
      facts: [business("rideshare")],
      decisions: [
        { decisionKey: "decisions.scope.filing_status", decision: "single" },
        { decisionKey: "decisions.scope.must_file_8995_a", decision: true },
      ],
    });
    expect(resolve8995AInfo(decided).mustFile?.["form-8995-a"]?.value).toBe(true);
    expect(resolve8995Info(decided).mustFile?.["form-8995"]?.value).toBe(false);
  });

  it("does not file with no business and no REIT dividends", () => {
    expect(resolve8995AInfo(inputs([], "single")).mustFile?.["form-8995-a"]?.value).toBe(false);
  });

  it("leaves a spouse's business off a separate return", () => {
    const info = resolveQbiInfo(
      inputs([business("rideshare"), spouseBusiness], "married_filing_separately"),
    );
    expect(info.qbiBusinesses?.map((qbi) => qbi.name)).toEqual(["rideshare"]);
  });
});

describe("Schedule SE line 8a (the taxpayer's W-2 wages on a joint return)", () => {
  const w2 = (slug: string, value: Record<string, unknown>): Fact => ({
    key: makeW2FactKey(slug),
    category: "wages",
    value: {
      employerName: slug,
      employerEin: "00-0000001",
      box1: 50000,
      box2: 0,
      box3: 50000,
      ...value,
    },
  });
  const taxpayerSsn: Fact = { key: "identity.ssn", category: "identity", value: "400-00-0001" };
  const line8a = (facts: Fact[]) =>
    resolveScheduleSEInfo(
      inputs([business("rideshare"), taxpayerSsn, ...facts], "married_filing_jointly"),
    ).w2SocialSecurityWagesAndTips;

  it.each([
    [
      "placed by the employee SSN",
      [
        w2("a", { employee: { ssn: "400-00-0001" } }),
        w2("b", { employee: { ssn: "400-00-0002" }, box3: 7000 }),
      ],
      50000,
    ],
    [
      "placed by the owner when both W-2s print the taxpayer's SSN",
      [
        w2("a", { owner: "taxpayer", employee: { ssn: "400-00-0001" } }),
        w2("b", { owner: "spouse", employee: { ssn: "400-00-0001" }, box3: 7000 }),
      ],
      50000,
    ],
    [
      "waits for a W-2 with no owner and no SSN",
      [w2("a", { employee: { ssn: "400-00-0001" } }), w2("b", { box3: 7000 })],
      undefined,
    ],
  ])("%s", (_, facts, expected) => {
    expect(line8a(facts)).toBe(expected);
  });
});

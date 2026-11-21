/*
 * Sources: irs-5329-inst-2025::sec::who-must-file::b01–b03 (when the form files,
 * and the Schedule 2 path for code 1), irs-1040-inst-2025::sec::line-8::b01–b02,
 * irs-pub-575-2025::sec::tax-on-early-distributions::b06–b07 (codes 2, 3, 4; exception 12).
 */

import { describe, expect, it } from "vitest";
import {
  SPOUSE_KEYS,
  makeEarlyDistributionExceptionKey,
  makeRetirementDistributionFactKey,
  makeRothIraFactKey,
  makeTraditionalIraFactKey,
  type RetirementDistributionFactValue,
} from "../../../../src/facts/index.js";
import { line1, line2, line2ExceptionNumber, line4 } from "../../../../src/federal/5329/lines.js";
import { ROTH_IRA_GAP } from "../../../../src/federal/5329/partI.js";
import {
  resolve5329Info,
  scheduleTwoNeededForEarlyDistributions,
} from "../../../../src/federal/5329/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

type Fact = { key: string; category: string; value: unknown };

const distribution = (
  id: string,
  box7: string,
  amount: number,
  extra: Partial<RetirementDistributionFactValue> = {},
): Fact => ({
  key: makeRetirementDistributionFactKey("payer", id),
  category: "retirement",
  value: {
    payerName: "Payer",
    box1: amount,
    box2a: amount,
    box7,
    box7IraSepSimple: false,
    ...extra,
  },
});
const exception = (id: string, number: string, amount: number): Fact => ({
  key: makeEarlyDistributionExceptionKey("payer", id),
  category: "retirement",
  value: { number, amount },
});
const dob = (value: string, key = "identity.dob"): Fact => ({ key, category: "identity", value });

function resolve(facts: Fact[], decisions: Array<{ decisionKey: string; decision: unknown }> = []) {
  const inputs = makeResolverInputs({ facts, decisions });
  const info = resolve5329Info(inputs);
  const person = info.earlyDistributionPeople?.[0];
  return {
    info,
    files: info.mustFile?.["form-5329"]?.value,
    withoutForm: info.earlyDistributionTaxWithoutForm,
    person,
    schedule2: scheduleTwoNeededForEarlyDistributions(inputs),
  };
}

describe("Form 5329 Part I: which distributions count", () => {
  it.each([
    ["code 7 (normal)", "7"],
    ["code 2 (exception known)", "2"],
    ["code 3 (disability)", "3"],
    ["code G (direct rollover)", "G"],
  ])("puts nothing on line 1 for %s", (_, box7) => {
    const result = resolve([distribution("a", box7, 5000), dob("01/01/1990")]);
    expect(result.info.earlyDistributionPeople).toEqual([]);
    expect(result.files).toBe(false);
    expect(result.withoutForm).toBe(false);
    expect(result.schedule2).toBe(false);
  });

  it("leaves a fully rolled-over IRA distribution off line 1 (::who-must-file::b03)", () => {
    const rolledOver: Fact = {
      key: makeTraditionalIraFactKey("taxpayer"),
      category: "retirement",
      value: { rolledOver: 7000 },
    };
    const ira = distribution("ira", "1", 7000, { box7IraSepSimple: true });
    expect(resolve([ira, rolledOver, dob("01/01/1990")]).info.earlyDistributionPeople).toEqual([]);
  });

  it("counts the taxable amount (box 2a), not the gross", () => {
    const pension = distribution("pension", "1", 18773, { box2a: 11207 });
    expect(line1(resolve([pension, dob("01/01/1990")]).person!.rows)).toBe(11207);
  });
});

describe("Form 5329 Part I: the form or Schedule 2 directly", () => {
  it("code 1 with no exception: no form, the 10% goes on Schedule 2 with the box checked", () => {
    const result = resolve([distribution("a", "1", 3000), dob("01/01/1990")]);
    expect(result.files).toBe(false);
    expect(result.withoutForm).toBe(true);
    expect(result.schedule2).toBe(true);
    expect(line4(result.person!.rows)).toBe(300);
  });

  it("files the form for a stated exception", () => {
    const result = resolve([
      distribution("a", "1", 3000),
      exception("a", "05", 1200),
      dob("01/01/1990"),
    ]);
    expect(result.files).toBe(true);
    expect(result.withoutForm).toBe(false);
    expect([line2(result.person!.rows), line2ExceptionNumber(result.person!.rows)]).toEqual([
      1200,
      "05",
    ]);
  });

  it("files the form for a SIMPLE IRA in its first 2 years (code S, 25%)", () => {
    const result = resolve([
      distribution("s", "S", 4000, { box7IraSepSimple: true }),
      dob("01/01/1990"),
    ]);
    expect(result.files).toBe(true);
    expect(line4(result.person!.rows)).toBe(1000);
  });

  // irs-pub-575-2025::sec::tax-on-early-distributions::b06–b07: code 1 shown at 59½ or older.
  it("enters exception 12 for a code 1 distribution of a person 59½ or older all year", () => {
    const result = resolve([distribution("a", "1", 3000), dob("03/15/1960")]);
    expect(result.files).toBe(true);
    expect(line2ExceptionNumber(result.person!.rows)).toBe("12");
    expect(line4(result.person!.rows)).toBe(0);
    expect(result.schedule2).toBe(false);
  });

  it("trusts code 1 in the year the person reaches 59½", () => {
    const result = resolve([distribution("a", "1", 3000), dob("01/15/1966")]);
    expect(result.withoutForm).toBe(true);
  });

  it("files the form when the decision says so (Tom Jones files one)", () => {
    const result = resolve(
      [distribution("a", "1", 3000), dob("01/01/1990")],
      [{ decisionKey: "decisions.scope.must_file_5329", decision: true }],
    );
    expect(result.files).toBe(true);
    expect(result.withoutForm).toBe(false);
    expect(result.info.form5329Filers).toHaveLength(1);
  });
});

describe("Form 5329 Part I: answers and gaps", () => {
  // ::exceptions-to-the-additional-tax-on-early::b01: exception 01 "doesn't apply to IRAs".
  it("asks again for an exception that does not apply to an IRA", () => {
    const result = resolve([
      distribution("ira", "1", 3000, { box7IraSepSimple: true }),
      exception("ira", "01", 3000),
      dob("01/01/1990"),
    ]);
    expect(result.info.missingInputs?.["form-5329"]).toEqual([
      makeEarlyDistributionExceptionKey("payer", "ira"),
    ]);
    expect(result.person!.pending).toBe(true);
    expect(result.schedule2).toBeUndefined();
  });

  const roth = (box1: number) => distribution("roth", "J", box1);
  const rothAnswers = (contributionBasis: number): Fact => ({
    key: makeRothIraFactKey("taxpayer"),
    category: "retirement",
    value: { contributionBasis, conversionAndRolloverBasis: 1750 },
  });

  it("puts nothing on line 1 for a Roth IRA distribution within the contribution basis", () => {
    const result = resolve([roth(4001), rothAnswers(5000), dob("01/01/1982")]);
    expect(result.info.earlyDistributionPeople).toEqual([]);
  });

  it("does not figure a Roth IRA distribution past the contribution basis", () => {
    const result = resolve([roth(9000), rothAnswers(5000), dob("01/01/1982")]);
    expect(result.person!.gap).toBe(ROTH_IRA_GAP);
    expect(result.files).toBe(true);
  });

  it("waits for the Roth IRA answers, and leaves the form undecided", () => {
    const result = resolve([roth(4001), dob("01/01/1982")]);
    expect(result.person!.pending).toBe(true);
    expect(result.files).toBeUndefined();
  });

  it("does not figure a designated Roth recapture (code 1B with box 10)", () => {
    const result = resolve([distribution("b", "1B", 35000, { box2a: 3500, box10: 31500 })]);
    expect(result.person!.gap).toContain("in-plan Roth rollover");
  });
});

describe("Form 5329 Part I: one form per person", () => {
  const spouseRow = distribution("sp", "1", 2000, { owner: "spouse" });

  it("keeps each spouse's distributions apart", () => {
    const result = resolve([
      distribution("tp", "1", 3000),
      spouseRow,
      dob("01/01/1990"),
      dob("01/01/1991", SPOUSE_KEYS.dob),
    ]);
    expect(result.info.earlyDistributionPeople?.map((each) => each.owner)).toEqual([
      "taxpayer",
      "spouse",
    ]);
    expect(result.withoutForm).toBe(true);
  });

  it("files a form for each spouse when one of them needs it", () => {
    const result = resolve([
      distribution("tp", "1", 3000),
      exception("tp", "05", 500),
      spouseRow,
      dob("01/01/1990"),
      dob("01/01/1991", SPOUSE_KEYS.dob),
    ]);
    expect(result.files).toBe(true);
    expect(result.info.form5329Filers?.map((each) => each.owner)).toEqual(["taxpayer", "spouse"]);
  });
});

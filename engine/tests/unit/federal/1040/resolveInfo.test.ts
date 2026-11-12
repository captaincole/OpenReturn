import { describe, expect, it } from "vitest";
import {
  SPOUSE_KEYS,
  makeGamblingWinningsFactKey,
  makeNonemployeeCompensationFactKey,
  makePaymentTransactionsFactKey,
  type GamblingWinningsFactValue,
  type RetirementDistributionFactValue,
} from "../../../../src/facts/index.js";
import {
  resolve1040Info,
  rowTaxable,
  traditionalTaxable,
} from "../../../../src/federal/1040/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const distribution = (
  change: Partial<RetirementDistributionFactValue>,
): RetirementDistributionFactValue => ({
  payerName: "Test Payer",
  box1: 35800,
  box7: "7",
  box7IraSepSimple: false,
  ...change,
});

describe("rowTaxable", () => {
  it.each([
    ["box 2a given", distribution({ box2a: 12000 }), 12000],
    ["no box 2a: box 1", distribution({}), 35800],
    [
      "box 2b taxable amount not determined",
      distribution({ box2b: { taxableAmountNotDetermined: true } }),
      undefined,
    ],
    ["Roth code Q: not taxable", distribution({ box7: "Q", box2a: 35800 }), 0],
    ["Roth code J: Form 8606 not modeled", distribution({ box7: "J", box2a: 35800 }), undefined],
    ["Roth code T: Form 8606 not modeled", distribution({ box7: "T" }), undefined],
    ["code Y: charitable distribution not modeled", distribution({ box7: "7Y" }), undefined],
  ] as Array<[string, RetirementDistributionFactValue, number | undefined]>)(
    "%s",
    (_, row, expected) => {
      expect(rowTaxable(row)).toBe(expected);
    },
  );
});

describe("traditionalTaxable", () => {
  const ira = (change: Partial<RetirementDistributionFactValue>) =>
    distribution({ box7IraSepSimple: true, ...change });
  const direct = ira({ box1: 20000, box2a: 0, box7: "G" });
  const normal = ira({ box1: 10000, box2a: 10000, box7: "7" });

  it("does not take a direct rollover off twice", () => {
    expect(traditionalTaxable([direct, normal], 20000)).toBe(10000);
  });
  it("takes an indirect rollover off the other rows", () => {
    expect(traditionalTaxable([direct, normal], 24000)).toBe(6000);
  });
  it("does not go below zero", () => {
    expect(traditionalTaxable([normal], 15000)).toBe(0);
  });
  it("is undefined when a row's taxable amount is not determined", () => {
    const unknown = ira({ box2b: { taxableAmountNotDetermined: true } });
    expect(traditionalTaxable([direct, unknown], 20000)).toBeUndefined();
  });
});

describe("line 25c W-2G slot", () => {
  const w2g = (winId: string, change: Partial<GamblingWinningsFactValue>) => ({
    key: makeGamblingWinningsFactKey("casino", winId),
    category: "other",
    value: { payerName: "Casino", box1: 5000, ...change },
  });
  const slot = (facts: ReturnType<typeof w2g>[]) =>
    resolve1040Info(makeResolverInputs({ facts, decisions: [] })).w2gFederalWithholding;

  it("sums box 4 and keeps cents", () => {
    expect(slot([w2g("a", { box4: 1200.4 }), w2g("b", { box4: 300.3 })])).toBeCloseTo(1500.7);
  });

  it("is blank when no W-2G has box 4", () => {
    expect(slot([w2g("a", {})])).toBeUndefined();
    expect(slot([])).toBeUndefined();
  });
});

describe("line 25b 1099-K slot", () => {
  const form1099K = (box4?: number) => ({
    key: makePaymentTransactionsFactKey("tin-00-0000006", "a"),
    category: "self_employment",
    value: { filerName: "Platform", box1a: 20000, box4 },
  });
  const slot = (facts: ReturnType<typeof form1099K>[]) =>
    resolve1040Info(makeResolverInputs({ facts, decisions: [] })).form1099FederalWithholding;

  it("adds 1099-K box 4", () => {
    expect(slot([form1099K(4800.25)])).toBeCloseTo(4800.25);
  });

  it("is blank when the 1099-K has no box 4", () => {
    expect(slot([form1099K()])).toBeUndefined();
  });
});

describe("line 25b 1099-NEC slot", () => {
  const form1099Nec = (box4?: number) => ({
    key: makeNonemployeeCompensationFactKey("tin-12-3456789", "a"),
    category: "self_employment",
    value: { payerName: "Client", box1: 3882, box4 },
  });
  const slot = (facts: ReturnType<typeof form1099Nec>[]) =>
    resolve1040Info(makeResolverInputs({ facts, decisions: [] })).form1099FederalWithholding;

  it("adds 1099-NEC box 4", () => {
    expect(slot([form1099Nec(388.2)])).toBeCloseTo(388.2);
  });

  it("is blank when the 1099-NEC has no box 4", () => {
    expect(slot([form1099Nec()])).toBeUndefined();
  });
});

describe("the lived-apart answers a separate return asks", () => {
  const fact = (key: string, value: boolean) => ({ key, category: "filing_status", value });
  const pending = (status: string, facts: ReturnType<typeof fact>[]) =>
    resolve1040Info(
      makeResolverInputs({
        facts,
        decisions: [{ decisionKey: "decisions.scope.filing_status", decision: status }],
      }),
    ).missingInputs?.["form-1040"] ?? [];
  const SIX = SPOUSE_KEYS.livedApartLastSixMonths;
  const SEPARATED = SPOUSE_KEYS.legallySeparatedApartAtYearEnd;

  it.each([
    ["MFS with no answer: the six-months answer", "married_filing_separately", [], [SIX]],
    [
      "MFS, apart all year: covers the six months",
      "married_filing_separately",
      [fact(SPOUSE_KEYS.livedApartAllYear, true)],
      [],
    ],
    [
      "MFS, apart the last 6 months: nothing more",
      "married_filing_separately",
      [fact(SIX, true)],
      [],
    ],
    [
      "MFS, not apart the last 6 months: the legal-separation answer",
      "married_filing_separately",
      [fact(SIX, false)],
      [SEPARATED],
    ],
    [
      "MFS, both answered",
      "married_filing_separately",
      [fact(SIX, false), fact(SEPARATED, true)],
      [],
    ],
    ["head of household: neither (most are unmarried)", "head_of_household", [], []],
    ["single: neither", "single", [], []],
  ] as Array<[string, string, ReturnType<typeof fact>[], string[]]>)(
    "%s",
    (_, status, facts, expected) => {
      const asked = pending(status, facts).filter((key) => key === SIX || key === SEPARATED);
      expect(asked).toEqual(expected);
    },
  );
});

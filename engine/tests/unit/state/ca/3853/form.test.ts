/*
 * FTB 3853 on a whole return: who files, Form 540 lines 92, 96 and 114, what
 * is asked, Part II, and the gaps. The synthetic lelaine scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CA_HEALTH_COVERAGE_KEYS,
  makeCaHealthCoverageDependentKey,
  makeCaHealthCoverageUnclaimedKey,
  makeDependentFactKey,
  makeInterestFactKey,
  makeW2FactKey,
  type CaHealthCoverageFactValue,
  type W2FactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { lelaineScenario as base } from "../../../../scenarios/synthetic/lelaine/index.js";
import { ottilieScenario } from "../../../../scenarios/synthetic/ottilie/index.js";

const FULL_YEAR = "health_coverage.full_year_mec";
const PENALTY = "1.part4.1_shared_responsibility_penalty";
const PART_II = "0.part2.1_income_below_filing_threshold";
const SPOUSE = CA_HEALTH_COVERAGE_KEYS.spouse;
const DAVAN = makeCaHealthCoverageDependentKey("davan-tarvesh");
const SELA = makeCaHealthCoverageUnclaimedKey("sela-tarvesh");
const NURSERY_W2 = makeW2FactKey("delta-bloom");
const FREIGHT_W2 = makeW2FactKey("capitol-freight");
const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const factOf = (key: string) => base.facts.find((fact) => fact.key === key)!;
const valueOf = <T>(key: string) => factOf(key).value as T;

function factsWith(
  replace: Record<string, unknown> = {},
  drop: string[] = [],
  add: TaxFactRow[] = [],
): TaxFactRow[] {
  return [
    ...base.facts
      .filter((fact) => !drop.includes(fact.key))
      .map((fact) => (fact.key in replace ? { ...fact, value: replace[fact.key] } : fact)),
    ...add,
  ];
}

const added = (key: string, value: unknown, category = "health_coverage"): TaxFactRow => ({
  ...factOf(FULL_YEAR),
  id: `f-${key}`,
  category,
  key,
  value,
});

function evaluate(facts: TaxFactRow[] = base.facts, extra: AIDecisionRow[] = [], scenario = base) {
  const result = evaluateScenario({
    filing: { id: "form-3853-test", taxYear: scenario.taxYear },
    facts,
    decisions: [
      ...scenario.decisions.filter(
        (each) => !extra.some((one) => one.decisionKey === each.decisionKey),
      ),
      ...extra,
    ],
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  const gap = (formId: string, id: string) =>
    (field(formId, id) as { unsupported?: boolean } | undefined)?.unsupported === true;
  const pending = () => {
    const { pendingDecisions, pendingFacts } = pendingInputs(result);
    return [...pendingDecisions, ...pendingFacts];
  };
  return { files, value, gap, pending };
}

const ftb = (run: ReturnType<typeof evaluate>, id: string) => run.value("form-3853", id);
const ca540 = (run: ReturnType<typeof evaluate>, id: string) => run.value("form-540", id);

/* Every member covered all year but Davan, uninsured all year. */
const onlyDavanUninsured = (): Record<string, unknown> => ({
  [SPOUSE]: { coveredMonths: ALL_YEAR },
  [makeCaHealthCoverageDependentKey("mira-tarvesh")]: {
    coveredMonths: ALL_YEAR,
    requiredToFile: false,
  },
  [SELA]: {
    ...valueOf<CaHealthCoverageFactValue>(SELA),
    coveredMonths: ALL_YEAR,
    affordabilityTests: [],
  },
});

describe("FTB 3853 who files", () => {
  it("files when the full-year coverage box is not checked", () => {
    expect(evaluate().files("form-3853")).toBe(true);
  });

  it("does not file with full-year coverage", () => {
    expect(evaluate(factsWith({ [FULL_YEAR]: true })).files("form-3853")).toBe(false);
  });

  it("does not file when someone can claim the taxpayer as a dependent", () => {
    const run = evaluate(factsWith({ [CA_HEALTH_COVERAGE_KEYS.claimableAsDependent]: true }));
    expect(run.files("form-3853")).toBe(false);
    expect(ca540(run, "line.92_isr_penalty")).toBeUndefined();
  });

  it("does not file without Form 540; an explicit decision false wins", () => {
    expect(
      evaluate(base.facts, [decision("decisions.scope.must_file_ca_540", false)]).files(
        "form-3853",
      ),
    ).toBe(false);
    expect(
      evaluate(base.facts, [decision("decisions.scope.must_file_3853", false)]).files("form-3853"),
    ).toBe(false);
  });
});

describe("with no FTB 3853, Form 540 is unchanged", () => {
  it("ottilie (full-year coverage): lines 92 and 96 are blank, line 114 is line 100", () => {
    const run = evaluate(ottilieScenario.facts, [], ottilieScenario);
    expect(run.files("form-3853")).toBe(false);
    expect(ca540(run, "line.92_isr_penalty")).toBeUndefined();
    expect(ca540(run, "line.96_isr_penalty_balance")).toBeUndefined();
    expect(ca540(run, "line.114_total_amount_due")).toBe(ca540(run, "line.100_tax_due"));
  });
});

describe("Form 540 receives the penalty", () => {
  it("line 92 is Part IV line 1; line 96 is line 92 less line 93; line 114 adds it", () => {
    const run = evaluate();
    expect(ftb(run, PENALTY)).toBe(1_615);
    expect(ca540(run, "line.92_isr_penalty")).toBe(1_615);
    expect(ca540(run, "line.93_payments_balance")).toBe(1_200);
    expect(ca540(run, "line.95_payments_after_isr_penalty")).toBe(0);
    expect(ca540(run, "line.96_isr_penalty_balance")).toBe(415);
    expect(ca540(run, "line.114_total_amount_due")).toBe(415 + 1_279);
  });

  it("with payments above the penalty, line 96 is blank and line 95 is the rest", () => {
    const nursery = valueOf<W2FactValue>(NURSERY_W2);
    const run = evaluate(factsWith({ [NURSERY_W2]: { ...nursery, box17: 5_000 } }));
    expect(ca540(run, "line.92_isr_penalty")).toBe(1_615);
    expect(ca540(run, "line.95_payments_after_isr_penalty")).toBe(5_200 - 1_615);
    expect(ca540(run, "line.96_isr_penalty_balance")).toBeUndefined();
  });
});

describe("the penalty paths", () => {
  it("Davan alone, X all year and 18 in June: Worksheet A counts him half until July", () => {
    // Line 5: 475 × 6, 950 × 6; Worksheet B: each month 1,520 (Step 4 line 5); bronze 377 × 12.
    const run = evaluate(factsWith(onlyDavanUninsured()));
    expect(ftb(run, PENALTY)).toBe(1_520);
  });

  it("everyone uninsured all year with no one turning 18: Step 2 and the household bronze amount", () => {
    const none: CaHealthCoverageFactValue = { coveredMonths: [], requiredToFile: false };
    const davanDependent = valueOf<object>(makeDependentFactKey("davan-tarvesh"));
    const run = evaluate(
      factsWith(
        {
          [CA_HEALTH_COVERAGE_KEYS.taxpayer]: { coveredMonths: [] },
          [SPOUSE]: { coveredMonths: [] },
          [makeCaHealthCoverageDependentKey("mira-tarvesh")]: none,
          [DAVAN]: none,
          [makeDependentFactKey("davan-tarvesh")]: { ...davanDependent, dob: "06/15/2006" },
        },
        [
          makeDependentFactKey("pell-tarvesh"),
          makeCaHealthCoverageDependentKey("pell-tarvesh"),
          SELA,
        ],
      ),
    );
    // CA AGI 110,400 less the 2-dependent threshold 73,595: 36,805 × 2.5% = 920; flat 3 adults + 1 child → 2,850.
    expect(ftb(run, PENALTY)).toBe(2_850);
    expect(ftb(run, "1.part3.1_full_year_code")).toBe("X");
  });

  it("a household at or under the gross income threshold checks Part II and owes nothing", () => {
    const nursery = valueOf<W2FactValue>(NURSERY_W2);
    const freight = valueOf<W2FactValue>(FREIGHT_W2);
    const low = { box1: 20_000, box3: 20_000, box5: 20_000, box16: 20_000 };
    const run = evaluate(
      factsWith({ [NURSERY_W2]: { ...nursery, ...low }, [FREIGHT_W2]: { ...freight, ...low } }, [
        SELA,
      ]),
    );
    expect(ftb(run, PART_II)).toBe(true);
    expect(ftb(run, PENALTY)).toBeUndefined();
    expect(ftb(run, "1.part3.2_first_code_oct")).toBeUndefined();
    expect(ftb(run, "0.part1.1_first_name")).toBeUndefined();
    expect(ca540(run, "line.92_isr_penalty")).toBeUndefined();
  });

  it("no X in any month: the form files with Part III and no penalty", () => {
    const run = evaluate(
      factsWith({
        ...onlyDavanUninsured(),
        [DAVAN]: {
          coveredMonths: [],
          exemptions: [{ code: "H", months: ALL_YEAR }],
          requiredToFile: false,
        },
      }),
    );
    expect(ftb(run, "1.part3.4_full_year_code")).toBe("H");
    expect(ftb(run, PENALTY)).toBeUndefined();
  });
});

describe("what FTB 3853 asks", () => {
  it("asks each member's coverage, Step 1 question 1 and the salary reduction premiums", () => {
    const run = evaluate(
      factsWith({}, [
        SPOUSE,
        CA_HEALTH_COVERAGE_KEYS.claimableAsDependent,
        CA_HEALTH_COVERAGE_KEYS.salaryReductionPremiums,
      ]),
    );
    expect(run.pending()).toEqual(
      expect.arrayContaining([
        SPOUSE,
        CA_HEALTH_COVERAGE_KEYS.claimableAsDependent,
        CA_HEALTH_COVERAGE_KEYS.salaryReductionPremiums,
      ]),
    );
    expect(ftb(run, PENALTY)).toBeUndefined();
  });

  it("asks the 2024 months for a short gap from January, and the MAGI of a member who files", () => {
    const sela = valueOf<CaHealthCoverageFactValue>(SELA);
    const { magi: _magi, ...noMagi } = sela;
    const run = evaluate(
      factsWith({ [SPOUSE]: { coveredMonths: [3, 4, 5, 6, 7, 8, 9] }, [SELA]: noMagi }),
    );
    expect(run.pending()).toEqual(expect.arrayContaining([SPOUSE, SELA]));
    const answered = evaluate(
      factsWith({
        [SPOUSE]: { coveredMonths: [3, 4, 5, 6, 7, 8, 9], uncoveredMonthsBefore2025: 2 },
      }),
    );
    expect(answered.pending()).not.toContain(SPOUSE);
    // December 2024 + November 2024 + January, February: 4 months, not a short gap.
    expect(ftb(answered, "1.part3.2_first_code_jan")).toBe("X");
  });

  it("asks gross income when the household income holds a member's own MAGI and the wages are low", () => {
    const nursery = valueOf<W2FactValue>(NURSERY_W2);
    const freight = valueOf<W2FactValue>(FREIGHT_W2);
    const low = { box1: 30_000, box3: 30_000, box5: 30_000, box16: 30_000 };
    const facts = factsWith({
      [NURSERY_W2]: { ...nursery, ...low },
      [FREIGHT_W2]: { ...freight, ...low },
    });
    const run = evaluate(facts);
    expect(run.pending()).toContain(CA_HEALTH_COVERAGE_KEYS.grossIncome);
    // 60,000 + Sela's 24,000 = 84,000, over 73,595; gross income 60,000 is under it.
    const answered = evaluate([...facts, added(CA_HEALTH_COVERAGE_KEYS.grossIncome, 60_000)]);
    expect(ftb(answered, PART_II)).toBe(true);
    expect(ftb(answered, PENALTY)).toBeUndefined();
  });
});

describe("the gaps", () => {
  it("tax-exempt interest leaves Part I line 1 and the penalty unsupported, unless the bronze amount caps it", () => {
    const muni = added(
      makeInterestFactKey("muni-fund"),
      { payerName: "Golden Bond Fund", box8: 900 },
      "investment_income",
    );
    const run = evaluate(factsWith(onlyDavanUninsured(), [], [muni]));
    expect(run.gap("form-3853", "0.part1.1_modified_agi")).toBe(true);
    expect(run.gap("form-3853", PENALTY)).toBe(true);
    expect(run.gap("form-540", "line.92_isr_penalty")).toBe(true);

    const nursery = valueOf<W2FactValue>(NURSERY_W2);
    const rich = { box1: 900_000, box3: 900_000, box5: 900_000, box16: 900_000 };
    const capped = evaluate(
      factsWith({ ...onlyDavanUninsured(), [NURSERY_W2]: { ...nursery, ...rich } }, [], [muni]),
    );
    expect(ftb(capped, PENALTY)).toBe(377 * 12);
  });

  it("a married filer filing separately: the penalty is unsupported", () => {
    const run = evaluate(base.facts, [
      decision("decisions.scope.filing_status", "married_filing_separately"),
    ]);
    expect(run.gap("form-3853", PENALTY)).toBe(true);
  });

  it("a fourth ECN goes on a statement: ECN 3 is unsupported", () => {
    const mira = makeCaHealthCoverageDependentKey("mira-tarvesh");
    const value = valueOf<CaHealthCoverageFactValue>(mira);
    const run = evaluate(factsWith({ [mira]: { ...value, ecns: [...value.ecns!, "KH11111"] } }));
    expect(run.gap("form-3853", "0.part1.3_ecn_3")).toBe(true);
    expect(ftb(run, "0.part1.3_ecn_2")).toBe("MP31956");
  });
});

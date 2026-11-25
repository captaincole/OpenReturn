import { bornBeforeJan2Of } from "../../birthDate.js";
import {
  CHILD_UNEARNED_INCOME_KEYS,
  isDividendFactKey,
  isInterestFactKey,
  readParentReturnFact,
  type ParentReturnFactValue,
} from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  resolveMustFile,
  sumInvestmentBox,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form8615Answers, Form8615FilingInfo } from "./filingInfo.js";
import { BASE_AMOUNT } from "./lines.js";

const KEYS = CHILD_UNEARNED_INCOME_KEYS;

/*
 * Who Must File, condition 3, by the date of birth
 * (irs-8615-inst-2025::sec::who-must-file::b01, ::b02): a January 1 birthday
 * counts as the day before, so a child born January 1, 2008 is 18 at the end
 * of 2025, January 1, 2007 is 19, and January 1, 2002 is 24.
 */
export type AgeGroup = "under_18" | "age_18" | "age_19_to_23" | "age_24_or_older";

/* California's FTB 3800 reads the same groups and answers (state/ca/3800-ca/resolveInfo.ts). */
export function ageGroup(dob: string | undefined): AgeGroup | undefined {
  const born2007OrEarlier = bornBeforeJan2Of(dob, 2008);
  if (born2007OrEarlier === undefined) return undefined;
  if (!born2007OrEarlier) return "under_18";
  if (!bornBeforeJan2Of(dob, 2007)) return "age_18";
  return bornBeforeJan2Of(dob, 2002) ? "age_24_or_older" : "age_19_to_23";
}

export const answer = (inputs: ResolverInputs, key: string) => {
  const value = inputs.factByKey.get(key);
  return typeof value === "boolean" ? value : undefined;
};

/*
 * Condition 3 for the group: true, false, or undefined while an answer is
 * missing. An 18-year-old's earned income must not be more than half of the
 * child's support; a 19-to-23-year-old must also be a full-time student.
 */
export function meetsAgeCondition(inputs: ResolverInputs, group: AgeGroup | undefined) {
  if (group === "under_18") return true;
  if (group === undefined || group === "age_24_or_older") return false;
  const overHalf = answer(inputs, KEYS.earnedIncomeOverHalfOfSupport);
  const student = group === "age_19_to_23" ? answer(inputs, KEYS.fullTimeStudent) : true;
  if (overHalf === true || student === false) return false;
  return overHalf === false && student === true ? true : undefined;
}

/*
 * The least unearned income the documents show: taxable interest (1099-INT
 * boxes 1 and 3), ordinary dividends and capital gain distributions (1099-DIV
 * boxes 1a and 2a), each total rounded. A sale (saleGainFromDocuments) or
 * another income can raise it (QUESTIONS.md item 1).
 */
function unearnedIncomeFromDocuments(inputs: ResolverInputs): number {
  return sum(
    roundDollars(
      sum(
        sumInvestmentBox(inputs, "box1", isInterestFactKey),
        sumInvestmentBox(inputs, "box3", isInterestFactKey),
      ),
    ),
    roundDollars(sumInvestmentBox(inputs, "box1a", isDividendFactKey)),
    roundDollars(sumInvestmentBox(inputs, "box2a", isDividendFactKey)),
  );
}

/*
 * The net gain the 1099-B sales show, 0 for a net loss: each sale's proceeds
 * less its basis plus its column (g) adjustment. A sale with no basis, or in a
 * currency with no rate, is left out. Unearned income "includes ... capital
 * gains" (::unearned-income::b01; FTB 3800 line 1 too,
 * ca-3800-inst-2025::sec::part-i-child-s-net-unearned-income::b01).
 */
export function saleGainFromDocuments(inputs: ResolverInputs): number {
  const gains = inputs.trades.boxed
    .filter((boxed) => boxed.basis !== undefined && !boxed.waitsForRate && !boxed.rateGap)
    .map((boxed) => sum(boxed.trade.proceeds, -sum(boxed.basis), boxed.trade.adjustmentAmount));
  return atLeast(0, roundDollars(sum(...gains)));
}

/*
 * The documents' unearned income turns the form on. Sales count only when the
 * age condition surely holds (a child under 18, or the answers given): an
 * older child with sales is not asked the support and student questions on a
 * sale alone (QUESTIONS.md item 1).
 */
export function documentsShowOverBase(
  interestAndDividends: number,
  saleGain: number,
  ageConditionMet: boolean | undefined,
  base: number,
): boolean {
  if (interestAndDividends > base) return true;
  return ageConditionMet === true && interestAndDividends + saleGain > base;
}

/* The child has dividends or gains that a Line 5 Worksheet splits. */
function hasDividendsOrGains(inputs: ResolverInputs): boolean {
  return (
    sumInvestmentBox(inputs, "box1b", isDividendFactKey) > 0 ||
    sumInvestmentBox(inputs, "box2a", isDividendFactKey) > 0 ||
    inputs.trades.factKeys.length > 0
  );
}

const DEPENDENT_GAP =
  "Someone can claim the child as a dependent, so Form 1040 line 12e needs the Standard Deduction Worksheet for Dependents (irs-1040-inst-2025::sec::line-16::b03), which the engine does not model; line 4 (Form 1040 line 15) and the tax cannot be figured. The rules apply to a dependent child too (irs-8615-inst-2025::sec::who-must-file::b01).";

const SCHEDULE_D_WORKSHEET =
  "has 28% rate gain or unrecaptured section 1250 gain, so the tax is figured on the Schedule D Tax Worksheet (irs-8615-inst-2025::sec::line-9::b01), which the engine does not model.";

/*
 * Line 9 gaps (::line-9::b01, ::line-9::b02, ::worksheet-2-for-line-11-of-the-schedule-d::b02):
 * the Schedule D Tax Worksheet, Schedule J or Form 2555 on the parent's or
 * another child's return.
 */
function line9Gap(parent: ParentReturnFactValue, childSpecialGain: boolean): string | undefined {
  const others = parent.otherChildren ?? [];
  if (childSpecialGain) return `Line 9: the child ${SCHEDULE_D_WORKSHEET}`;
  if (parent.hasRate28OrSection1250Gain) return `Line 9: the parent ${SCHEDULE_D_WORKSHEET}`;
  if (others.some((other) => other.hasRate28OrSection1250Gain === true)) {
    return `Line 9: another child ${SCHEDULE_D_WORKSHEET}`;
  }
  if (parent.electedInvestmentIncome) {
    return "Line 9: the parent's Form 4952 line 4g election puts the tax on the Schedule D Tax Worksheet (::using-the-qualified-dividends-and-capital-gain-tax-worksheet::b03), which the engine does not model.";
  }
  if (parent.usedScheduleJ) {
    return "Line 9: the parent's tax is figured on Schedule J, so line 9 uses another Schedule J (::worksheet-2-for-line-11-of-the-schedule-d::b02), which the engine does not model.";
  }
  if (others.some((other) => other.filesForm2555 === true)) {
    return "Line 9: another child files Form 2555 (::line-9::b02), which the engine does not model.";
  }
  return undefined;
}

/* Line 7 and its parts: the other children's line 5 amounts added; undefined when none. */
function otherChildrenTotals(parent: ParentReturnFactValue): Form8615Answers["otherChildren"] {
  const others = parent.otherChildren ?? [];
  const netUnearnedIncome = sum(...others.map((other) => other.netUnearnedIncome));
  if (netUnearnedIncome <= 0) return undefined;
  return {
    netUnearnedIncome: roundDollars(netUnearnedIncome),
    qualifiedDividends: roundDollars(sum(...others.map((other) => other.qualifiedDividends))),
    netCapitalGain: roundDollars(sum(...others.map((other) => other.netCapitalGain))),
  };
}

/* The answers the form reads, by key: the itemized amounts only for a child who itemizes. */
function requiredAnswers(inputs: ResolverInputs, group: AgeGroup | undefined) {
  const itemizes = inputs.decisionByKey.get("decisions.itemize_vs_standard") === "itemized";
  return {
    [KEYS.parentAlive]: answer(inputs, KEYS.parentAlive),
    [KEYS.claimableAsDependent]: answer(inputs, KEYS.claimableAsDependent),
    [KEYS.parentReturn]: readParentReturnFact(inputs.facts),
    ...(group === "age_18" || group === "age_19_to_23"
      ? { [KEYS.earnedIncomeOverHalfOfSupport]: answer(inputs, KEYS.earnedIncomeOverHalfOfSupport) }
      : {}),
    ...(group === "age_19_to_23"
      ? { [KEYS.fullTimeStudent]: answer(inputs, KEYS.fullTimeStudent) }
      : {}),
    ...(itemizes
      ? { [KEYS.itemizedForUnearnedIncome]: num(inputs, KEYS.itemizedForUnearnedIncome) }
      : {}),
    ...(itemizes && hasDividendsOrGains(inputs)
      ? { [KEYS.itemizedForDividendsAndGains]: num(inputs, KEYS.itemizedForDividendsAndGains) }
      : {}),
  };
}

/* The child's 1099-DIV shows unrecaptured section 1250 gain or 28% (collectibles) gain (boxes 2b, 2d). */
function childSpecialGain(inputs: ResolverInputs): boolean {
  return (
    sumInvestmentBox(inputs, "box2b", isDividendFactKey) > 0 ||
    sumInvestmentBox(inputs, "box2d", isDividendFactKey) > 0
  );
}

/*
 * Who files (irs-8615-inst-2025::sec::who-must-file::b01): the child is under
 * 18 (or 18, or a full-time student under 24, whose earned income was not more
 * than half of their support), a parent was alive at the end of 2025, the child
 * does not file a joint return, and the child had more than $2,700 of unearned
 * income. Resolvers cannot read line 1, so the documents' interest, dividends
 * and capital gain distributions stand in; a parent's return fact Cade recorded
 * files the form too. A missing age answer files the form and asks. The
 * explicit decision still wins. The child's own return is required to file
 * (condition 2): the engine figures that return.
 */
export function resolve8615Info(inputs: ResolverInputs): Form8615FilingInfo {
  const group = ageGroup(text(inputs, "identity.dob"));
  const parent = readParentReturnFact(inputs.facts);
  const unearned = unearnedIncomeFromDocuments(inputs);
  const saleGain = saleGainFromDocuments(inputs);
  const ageMet = meetsAgeCondition(inputs, group);
  const eligible =
    filingStatusOf(inputs) !== "married_filing_jointly" &&
    answer(inputs, KEYS.parentAlive) !== false &&
    ageMet !== false;
  const overBase = documentsShowOverBase(unearned, saleGain, ageMet, BASE_AMOUNT);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8615",
    fallbacks: [
      {
        rule: `fallback: a child (${group ?? "age unknown"}) with $${unearned} of interest and dividends and $${saleGain} of sale gains, or the parent's return recorded`,
        value: eligible && (overBase || parent !== undefined),
        triggeredByFactKeys: [
          "identity.dob",
          ...(parent ? [KEYS.parentReturn] : []),
          ...(saleGain > 0 ? inputs.trades.factKeys : []),
        ],
      },
    ],
  });
  const filed = { mustFile: { "form-8615": resolution } };
  if (resolution.value !== true) return { ...filed, missingInputs: { "form-8615": [] } };
  if (answer(inputs, KEYS.claimableAsDependent) === true) {
    return { ...filed, missingInputs: { "form-8615": [] }, form8615DependentGap: DEPENDENT_GAP };
  }
  const required = requiredAnswers(inputs, group);
  const missing = missingInputs(required);
  if (missing.length > 0 || parent === undefined) {
    return { ...filed, missingInputs: { "form-8615": missing } };
  }
  return {
    ...filed,
    missingInputs: { "form-8615": [] },
    form8615Answers: {
      parent,
      otherChildren: otherChildrenTotals(parent),
      itemizedForUnearnedIncome: num(inputs, KEYS.itemizedForUnearnedIncome) ?? 0,
      itemizedForDividendsAndGains: num(inputs, KEYS.itemizedForDividendsAndGains) ?? 0,
    },
    form8615Line9Gap: line9Gap(parent, childSpecialGain(inputs)),
    form8615ChildTaxGap: childSpecialGain(inputs)
      ? `Lines 15 and 17: the child ${SCHEDULE_D_WORKSHEET}`
      : undefined,
    form8615ParentIncomeGap: parent.filesForm2555
      ? "The parent files Form 2555: lines 6, 9 and 10 use the parent's Foreign Earned Income Tax Worksheet (::line-6::b01, ::line-10::b01), which the engine does not model."
      : undefined,
  };
}

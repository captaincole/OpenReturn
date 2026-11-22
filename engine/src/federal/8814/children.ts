/*
 * One Form 8814 per child with an investment income fact, once the parents
 * elect (decisions.scope.must_file_8814). A child who fails a condition of the
 * election (irs-8814-inst-2025::sec::general-instructions::b01, ::b02) gets no
 * computed form: its lines are unsupported with the condition as the reason.
 *
 * KNOWN GAPS: the election is made for every child with a fact (not one child
 * and not another); the conditions that the parent qualifies and uses the right
 * return (::b03, ::which-parent-s-return-to-use::b01) and that the child files
 * no joint return are the decision's, not checked here; "required to file" is
 * the single dependent's test without blindness (irs-pub-501-2025::sec::residents-of-puerto-rico::b04:
 * unearned income more than $1,350), since no fact says a dependent is blind.
 */

import { bornBeforeJan2Of } from "../../birthDate.js";
import {
  getChildInvestmentIncomeFacts,
  makeDependentFactKey,
  type ChildInvestmentIncomeFact,
  type ChildInvestmentIncomeFactValue,
  type DependentFactValue,
} from "../../facts/index.js";
import { formatDollars, sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { ssnOf } from "../../values.js";
import type { Form8814Child } from "./filingInfo.js";
import {
  FORM_8814_AMOUNTS_2025,
  form8814Lines,
  wholeDollarsOrBlank,
  type Form8814Amounts,
  type Form8814Lines,
} from "./lines.js";

export const MUST_FILE_8814_KEY = "decisions.scope.must_file_8814";

const TAX_YEAR = 2025;
/* "Under age 19 (or under age 24 if a full-time student) at the end of 2025." */
const AGE_LIMIT = 19;
const STUDENT_AGE_LIMIT = 24;

const NOT_ELECTED = "so the parents cannot report it on Form 8814";

export const FORM_8814_GAPS = {
  age24: `The child was 24 or older at the end of 2025, ${NOT_ELECTED}.`,
  age19NotStudent: `The child was 19 or older at the end of 2025 and not a full-time student, ${NOT_ELECTED}.`,
  otherIncome: `The child had income other than interest and dividends, ${NOT_ELECTED}.`,
  estimatedTax: `Estimated tax was paid for 2025 under the child's name, ${NOT_ELECTED}.`,
  withholding: `Federal income tax was withheld from the child's income, ${NOT_ELECTED}.`,
  capitalGainParts:
    "The child's capital gain distributions include unrecaptured section 1250, section 1202 or collectibles (28%) gain, and the engine does not carry that part to the Schedule D worksheets.",
} as const;

const grossIncomeGap = (amounts: Form8814Amounts) =>
  `The child's interest and dividends (line 4) are $${formatDollars(amounts.grossIncomeLimit)} or more, so the child must file a return and Form 8814 is not filed.`;

const notRequiredToFileGap = (amounts: Form8814Amounts) =>
  `The child's interest and dividends (line 4) are $${formatDollars(amounts.amountNotTaxed)} or less, so the child is not required to file and the Form 8814 election is not available.`;

/* A condition's outcome: a gap, the answers it waits for, or neither. */
interface Condition {
  gap?: string;
  missing: string[];
}

const met: Condition = { missing: [] };
const fails = (gap: string): Condition => ({ gap, missing: [] });
const waitsFor = (key: string): Condition => ({ missing: [key] });

/* Age N or older at the end of the tax year: born before January 2 of the year N − 1 years earlier (the January 1 rule, ::b02). */
const reachedAge = (dob: string | undefined, age: number) =>
  bornBeforeJan2Of(dob, TAX_YEAR - age + 1);

function ageCondition(dependentKey: string, dependent: DependentFactValue | undefined): Condition {
  const studentLimitReached = reachedAge(dependent?.dob, STUDENT_AGE_LIMIT);
  if (dependent === undefined || studentLimitReached === undefined) return waitsFor(dependentKey);
  if (studentLimitReached) return fails(FORM_8814_GAPS.age24);
  if (reachedAge(dependent.dob, AGE_LIMIT) !== true) return met;
  if (dependent.fullTimeStudent === undefined) return waitsFor(dependentKey);
  return dependent.fullTimeStudent ? met : fails(FORM_8814_GAPS.age19NotStudent);
}

/* The answers no document gives, and the withholding on the child's Forms 1099. */
function answerConditions(factKey: string, income: ChildInvestmentIncomeFactValue): Condition[] {
  const answer = (value: boolean | undefined, gap: string): Condition =>
    value === undefined ? waitsFor(factKey) : value ? fails(gap) : met;
  return [
    answer(income.hadOtherIncome, FORM_8814_GAPS.otherIncome),
    answer(income.estimatedTaxPaid, FORM_8814_GAPS.estimatedTax),
    (income.federalTaxWithheld ?? 0) > 0 ? fails(FORM_8814_GAPS.withholding) : met,
  ];
}

/* Line 4's limits, and the capital gain distribution parts the engine does not carry. */
function lineConditions(
  lines: Form8814Lines,
  income: ChildInvestmentIncomeFactValue,
  amounts: Form8814Amounts,
): Condition[] {
  const parts = [
    income.unrecapturedSection1250Gain,
    income.section1202Gain,
    income.collectiblesGain,
  ];
  return [
    lines.line4 >= amounts.grossIncomeLimit ? fails(grossIncomeGap(amounts)) : met,
    lines.line4 <= amounts.amountNotTaxed ? fails(notRequiredToFileGap(amounts)) : met,
    parts.some((part) => (part ?? 0) > 0) ? fails(FORM_8814_GAPS.capitalGainParts) : met,
  ];
}

/* Lines 1a–3 from the fact, whole dollars, blank when none. */
export function form8814InputsOf(income: ChildInvestmentIncomeFactValue) {
  return {
    line1a: wholeDollarsOrBlank(income.taxableInterest),
    line1b: wholeDollarsOrBlank(income.taxExemptInterest),
    line2a: wholeDollarsOrBlank(income.ordinaryDividends),
    line2b: wholeDollarsOrBlank(income.qualifiedDividends),
    line3: wholeDollarsOrBlank(income.capitalGainDistributions),
  };
}

function childForm(inputs: ResolverInputs, fact: ChildInvestmentIncomeFact): Form8814Child {
  const dependentKey = makeDependentFactKey(fact.dependentSlug);
  const dependent = inputs.factByKey.get(dependentKey) as DependentFactValue | undefined;
  const lines = form8814Lines(form8814InputsOf(fact.income), FORM_8814_AMOUNTS_2025);
  const conditions = [
    ageCondition(dependentKey, dependent),
    ...answerConditions(fact.factKey, fact.income),
    ...lineConditions(lines, fact.income, FORM_8814_AMOUNTS_2025),
  ];
  const gap = conditions.find((condition) => condition.gap !== undefined)?.gap;
  const missing = [...new Set(conditions.flatMap((condition) => condition.missing))];
  return {
    factKey: fact.factKey,
    name: dependent ? `${dependent.firstName} ${dependent.lastName}` : undefined,
    ssn: ssnOf(dependent?.ssn ?? dependent?.tin),
    lines: gap === undefined && missing.length === 0 ? lines : undefined,
    gap,
    missing: gap === undefined ? missing : [],
    alaskaPermanentFundDividends: fact.income.alaskaPermanentFundDividends,
    privateActivityBondInterest: fact.income.privateActivityBondInterest,
  };
}

/*
 * Each elected child's interest, dividends and capital gain distributions (line
 * 4 before rounding): more than line 6, the part the parents' AGI takes on
 * (lines 9, 10 and 12), so an upper bound on it. 0 before the election.
 */
export function form8814IncomeUpperBound(inputs: ResolverInputs): number {
  if (inputs.decisionByKey.get(MUST_FILE_8814_KEY) !== true) return 0;
  return sum(
    ...getChildInvestmentIncomeFacts(inputs.facts).map(({ income }) =>
      sum(income.taxableInterest, income.ordinaryDividends, income.capitalGainDistributions),
    ),
  );
}

/* Every child's Form 8814 once the parents elect; none before. */
export function form8814Children(inputs: ResolverInputs): Form8814Child[] {
  if (inputs.decisionByKey.get(MUST_FILE_8814_KEY) !== true) return [];
  return getChildInvestmentIncomeFacts(inputs.facts).map((fact) => childForm(inputs, fact));
}

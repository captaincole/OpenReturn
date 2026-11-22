/*
 * One FTB 3803 per child with an investment income fact, once the parents
 * elect (decisions.scope.must_file_3803). A child who fails a condition of the
 * election (ca-3803-inst-2025::sec::a-purpose::b01) gets no computed form: its
 * lines are unsupported with the condition as the reason.
 *
 * KNOWN GAPS (QUESTIONS.md): the election is made for every child with a fact
 * (not one child and not another, ::c-how-to-make-the-election::b01); the
 * conditions that the parent qualifies (::b-parents-who-qualify-to-make-the-election::b01)
 * and that the child files no joint return are the decision's, not checked here.
 */

import { bornBeforeJan2Of } from "../../../birthDate.js";
import {
  getChildInvestmentIncomeFacts,
  makeDependentFactKey,
  type ChildInvestmentIncomeFact,
  type ChildInvestmentIncomeFactValue,
  type DependentFactValue,
} from "../../../facts/index.js";
import { formatDollars, sum } from "../../../money.js";
import type { ResolverInputs } from "../../../resolverInputs.js";
import { ssnOf } from "../../../values.js";
import type { Form3803Child, Form3803Totals } from "./filingInfo.js";
import {
  FORM_3803_AMOUNTS_2025,
  form3803InputsOf,
  form3803Lines,
  line6Of,
  type Form3803Amounts,
  type Form3803Lines,
} from "./lines.js";

export const MUST_FILE_3803_KEY = "decisions.scope.must_file_3803";

const TAX_YEAR = 2025;
/* "Under age 19 or a full-time student under age 24 at the end of 2025" (::a-purpose::b01). */
const AGE_LIMIT = 19;
const STUDENT_AGE_LIMIT = 24;

const NOT_ELECTED = "so the parents cannot report it on FTB 3803";

export const FORM_3803_GAPS = {
  age24: `The child was 24 or older at the end of 2025, ${NOT_ELECTED}.`,
  age19NotStudent: `The child was 19 or older at the end of 2025 and not a full-time student, ${NOT_ELECTED}.`,
  otherIncome: `The child had income other than interest and dividends, ${NOT_ELECTED}.`,
  estimatedTax: `California estimated tax was paid for 2025 under the child's name, ${NOT_ELECTED}.`,
  withholding: `California income tax was withheld from the child's income (backup withholding), ${NOT_ELECTED}.`,
} as const;

/* "Had gross income for 2025 that was less than $13,500" (::a-purpose::b01; the form's line 4). */
export const grossIncomeGap = (amounts: Form3803Amounts) =>
  `The child's interest and dividends (line 4) are $${formatDollars(amounts.grossIncomeLimit)} or more, so the child must file a return and FTB 3803 is not filed.`;

/* "Is required to file a 2025 income tax return": income "of more than $1,350" (ca-540-inst-2025::sec::line-31-tax::b01). */
export const notRequiredToFileGap = (amounts: Form3803Amounts) =>
  `The child's interest and dividends (line 4) are $${formatDollars(amounts.amountNotTaxed)} or less, so the child is not required to file and the FTB 3803 election is not available.`;

/* A condition's outcome: a gap, the answers it waits for, or neither. */
interface Condition {
  gap?: string;
  missing: string[];
}

const met: Condition = { missing: [] };
const fails = (gap: string): Condition => ({ gap, missing: [] });
const waitsFor = (key: string): Condition => ({ missing: [key] });

/* Age N or older at the end of the tax year; a January 1 birthday counts as the day before (::a-purpose::b01). */
const reachedAge = (dob: string | undefined, age: number) =>
  bornBeforeJan2Of(dob, TAX_YEAR - age + 1);

function ageCondition(dependentKey: string, dependent: DependentFactValue | undefined): Condition {
  const studentLimitReached = reachedAge(dependent?.dob, STUDENT_AGE_LIMIT);
  if (dependent === undefined || studentLimitReached === undefined) return waitsFor(dependentKey);
  if (studentLimitReached) return fails(FORM_3803_GAPS.age24);
  if (reachedAge(dependent.dob, AGE_LIMIT) !== true) return met;
  if (dependent.fullTimeStudent === undefined) return waitsFor(dependentKey);
  return dependent.fullTimeStudent ? met : fails(FORM_3803_GAPS.age19NotStudent);
}

/* The answers no document gives, and the California withholding on the child's Forms 1099. */
function answerConditions(factKey: string, income: ChildInvestmentIncomeFactValue): Condition[] {
  const answer = (value: boolean | undefined, gap: string): Condition =>
    value === undefined ? waitsFor(factKey) : value ? fails(gap) : met;
  return [
    answer(income.hadOtherIncome, FORM_3803_GAPS.otherIncome),
    answer(income.californiaEstimatedTaxPaid, FORM_3803_GAPS.estimatedTax),
    (income.stateTaxWithheld ?? 0) > 0 ? fails(FORM_3803_GAPS.withholding) : met,
  ];
}

/* Line 4's two limits. */
function lineConditions(lines: Form3803Lines, amounts: Form3803Amounts): Condition[] {
  return [
    lines.line4 >= amounts.grossIncomeLimit ? fails(grossIncomeGap(amounts)) : met,
    lines.line4 <= amounts.amountNotTaxed ? fails(notRequiredToFileGap(amounts)) : met,
  ];
}

function childForm(inputs: ResolverInputs, fact: ChildInvestmentIncomeFact): Form3803Child {
  const dependentKey = makeDependentFactKey(fact.dependentSlug);
  const dependent = inputs.factByKey.get(dependentKey) as DependentFactValue | undefined;
  const lines = form3803Lines(form3803InputsOf(fact.income), FORM_3803_AMOUNTS_2025);
  const conditions = [
    ageCondition(dependentKey, dependent),
    ...answerConditions(fact.factKey, fact.income),
    ...lineConditions(lines, FORM_3803_AMOUNTS_2025),
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
  };
}

/* Every child's FTB 3803 once the parents elect; none before. */
export function form3803Children(inputs: ResolverInputs): Form3803Child[] {
  if (inputs.decisionByKey.get(MUST_FILE_3803_KEY) !== true) return [];
  return getChildInvestmentIncomeFacts(inputs.facts).map((fact) => childForm(inputs, fact));
}

/* Undefined with no child; "waits" while a child's answer is missing; the first child's gap. */
export function form3803TotalsOf(children: Form3803Child[]): Form3803Totals | undefined {
  if (children.length === 0) return undefined;
  const gap = children.find((child) => child.gap !== undefined)?.gap;
  if (gap !== undefined) return { kind: "unsupported", reason: gap };
  const figured = children.flatMap((child) => (child.lines ? [child.lines] : []));
  if (figured.length < children.length) return { kind: "waits" };
  return {
    kind: "figured",
    line6: sum(...figured.map(line6Of)),
    line9: sum(...figured.map((lines) => lines.line9)),
  };
}

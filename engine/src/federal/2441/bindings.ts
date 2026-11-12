/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn, type FormAccessor } from "../../defineForm.js";
import type { DependentCareProviderFactValue } from "../../facts/index.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN, ssn } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { DependentCarePersonRow, Form2441FilingInfo } from "./filingInfo.js";
import {
  DEEMED_INCOME,
  claimsCredit,
  creditPercent,
  earnedIncome,
  expenseLimit,
  expensesPaid,
  hasBenefits,
} from "./lines.js";
import { SPOUSE_EARNED_INCOME, partIIIBindings } from "./partIII.js";
import type { Form2441 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form2441]: BindingFn<Form2441, Form2441FilingInfo, K> }>;
type RowBinding = (form: FormAccessor<Form2441>, info: Form2441FilingInfo) => unknown;

/* Lines 1 and 2 print three rows each. */
const TABLE_ROWS = [1, 2, 3];

const PROVIDER_STATEMENT =
  "The attached statement for a fourth care provider and more (line 1) is not modeled.";
const PERSON_STATEMENT =
  "The attached statement for a fourth qualifying person and more (line 2) is not modeled.";
const NO_PROVIDER_TIN =
  "The care provider's identifying number is not recorded, and the due-diligence statement is not modeled.";
const WORKSHEET_A = "Worksheet A (credit for 2024 expenses paid in 2025, line 9b) is not modeled.";
const NO_PROVIDER =
  "No care provider is recorded for line 1, and the credit or exclusion needs the provider's name, address and identifying number.";

/* Line 1 column (c): a tax-exempt organization enters "Tax-Exempt" (irs-2441-inst-2025::sec::due-diligence::b02). */
const TAX_EXEMPT_TIN = "Tax-Exempt";

const formatSsn = (value: string) => SSN.format(value as Parameters<typeof SSN.format>[0]);

function providerAddress({ address }: DependentCareProviderFactValue): string {
  return `${address.line1}, ${address.city}, ${address.state} ${address.zip}`;
}

/* Part III only: "enter 'none' on line 1, column (a)" (irs-2441-inst-2025::sec::line-1::b02). */
function nothingToList(info: Form2441FilingInfo): boolean {
  return (
    (info.dependentCareProviders ?? []).length === 0 &&
    (info.dependentCarePersons ?? []).length === 0
  );
}

/*
 * MANUAL EDIT: line 1, one row per provider fact in the order recorded
 * (irs-2441-inst-2025::sec::due-diligence::b01-b03). A row with no provider stays
 * blank; with a qualifying person and no provider at all, row 1 is a gap
 * (irs-2441-inst-2025::sec::who-can-take-the-credit-or-exclude::b01, item 5).
 */
function providerRowBindings(): Bindings {
  const bindings: Record<string, RowBinding> = {};
  for (const row of TABLE_ROWS) {
    const provider = (info: Form2441FilingInfo) => info.dependentCareProviders?.[row - 1];
    const prefix = `0.line.1_row_${row}`;
    bindings[`${prefix}_provider_name`] = (_, info) => {
      const found = provider(info);
      if (found !== undefined) return found.name;
      if (row !== 1) return undefined;
      return nothingToList(info) ? "none" : unsupported(NO_PROVIDER);
    };
    bindings[`${prefix}_address`] = (_, info) => {
      const found = provider(info);
      return found === undefined ? undefined : providerAddress(found);
    };
    bindings[`${prefix}_tin`] = (_, info) => {
      const found = provider(info);
      if (found === undefined) return undefined;
      if (found.taxExempt === true) return TAX_EXEMPT_TIN;
      return found.tin ?? unsupported(NO_PROVIDER_TIN);
    };
    bindings[`${prefix}_household_employee_yes`] = (_, info) => provider(info)?.householdEmployee;
    bindings[`${prefix}_household_employee_no`] = (_, info) => {
      const found = provider(info);
      return found === undefined ? undefined : !found.householdEmployee;
    };
    bindings[`${prefix}_amount_paid`] = (_, info) => roundDollars(provider(info)?.amountPaid);
  }
  return bindings as Bindings;
}

/* Column (c): over age 12 and unable to care for themselves (irs-2441-inst-2025::sec::line-2::b02). */
function overTwelveAndDisabled(person: DependentCarePersonRow): boolean | undefined {
  if (person.ageAtYearEnd === undefined) return undefined;
  return person.ageAtYearEnd > 12 && person.unableToCareForSelf === true;
}

/*
 * MANUAL EDIT: line 2, one row per qualifying person fact in the order
 * recorded (irs-2441-inst-2025::sec::line-2::b01-b02). The SSN takes the nine digits.
 */
function personRowBindings(): Bindings {
  const bindings: Record<string, RowBinding> = {};
  for (const row of TABLE_ROWS) {
    const person = (info: Form2441FilingInfo) => info.dependentCarePersons?.[row - 1];
    const prefix = `0.line.2_row_${row}`;
    bindings[`${prefix}_first_name`] = (_, info) => person(info)?.firstName;
    bindings[`${prefix}_last_name`] = (_, info) => person(info)?.lastName;
    bindings[`${prefix}_ssn`] = (_, info) => {
      const raw = person(info)?.ssn;
      return raw === undefined ? undefined : ssn(raw);
    };
    bindings[`${prefix}_over_12_disabled`] = (_, info) => {
      const found = person(info);
      return found === undefined ? undefined : overTwelveAndDisabled(found);
    };
    bindings[`${prefix}_expenses`] = (_, info) => roundDollars(person(info)?.expensesPaid);
  }
  return bindings as Bindings;
}

/*
 * MANUAL EDIT: lines 3 to 11 stay blank unless the credit applies (claimsCredit),
 * line 1 lists a provider, and, with Part III, line 29 is more than zero
 * ("If zero or less, stop. You can't take the credit").
 */
function partII<T>(
  form: FormAccessor<Form2441>,
  info: Form2441FilingInfo,
  line: () => T,
): T | undefined {
  if (claimsCredit(info) !== true) return undefined;
  if ((info.dependentCareProviders ?? []).length === 0) return undefined;
  if (hasBenefits(info) && !((numberOrBlank(form["1.line.29_line_27_minus_28"]) ?? 0) > 0)) {
    return undefined;
  }
  return line();
}

/*
 * MANUAL EDIT: line 3. With dependent care benefits Part III applies, and
 * line 3 copies line 31; else column (d) up to the dollar limit
 * (irs-pub-503-2025::sec::dollar-limit::b02: $6,000 with more than one qualifying person).
 */
function line3(form: FormAccessor<Form2441>, info: Form2441FilingInfo): number | undefined {
  if (hasBenefits(info)) return form["1.line.31_smaller_line_29_30"];
  const persons = info.dependentCarePersons ?? [];
  return Math.min(expensesPaid(info), expenseLimit(persons.length));
}

/* Lines 4 and 5: the earned income figure for one spouse, or its gap. */
function earnedIncomeLine(
  form: FormAccessor<Form2441>,
  info: Form2441FilingInfo,
  whose: "yours" | "spouse",
): number | Unsupported | undefined {
  const income = earnedIncome(form, info);
  if (income === undefined || "unsupported" in income) return income;
  return income[whose];
}

/* MANUAL EDIT: line-10::b01, the Credit Limit Worksheet. Zero or less: "stop; you can't take the credit". */
function line10(form: FormAccessor<Form2441>): number | undefined {
  const tax = numberOrBlank(form["form-1040.line.18"]);
  if (tax === undefined) return undefined;
  const limit = tax - sum(form["schedule-3.0.line.1"], form["schedule-3.0.line.6l"]);
  return limit > 0 ? limit : undefined;
}

/*
 * MANUAL EDIT: line B on MFS. Not treated as unmarried, line 19 takes the
 * spouse's earned income, deemed income included (irs-2441-inst-2025::sec::line-19::b01),
 * and that line is a gap; treated as unmarried, or with no Part III, nothing is deemed.
 */
function separateLineB(info: Form2441FilingInfo): boolean | Unsupported | undefined {
  if (!hasBenefits(info)) return false;
  const unmarried = info.dependentCareMfsTreatedAsUnmarried;
  if (unmarried === undefined) return undefined;
  return unmarried ? false : unsupported(SPOUSE_EARNED_INCOME);
}

/* The header and the checkboxes above Part I and line 2. */
function headerBindings(): Bindings {
  return {
    // MANUAL EDIT: "Name(s) shown on return": both spouses on a joint return.
    "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
    "0.header.ssn": (_, info) => info.taxpayerSSN,
    // MANUAL EDIT: line-instructions::b01: married filing separately checks it when treated as unmarried.
    "0.line.a_mfs_requirements_met": (_, info) =>
      info.filingStatus === "married_filing_separately"
        ? info.dependentCareMfsTreatedAsUnmarried
        : false,
    // MANUAL EDIT: line-b::b01: checked only with deemed income, which is not modeled.
    "0.line.b_deemed_income": (_, info) => {
      if (info.filingStatus === "married_filing_separately") return separateLineB(info);
      if (info.filingStatus !== "married_filing_jointly") return false;
      const answer = info.dependentCareStudentOrDisabledSpouse;
      return answer === true ? unsupported(DEEMED_INCOME) : answer;
    },
    "0.line.1_more_than_three_providers": (_, info) =>
      (info.dependentCareProviders ?? []).length > 3 ? unsupported(PROVIDER_STATEMENT) : false,
    "0.line.2_more_than_three_persons": (_, info) =>
      (info.dependentCarePersons ?? []).length > 3 ? unsupported(PERSON_STATEMENT) : false,
  };
}

/* Lines 3 to 11. */
function creditBindings(): Bindings {
  return {
    "0.line.3_qualified_expenses_total": (form, info) =>
      partII(form, info, () => line3(form, info)),
    "0.line.4_earned_income": (form, info) =>
      partII(form, info, () => earnedIncomeLine(form, info, "yours")),
    "0.line.5_spouse_earned_income": (form, info) =>
      partII(form, info, () => earnedIncomeLine(form, info, "spouse")),
    "0.line.6_smallest_of_3_4_5": (form) => {
      const lines = [
        form["0.line.3_qualified_expenses_total"],
        form["0.line.4_earned_income"],
        form["0.line.5_spouse_earned_income"],
      ];
      if (lines.includes(undefined)) return undefined;
      return atLeast(0, Math.min(...(lines as number[])));
    },
    "0.line.7_agi": (form, info) =>
      partII(form, info, () => numberOrBlank(form["form-1040.line.11a"])),
    // MANUAL EDIT: the widget takes the two digits after the printed decimal point.
    "0.line.8_decimal_amount": (form) => {
      const agi = form["0.line.7_agi"];
      return agi === undefined ? undefined : String(creditPercent(agi));
    },
    "0.line.9a_line_6_times_line_8": (form) => {
      const line6 = form["0.line.6_smallest_of_3_4_5"];
      const agi = form["0.line.7_agi"];
      if (line6 === undefined || agi === undefined) return undefined;
      return roundDollars((line6 * creditPercent(agi)) / 100);
    },
    // MANUAL EDIT: line-9b::b01: Worksheet A applies only with 2024 expenses paid in 2025.
    "0.line.9b_prior_year_expenses": (form, info) =>
      partII(form, info, () => {
        const paid = info.dependentCarePriorYearExpensesPaid;
        if (paid === undefined) return undefined;
        return paid > 0 ? unsupported(WORKSHEET_A) : 0;
      }),
    "0.line.9c_add_9a_9b": (form) => {
      const line9a = form["0.line.9a_line_6_times_line_8"];
      const line9b = form["0.line.9b_prior_year_expenses"];
      return line9a === undefined || line9b === undefined ? undefined : line9a + line9b;
    },
    "0.line.10_tax_liability_limit": (form, info) => partII(form, info, () => line10(form)),
    "0.line.11_dependent_care_credit": (form) => {
      const line9c = form["0.line.9c_add_9a_9b"];
      const limit = form["0.line.10_tax_liability_limit"];
      return line9c === undefined || limit === undefined ? undefined : Math.min(line9c, limit);
    },
  };
}

/* Every Form 2441 binding; the unit tests evaluate them without the engine. */
export function form2441Bindings(): Bindings {
  return {
    ...headerBindings(),
    ...providerRowBindings(),
    ...personRowBindings(),
    ...creditBindings(),
    ...partIIIBindings(),
  };
}

export function register(): void {
  defineForm<Form2441, Form2441FilingInfo>("form-2441", {
    bindings: form2441Bindings(),
    formatters: {
      "0.header.ssn": formatSsn,
      "0.line.2_row_1_ssn": formatSsn,
      "0.line.2_row_2_ssn": formatSsn,
      "0.line.2_row_3_ssn": formatSsn,
    },
  });
}

/* FTB 3853 rules, written by hand from ca-3853-inst-2025 (no answer key: QUESTIONS.md). */

import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { roundDollars } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { SSN, ssnOf } from "../../../values.js";
import { fullYearCode } from "./codes.js";
import type { Ca3853Member, Form3853FilingInfo } from "./filingInfo.js";
import { isrPenalty } from "./isrPenalty.js";
import {
  TAX_EXEMPT_INTEREST_UNKNOWN,
  householdIncome,
  isGap,
  memberCodes,
  memberIncome,
  partIIBox,
  type ReadField,
} from "./penalty.js";
import type { Form3853 } from "./types.js";

type Info = Form3853FilingInfo;
type Form = FormAccessor<Form3853>;
type Bindings = Partial<{ [K in keyof Form3853]: BindingFn<Form3853, Info, K> }>;
type RowBinding = (form: Form, info: Info) => unknown;

const ROWS = 12;
const ECN_FIELDS = 3;
const MONTH_FIELDS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/* Part I ECN fields (exemption-certificate-number-ecn::b01) and the SSN field (social-security-number-ssn::b01). */
const NO_ECN = "No ECN";
const NO_ID = "No ID";

const MORE_THAN_12 = unsupported(
  "The household has more than 12 members, and the instructions give no continuation statement for Parts I and III.",
);
const MORE_THAN_3_ECNS = unsupported(
  "More than three ECNs go on a separate statement (exemption-certificate-number-ecn::b01), which is not modeled.",
);

const reader =
  (form: Form): ReadField =>
  (id) =>
    form[id];

/*
 * The member on a row of Parts I and III, in household order. Blank when
 * Part II is checked: "If you cannot check the box on Part II, you will need
 * to complete" Part I (part-i::b01), and Part III is not needed
 * (line-1-applicable-household-income-or-gross::b01).
 */
function rowMember(form: Form, info: Info, row: number): Ca3853Member | Unsupported | undefined {
  const box = partIIBox(reader(form), info);
  if (box !== false) return box === true ? undefined : box;
  const members = info.ca3853?.members ?? [];
  if (row === ROWS && members.length > ROWS) return MORE_THAN_12;
  return members[row - 1];
}

/* A field of a row from its member; the gap or blank of the row passes through. */
const fromMember =
  (row: number, value: (person: Ca3853Member, form: Form, info: Info) => unknown): RowBinding =>
  (form, info) => {
    const person = rowMember(form, info, row);
    if (person === undefined || isGap(person)) return person;
    return value(person, form, info);
  };

/* Part I Modified AGI (modified-adjusted-gross-income-magi::b01): a joint return's on line 1, the spouse's blank. */
function modifiedAgi(person: Ca3853Member, form: Form, info: Info) {
  if (person.kind === "spouse") return undefined;
  if (person.kind === "taxpayer") {
    const income = householdIncome(reader(form), info);
    if (income === undefined || isGap(income)) return income;
    return income.exact
      ? roundDollars(income.returnMagi)
      : unsupported(TAX_EXEMPT_INTEREST_UNKNOWN);
  }
  const own = memberIncome(person, info);
  if (own === undefined || isGap(own)) return own;
  return roundDollars(own.printed);
}

/* ECN n (1 to 3): "No ECN" in ECN 1 when the Marketplace granted none. */
function ecn(person: Ca3853Member, index: number) {
  const ecns = person.coverage?.ecns ?? [];
  if (index === 0) return ecns[0] ?? NO_ECN;
  if (index === ECN_FIELDS - 1 && ecns.length > ECN_FIELDS) return MORE_THAN_3_ECNS;
  return ecns[index];
}

function partIRow(row: number): Record<string, RowBinding> {
  const prefix = `0.part1.${row}_`;
  const bindings: Record<string, RowBinding> = {
    [`${prefix}first_name`]: fromMember(row, (person) => person.firstName),
    [`${prefix}middle_initial`]: fromMember(row, (person) => person.middleInitial),
    [`${prefix}last_name`]: fromMember(row, (person) => person.lastName),
    [`${prefix}ssn`]: fromMember(row, (person) => person.idNumber ?? NO_ID),
    [`${prefix}date_of_birth`]: fromMember(row, (person) => person.dob),
    [`${prefix}modified_agi`]: fromMember(row, modifiedAgi),
  };
  for (let index = 0; index < ECN_FIELDS; index++) {
    bindings[`${prefix}ecn_${index + 1}`] = fromMember(row, (person) => ecn(person, index));
  }
  return bindings;
}

/* A Part III code field: column (a) when one code covers the year, else the month's codes. */
function codeField(row: number, month: number | "year", slot: 0 | 1): RowBinding {
  return fromMember(row, (person, form, info) => {
    const codes = memberCodes(person, reader(form), info);
    if (codes === undefined || isGap(codes)) return codes;
    const wholeYear = fullYearCode(codes);
    if (month === "year") return wholeYear;
    return wholeYear === undefined ? codes[month][slot] : undefined;
  });
}

function partIIIRow(row: number): Record<string, RowBinding> {
  const prefix = `1.part3.${row}_`;
  const bindings: Record<string, RowBinding> = {
    [`${prefix}first_name`]: fromMember(row, (person) => person.firstName),
    [`${prefix}middle_initial`]: fromMember(row, (person) => person.middleInitial),
    [`${prefix}last_name`]: fromMember(row, (person) => person.lastName),
    [`${prefix}full_year_code`]: codeField(row, "year", 0),
  };
  MONTH_FIELDS.forEach((name, month) => {
    bindings[`${prefix}first_code_${name}`] = codeField(row, month, 0);
    bindings[`${prefix}second_code_${name}`] = codeField(row, month, 1);
  });
  return bindings;
}

function rowBindings(): Bindings {
  const bindings: Record<string, RowBinding> = {};
  for (let row = 1; row <= ROWS; row++) Object.assign(bindings, partIRow(row), partIIIRow(row));
  return bindings as Bindings;
}

/* Nine digits print dashed (the field holds 11 characters); "No ID" prints as is. */
const idFormat = (value: unknown) => {
  const digits = typeof value === "string" ? ssnOf(value) : undefined;
  return digits === value && digits !== undefined ? SSN.format(digits) : String(value);
};

function idFormatters(): Record<string, (value: unknown) => string> {
  const formatters: Record<string, (value: unknown) => string> = {
    "0.header.ssn_or_itin": idFormat,
  };
  for (let row = 1; row <= ROWS; row++) formatters[`0.part1.${row}_ssn`] = idFormat;
  return formatters;
}

export function register(): void {
  defineForm<Form3853, Info>("form-3853", {
    bindings: {
      "0.header.name": (_, info) => namesOnReturn(info),
      "0.header.ssn_or_itin": (_, info) => info.taxpayerSSN,
      ...rowBindings(),
      "0.part2.1_income_below_filing_threshold": (form, info) => partIIBox(reader(form), info),
      "1.part4.1_shared_responsibility_penalty": (form, info) => isrPenalty(reader(form), info),
    },
    formatters: idFormatters(),
  });
}

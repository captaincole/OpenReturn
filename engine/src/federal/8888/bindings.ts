/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn, type FormAccessor } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { RefundAccount } from "./accounts.js";
import type { Form8888FilingInfo } from "./filingInfo.js";
import { form8888Lines, type Form8888Lines } from "./lines.js";
import type { Form8888 } from "./types.js";

type Accessor = FormAccessor<Form8888>;
type Bindings = Partial<{ [K in keyof Form8888]: BindingFn<Form8888, Form8888FilingInfo, K> }>;

/* The form is for the calendar year of the return: tax year 2025, "20" printed. */
const CALENDAR_YEAR_LAST_TWO_DIGITS = "25";

/* The refund the form splits: Form 1040 line 35a (irs-8888-form-2025::sec::line-5::b01). */
const REFUND_FIELD = "form-1040.line.35a";

const ONE_ACCOUNT =
  "Only one account gets at least $1 of the refund. A deposit to one account goes on Form 1040 lines 35b–35d, not Form 8888 (irs-8888-form-2025::sec::general-instructions::b01), and the engine does not fill those lines yet.";

/* Lines 1–5 from the refund and the accounts; undefined while either waits. */
function linesOf(
  form: Accessor,
  info: Form8888FilingInfo,
): Form8888Lines | Unsupported | undefined {
  const accounts = info.form8888Accounts;
  const refund = form[REFUND_FIELD];
  if (accounts === undefined || typeof refund !== "number") return undefined;
  const lines = form8888Lines(
    refund,
    accounts.map((account) => account.amount),
  );
  return lines.deposits.length === 1 ? unsupported(ONE_ACCOUNT) : lines;
}

type AccountPick<T> = (account: RefundAccount, amount: number) => T | undefined;

/* A field of line 1, 2 or 3 (row 0, 1 or 2): blank when no account takes that line. */
function rowField<T>(row: number, pick: AccountPick<T>) {
  return (form: Accessor, info: Form8888FilingInfo): T | Unsupported | undefined => {
    const lines = linesOf(form, info);
    if (lines === undefined || "unsupported" in lines) return lines;
    const deposit = lines.deposits[row];
    const account = deposit === undefined ? undefined : info.form8888Accounts?.[deposit.account];
    return deposit === undefined || account === undefined
      ? undefined
      : pick(account, deposit.amount);
  };
}

/*
 * MANUAL EDIT: one line's four parts. a: the dollars (lines-1a-2a-and-3a::b01);
 * b: the routing number (lines-1b-2b-and-3b::b01); c: one box, checking or
 * savings (lines-1c-2c-and-3c::b01: "Don't check more than one box"); d: the
 * account number as entered (lines-1d-2d-and-3d::b01).
 */
function lineBindings(row: number, line: number, ordinal: string): Bindings {
  const prefix = `0.line.${line}`;
  const entries: Record<string, ReturnType<typeof rowField<unknown>>> = {
    [`${prefix}a_${ordinal}_account_amount`]: rowField(row, (_, amount) => amount),
    [`${prefix}b_${ordinal}_account_routing_number`]: rowField(
      row,
      (account) => account.routingNumber,
    ),
    [`${prefix}c_${ordinal}_account_checking`]: rowField(row, (account) =>
      account.accountType === "checking" ? true : undefined,
    ),
    [`${prefix}c_${ordinal}_account_savings`]: rowField(row, (account) =>
      account.accountType === "savings" ? true : undefined,
    ),
    [`${prefix}d_${ordinal}_account_number`]: rowField(row, (account) => account.accountNumber),
  };
  return entries as Bindings;
}

export function register(): void {
  defineForm<Form8888, Form8888FilingInfo>("form-8888", {
    bindings: {
      "0.header.calendar_year": () => CALENDAR_YEAR_LAST_TWO_DIGITS,
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      ...lineBindings(0, 1, "first"),
      ...lineBindings(1, 2, "second"),
      ...lineBindings(2, 3, "third"),
      // MANUAL EDIT: line 5 adds lines 1a, 2a and 3a; it equals the refund (line-5::b01).
      "0.line.5_total_allocation_refund": (form, info) => {
        const lines = linesOf(form, info);
        if (lines === undefined || "unsupported" in lines) return lines;
        return lines.line5;
      },
    },

    // MANUAL EDIT: with no refund there is nothing to split, so the form does not file.
    filesOnlyWithAmountOn: REFUND_FIELD,

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}

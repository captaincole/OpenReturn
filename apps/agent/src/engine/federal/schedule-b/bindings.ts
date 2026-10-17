/*
 * Schedule B bindings. Written by hand (MANUAL EDIT, 2026-10-15): Parts I
 * and II are payer lists, which the generator cannot bind row by row.
 *
 * Rows come from FilingInfo payer lists (one per 1099-INT / 1099-DIV
 * fact, in fact order). Each row is whole dollars (IRS: "if you round,
 * round all amounts"). Lines 2 and 6 follow `info.rounding`: by default
 * they add the amounts with cents and round only the total (IRS rule);
 * "sum_rounded_rows" adds the printed rows instead. More payers than
 * rows: the rows show the first ones and the total still covers every
 * payer (an attached statement would list the rest; not modeled).
 */

import {
  defineForm,
  roundDollars,
  sum,
  type BindingFn,
  type FormAccessor,
} from "../../defineForm.js";
import type { PayerAmount, ScheduleBFilingInfo, ScheduleBRounding } from "./filingInfo.js";
import type { ScheduleB } from "./types.js";

type Fn = (f: FormAccessor<ScheduleB>, info: ScheduleBFilingInfo) => unknown;
type Bindings = Partial<{ [K in keyof ScheduleB]: BindingFn<ScheduleB, ScheduleBFilingInfo, K> }>;

const INTEREST_ROWS = 14;
const DIVIDEND_ROWS = 15;

/* Payer rows for one list: name and amount per row. */
function payerRows(
  line: string,
  rows: number,
  payers: (info: ScheduleBFilingInfo) => PayerAmount[] | undefined,
): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (let n = 1; n <= rows; n++) {
    out[`0.line.${line}_payer_name_${n}`] = (_, info) => payers(info)?.[n - 1]?.payerName;
    out[`0.line.${line}_amount_${n}`] = (_, info) => roundDollars(payers(info)?.[n - 1]?.amount);
  }
  return out;
}

/* Total of every payer (not only the printed rows), per the rounding choice. */
function payerTotal(
  payers: PayerAmount[] | undefined,
  rounding: ScheduleBRounding | undefined,
): number | undefined {
  if (!payers || payers.length === 0) return undefined;
  if (rounding === "sum_rounded_rows") return sum(...payers.map((p) => roundDollars(p.amount)));
  return roundDollars(sum(...payers.map((p) => p.amount)));
}

/* A Yes/No checkbox pair from one boolean decision. */
function yesNo(answer: (info: ScheduleBFilingInfo) => boolean | undefined, yes: boolean): Fn {
  return (_, info) => (answer(info) === yes ? true : undefined);
}

/*
 * register() wraps the defineForm side effect. Callers import it and
 * run the registration once at startup. The call is idempotent; a
 * second call overwrites in place.
 */
export function register(): void {
  const bindings: Record<string, Fn> = {
    "0.header.taxpayer_name": (_, info) =>
      info.taxpayerFirstName && info.taxpayerLastName
        ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
        : undefined,
    "0.header.ssn": (_, info) => info.taxpayerSSN,
    ...payerRows("1", INTEREST_ROWS, (info) => info.interestPayers),
    "0.line.2_total_interest": (_, info) => payerTotal(info.interestPayers, info.rounding),
    // Line 4 = line 2 − line 3 (Form 8815 exclusion, not modeled: 0).
    "0.line.4_taxable_interest": (f) => {
      const total = f["0.line.2_total_interest"];
      return typeof total === "number"
        ? total - (f["0.line.3_excludable_savings_bond_interest"] ?? 0)
        : undefined;
    },
    ...payerRows("5", DIVIDEND_ROWS, (info) => info.dividendPayers),
    "0.line.6_total_ordinary_dividends": (_, info) =>
      payerTotal(info.dividendPayers, info.rounding),
    "0.line.7a_foreign_account_yes": yesNo((info) => info.hasForeignFinancialAccount, true),
    "0.line.7a_foreign_account_no": yesNo((info) => info.hasForeignFinancialAccount, false),
    "0.line.8_foreign_trust_yes": yesNo((info) => info.hasForeignTrust, true),
    "0.line.8_foreign_trust_no": yesNo((info) => info.hasForeignTrust, false),
  };
  defineForm<ScheduleB, ScheduleBFilingInfo>("schedule-b", {
    bindings: bindings as Bindings,
    unsupported: {
      "0.line.3_excludable_savings_bond_interest":
        "Form 8815 (education savings bond exclusion) is not modeled; no scenario yet.",
      "0.line.7a_fincen_114_required_yes":
        "FinCEN 114 question applies only after a foreign-account Yes; no foreign-account scenario yet.",
      "0.line.7a_fincen_114_required_no":
        "FinCEN 114 question applies only after a foreign-account Yes; no foreign-account scenario yet.",
      "0.line.7b_foreign_country_1": "No foreign-account scenario yet.",
      "0.line.7b_foreign_country_2": "No foreign-account scenario yet.",
    },
  });
}

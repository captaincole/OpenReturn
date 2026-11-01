/*
 * MANUAL EDIT: written by hand; the generator cannot bind payer lists row by row.
 * Rows are whole dollars (IRS: "if you round, round all amounts"). With more
 * payers than rows, the total still covers every payer (no attached statement).
 */

import { defineForm, type BindingFn, type FormAccessor } from "../../defineForm.js";
import { roundDollars, sum } from "../../money.js";
import type { PayerAmount, ScheduleBFilingInfo, ScheduleBRounding } from "./filingInfo.js";
import type { ScheduleB } from "./types.js";

type Fn = (f: FormAccessor<ScheduleB>, info: ScheduleBFilingInfo) => unknown;
type Bindings = Partial<{ [K in keyof ScheduleB]: BindingFn<ScheduleB, ScheduleBFilingInfo, K> }>;

const INTEREST_ROWS = 14;
const DIVIDEND_ROWS = 15;

function payerRows(
  line: string,
  rows: number,
  payers: (info: ScheduleBFilingInfo) => PayerAmount[] | undefined,
): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (let rowNumber = 1; rowNumber <= rows; rowNumber++) {
    out[`0.line.${line}_payer_name_${rowNumber}`] = (_, info) =>
      payers(info)?.[rowNumber - 1]?.payerName;
    out[`0.line.${line}_amount_${rowNumber}`] = (_, info) =>
      roundDollars(payers(info)?.[rowNumber - 1]?.amount);
  }
  return out;
}

function payerTotal(
  payers: PayerAmount[] | undefined,
  rounding: ScheduleBRounding | undefined,
): number | undefined {
  if (!payers || payers.length === 0) return undefined;
  if (rounding === "sum_rounded_rows")
    return sum(...payers.map((payer) => roundDollars(payer.amount)));
  return roundDollars(sum(...payers.map((payer) => payer.amount)));
}

function yesNo(answer: (info: ScheduleBFilingInfo) => boolean | undefined, yes: boolean): Fn {
  return (_, info) => (answer(info) === yes ? true : undefined);
}

export function register(): void {
  const bindings: Record<string, Fn> = {
    "0.header.taxpayer_name": (_, info) =>
      info.taxpayerFirstName && info.taxpayerLastName
        ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
        : undefined,
    "0.header.ssn": (_, info) => info.taxpayerSSN,
    ...payerRows("1", INTEREST_ROWS, (info) => info.interestPayers),
    "0.line.2_total_interest": (_, info) => payerTotal(info.interestPayers, info.rounding),
    "0.line.4_taxable_interest": (form) => {
      const total = form["0.line.2_total_interest"];
      return typeof total === "number"
        ? total - (form["0.line.3_excludable_savings_bond_interest"] ?? 0)
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

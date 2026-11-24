/*
 * MANUAL EDIT: written by hand; the generator cannot bind payer lists row by row.
 * Rows are whole dollars (IRS: "if you round, round all amounts"). With more
 * payers than rows, the total still covers every payer (no attached statement).
 */

import { defineForm, type BindingFn, type FormAccessor } from "../../defineForm.js";
import { numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { withForm8814 } from "../8814/totals.js";
import type { Receipt } from "../passThrough/receipts.js";
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

/* The total, unless a K-1 row is not known: blank while it waits, its gap when unsupported. */
function withPassThrough(
  receipt: Receipt | undefined,
  total: () => number | Unsupported | undefined,
): number | Unsupported | undefined {
  if (receipt?.kind === "unsupported") return unsupported(receipt.reason);
  if (receipt?.kind === "waiting") return undefined;
  return total();
}

function yesNo(answer: (info: ScheduleBFilingInfo) => boolean | undefined, yes: boolean): Fn {
  return (_, info) => (answer(info) === yes ? true : undefined);
}

const FINCEN_GAP =
  "FinCEN Form 114 is required when the foreign accounts together are worth more than $10,000 at any time; the engine knows it only when one recorded account alone is worth more.";

/* Question 2 is Yes from the account facts (resolveInfo.ts foreignAccountFactsOf). */
const fincenYes = (info: ScheduleBFilingInfo) =>
  info.hasForeignFinancialAccount === true && info.foreignAccountFacts?.overFincenLimit === true;

/*
 * MANUAL EDIT: line 7a question 2 and line 7b
 * (irs-1040sb-inst-2025::sec::line-7a-question-2-see-fincen-form-114-and-its::b01, line-7b::b01):
 * Yes, and the accounts' countries, when one recorded account alone is worth
 * more than $10,000; blank after a No to question 1. Otherwise the engine
 * cannot tell: unsupported. Line 7b
 * row 1 takes the first country, row 2 the others.
 */
function fincenBindings(): Record<string, Fn> {
  // "If 'Yes,' are you required to file FinCEN Form 114": blank after a No.
  const settled =
    (value: (info: ScheduleBFilingInfo) => unknown): Fn =>
    (_, info) => {
      if (info.hasForeignFinancialAccount === false) return undefined;
      return fincenYes(info) ? value(info) : unsupported(FINCEN_GAP);
    };
  const countries = (info: ScheduleBFilingInfo) => info.foreignAccountFacts?.countries ?? [];
  return {
    "0.line.7a_fincen_114_required_yes": settled(() => true),
    "0.line.7a_fincen_114_required_no": settled(() => undefined),
    "0.line.7b_foreign_country_1": settled((info) => countries(info)[0]),
    "0.line.7b_foreign_country_2": settled((info) =>
      countries(info).length > 1 ? countries(info).slice(1).join(", ") : undefined,
    ),
  };
}

export function register(): void {
  const bindings: Record<string, Fn> = {
    "0.header.taxpayer_name": (_, info) =>
      info.taxpayerFirstName && info.taxpayerLastName
        ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
        : undefined,
    "0.header.ssn": (_, info) => info.taxpayerSSN,
    ...payerRows("1", INTEREST_ROWS, (info) => info.interestPayers),
    // MANUAL EDIT: a K-1 whose interest is not known yet leaves the total waiting, or shows its gap.
    "0.line.2_total_interest": (_, info) =>
      withPassThrough(info.passThroughInterest, () =>
        payerTotal(info.interestPayers, info.rounding),
      ),
    /*
     * MANUAL EDIT: line 3 is Form 8815 line 14 (irs-8815-form-2025::sec::omb-no-1545-0074::b03);
     * blank when Form 8815 does not file, or stops before line 14.
     */
    "0.line.3_excludable_savings_bond_interest": (form, info) => {
      if (info.mustFile?.["form-8815"]?.value !== true) return undefined;
      if (info.savingsBondExclusionGap) return unsupported(info.savingsBondExclusionGap);
      return numberOrBlank(form["form-8815.0.line.14_excludable_bond_interest"]);
    },
    "0.line.4_taxable_interest": (form) => {
      const total = form["0.line.2_total_interest"];
      return typeof total === "number"
        ? total - (form["0.line.3_excludable_savings_bond_interest"] ?? 0)
        : undefined;
    },
    ...payerRows("5", DIVIDEND_ROWS, (info) => info.dividendPayers),
    // MANUAL EDIT: line 5 lists each Form 8814 line 9; the total waits with Form 8814 (::line-9::b01).
    "0.line.6_total_ordinary_dividends": (_, info) =>
      withPassThrough(info.passThroughDividends, () =>
        withForm8814(info.form8814Totals, payerTotal(info.dividendPayers, info.rounding), () => 0),
      ),
    "0.line.7a_foreign_account_yes": yesNo((info) => info.hasForeignFinancialAccount, true),
    "0.line.7a_foreign_account_no": yesNo((info) => info.hasForeignFinancialAccount, false),
    "0.line.8_foreign_trust_yes": yesNo((info) => info.hasForeignTrust, true),
    "0.line.8_foreign_trust_no": yesNo((info) => info.hasForeignTrust, false),
    ...fincenBindings(),
  };
  defineForm<ScheduleB, ScheduleBFilingInfo>("schedule-b", {
    bindings: bindings as Bindings,
  });
}

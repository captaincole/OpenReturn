/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../money.js";
import type { QbiBusiness } from "../qbi/filingInfo.js";
import {
  businessTin,
  qbiOf,
  qualifiedDividendsPlusNetCapitalGain,
  taxableIncomeBeforeQbi,
} from "../qbi/lines.js";
import type { Form8995FilingInfo } from "./filingInfo.js";
import type { Form8995 } from "./types.js";

type Read = Record<string, unknown>;

/* Lines 5, 9 and 14. */
const QBI_RATE = 0.2;

const QBI_CARRYFORWARD =
  "No fact gives a qualified business net loss carried forward from the prior year (prior-year Form 8995 line 16).";
const REIT_PTP_CARRYFORWARD =
  "No fact gives a qualified REIT dividends and PTP loss carried forward from the prior year (prior-year Form 8995 line 17).";

/*
 * Line 1 rows i–v, one business each in fact order. More than five businesses
 * need an attached statement (line-2::b01), not modeled: a sixth gets no row.
 * At or below the threshold an SSTB counts like any other business
 * (determining-your-qualified-trades-or::b05), so every business gets a row.
 */
const ROWS = ["i", "ii", "iii", "iv", "v"] as const;
type Row = (typeof ROWS)[number];

const businessIn = (info: Form8995FilingInfo, row: Row): QbiBusiness | undefined =>
  info.qbiBusinesses?.[ROWS.indexOf(row)];

// Line 1(c): QBI counts the deductible part of SE tax (determining-your-qualified-business::b01).
function qbi(form: Read, info: Form8995FilingInfo, row: Row): number | undefined {
  const business = businessIn(info, row);
  const amount = business && qbiOf(form, info, business);
  return amount === undefined ? undefined : roundDollars(amount);
}

// Line 1(b): the EIN, else the owner's SSN (specific-instructions::b01).
function tin(info: Form8995FilingInfo, row: Row): string | undefined {
  const business = businessIn(info, row);
  return business && businessTin(info, business);
}

/*
 * Line 2: every business's line 1(c), including those past the fifth on the
 * attached statement (line-2::b01). Undefined with no business, or while any
 * business's QBI is unknown.
 */
function line2(form: Read, info: Form8995FilingInfo): number | undefined {
  const amounts = (info.qbiBusinesses ?? []).map((business) =>
    roundDollars(qbiOf(form, info, business)),
  );
  if (amounts.length === 0 || amounts.includes(undefined)) return undefined;
  return sum(...amounts);
}

// Undefined only while a business's QBI is unknown: a REIT-only return has no line 2.
function line2Pending(form: Read, info: Form8995FilingInfo): boolean {
  return (info.qbiBusinesses?.length ?? 0) > 0 && numberOrBlank(form["0.line.2"]) === undefined;
}

// Lines 3 and 7 print in parentheses: a positive loss that the combining lines subtract.
const combined = (amount: unknown, loss: unknown) => sum(amount) - sum(loss);

const percentOf = (value: unknown) => {
  const amount = numberOrBlank(value);
  return amount === undefined ? undefined : roundDollars(amount * QBI_RATE);
};

// "Name(s) shown on return": both spouses on a joint return.
function returnName(info: Form8995FilingInfo): string | undefined {
  if (!info.taxpayerFirstName || !info.taxpayerLastName) return undefined;
  const taxpayer = `${info.taxpayerFirstName} ${info.taxpayerLastName}`;
  const joint = info.filingStatus === "married_filing_jointly";
  return joint && info.spouseFirstName && info.spouseLastName
    ? `${taxpayer} and ${info.spouseFirstName} ${info.spouseLastName}`
    : taxpayer;
}

export function register(): void {
  defineForm<Form8995, Form8995FilingInfo>("form-8995", {
    bindings: {
      "0.header.name": (_, info) => returnName(info),
      "0.header.taxpayer_id": (_, info) => info.taxpayerSSN,
      "0.line.1i_a": (_, info) => businessIn(info, "i")?.name,
      "0.line.1i_b": (_, info) => tin(info, "i"),
      "0.line.1i_c": (form, info) => qbi(form, info, "i"),
      "0.line.1ii_a": (_, info) => businessIn(info, "ii")?.name,
      "0.line.1ii_b": (_, info) => tin(info, "ii"),
      "0.line.1ii_c": (form, info) => qbi(form, info, "ii"),
      "0.line.1iii_a": (_, info) => businessIn(info, "iii")?.name,
      "0.line.1iii_b": (_, info) => tin(info, "iii"),
      "0.line.1iii_c": (form, info) => qbi(form, info, "iii"),
      "0.line.1iv_a": (_, info) => businessIn(info, "iv")?.name,
      "0.line.1iv_b": (_, info) => tin(info, "iv"),
      "0.line.1iv_c": (form, info) => qbi(form, info, "iv"),
      "0.line.1v_a": (_, info) => businessIn(info, "v")?.name,
      "0.line.1v_b": (_, info) => tin(info, "v"),
      "0.line.1v_c": (form, info) => qbi(form, info, "v"),
      "0.line.2": (form, info) => line2(form, info),
      "0.line.4": (form, info) =>
        line2Pending(form, info)
          ? undefined
          : atLeast(0, combined(form["0.line.2"], form["0.line.3"])),
      "0.line.5": (form) => percentOf(form["0.line.4"]),
      // No fact gives PTP income; line 6 is the REIT dividends alone.
      "0.line.6": (_, info) => roundDollars(info.qualifiedReitDividends),
      "0.line.8": (form) => atLeast(0, combined(form["0.line.6"], form["0.line.7"])),
      "0.line.9": (form) => percentOf(form["0.line.8"]),
      "0.line.10": (form) => {
        const line5 = numberOrBlank(form["0.line.5"]);
        return line5 === undefined ? undefined : sum(line5, form["0.line.9"]);
      },
      "0.line.11": (form, info) => taxableIncomeBeforeQbi(form, info),
      "0.line.12": (form) => qualifiedDividendsPlusNetCapitalGain(form),
      "0.line.13": (form) => {
        const line11 = numberOrBlank(form["0.line.11"]);
        return line11 === undefined ? undefined : atLeast(0, line11 - sum(form["0.line.12"]));
      },
      "0.line.14": (form) => percentOf(form["0.line.13"]),
      "0.line.15": (form) => {
        const line10 = numberOrBlank(form["0.line.10"]);
        const line14 = numberOrBlank(form["0.line.14"]);
        return line10 === undefined || line14 === undefined ? undefined : Math.min(line10, line14);
      },
      // Lines 16 and 17 print in parentheses: the loss carried forward, as a positive amount.
      "0.line.16": (form, info) =>
        line2Pending(form, info)
          ? undefined
          : atLeast(0, -combined(form["0.line.2"], form["0.line.3"])),
      "0.line.17": (form) => atLeast(0, -combined(form["0.line.6"], form["0.line.7"])),
    },

    unsupported: {
      "0.line.3": QBI_CARRYFORWARD,
      "0.line.7": REIT_PTP_CARRYFORWARD,
    },
  });
}

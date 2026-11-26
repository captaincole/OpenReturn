/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum, sumOrBlank } from "../../money.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { ScheduleSEFilingInfo } from "./filingInfo.js";
import { MIN_NET_EARNINGS, netEarnings } from "./lines.js";
import type { ScheduleSE } from "./types.js";

/* Line 7 (printed): the 2025 social security wage base. */
const SOCIAL_SECURITY_WAGE_BASE = 176100;
/* Line 10: the social security portion of SE tax. */
const SOCIAL_SECURITY_RATE = 0.124;
/* Line 11: the Medicare portion of SE tax. */
const MEDICARE_RATE = 0.029;
/* Line 13: one-half of SE tax is deductible. */
const DEDUCTIBLE_SHARE = 0.5;

const FORM_4361 = "No fact says whether the taxpayer is a minister who filed Form 4361.";
const CHURCH =
  "No fact gives church employee income (W-2 wages from a church that elected out of social security tax).";
const PART_II =
  "Part II (the optional methods) is not modeled: no fact or decision elects the farm or nonfarm optional method.";

type Form = FormAccessor<ScheduleSE>;

// Line 4c under $400: stop. Its exception (church employee income) is not modeled.
function owesTax(form: Form): boolean {
  const line4c = form["0.line.4c"];
  return typeof line4c === "number" && line4c >= MIN_NET_EARNINGS;
}

// Line 8a of $176,100 or more: skip lines 8b through 10.
function skipsTo11(form: Form): boolean {
  return (form["0.line.8a"] ?? 0) >= SOCIAL_SECURITY_WAGE_BASE;
}

/*
 * Line 3: lines 1a and 2 combined, less line 1b. It waits while a farm's line 34
 * or a business's line 31 does; blank with neither.
 */
function line3(form: Form, info: ScheduleSEFilingInfo) {
  if (info.farmNetProfitGap) return unsupported(info.farmNetProfitGap);
  const line1a = form["0.line.1a"];
  const line2 = form["0.line.2"];
  if (info.farmNetProfitWaits === true || info.scheduleCNetProfitWaits === true) return undefined;
  if (line1a === undefined && line2 === undefined) return undefined;
  // Line 1b is entered in parentheses: it reduces line 3.
  return sum(line1a, line2) - sum(form["0.line.1b"]);
}

function line4a(form: Form): number | undefined {
  const line3Value = form["0.line.3"];
  if (line3Value === undefined) return undefined;
  return netEarnings(line3Value);
}

function line10(form: Form): number | undefined {
  const line6 = form["0.line.6"];
  const line9 = form["0.line.9"];
  if (!owesTax(form) || skipsTo11(form) || line6 === undefined || line9 === undefined) {
    return undefined;
  }
  return roundDollars(Math.min(line6, line9) * SOCIAL_SECURITY_RATE);
}

export function register(): void {
  defineForm<ScheduleSE, ScheduleSEFilingInfo>("schedule-se", {
    bindings: {
      // The SE person is the taxpayer; a spouse's Schedule SE is not modeled.
      "0.header.name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      /*
       * MANUAL EDIT: line 1a = the taxpayer's Schedule F line 34 (irs-1040sf-inst-2025::sec::line-34::b02).
       * A farm partnership's K-1 box 14, code A, has no route here.
       */
      "0.line.1a": (_, info) =>
        info.farmNetProfitGap
          ? unsupported(info.farmNetProfitGap)
          : roundDollars(info.farmNetProfit),
      // MANUAL EDIT: line 1b = taxable CRP payments received while on social security (irs-1040sse-inst-2025::sec::line-1b::b01).
      "0.line.1b": (_, info) => roundDollars(info.crpPayments),
      // Only Schedule C feeds line 2: no fact gives partnership (K-1) earnings.
      "0.line.2": (_, info) => roundDollars(info.scheduleCNetProfit),
      "0.line.3": (form, info) => line3(form, info),
      "0.line.4a": (form) => line4a(form),
      "0.line.4c": (form) => {
        const value = form["0.line.4a"];
        return value === undefined ? undefined : sum(value, form["0.line.4b"]);
      },
      "0.line.6": (form) => (owesTax(form) ? sum(form["0.line.4c"], form["0.line.5b"]) : undefined),
      // No fact gives railroad retirement (tier 1) compensation.
      "0.line.8a": (form, info) =>
        owesTax(form) ? roundDollars(info.w2SocialSecurityWagesAndTips) : undefined,
      /*
       * MANUAL EDIT: line 8b is "Unreported tips subject to social security tax from
       * Form 4137, line 10" of the SE person, the taxpayer. The taxpayer's Form 4137
       * is the first copy when it files; a spouse's form does not count here.
       */
      "0.line.8b": (form, info) => {
        if (!owesTax(form) || skipsTo11(form)) return undefined;
        return info.form4137Filers?.[0]?.owner === "taxpayer"
          ? numberOrBlank(form["form-4137.0.line.10_tips_subject_social_security_tax"])
          : undefined;
      },
      /*
       * MANUAL EDIT: line 8c is "Wages subject to social security tax from Form
       * 8919, line 10" of the SE person, the taxpayer. The taxpayer's Form 8919 is
       * the first copy when it files; a spouse's form does not count here.
       */
      "0.line.8c": (form, info) => {
        if (!owesTax(form) || skipsTo11(form)) return undefined;
        return info.form8919Filers?.[0]?.owner === "taxpayer"
          ? numberOrBlank(form["form-8919.0.line.10_wages_subject_social_security_tax"])
          : undefined;
      },
      /*
       * A blank line 8a (no W-2) counts as 0: line 8c still reduces line 9
       * (irs-pub-560-2025::sec::omb-no-1545-0074::b03). Blank when all three are.
       */
      "0.line.8d": (form) => {
        if (!owesTax(form) || skipsTo11(form)) return undefined;
        return sumOrBlank(form["0.line.8a"], form["0.line.8b"], form["0.line.8c"]);
      },
      "0.line.9": (form) =>
        owesTax(form) && !skipsTo11(form)
          ? atLeast(0, SOCIAL_SECURITY_WAGE_BASE - sum(form["0.line.8d"]))
          : undefined,
      "0.line.10": (form) => line10(form),
      "0.line.11": (form) => {
        const line6 = form["0.line.6"];
        return line6 === undefined ? undefined : roundDollars(line6 * MEDICARE_RATE);
      },
      "0.line.12": (form) =>
        owesTax(form) ? sum(form["0.line.10"], form["0.line.11"]) : undefined,
      "0.line.13": (form) => {
        const line12 = form["0.line.12"];
        return line12 === undefined ? undefined : roundDollars(line12 * DEDUCTIBLE_SHARE);
      },
    },
    formatters: {
      // The SSN renders with dashes; this form has no comb widget.
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
    unsupported: {
      "0.line.a_form_4361_exempt": FORM_4361,
      "0.line.4b": PART_II,
      "0.line.5a": CHURCH,
      "0.line.5b": CHURCH,
      "1.line.15": PART_II,
      "1.line.16": PART_II,
      "1.line.17": PART_II,
    },
  });
}

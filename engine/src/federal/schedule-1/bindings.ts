/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { roundDollars, sum } from "../../money.js";
import { unsupported } from "../../types.js";
import { form4797Files, scheduleOneLine4 } from "../4797/receivers.js";
import { selfEmployedHealthDeduction } from "../7206/results.js";
import { files8853, form8853Total } from "../8853/results.js";
import { answerBindings } from "./answerBindings.js";
import { canceledDebtHold, line8c } from "./canceledDebt.js";
import { line12 } from "./employeeBusinessExpenses.js";
import { line8p, line8pHold } from "./excessBusinessLoss.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";
import { foreignExclusionHold, line24j, line8d } from "./foreignExclusion.js";
import { line14, storageFeesOnlyBox } from "./movingExpenses.js";
import { line8a, line8aHold } from "./nolDeduction.js";
import { line21 } from "./studentLoanInterest.js";
import type { Schedule1 } from "./types.js";

const NO_FORM_8853_LINE_8E = "No Form 8853 (Archer MSA / LTC) scenario yet";
const NO_FORM_8853_LINE_23 = "Form 8853 (Archer MSA) not ingested; no scenario.";
const NO_FORM_4797_LINE_4 = "No Form 4797 or Form 4684 scenario yet.";
const NO_FORM_4797_BOX = "No Form 4797 business-property sale scenario yet.";

export function register(): void {
  defineForm<Schedule1, Schedule1FilingInfo>("schedule-1", {
    bindings: {
      // MANUAL EDIT: line 3 = Schedule C line 31, every business (the engine evaluates one Schedule C copy).
      "0.line.3": (_, info) => info.businessIncome,
      // MANUAL EDIT: line 7 = 1099-G box 1 (irs-1040-inst-2025::sec::line-7::b01).
      "0.line.7": (_, info) => roundDollars(info.unemploymentCompensation),
      // MANUAL EDIT: line 8b = W-2G box 1. Winnings with no W-2G have no fact and are not included.
      "0.line.8b": (_, info) => roundDollars(info.gamblingWinnings),
      // MANUAL EDIT: line 8c = the taxable part of the nonbusiness canceled debts, after Form 982 (canceledDebt.ts).
      "0.line.8c": line8c,
      /*
       * MANUAL EDIT: line 4 = Form 4797 line 18b, its box checked
       * (irs-4797-inst-2025::sec::line-18a::b01; the form's line 18b). Without
       * Form 4797 each keeps the reason it had. Form 4684 sends nothing here:
       * its Section B, which goes through Form 4797, is not modeled.
       */
      "0.line.4": (_, info) =>
        form4797Files(info) ? scheduleOneLine4(info) : unsupported(NO_FORM_4797_LINE_4),
      "0.line.4_form_4797": (_, info) => {
        if (!form4797Files(info)) return unsupported(NO_FORM_4797_BOX);
        return typeof scheduleOneLine4(info) === "number" ? true : undefined;
      },
      /*
       * MANUAL EDIT: line 6 = Schedule F line 34, every farm (irs-1040sf-inst-2025::sec::line-34::b02);
       * blank with no farm and while a line 34 waits, the gap when one is a case the engine does not handle.
       */
      "0.line.6": (_, info) =>
        info.farmIncomeGap ? unsupported(info.farmIncomeGap) : info.farmIncome,
      // MANUAL EDIT: line 5 = Schedule E line 41; blank when Schedule E is not filed.
      "0.line.5": (form) => {
        const line41 = form["schedule-e.1.line.41_total_income_or_loss"];
        return typeof line41 === "number" ? line41 : undefined;
      },
      // MANUAL EDIT: line 15 = Schedule SE line 13; blank when Schedule SE is not filed.
      "1.line.15": (form) => {
        const line13 = form["schedule-se.0.line.13"];
        return typeof line13 === "number" ? line13 : undefined;
      },
      // MANUAL EDIT: lines 2a, 2b, 8h, 8i, 8k, 8z, 16, 19a–20 and 24a–24i from the answers (answerBindings.ts).
      ...answerBindings(),
      // MANUAL EDIT: line 8g = the Alaska Permanent Fund dividend (irs-pub-525-2025::sec::other-income::b01).
      "0.line.8g": (_, info) => roundDollars(info.alaskaPermanentFundDividends),
      // MANUAL EDIT: line 8p = Form 461 line 16 as a positive amount when below 0 (excessBusinessLoss.ts).
      "0.line.8p": line8p,
      // MANUAL EDIT: lines 8d and 24j from Form 2555 (foreignExclusion.ts).
      "0.line.8d": line8d,
      "1.line.24j": line24j,
      // MANUAL EDIT: line 8a, the NOL deduction from the stated carryovers (nolDeduction.ts).
      "0.line.8a": line8a,
      // MANUAL EDIT: lines 8a, 8d and 8s are subtractions (printed in parentheses); lines 8a and 8p hold it.
      "0.line.9": (form, info) => {
        // MANUAL EDIT: line 8c holds line 9 while a canceled debt waits for an answer (canceledDebt.ts).
        const hold =
          line8pHold(form, info) ??
          foreignExclusionHold(form, info) ??
          canceledDebtHold(info) ??
          line8aHold(form["0.line.8a"], info);
        if (hold !== undefined) return hold === "waiting" ? undefined : hold;
        return (
          sum(
            form["0.line.8b"],
            form["0.line.8c"],
            form["0.line.8e"],
            form["0.line.8f"],
            form["0.line.8g"],
            form["0.line.8h"],
            form["0.line.8i"],
            form["0.line.8j"],
            form["0.line.8k"],
            form["0.line.8l"],
            form["0.line.8m"],
            form["0.line.8n"],
            form["0.line.8o"],
            form["0.line.8p"],
            form["0.line.8q"],
            form["0.line.8r"],
            form["0.line.8t"],
            form["0.line.8u"],
            form["0.line.8v"],
            form["0.line.8z"],
          ) - sum(form["0.line.8a"], form["0.line.8d"], form["0.line.8s"])
        );
      },
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      /*
       * MANUAL EDIT: line 8e = Form 8853 lines 8, 12 and 26 (irs-1040-inst-2025::sec::line-8e::b01).
       * Without Form 8853 the line keeps the reason it had before the form had rules.
       */
      "0.line.8e": (_, info) =>
        files8853(info)
          ? form8853Total(info, [
              "0.line.8_taxable_archer_msa_distributions",
              "0.line.12_taxable_medicare_advantage_distributions",
              "1.line.26_taxable_payments",
            ])
          : unsupported(NO_FORM_8853_LINE_8E),
      // MANUAL EDIT: line 23 = Form 8853 line 5 (irs-1040-inst-2025::sec::line-23::b01; the 8853 form).
      "1.line.23": (_, info) =>
        files8853(info)
          ? form8853Total(info, ["0.line.5_archer_msa_deduction"])
          : unsupported(NO_FORM_8853_LINE_23),
      "0.line.8f": (form) =>
        sum(
          form["form-8889.0.line.16_taxable_hsa_distributions"],
          form["form-8889.0.line.20_total_income"],
        ),
      /*
       * MANUAL EDIT: irs-1040-inst-2025::sec::line-3::b01. Line 3 is blank with no
       * business (adds nothing) and blank while a business's line 31 waits. Then
       * line 10 waits: sum() would add the loss as 0 and overstate income. The
       * other terms are blank only when empty: 1, 2a, 4 are unsupported, line 6
       * is blank with no farm, line 7 is blank with no 1099-G, and line 9 is a sum.
       */
      "0.line.10": (form, info) => {
        // MANUAL EDIT: line 9 holds while Form 461 line 16, Form 2555, a canceled debt or line 8a waits or is a gap.
        const hold =
          line8pHold(form, info) ??
          foreignExclusionHold(form, info) ??
          canceledDebtHold(info) ??
          line8aHold(form["0.line.8a"], info);
        if (hold !== undefined) return hold === "waiting" ? undefined : hold;
        // MANUAL EDIT: a farm's line 34 gap reaches line 10; a farm whose line 34 waits makes it wait.
        if (info.farmIncomeGap) return unsupported(info.farmIncomeGap);
        return (info.hasBusiness === true && form["0.line.3"] === undefined) ||
          (info.hasFarm === true && form["0.line.6"] === undefined) ||
          // MANUAL EDIT: Schedule E filed or still open (an unreadable rental fact), line 41 blank: wait too.
          (info.mustFile?.["schedule-e"]?.value !== false && form["0.line.5"] === undefined) ||
          // MANUAL EDIT: Form 4797 waits on its line 8 answer: line 4 is not known yet.
          info.form4797?.waitsForLine8 === true
          ? undefined
          : sum(
              form["0.line.1"],
              form["0.line.2a"],
              form["0.line.3"],
              form["0.line.4"],
              form["0.line.5"],
              form["0.line.6"],
              form["0.line.7"],
              form["0.line.9"],
            );
      },
      // MANUAL EDIT: line 11, at most $300 per eligible educator (adjustments.ts).
      "1.line.11": (_, info) => roundDollars(info.educatorExpenses),
      // MANUAL EDIT: line 12, Form 2106 line 10's reservist, performing-artist and fee-basis parts (employeeBusinessExpenses.ts).
      "1.line.12": line12,
      "1.line.13": (form) => sum(form["form-8889.0.line.13_hsa_deduction"]),
      // MANUAL EDIT: line 14 and its storage-fees box (movingExpenses.ts).
      "1.line.14": line14,
      "1.line.14_storage_fees_only": storageFeesOnlyBox,
      /*
       * MANUAL EDIT: line 17 = Form 7206 line 14 of every plan, or the Form 1040
       * worksheet's line 3 (irs-1040-inst-2025::sec::line-17::b04; federal/7206/results.ts).
       */
      "1.line.17": selfEmployedHealthDeduction,
      // MANUAL EDIT: line 18 = 1099-INT box 2 summed (irs-1040-inst-2025::sec::line-18::b01).
      "1.line.18": (_, info) => roundDollars(info.earlyWithdrawalPenalty),
      // MANUAL EDIT: line 21, the Student Loan Interest Deduction Worksheet (studentLoanInterest.ts).
      "1.line.21": line21,
      "1.line.25": (form, info) => {
        // MANUAL EDIT: line 24j holds the total while Form 2555 waits or is a gap.
        const hold = foreignExclusionHold(form, info);
        if (hold !== undefined) return hold === "waiting" ? undefined : hold;
        return sum(
          form["1.line.24a"],
          form["1.line.24b"],
          form["1.line.24c"],
          form["1.line.24d"],
          form["1.line.24e"],
          form["1.line.24f"],
          form["1.line.24g"],
          form["1.line.24h"],
          form["1.line.24i"],
          form["1.line.24j"],
          form["1.line.24k"],
          form["1.line.24z"],
        );
      },
      "1.line.26": (form, info) => {
        // MANUAL EDIT: line 25 holds while Form 2555 waits; line 26 holds with it.
        const hold = foreignExclusionHold(form, info);
        if (hold !== undefined) return hold === "waiting" ? undefined : hold;
        return sum(
          form["1.line.11"],
          form["1.line.12"],
          form["1.line.13"],
          form["1.line.14"],
          form["1.line.15"],
          form["1.line.16"],
          form["1.line.17"],
          form["1.line.18"],
          form["1.line.19a"],
          form["1.line.20"],
          form["1.line.21"],
          form["1.line.23"],
          form["1.line.25"],
        );
      },
    },

    unsupported: {
      "0.header.name":
        "No combined full-name fact exists and lookupFact reads only one fact; it needs a first+last concatenation rule.",
      "0.header.form_1099k_error_amount":
        "No fact for a 1099-K amount in error or for personal items sold at a loss; a 1099-K that names no business stays open on Schedule C.",
      "0.line.1": "No 1099-G or state-refund taxability worksheet scenario yet.",
      "0.line.4_form_4684": "No Form 4684 casualty/theft scenario yet.",
      "0.line.7_repaid_checkbox":
        "No fact for a repayment of unemployment compensation; Cade says a repayment is not supported.",
      "0.line.7_amount_repaid":
        "No fact for a repayment of unemployment compensation; Cade says a repayment is not supported.",
      "0.line.8j": "No hobby (not-for-profit activity) income scenario yet.",
      "0.line.8l": "No personal-property rental income scenario yet.",
      "0.line.8m": "No Olympic/Paralympic medal or USOC prize money scenario yet.",
      "0.line.8n": "No Form 5471 / CFC subpart F inclusion scenario yet.",
      "0.line.8o": "No Form 8992 / GILTI inclusion scenario yet.",
      "0.line.8q": "No ABLE account (Form 1099-QA) ingestion yet.",
      "0.line.8r": "No scholarship/fellowship grant (Form 1098-T) ingestion yet.",
      "0.line.8s": "No Medicaid waiver payment scenario yet (W-2 box 12 code II not modeled).",
      "0.line.8t":
        "No nonqualified deferred comp / nongovernmental 457 pension scenario yet (W-2 box 11 not routed).",
      "0.line.8u": "No incarcerated-wages scenario yet.",
      "0.line.8v":
        "No ingestion for digital-asset ordinary income (staking, mining, forks) yet; 1099-DA covers only dispositions.",
      "1.line.24b": "No personal-property rental scenario (line 8l) yet.",
      "1.line.24c": "No Olympic/Paralympic medal or USOC prize scenario (line 8m) yet.",
      "1.line.24g": "No chaplain 403(b) contribution scenario or facts yet.",
      "1.line.24k":
        "No Schedule K-1 (Form 1041) ingestion yet for box 11 code A excess deductions.",
      "1.line.24z_type": "No write-in other-adjustment scenario or facts yet.",
      "1.line.24z": "No write-in other-adjustment scenario or facts yet.",
    },
  });
}

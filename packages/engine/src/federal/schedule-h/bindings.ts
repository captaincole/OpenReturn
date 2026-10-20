/*
 * Schedule H (Form 1040) — Household Employment Taxes, tax year 2025.
 * Drafted by `form-engine generate-bindings`, then written by hand from
 * the 2025 Schedule H and its instructions (irs-1040sh-inst-2025).
 *
 * Modeled: lines A–C and Part I (social security, Medicare, and
 * withheld income tax, lines 1–9). Not modeled: Part II (FUTA tax,
 * lines 10–26), which applies when line 9 is Yes, and Part IV (address
 * and signature), which only employers who do not file Form 1040 use.
 * Schedule 2 line 9 reads line 8 when line 9 is No.
 */

import { defineForm } from "../../defineForm.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { SSN } from "../../values.js";
import type { ScheduleHFilingInfo } from "./filingInfo.js";
import {
  ADDITIONAL_MEDICARE_WITHHOLDING_THRESHOLD,
  line9,
  lineA,
  lineAEmployees,
  lineB,
  lineC,
  lines7to9,
  partI,
} from "./lines.js";
import type { ScheduleH } from "./types.js";

const yes = (v: boolean | undefined) => (v === undefined ? undefined : v);
const no = (v: boolean | undefined) => (v === undefined ? undefined : !v);

export function register(): void {
  defineForm<ScheduleH, ScheduleHFilingInfo>("schedule-h", {
    bindings: {
      "0.header.employer_name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      // The EIN widget is a 9-box comb: digits only.
      "0.header.ein": (_, info) => info.householdEmployerEin?.replace(/\D/g, ""),
      "0.line.A_yes": (_, info) => yes(lineA(info)),
      "0.line.A_no": (_, info) => no(lineA(info)),
      "0.line.B_yes": (_, info) => yes(lineB(info)),
      "0.line.B_no": (_, info) => no(lineB(info)),
      "0.line.C_yes": (_, info) => yes(lineC(info)),
      "0.line.C_no": (_, info) => no(lineC(info)),
      // Line 1: W-2 box 3 of each line A employee. Document sum: round the total.
      "0.line.1": (_, info) =>
        partI(info)
          ? roundDollars(sum(...lineAEmployees(info).map((e) => e.socialSecurityWages)))
          : undefined,
      // Line 2: line 1 × 12.4% (employee and employer share together).
      "0.line.2": (f) =>
        f["0.line.1"] === undefined ? undefined : roundDollars(f["0.line.1"] * 0.124),
      "0.line.3": (_, info) =>
        partI(info)
          ? roundDollars(sum(...lineAEmployees(info).map((e) => e.medicareWages)))
          : undefined,
      // Line 4: line 3 × 2.9%.
      "0.line.4": (f) =>
        f["0.line.3"] === undefined ? undefined : roundDollars(f["0.line.3"] * 0.029),
      // Line 5: each employee's Medicare wages over $200,000.
      "0.line.5": (_, info) =>
        partI(info)
          ? roundDollars(
              sum(
                ...lineAEmployees(info).map((e) =>
                  atLeast(0, e.medicareWages - ADDITIONAL_MEDICARE_WITHHOLDING_THRESHOLD),
                ),
              ),
            )
          : undefined,
      // Line 6: line 5 × 0.9%.
      "0.line.6": (f) =>
        f["0.line.5"] === undefined ? undefined : roundDollars(f["0.line.5"] * 0.009),
      // Line 7: W-2 box 2 of every household employee.
      "0.line.7": (_, info) =>
        lines7to9(info)
          ? roundDollars(sum(...(info.householdEmployees ?? []).map((e) => e.federalTaxWithheld)))
          : undefined,
      "0.line.8": (f, info) =>
        lines7to9(info)
          ? sum(f["0.line.2"], f["0.line.4"], f["0.line.6"], f["0.line.7"])
          : undefined,
      "0.line.9_yes": (_, info) => yes(line9(info)),
      "0.line.9_no": (_, info) => no(line9(info)),
    },

    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    unsupported: {
      "1.line.10_yes":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.10_no":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.11_yes":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.11_no":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.12_yes":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.12_no":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.13_state_name":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.14": "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.15": "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.16": "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row1.state_name":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row1.taxable_wages":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row1.experience_period_from":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row1.experience_period_to":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row1.experience_rate":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row1.col_e_amount":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row1.col_f_amount":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row1.col_g_amount":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row1.contributions_paid":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row2.state_name":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row2.taxable_wages":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row2.experience_period_from":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row2.experience_period_to":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row2.experience_rate":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row2.col_e_amount":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row2.col_f_amount":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row2.col_g_amount":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.17.row2.contributions_paid":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.20": "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.21": "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.22": "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.23.late_contributions_credit_reduction":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.23": "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.signing.preparer_self_employed":
        "Paid preparer block: Summa does not model preparer details.",
      "1.signing.preparer_name": "Paid preparer block: Summa does not model preparer details.",
      "1.signing.preparer_ptin": "Paid preparer block: Summa does not model preparer details.",
      "1.signing.firm_name": "Paid preparer block: Summa does not model preparer details.",
      "1.signing.firm_ein": "Paid preparer block: Summa does not model preparer details.",
      "1.signing.firm_address": "Paid preparer block: Summa does not model preparer details.",
      "1.signing.firm_phone": "Paid preparer block: Summa does not model preparer details.",
      "1.line.18.taxable_wages_total":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.18.contributions_total":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.19": "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.26": "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.27_yes":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.line.27_no":
        "Part II (FUTA tax, lines 10–26) is not modeled. It applies when line 9 is Yes.",
      "1.header.employer_address":
        "Part IV address: only for household employers who do not file Form 1040.",
      "1.header.employer_apartment":
        "Part IV address: only for household employers who do not file Form 1040.",
      "1.header.employer_city":
        "Part IV address: only for household employers who do not file Form 1040.",
      "1.header.employer_state":
        "Part IV address: only for household employers who do not file Form 1040.",
      "1.header.employer_zip":
        "Part IV address: only for household employers who do not file Form 1040.",
      "1.line.24":
        "Part II/III (FUTA tax, lines 10–27) is not modeled. It applies when line 9 is Yes.",
      "1.line.25":
        "Part II/III (FUTA tax, lines 10–27) is not modeled. It applies when line 9 is Yes.",
    },

    todos: {},
  });
}

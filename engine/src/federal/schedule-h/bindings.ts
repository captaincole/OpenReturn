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

const yes = (value: boolean | undefined) => (value === undefined ? undefined : value);
const no = (value: boolean | undefined) => (value === undefined ? undefined : !value);

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
      "0.line.1": (_, info) =>
        partI(info)
          ? roundDollars(
              sum(...lineAEmployees(info).map((employee) => employee.socialSecurityWages)),
            )
          : undefined,
      // 12.4%: employee and employer share together.
      "0.line.2": (form) =>
        form["0.line.1"] === undefined ? undefined : roundDollars(form["0.line.1"] * 0.124),
      "0.line.3": (_, info) =>
        partI(info)
          ? roundDollars(sum(...lineAEmployees(info).map((employee) => employee.medicareWages)))
          : undefined,
      "0.line.4": (form) =>
        form["0.line.3"] === undefined ? undefined : roundDollars(form["0.line.3"] * 0.029),
      "0.line.5": (_, info) =>
        partI(info)
          ? roundDollars(
              sum(
                ...lineAEmployees(info).map((employee) =>
                  atLeast(0, employee.medicareWages - ADDITIONAL_MEDICARE_WITHHOLDING_THRESHOLD),
                ),
              ),
            )
          : undefined,
      "0.line.6": (form) =>
        form["0.line.5"] === undefined ? undefined : roundDollars(form["0.line.5"] * 0.009),
      "0.line.7": (_, info) =>
        lines7to9(info)
          ? roundDollars(
              sum(
                ...(info.householdEmployees ?? []).map((employee) => employee.federalTaxWithheld),
              ),
            )
          : undefined,
      "0.line.8": (form, info) =>
        lines7to9(info)
          ? sum(form["0.line.2"], form["0.line.4"], form["0.line.6"], form["0.line.7"])
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
        "Paid preparer block: OpenReturn does not model preparer details.",
      "1.signing.preparer_name": "Paid preparer block: OpenReturn does not model preparer details.",
      "1.signing.preparer_ptin": "Paid preparer block: OpenReturn does not model preparer details.",
      "1.signing.firm_name": "Paid preparer block: OpenReturn does not model preparer details.",
      "1.signing.firm_ein": "Paid preparer block: OpenReturn does not model preparer details.",
      "1.signing.firm_address": "Paid preparer block: OpenReturn does not model preparer details.",
      "1.signing.firm_phone": "Paid preparer block: OpenReturn does not model preparer details.",
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
  });
}

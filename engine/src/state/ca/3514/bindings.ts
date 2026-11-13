/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { numberOrBlank, roundDollars } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { childRowBindings } from "./childRows.js";
import { caEitcOutcome, creditLine, PART_YEAR_GAP, tableChildren } from "./credit.js";
import type { CaEitcBusiness, Form3514FilingInfo } from "./filingInfo.js";
import {
  businessIncome,
  investmentIncome,
  isGap,
  MEDICAID_WAIVER_GAP,
  partIV,
  type Lines,
  type PartIV,
} from "./lines.js";
import type { Form3514 } from "./types.js";
import { partIXBindings, partVIIBindings } from "./youngChildAndFosterYouthLines.js";

type Bindings = Partial<{ [K in keyof Form3514]: BindingFn<Form3514, Form3514FilingInfo, K> }>;

const yesNo = (answer: boolean | undefined) =>
  answer === undefined ? undefined : answer ? "yes" : "no";

/*
 * Parts VI, VIII and X (lines 21–22, 29–30, 40–41) are for Form 540NR
 * (::sec::step-7-how-to-figure-the-part-year-resident-eitc::b01: "If you file
 * Form 540 or 540 2EZ, skip Step 7"). Blank for a full-year resident; the
 * engine does not model Form 540NR.
 */
const partYearOnly = (_: Lines, info: Form3514FilingInfo) =>
  info.caFullYearResident === false ? unsupported(PART_YEAR_GAP) : undefined;

/* Part IV's line, printed when it is not 0 (a blank line counts as 0). */
const partIVLine = (pick: (lines: PartIV) => number) => (form: Lines, info: Form3514FilingInfo) => {
  const lines = partIV(form, info);
  if (isGap(lines)) return lines;
  if (lines === undefined) return undefined;
  const value = pick(lines);
  return value === 0 ? undefined : value;
};

/*
 * Lines 18a–18e (ca-3514-inst-2025::sec::worksheet-3::b01, ::b02): the
 * business with the largest net profit (loss). Blank with no business. The
 * license number and SEIN are left blank when there is none, and no fact
 * records them.
 */
const LICENSE_GAP =
  "FTB 3514 line 18c asks for the business license number, and no fact records it (blank when there is none).";
const SEIN_GAP =
  "FTB 3514 line 18d asks for the business's California SEIN, and no fact records it (blank when there is none).";

const business =
  (pick: (lines: CaEitcBusiness) => string | undefined) => (_: Lines, info: Form3514FilingInfo) =>
    info.caEitcBusiness === undefined ? undefined : pick(info.caEitcBusiness);

const businessGap = (reason: string) => (_: Lines, info: Form3514FilingInfo) =>
  info.caEitcHasBusiness ? unsupported(reason) : undefined;

/*
 * Header box (::sec::specific-instructions::b02): a married filer not filing
 * jointly who meets the separated-spouse rule with a qualifying child (Step
 * 1, question d) checks it.
 */
function separatedSpouseBox(info: Form3514FilingInfo): boolean {
  const separate =
    info.filingStatus === "married_filing_separately" || info.filingStatus === "head_of_household";
  const answers = info.caEitcAnswers ?? {};
  const apart =
    answers.livedApartLastSixMonths === true || answers.legallySeparatedApartAtYearEnd === true;
  return separate && apart && tableChildren(info) > 0;
}

const headerAndPartIBindings: Bindings = {
  // "Name(s) as shown on tax return": both spouses on a joint return.
  "0.header.names_on_return": (_, info) => namesOnReturn(info),
  // A nine-digit widget (maxLength 9): the SSN as digits, no formatter.
  "0.header.ssn_or_itin": (_, info) => info.taxpayerSSN,
  "0.header.separated_spouse_eitc": (_, info) => separatedSpouseBox(info),
  // Line 1a: the federal EIC answer (eic.denied_in_earlier_year).
  "0.line.1a_irs_disallowed_federal_eic": (_, info) =>
    yesNo(info.caEitcAnswers?.irsDisallowedEarlierYear),
  // Line 1b (::sec::specific-instructions::b01): a yes does not stop the credit.
  "0.line.1b_ftb_disallowed_ca_eitc": (_, info) =>
    yesNo(info.caEitcAnswers?.ftbDisallowedEarlierYear),
  // Line 2: "federal Form 1040 or 1040-SR, line 11b".
  "0.line.2_federal_agi": (form) => numberOrBlank(form["form-1040.line.11b"]),
  // Line 3: "federal Form 1040 or 1040-SR, line 27a"; blank when the federal EIC is.
  "0.line.3_federal_eic": (form) => numberOrBlank(form["form-1040.line.27a"]),
  // Line 4: Worksheet 1 line 12 (lines.ts); blank when it is 0 and no federal line has an amount.
  "0.line.4_investment_income": (form, info) => {
    const amount = investmentIncome(form, info);
    return isGap(amount) || amount !== 0 ? amount : undefined;
  },
};

const partIVBindings: Bindings = {
  // Line 13: shown even when a later line is a gap; it waits on a disability pension's answer.
  "1.line.13_ca_wages": (_, info) =>
    info.caEitcWages === undefined || info.caMedicaidWaiverPayments !== undefined
      ? undefined
      : roundDollars(info.caEitcWages) || undefined,
  // Line 14: an election to exclude Medicaid waiver (W-2 code II) or IHSS payments; no fact records it.
  "1.line.14_ihss_payments": (_, info) =>
    info.caMedicaidWaiverPayments === undefined ? undefined : unsupported(MEDICAID_WAIVER_GAP),
  "1.line.15_inmate_wages_nonqualified_pension": partIVLine((lines) => lines.line15),
  "1.line.16_wages_less_lines_14_15": partIVLine((lines) => lines.line16),
  "1.line.17_nontaxable_combat_pay": partIVLine((lines) => lines.line17),
  "1.line.18_business_income": (form, info) => businessIncome(form, info) || undefined,
  "1.line.18a_business_name": business((lines) => lines.name),
  "1.line.18b_business_address": business((lines) => lines.street),
  "1.line.18b_business_city": business((lines) => lines.city),
  "1.line.18b_business_state": business((lines) => lines.state),
  "1.line.18b_business_zip": business((lines) => lines.zip),
  "1.line.18c_business_license_number": businessGap(LICENSE_GAP),
  "1.line.18d_sein": businessGap(SEIN_GAP),
  "1.line.18e_business_code": business((lines) => lines.code),
  "1.line.19_ca_earned_income": partIVLine((lines) => lines.line19),
  // Line 20: the worksheet's Part III line 6 (credit.ts).
  "1.line.20_ca_eitc": (form, info) => creditLine(caEitcOutcome(form, info)),
};

const partYearBindings: Bindings = {
  "2.line.21_ca_exemption_credit_percentage_whole": partYearOnly,
  "2.line.21_ca_exemption_credit_percentage_decimal": partYearOnly,
  "2.line.22_part_year_resident_eitc": partYearOnly,
  "2.line.29_ca_exemption_credit_percentage_whole": partYearOnly,
  "2.line.29_ca_exemption_credit_percentage_decimal": partYearOnly,
  "2.line.30_part_year_resident_yctc": partYearOnly,
  "3.line.40_ca_exemption_credit_percentage_whole": partYearOnly,
  "3.line.40_ca_exemption_credit_percentage_decimal": partYearOnly,
  "3.line.41_part_year_resident_fytc": partYearOnly,
};

export function register(): void {
  defineForm<Form3514, Form3514FilingInfo>("form-3514", {
    bindings: {
      ...headerAndPartIBindings,
      ...childRowBindings(),
      ...partIVBindings,
      ...partYearBindings,
      ...partVIIBindings(),
      ...partIXBindings(),
    },
  });
}

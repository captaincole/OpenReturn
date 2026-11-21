/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import { numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8396FilingInfo } from "./filingInfo.js";
import {
  certificateCredit,
  certifiedInterest,
  creditLimit,
  creditRateText,
  currentYearCredit,
  partII,
  REFINANCE_STATEMENT,
  totalCredit,
  type CreditInputs,
  type CreditLimit,
  type PartIIResult,
} from "./lines.js";
import type { Form8396 } from "./types.js";

type Form = FormAccessor<Form8396>;
type Info = Form8396FilingInfo;

const isUnsupported = (value: object): value is Unsupported => "unsupported" in value;

/* Line 3, or why it cannot be figured; undefined while the certificate is not recorded. */
function line3Of(info: Info): number | Unsupported | undefined {
  const certificate = info.mortgageCreditCertificate;
  if (certificate === undefined) return undefined;
  const credit = certificateCredit(certificate);
  return isUnsupported(credit) ? credit : credit.line3;
}

/* Lines 3 to 6 once the certificate and the three carryforward answers are in. */
function inputsOf(info: Info): CreditInputs | Unsupported | undefined {
  const line3 = line3Of(info);
  const carried = info.mortgageCreditCarryforwards;
  if (line3 === undefined || carried === undefined) return undefined;
  if (typeof line3 !== "number") return line3;
  const { from2022, from2023, from2024 } = carried;
  if (from2022 === undefined || from2023 === undefined || from2024 === undefined) return undefined;
  return {
    line3,
    line4: roundDollars(from2022),
    line5: roundDollars(from2023),
    line6: roundDollars(from2024),
  };
}

/* "Enter any … carryforward": the amount, blank when there is none. */
const carried = (amount: number | undefined): number | undefined =>
  amount === undefined || roundDollars(amount) <= 0 ? undefined : roundDollars(amount);

/*
 * Credit Limit Worksheet B of the Schedule 8812 instructions applies with a
 * qualifying child under 17 (line 4 above 0) and this credit
 * (irs-1040s8-inst-2025::sec::line-21::b03); worksheet line 2 then takes its
 * line 14 instead of Form 1040 line 19
 * (irs-8396-form-2025::sec::line-8-credit-limit-worksheet::b01). The engine has
 * no Worksheet B. Form 2555, which turns it off, has no fact.
 */
const WORKSHEET_B =
  "With a qualifying child under 17, line 2 of the Credit Limit Worksheet takes line 14 of Credit Limit Worksheet B in the Schedule 8812 instructions instead of Form 1040 line 19; the engine does not figure Worksheet B.";

/*
 * Worksheet line 2 names Schedule 3 lines the engine does not compute yet. While
 * one of their forms files, the total would leave its credit out.
 */
const UNCOMPUTED_CREDITS: ReadonlyArray<[formId: string, line: string]> = [
  ["form-1116", "Schedule 3 line 1 (Form 1116)"],
  ["form-8863", "Schedule 3 line 3 (Form 8863)"],
  ["form-8880", "Schedule 3 line 4 (Form 8880)"],
  ["form-8936", "Schedule 3 lines 6f and 6m (Form 8936)"],
  ["form-8978", "Schedule 3 line 6l (Form 8978)"],
];

function creditLimitOf(form: Form, info: Info): CreditLimit | Unsupported | undefined {
  if (sum(form["schedule-8812.0.line.4_qualifying_children_under_17"]) > 0) {
    return unsupported(WORKSHEET_B);
  }
  const missing = UNCOMPUTED_CREDITS.find(([formId]) => info.mustFile?.[formId]?.value === true);
  if (missing) {
    return unsupported(
      `Line 2 of the Credit Limit Worksheet takes ${missing[1]}, which the engine does not compute yet.`,
    );
  }
  const line18 = numberOrBlank(form["form-1040.line.18"]);
  if (line18 === undefined) return undefined;
  const otherCredits = sum(
    form["form-1040.line.19"],
    form["schedule-3.0.line.1"],
    form["schedule-3.0.line.2"],
    form["schedule-3.0.line.3"],
    form["schedule-3.0.line.4"],
    form["schedule-3.0.line.6d"],
    form["schedule-3.0.line.6f"],
    form["schedule-3.0.line.6l"],
    form["schedule-3.0.line.6m"],
    form["form-5695.3.line.32"],
  );
  return creditLimit(line18, otherCredits);
}

/* Line 9, from lines 7 and 8. */
function line9Of(form: Form, info: Info): number | Unsupported | undefined {
  const inputs = inputsOf(info);
  const limit = creditLimitOf(form, info);
  if (inputs === undefined || limit === undefined) return undefined;
  if (isUnsupported(inputs)) return inputs;
  if (isUnsupported(limit)) return limit;
  return currentYearCredit(totalCredit(inputs), limit.line3);
}

/* Part II; blank when line 9 equals line 7 ("Complete only if line 9 is less than line 7"). */
function partIIOf(form: Form, info: Info): PartIIResult | Unsupported | undefined {
  const inputs = inputsOf(info);
  const line9 = line9Of(form, info);
  if (inputs === undefined || line9 === undefined) return undefined;
  if (isUnsupported(inputs)) return inputs;
  if (typeof line9 !== "number") return line9;
  return partII(inputs, line9);
}

const partIILine =
  (pick: (part: PartIIResult) => number) =>
  (form: Form, info: Info): number | Unsupported | undefined => {
    const part = partIIOf(form, info);
    if (part === undefined || isUnsupported(part)) return part;
    return pick(part);
  };

const limitLine =
  (pick: (limit: CreditLimit) => number) =>
  (form: Form, info: Info): number | Unsupported | undefined => {
    const limit = creditLimitOf(form, info);
    if (limit === undefined || isUnsupported(limit)) return limit;
    return pick(limit);
  };

const certificateText =
  (pick: (info: Info) => string | undefined) =>
  (_: Form, info: Info): string | undefined =>
    pick(info);

export function register(): void {
  defineForm<Form8396, Form8396FilingInfo>("form-8396", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: only when the main home's address differs from the return's (the form).
      "0.header.main_home_address": certificateText(
        (info) => info.mortgageCreditCertificate?.homeAddress,
      ),
      "0.header.certificate_issuer_name": certificateText(
        (info) => info.mortgageCreditCertificate?.issuerName,
      ),
      "0.header.certificate_number": certificateText(
        (info) => info.mortgageCreditCertificate?.certificateNumber,
      ),
      "0.header.certificate_issue_date": certificateText(
        (info) => info.mortgageCreditCertificate?.issueDate,
      ),
      // MANUAL EDIT: lines 1–3 (irs-8396-form-2025::sec::specific-instructions::b01, line-2::b01, line-3::b01).
      "0.line.1_interest_paid_certified_indebtedness": (_, info) => {
        const certificate = info.mortgageCreditCertificate;
        if (certificate === undefined) return undefined;
        return certificate.reissued?.ratesDifferThisYear === true
          ? unsupported(REFINANCE_STATEMENT)
          : certifiedInterest(certificate);
      },
      "0.line.2_certificate_credit_rate": (_, info) => {
        const certificate = info.mortgageCreditCertificate;
        if (certificate === undefined) return undefined;
        // "enter 'see attached' on the dotted line next to line 2" (refinanced-mortgage::b02).
        return certificate.reissued?.ratesDifferThisYear === true
          ? unsupported(REFINANCE_STATEMENT)
          : creditRateText(certificate);
      },
      "0.line.3_interest_times_credit_rate": (_, info) => line3Of(info),
      // MANUAL EDIT: lines 4–6 come from the 2024 Form 8396 lines 16, 14 and 17.
      "0.line.4_carryforward_from_2022": (_, info) =>
        carried(info.mortgageCreditCarryforwards?.from2022),
      "0.line.5_carryforward_from_2023": (_, info) =>
        carried(info.mortgageCreditCarryforwards?.from2023),
      "0.line.6_carryforward_from_2024": (_, info) =>
        carried(info.mortgageCreditCarryforwards?.from2024),
      "0.line.7_total_credit_available": (_, info) => {
        const inputs = inputsOf(info);
        return inputs === undefined || isUnsupported(inputs) ? inputs : totalCredit(inputs);
      },
      // MANUAL EDIT: line 8 is line 3 of the Credit Limit Worksheet (line-8-credit-limit-worksheet::b01).
      "0.line.8_tax_liability_limitation": limitLine((limit) => limit.line3),
      "0.line.9_current_year_mortgage_interest_credit": (form, info) => line9Of(form, info),
      "0.line.10_add_lines_3_and_4": partIILine((part) => part.line10),
      "0.line.11_amount_from_line_7": partIILine((part) => part.line11),
      "0.line.12_larger_of_line_9_or_10": partIILine((part) => part.line12),
      "0.line.13_line_11_minus_line_12": partIILine((part) => part.line13),
      "0.line.14_2024_carryforward_to_2026": partIILine((part) => part.line14),
      "0.line.15_line_13_minus_line_14": partIILine((part) => part.line15),
      "0.line.16_2023_carryforward_to_2026": partIILine((part) => part.line16),
      "0.line.17_2025_carryforward_to_2026": partIILine((part) => part.line17),
      "1.line8_worksheet.1_form_1040_line_18": limitLine((limit) => limit.line1),
      "1.line8_worksheet.2_total_other_credits": limitLine((limit) => limit.line2),
      "1.line8_worksheet.3_credit_limit": limitLine((limit) => limit.line3),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}

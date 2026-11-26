/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { monthDayYear } from "../8621/fundLine.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8611Copy, Form8611FilingInfo } from "./filingInfo.js";
import {
  decimalDigits,
  decimalText,
  type Line2Worksheet,
  type OwnPartLines,
  type RecaptureLines,
} from "./lines.js";
import type { Form8611 } from "./types.js";

type Value = number | string | undefined;
type Binding = (form: unknown, info: Form8611FilingInfo) => Value | Unsupported;
type Bindings = Partial<{ [K in keyof Form8611]: BindingFn<Form8611, Form8611FilingInfo, K> }>;

/* "If the issue does not have a CUSIP number, enter 'None.'" (specific-instructions::b01). */
const NO_CUSIP = "None";

/*
 * This copy for one line: unsupported from its gap's line on, undefined while
 * it waits or with no copy (a decision files the form with no fact).
 */
function copyFor(line: number, info: Form8611FilingInfo): Form8611Copy | Unsupported | undefined {
  const copy = info.form8611Copies?.[info.form8611CopyIndex ?? 0];
  if (copy?.gap && copy.gap.fromLine <= line) return unsupported(copy.gap.reason);
  if (copy?.waitingOn && copy.waitingOn.length > 0) return undefined;
  return copy;
}

const isGap = (value: object): value is Unsupported => "unsupported" in value;

/* A line the copy settles; the pick returns undefined for a line this copy leaves blank. */
function lineOf(line: number, pick: (copy: Form8611Copy) => Value): Binding {
  return (_, info) => {
    const copy = copyFor(line, info);
    return copy === undefined || isGap(copy) ? copy : pick(copy);
  };
}

/* Lines 1 to 7: a building the owner figures; blank for a K-1's recapture (specific-instructions::b01). */
const ownLine = (line: number, pick: (own: OwnPartLines) => Value): Binding =>
  lineOf(line, (copy) => (copy.own ? pick(copy.own) : undefined));

/* Lines 9 to 15. */
const recaptureLine = (line: number, pick: (lines: RecaptureLines) => number): Binding =>
  lineOf(line, (copy) => (copy.recapture ? pick(copy.recapture) : undefined));

/* The Line 2 Worksheet, printed only when one prior year has one (QUESTIONS.md). */
const worksheetLine = (pick: (worksheet: Line2Worksheet) => Value): Binding =>
  lineOf(2, (copy) => (copy.worksheet ? pick(copy.worksheet) : undefined));

/* Items C to F, from the building fact. */
function headerBindings(): Bindings {
  const bonds = (copy: Form8611Copy) => copy.building?.taxExemptBonds;
  const out: Record<string, Binding> = {
    // MANUAL EDIT: items C, D, E "as shown on Form 8609" (face-page-1::b01).
    "0.header.c_building_address": lineOf(0, (copy) => copy.building?.address),
    "0.header.d_building_identification_number": lineOf(
      0,
      (copy) => copy.building?.buildingIdentificationNumber,
    ),
    "0.header.e_date_placed_in_service": lineOf(0, (copy) =>
      copy.building ? monthDayYear(copy.building.placedInServiceDate) : undefined,
    ),
    // MANUAL EDIT: item F only for a building financed with tax-exempt bonds (specific-instructions::b01).
    "0.header.f1_bond_issuer_name": lineOf(0, (copy) => bonds(copy)?.issuerName),
    "0.header.f2_bond_date_of_issue": lineOf(0, (copy) => {
      const issueDate = bonds(copy)?.issueDate;
      return issueDate === undefined ? undefined : monthDayYear(issueDate);
    }),
    "0.header.f3_bond_name_of_issue": lineOf(0, (copy) => bonds(copy)?.issueName),
    "0.header.f4_bond_cusip_number": lineOf(0, (copy) => {
      const issue = bonds(copy);
      return issue === undefined ? undefined : (issue.cusipNumber ?? NO_CUSIP);
    }),
  };
  return out as Bindings;
}

/* Lines 1 to 8 (face-page-1::b01, b02; lines.ts). */
function partOneBindings(): Bindings {
  const out: Record<string, Binding> = {
    "0.line.1_total_credits_prior_years": ownLine(1, (own) => own.line1),
    "0.line.2_credits_additions_qualified_basis": ownLine(2, (own) => own.line2),
    "0.line.3_credits_subject_to_recapture": ownLine(3, (own) => own.line3),
    "0.line.4_credit_recapture_percentage_whole": ownLine(
      4,
      (own) => decimalDigits(own.line4).whole,
    ),
    "0.line.4_credit_recapture_percentage_decimal": ownLine(
      4,
      (own) => decimalDigits(own.line4).decimal,
    ),
    "0.line.5_accelerated_portion_of_credit": ownLine(5, (own) => own.line5),
    "0.line.6_percentage_decrease_qualified_basis_whole": ownLine(
      6,
      (own) => decimalDigits(own.line6).whole,
    ),
    "0.line.6_percentage_decrease_qualified_basis_decimal": ownLine(
      6,
      (own) => decimalDigits(own.line6).decimal,
    ),
    "0.line.7_accelerated_portion_recaptured": ownLine(7, (own) => own.line7),
    // MANUAL EDIT: line 8, the K-1 amount (face-page-1::b02; passThrough route form_8611_line_8).
    "0.line.8_recapture_from_flow_through_entity": lineOf(8, (copy) => copy.line8),
  };
  return out as Bindings;
}

/* Lines 9 to 17 and the Line 2 Worksheet. */
function partTwoBindings(): Bindings {
  const out: Record<string, Binding> = {
    "0.line.9_unused_portion_accelerated_amount": recaptureLine(9, (lines) => lines.line9),
    "0.line.10_net_recapture": recaptureLine(10, (lines) => lines.line10),
    "0.line.11_interest_on_line_10_recapture": recaptureLine(11, (lines) => lines.line11),
    "0.line.12_total_amount_subject_to_recapture": recaptureLine(12, (lines) => lines.line12),
    "0.line.13_unused_credits_this_building": recaptureLine(13, (lines) => lines.line13),
    "0.line.14_recapture_tax": recaptureLine(14, (lines) => lines.line14),
    "0.line.15_carryforward_low_income_housing_credit": recaptureLine(15, (lines) => lines.line15),
    // MANUAL EDIT: "Only section 42(j)(5) partnerships complete these lines" (lines-16-and-17::b01): blank on an individual return.
    "0.line.16_interest_on_line_7_recapture": () => undefined,
    "0.line.17_total_recapture": () => undefined,
    "1.line2_worksheet.a_form_8609a_line_10": worksheetLine((worksheet) => worksheet.lineA),
    "1.line2_worksheet.b_line_a_times_2": worksheetLine((worksheet) => worksheet.lineB),
    "1.line2_worksheet.c_form_8609a_line_11": worksheetLine((worksheet) => worksheet.lineC),
    "1.line2_worksheet.d_line_b_minus_c": worksheetLine((worksheet) => worksheet.lineD),
    "1.line2_worksheet.e_line_14_decimal_amount": worksheetLine((worksheet) =>
      decimalText(worksheet.lineE),
    ),
    "1.line2_worksheet.f_line_d_times_e": worksheetLine((worksheet) => worksheet.lineF),
    "1.line2_worksheet.g_line_d_minus_f": worksheetLine((worksheet) => worksheet.lineG),
    "1.line2_worksheet.h_line_16_divided_by_line_15": worksheetLine((worksheet) =>
      decimalText(worksheet.lineH),
    ),
    "1.line2_worksheet.i_line_g_times_h": worksheetLine((worksheet) => worksheet.lineI),
  };
  return out as Bindings;
}

export function register(): void {
  defineForm<Form8611, Form8611FilingInfo>("form-8611", {
    bindings: {
      // MANUAL EDIT: items A and B, the names and number of the return.
      "0.header.a_taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.b_identifying_number": (_, info) => info.taxpayerSSN,
      ...headerBindings(),
      ...partOneBindings(),
      ...partTwoBindings(),
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.b_identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}

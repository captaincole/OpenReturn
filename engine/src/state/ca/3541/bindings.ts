/*
 * FTB 3541, California Motion Picture and Television Production Credit, for
 * an individual on Form 540: one form per certificate. Part I and Part II
 * come from the certificate's facts and the credit taken (creditUsed.ts);
 * Part III is for corporations ("If you are not a corporation, skip Part
 * III", ca-3541-inst-2025::sec::part-iii-credit-assigned-to-affiliated-corporations-pursuant-to-the-film-credit-assignment-provisions::b01)
 * and stays blank; Part IV is the program 4.0 election (partIV.ts).
 */

import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import type { Unsupported } from "../../../types.js";
import {
  certificateFigures,
  certificateProgram,
  CREDIT_SOLD,
  statedPartI,
  type CertificateFigures,
} from "./certificate.js";
import { certificateCreditClaimed } from "./creditUsed.js";
import type { FilmCertificate, Form3541FilingInfo } from "./filingInfo.js";
import { FILM_PROGRAMS, line13, LINE_12B_INDIVIDUAL, type PartILines } from "./lines.js";
import { partIVOf, type PartIVResult } from "./partIV.js";
import type { Form3541 } from "./types.js";

type Info = Form3541FilingInfo;
type Form = FormAccessor<Form3541>;
type Bindings = Partial<{ [K in keyof Form3541]: BindingFn<Form3541, Info, K> }>;

const copyIndex = (info: Info) => info.form3541CopyIndex ?? 0;
const rowOf = (info: Info): FilmCertificate | undefined =>
  (info.filmCertificates ?? [])[copyIndex(info)];
const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/*
 * "Owner of credit. Complete the owner of credit section with the information
 * provided on the credit certificate issued by the CFC. If the name shown on
 * the California return is the same as the owner of the credit, enter 'Same.'"
 * (ca-3541-inst-2025::sec::specific-line-instructions::b01).
 */
const SAME_OWNER = "Same";

const header: Bindings = {
  // An individual files with an SSN or ITIN (the header's first box).
  "0.header.taxpayer_id_type": (_, info) => (rowOf(info) ? "ssn_or_itin" : undefined),
  "0.header.taxpayer_id_number": (_, info) => (rowOf(info) ? info.taxpayerSSN : undefined),
  "0.header.name_on_return": (_, info) => (rowOf(info) ? namesOnReturn(info) : undefined),
  // An individual has no Secretary of State file number: blank.
  "0.header.sos_file_number": () => undefined,
  "0.header.credit_owner_name": (_, info) => {
    const row = rowOf(info);
    return row === undefined ? undefined : (row.owner?.name ?? SAME_OWNER);
  },
  "0.header.credit_owner_id_type": (_, info) => rowOf(info)?.owner?.idType,
  "0.header.credit_owner_id_number": (_, info) => rowOf(info)?.owner?.idNumber,
  "0.header.credit_owner_sos_file_number": (_, info) => rowOf(info)?.owner?.sosFileNumber,
};

/* "Check only one box": the box of the certificate's program (the form). */
const programBoxes: Bindings = Object.fromEntries(
  FILM_PROGRAMS.map((program) => [
    program.box,
    (_: Form, info: Info) => {
      const row = rowOf(info);
      const found = row === undefined ? undefined : certificateProgram(row);
      if (found === undefined || isGap(found)) return found;
      return found.box === program.box;
    },
  ]),
);

const partIV = (form: Form, info: Info): PartIVResult | Unsupported | null | undefined =>
  rowOf(info) === undefined ? null : partIVOf((id) => form[id], info, copyIndex(info));

/*
 * "Check the last two boxes" when the program 4.0 credit is claimed and the
 * election is made (the form): checked when Part IV line 22 is above 0, the
 * credit that qualifies.
 */
const electionBox: Bindings = {
  "0.header.refundable_program_4_0_election": (form, info) => {
    if (rowOf(info) === undefined) return undefined;
    const lines = partIV(form, info);
    if (lines === undefined || isGap(lines)) return lines;
    return lines !== null && lines.line22 > 0;
  },
};

const stated = (pick: (lines: PartILines) => number | undefined) => (_: Form, info: Info) => {
  const row = rowOf(info);
  const lines = row === undefined ? undefined : statedPartI(row);
  return lines === undefined ? undefined : pick(lines);
};

const figured =
  (pick: (figures: CertificateFigures) => number | undefined) => (_: Form, info: Info) => {
    const row = rowOf(info);
    const figures = row === undefined ? undefined : certificateFigures(row);
    return figures === undefined || isGap(figures) ? figures : pick(figures);
  };

const partI: Bindings = {
  "0.line.a_year_certificate_issued": (_, info) => {
    const year = rowOf(info)?.yearIssued;
    return year === undefined ? undefined : String(year);
  },
  "0.line.b_credit_certificate_number": (_, info) => {
    const number = rowOf(info)?.certificateNumber;
    return number === undefined ? undefined : String(number);
  },
  "0.line.c_copyright_registration_number": (_, info) => rowOf(info)?.copyrightRegistrationNumber,
  "0.line.1_current_year_generated_credit": stated((lines) => lines.line1),
  "0.line.2_credit_from_passthrough_entities": stated((lines) => lines.line2),
  "0.line.3_credit_purchased_from_entities": stated((lines) => lines.line3),
  // Lines 4a to 4c: an eligible assignee "must be an affiliated corporation" (ca-3541-inst-2025::sec::b-assignment-of-credits::b03).
  "0.line.4a_credit_from_affiliated_corporations": () => undefined,
  "0.line.4b_assignor_name": () => undefined,
  "0.line.4c_assignor_id_number": () => undefined,
  "0.line.5a_credit_carryover_prior_year": stated((lines) => lines.line5a),
  // Line 5b: "only if you are an entity with affiliates" (ca-3541-inst-2025::sec::part-i-available-credit::b03).
  "0.line.5b_assignable_credit_carryover": () => undefined,
  "0.line.6_credit_sold_to_entities": (_, info) =>
    (rowOf(info)?.soldToOthers ?? 0) > 0 ? CREDIT_SOLD : undefined,
  // Line 7 takes Part III line 19, which an individual skips.
  "0.line.7_credit_assigned_to_affiliates": () => undefined,
  // Line 8: the credit an entity passes "to shareholders, partners, or members" (::b04).
  "0.line.8_credit_passed_through_k1": () => undefined,
  "0.line.9_credit_applied_sales_use_tax": stated((lines) => lines.line9),
  "0.line.10_total_credit_sold_assigned_applied": figured((figures) => figures.partI.line10),
  "0.line.11_total_available_credit": figured((figures) => figures.partI.line11),
};

const line12a = (form: Form, info: Info) =>
  rowOf(info) === undefined
    ? undefined
    : certificateCreditClaimed((id) => form[id], info, copyIndex(info));

/* Part II line 12d: Part IV line 22 when the credit qualifies; blank with no election. */
function line12d(form: Form, info: Info): number | Unsupported | undefined {
  const lines = partIV(form, info);
  if (lines === undefined || isGap(lines)) return lines;
  return lines !== null && lines.line22 > 0 ? lines.line22 : undefined;
}

const partII: Bindings = {
  "1.line.12a_credit_claimed": line12a,
  "1.line.12b_total_credit_assigned": figured(() => LINE_12B_INDIVIDUAL),
  // Line 12c: only with an FTB 3870 election for credit the $5,000,000 limit disallows; the limit is a gap in creditUsed.ts.
  "1.line.12c_credit_elected_refundable_future": () => undefined,
  "1.line.12d_program_4_credit_elected_refundable": line12d,
  "1.line.13_credit_carryover_future_years": (form, info) => {
    const figures = figured((each) => each.partI.line11)(form, info);
    const claimed = line12a(form, info);
    const refundable = line12d(form, info);
    for (const value of [figures, claimed, refundable]) if (isGap(value)) return value;
    if (typeof figures !== "number" || typeof claimed !== "number") return undefined;
    if (partIV(form, info) === undefined) return undefined;
    return line13(figures, claimed, refundable as number | undefined);
  },
};

const PART_III_FIELDS = [
  "1.line.14_total_credit_available_assignment",
  "1.line.15_tax",
  "1.line.16_credit_available_affiliated_corporations",
  "1.line.17_credit_available_col_d",
  ...[1, 2, 3, 4, 5].flatMap((row) =>
    ["a", "b", "c", "d"].map((column) => `1.line.18_row${row}_col_${column}`),
  ),
  "1.line.19_total_credit_assigned_col_c",
];
const partIII: Bindings = Object.fromEntries(PART_III_FIELDS.map((id) => [id, () => undefined]));

const fromPartIV =
  (pick: (lines: PartIVResult) => number | undefined) => (form: Form, info: Info) => {
    const lines = partIV(form, info);
    if (lines === undefined || isGap(lines)) return lines;
    return lines === null ? undefined : pick(lines);
  };

const partIVBindings: Bindings = {
  "1.line.20_program_4_credit_amount": fromPartIV((lines) => lines.line20),
  "1.line.21_ca_income_tax_liability": fromPartIV((lines) => lines.line21),
  "1.line.22_available_credit_elected_refundable": fromPartIV((lines) => lines.line22),
  "1.line.23_total_refundable_amount": fromPartIV((lines) => lines.line23),
  "1.line.24_annual_refundable_amount": fromPartIV((lines) => lines.line24),
  "1.line.25_refundable_credits_claimed": fromPartIV((lines) => lines.line25),
  "1.line.26_refundable_credit_carryover": fromPartIV((lines) => lines.line26),
};

export function register(): void {
  defineForm<Form3541, Form3541FilingInfo>("form-3541", {
    bindings: {
      ...header,
      ...programBoxes,
      ...electionBox,
      ...partI,
      ...partII,
      ...partIII,
      ...partIVBindings,
    },
  });
}

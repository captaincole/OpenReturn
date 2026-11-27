/*
 * FTB 3541 Part IV, the program 4.0 refundable credit election, and the
 * refundable credit Form 540 line 74 takes ("from form FTB 3541 ... line 25",
 * ca-540-inst-2025::sec::line-74-refundable-program-4-0-california-motion-picture-and-television-production-credit::b01).
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import { sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3805ZFilingInfo } from "../3805z/filingInfo.js";
import { certificateFigures } from "./certificate.js";
import { files3541, filmCreditsUsedTotal, taxBeforeProgram40 } from "./creditUsed.js";
import type { FilmCertificate, Form3541FilingInfo } from "./filingInfo.js";
import {
  BUSINESS_CREDIT_LIMIT,
  FORM_YEAR,
  line26,
  partIVLines,
  PROGRAM_4_0_CODE,
  programOf,
  type PartIVLines,
} from "./lines.js";

type ReadField = (fieldId: string) => unknown;
type Info = Form3541FilingInfo;

export interface PartIVResult extends PartIVLines {
  line25?: number;
  line26?: number;
}

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

const isProgram40 = (row: FilmCertificate) =>
  row.certificateNumber !== undefined &&
  programOf(row.certificateNumber)?.code === PROGRAM_4_0_CODE;

/*
 * The election is open to a program 4.0 credit that was not bought ("Do not
 * complete this part if you have purchased credits", the form), made "in the
 * first taxable year the certificate is issued"
 * (ca-3541-inst-2025::sec::what-s-new::b01).
 */
export const electsRefund = (row: FilmCertificate) =>
  row.refundableElection &&
  isProgram40(row) &&
  row.source !== "purchased" &&
  row.yearIssued === FORM_YEAR;

const TWO_PROGRAM_40_CERTIFICATES = unsupported(
  "With two program 4.0 certificates and an election, line 21 of each form would subtract the same tax; the instructions do not say how the tax is shared between them.",
);
const CREDIT_AFTER_PROGRAM_40 = unsupported(
  "Line 21 takes the tax left after every other nonrefundable credit, and Schedule P (540) applies the enterprise zone, passive, other state or PTE credit after program 4.0; the engine does not reorder the credits for the election.",
);
const NO_PROGRAM_40_LEFT = unsupported(
  "The program 4.0 credit left after line 10 is 0, so the tax left for it is not figured.",
);
const OVER_BUSINESS_CREDIT_LIMIT = unsupported(
  "The film credits taken and the annual refundable amount are over $5,000,000, so line 25 can be less than line 24 (ca-3541-inst-2025::sec::part-iv-program-4-0-refundable-credit-election::b02); the engine does not figure the limitation.",
);

/* The credit forms whose credits Schedule P (540) applies after Section B2. */
const LATER_CREDIT_FORMS = ["form-3801-cr", "schedule-s", "form-3804-cr"];

/*
 * FTB 3805Z's enterprise zone credit also comes after program 4.0 in Section
 * B2 (3805z/creditUsed.ts). The form also files for an EZ NOL alone, which
 * takes no credit, so only a stated credit carryover above 0 counts.
 */
function claimsEnterpriseZoneCredit(info: BaseFilingInfo & Partial<Form3805ZFilingInfo>): boolean {
  if (!files(info, "form-3805z")) return false;
  const zone = info.enterpriseZone;
  return (zone?.hiringCarryover ?? 0) + (zone?.salesTaxCarryover ?? 0) > 0;
}

const appliesCreditAfterProgram40 = (info: Info) =>
  LATER_CREDIT_FORMS.some((formId) => files(info, formId)) || claimsEnterpriseZoneCredit(info);

/* Part IV of the certificate at `index`: null when it does not elect; a gap; undefined while it waits. */
export function partIVOf(
  read: ReadField,
  info: Info,
  index: number,
): PartIVResult | Unsupported | null | undefined {
  const rows = info.filmCertificates ?? [];
  const row = rows[index];
  if (row === undefined || !electsRefund(row)) return null;
  if (rows.filter(isProgram40).length > 1) return TWO_PROGRAM_40_CERTIFICATES;
  if (appliesCreditAfterProgram40(info)) return CREDIT_AFTER_PROGRAM_40;
  const figures = certificateFigures(row);
  if (figures === undefined || "unsupported" in figures) return figures;
  if (figures.partI.line11 <= 0) return NO_PROGRAM_40_LEFT;
  const taxLeft = taxBeforeProgram40(read, info);
  if (taxLeft === undefined) return undefined;
  // Line 20: "Enter the amount from Part I, line 1, 2, or 4a" (the form).
  const line20 = sum(figures.partI.line1, figures.partI.line2);
  const lines = partIVLines(line20, taxLeft, figures.partI.line10 ?? 0);
  if (lines.line24 === undefined) return lines;
  const used = filmCreditsUsedTotal(read, info);
  if (typeof used !== "number") return used;
  // Line 25: the annual amount, which "may be less ... if your total business credit exceeds $5,000,000".
  if (used + lines.line24 > BUSINESS_CREDIT_LIMIT) return OVER_BUSINESS_CREDIT_LIMIT;
  return { ...lines, line25: lines.line24, line26: line26(lines.line24, lines.line24) };
}

/*
 * Form 540 line 74: the total of line 25 on every FTB 3541 that elects
 * ("add the amounts of line 25 for all forms",
 * ca-3541-inst-2025::sec::part-iv-program-4-0-refundable-credit-election::b03).
 * Blank with no election; a gap passes through; undefined while one waits.
 */
/*
 * The program 4.0 credit elected as refundable: line 22 of each form that
 * qualifies (Part II line 12d), 0 with none. It is not carried over ("Do not
 * include ... amounts included in Part IV", ca-3541-inst-2025::sec::part-ii-carryover-computation::b03),
 * so Schedule P (540) column (d) leaves it out too (decision A76).
 */
export function program40ElectedRefundable(
  read: ReadField,
  info: Info,
): number | Unsupported | undefined {
  const results = partIVResults(read, info);
  const gap = results.find((each) => each !== null && each !== undefined && "unsupported" in each);
  if (gap) return gap as Unsupported;
  if (results.some((each) => each === undefined)) return undefined;
  return sum(
    ...results.map((each) =>
      each !== null && each !== undefined && "line22" in each ? each.line22 : 0,
    ),
  );
}

function partIVResults(read: ReadField, info: Info) {
  return (info.filmCertificates ?? []).map((_, index) => partIVOf(read, info, index));
}

/* An election's Part IV still waits, so Form 540 line 78 waits too. */
export const refundableFilmCreditWaits = (read: ReadField, info: Info): boolean =>
  files3541(info) && partIVResults(read, info).some((each) => each === undefined);

export function refundableFilmCredit(
  read: ReadField,
  info: Info,
): number | Unsupported | undefined {
  if (!files3541(info)) return undefined;
  const results = partIVResults(read, info);
  const gap = results.find((each) => each !== null && each !== undefined && "unsupported" in each);
  if (gap) return gap as Unsupported;
  if (results.some((each) => each === undefined)) return undefined;
  const amounts = results.flatMap((each) =>
    each !== null && each !== undefined && "line20" in each && each.line25 !== undefined
      ? [each.line25]
      : [],
  );
  return amounts.length === 0 ? undefined : sum(...amounts);
}

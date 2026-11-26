/*
 * FTB 3541, California Motion Picture and Television Production Credit: the
 * arithmetic, pure. Written by hand from ca-3541-inst-2025. The only published
 * examples with numbers are the California Film Commission's Program 4.0
 * refundability examples (Part IV; QUESTIONS.md).
 */

import { atLeast, roundDollars, sum, sumOrBlank } from "../../../money.js";

/* Schedule P (540) Part III section the credit offsets tax in (the Credit Table). */
export type FilmCreditSection = "A2" | "B2";

export interface FilmProgram {
  /* The lowest certificate number of the program (the form's check boxes). */
  firstCertificate: number;
  /* The header box the program checks. */
  box:
    | "0.header.original_credit"
    | "0.header.new_credit"
    | "0.header.program_3_0_credit"
    | "0.header.soundstage_filming_credit"
    | "0.header.program_4_0_credit";
  /* "When you claim the credit, use" (ca-3541-inst-2025::sec::important-information::b05). */
  code: "223" | "237" | "239" | "245" | "248";
  /* The Credit Table's name, shortened to fit Form 540 line 43; the code names the credit. */
  name: string;
  /*
   * Original (223) and new (237) offset tax in Section A2; program 3.0 (239),
   * program 4.0 (248) and soundstage filming (245) in Section B2
   * (ca-540-sched-p-inst-2025::sec::credit-table::b01, ::b02, ::b03): "the
   * original and new credit cannot reduce regular tax below TMT"
   * (ca-3541-inst-2025::sec::c-limitations::b01).
   */
  section: FilmCreditSection;
}

/*
 * The programs in the order of the check boxes, which is also the order the
 * engine applies them in (QUESTIONS.md). Program 4.0 comes last: Part IV line
 * 21 takes the tax left after every other credit.
 */
export const FILM_PROGRAMS: ReadonlyArray<FilmProgram> = [
  {
    firstCertificate: 1000,
    box: "0.header.original_credit",
    code: "223",
    name: "Motion Picture",
    section: "A2",
  },
  {
    firstCertificate: 5000,
    box: "0.header.new_credit",
    code: "237",
    name: "New Motion Picture",
    section: "A2",
  },
  {
    firstCertificate: 7000,
    box: "0.header.program_3_0_credit",
    code: "239",
    name: "Program 3.0 Motion Picture",
    section: "B2",
  },
  {
    firstCertificate: 8000,
    box: "0.header.soundstage_filming_credit",
    code: "245",
    name: "Soundstage Filming",
    section: "B2",
  },
  {
    firstCertificate: 8200,
    box: "0.header.program_4_0_credit",
    code: "248",
    name: "Program 4.0 Motion Picture",
    section: "B2",
  },
];

export const PROGRAM_4_0_CODE = "248";

/* The program a certificate number belongs to; undefined below 1000 (no box fits). */
export function programOf(certificateNumber: number): FilmProgram | undefined {
  return [...FILM_PROGRAMS]
    .reverse()
    .find((program) => certificateNumber >= program.firstCertificate);
}

/*
 * "For taxable years beginning on or after January 1, 2024, and before
 * January 1, 2027, there is a $5,000,000 limitation on the application of
 * business credits" (ca-3541-inst-2025::sec::c-limitations::b01).
 */
export const BUSINESS_CREDIT_LIMIT = 5_000_000;

/* Part IV: "Multiply line 22 by 90%" and "Multiply line 23 by 20%" (the form). */
export const TOTAL_REFUNDABLE_SHARE = 0.9;
export const ANNUAL_REFUNDABLE_SHARE = 0.2;

/* The tax year of this form: the election is made "in the first taxable year the certificate is issued". */
export const FORM_YEAR = 2025;

export type FilmCreditSource = "generated" | "pass_through" | "purchased";

export interface PartIInputs {
  source: FilmCreditSource;
  credit: number;
  carryover: number;
  appliedToSalesAndUseTax: number;
}

export interface PartILines {
  line1?: number;
  line2?: number;
  line3?: number;
  line5a?: number;
  line9?: number;
  line10?: number;
  line11: number;
}

const positive = (amount: number) => (amount > 0 ? roundDollars(amount) : undefined);

/*
 * Part I for an individual. Lines 1 to 3 take the credit by how it was
 * received (ca-3541-inst-2025::sec::part-i-available-credit::b01, ::b02).
 * Lines 4a to 4c, 5b, 7 and 8 are for corporations and pass-through entities
 * (::b03, ::b04; Part III: "If you are not a corporation, skip Part III"),
 * and line 6 needs FTB 3551, so they stay blank here. Line 10: "Add line 6
 * through line 9". Line 11: "Subtract line 10 from any entry made on line 1,
 * line 2, line 3, line 4a, or line 5a", read as their total (QUESTIONS.md).
 */
export function partILines(input: PartIInputs): PartILines {
  const current = positive(input.credit);
  const line1 = input.source === "generated" ? current : undefined;
  const line2 = input.source === "pass_through" ? current : undefined;
  const line3 = input.source === "purchased" ? current : undefined;
  const line5a = positive(input.carryover);
  const line9 = positive(input.appliedToSalesAndUseTax);
  const line10 = sumOrBlank(line9);
  const line11 = atLeast(0, sum(line1, line2, line3, line5a) - (line10 ?? 0));
  return { line1, line2, line3, line5a, line9, line10, line11 };
}

/*
 * Line 12b: "If you are not a corporation, enter 0" (the form). Printed as 0.
 */
export const LINE_12B_INDIVIDUAL = 0;

/* Line 13: "Add lines 12a, 12b, 12c, and 12d, subtract the result from line 11" (the form). */
export const line13 = (line11: number, line12a: number, line12d: number | undefined): number =>
  line11 - sum(line12a, LINE_12B_INDIVIDUAL, line12d);

export interface PartIVLines {
  line20: number;
  line21: number;
  line22: number;
  line23?: number;
  line24?: number;
}

/*
 * Part IV. Line 20 is the 2025 credit (Part I line 1, 2 or 4a). Line 21 is
 * the tax less every nonrefundable credit other than program 4.0, plus Part I
 * line 10 and Part II line 12b
 * (ca-3541-inst-2025::sec::part-iv-program-4-0-refundable-credit-election::b02).
 * Line 22 is line 20 less line 21; "If zero or less, stop" (the form): line 22
 * prints 0 and lines 23 and 24 stay blank. Line 23 is 90% of line 22 and line
 * 24 is 20% of line 23, each rounded to the nearest dollar.
 */
export function partIVLines(line20: number, taxLeft: number, line10: number): PartIVLines {
  const line21 = sum(atLeast(0, taxLeft), line10, LINE_12B_INDIVIDUAL);
  const excess = line20 - line21;
  if (excess <= 0) return { line20, line21, line22: 0 };
  const line23 = roundDollars(excess * TOTAL_REFUNDABLE_SHARE);
  const line24 = roundDollars(line23 * ANNUAL_REFUNDABLE_SHARE);
  return { line20, line21, line22: excess, line23, line24 };
}

/* Line 26: "Subtract line 25 from line 24" (the form). */
export const line26 = (line24: number, line25: number): number => line24 - line25;

/*
 * The credit of one code used this year, shared among its certificates in
 * the order given (the oldest first: "Apply the credit carryover to the
 * earliest taxable year", ca-3541-inst-2025::sec::d-carryover::b01). Each
 * takes up to its line 11.
 */
export function shareUsed(used: number, available: readonly number[]): number[] {
  let left = atLeast(0, used);
  return available.map((amount) => {
    const taken = Math.min(amount, left);
    left -= taken;
    return taken;
  });
}

/* Column (b) of a credit row: the smaller of the credit and the tax left (ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01). */
export const creditTaken = (available: number, taxLeft: number): number =>
  Math.min(available, atLeast(0, taxLeft));

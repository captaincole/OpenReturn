/*
 * The motion picture credits the return takes, by credit code: every
 * certificate of a code adds to one line ("enter the sum of this line for all
 * forms FTB 3541 on your current year tax return using the appropriate credit
 * code", ca-3541-inst-2025::sec::part-ii-carryover-computation::b01).
 * Original (223) and new (237) take Schedule P (540) Section A2 lines 6 and 7;
 * program 3.0, soundstage filming and program 4.0 take Section B2 from line
 * 16, before FTB 3801-CR's passive credits (QUESTIONS.md, decision A68).
 * Form 540 lines 43 to 45, Schedule P (540), Schedule S line 2, FTB 3801-CR
 * and FTB 3804-CR read them here. `read` takes a full field id.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import { numberOrBlank, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { taxBeforeSectionB2 } from "../540/creditBalance.js";
import { certificateFigures, type CertificateFigures } from "./certificate.js";
import type { FilmCertificate, Form3541FilingInfo } from "./filingInfo.js";
import {
  BUSINESS_CREDIT_LIMIT,
  creditTaken,
  FILM_PROGRAMS,
  PROGRAM_4_0_CODE,
  shareUsed,
  type FilmProgram,
} from "./lines.js";

type ReadField = (fieldId: string) => unknown;
type Info = Form3541FilingInfo;

export interface FilmCodeCredit {
  program: FilmProgram;
  /* The total of line 11 of the code's certificates (Schedule P (540) column (a)). */
  available: number;
  /* The Schedule P (540) Part III line the code takes. */
  line: number;
}

export interface FilmCodeUsed extends FilmCodeCredit {
  /* Schedule P (540) column (b), or the credit up to the tax left. */
  used: number;
}

export const files3541 = (info: BaseFilingInfo) => info.mustFile?.["form-3541"]?.value === true;
const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

/*
 * DECISION (2026-11-26, by the author): in Schedule P (540) Section B2 the
 * motion picture credits come first (program 3.0, soundstage filming, then
 * program 4.0), before FTB 3801-CR's research, orphan drug and low-income
 * housing credits.
 * - Schedule P (540) Section B2: "Generally, it is to your advantage to apply
 *   credits with limited carryovers before credits with no limitation on
 *   carryover. However, you may apply credits with no limitation on carryover
 *   first, if that is to your advantage"
 *   (ca-540-sched-p-inst-2025::sec::section-b2-instructions::b01).
 * - The business credit limitation: the low-income housing credit is
 *   "required to be applied after any business credits are applied"
 *   (ca-540-sched-p-inst-2025::sec::how-to-compute-the-limitation::b01), and
 *   FTB 3541 Part IV line 21 takes the tax after "any non-refundable credits
 *   (except program 4.0)" (ca-3541-inst-2025::sec::part-iv-program-4-0-refundable-credit-election::b02).
 * The film credits carry over nine years (ca-3541-inst-2025::sec::d-carryover::b01)
 * and the research credit has no limit, so the general rule puts them first;
 * program 4.0 is the last film credit, so its election sees the tax after the
 * others. One order for every return: the taxpayer does not pick.
 * Section A2 takes lines 6 and 7; Section B2 starts at line 16.
 */
export const SECTION_A2_FILM_LINES = [6, 7] as const;
export const SECTION_B2_FIRST_LINE = 16;

const NONRESIDENT_RETURN = unsupported(
  "The credit on a Form 540NR return is limited by Form 540NR and Schedule P (540NR), which have no rules yet.",
);
const DISREGARDED_ENTITY = unsupported(
  "A credit received from a disregarded business entity is limited to the tax on that entity's income (ca-3541-inst-2025::sec::c-limitations::b03), which needs the tax figured with and without it; the engine does not figure it.",
);
const OVER_BUSINESS_CREDIT_LIMIT = unsupported(
  "The film credits are over $5,000,000, so the business credit limitation and the FTB 3870 election (ca-3541-inst-2025::sec::c-limitations::b01) can apply; the engine does not figure them.",
);
const SECTION_A2_NEEDS_SCHEDULE_P = unsupported(
  "An original or new credit cannot reduce regular tax below TMT, which Schedule P (540) Section A2 figures (ca-3541-inst-2025::sec::c-limitations::b01), and the return does not complete Schedule P (540).",
);

const certificatesOf = (info: Info): FilmCertificate[] => info.filmCertificates ?? [];

/* Every certificate's figures, in the order of the forms; a gap; undefined while one waits. */
export function allCertificateFigures(info: Info): CertificateFigures[] | Unsupported | undefined {
  const figures = certificatesOf(info).map(certificateFigures);
  const gap = figures.find((each) => each !== undefined && "unsupported" in each);
  if (gap !== undefined) return gap as Unsupported;
  if (figures.some((each) => each === undefined)) return undefined;
  return figures as CertificateFigures[];
}

/* A case of the whole return the engine does not handle, else undefined. */
function returnGap(info: Info): Unsupported | undefined {
  if (files(info, "form-540nr")) return NONRESIDENT_RETURN;
  if (certificatesOf(info).some((row) => row.throughDisregardedEntity)) return DISREGARDED_ENTITY;
  return undefined;
}

/* The credit of each code above 0, in the order of FILM_PROGRAMS; [] with no FTB 3541. */
export function filmCreditsAvailable(info: Info): FilmCodeCredit[] | Unsupported | undefined {
  if (!files3541(info)) return [];
  const gap = returnGap(info);
  if (gap !== undefined) return gap;
  const figures = allCertificateFigures(info);
  if (figures === undefined || !Array.isArray(figures)) return figures;
  const total = sum(...figures.map((each) => each.partI.line11));
  if (total > BUSINESS_CREDIT_LIMIT) return OVER_BUSINESS_CREDIT_LIMIT;
  const credits = FILM_PROGRAMS.map((program) => ({
    program,
    available: sum(
      ...figures
        .filter((each) => each.program.code === program.code)
        .map((each) => each.partI.line11),
    ),
  })).filter((credit) => credit.available > 0);
  const a2 = credits.filter((credit) => credit.program.section === "A2");
  const b2 = credits.filter((credit) => credit.program.section === "B2");
  return [
    ...a2.map((credit, index) => ({ ...credit, line: SECTION_A2_FILM_LINES[index] })),
    ...b2.map((credit, index) => ({ ...credit, line: SECTION_B2_FIRST_LINE + index })),
  ];
}

/* The Section B2 film credits, for the rows and the passive credits that follow them. */
export function filmSectionB2Credits(info: Info): FilmCodeCredit[] | Unsupported | undefined {
  const credits = filmCreditsAvailable(info);
  if (credits === undefined || !Array.isArray(credits)) return credits;
  return credits.filter((credit) => credit.program.section === "B2");
}

const page = (credit: FilmCodeCredit) => (credit.program.section === "A2" ? 2 : 3);
export const scheduleColumn = (
  credit: FilmCodeCredit,
  column: "credit_used_col_b" | "tax_balance_col_c",
) => `schedule-p.${page(credit)}.part3.${credit.line}_${column}`;

/*
 * The credit taken of each code. With Schedule P (540), column (b) of its line
 * (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01). Without it,
 * each Section B2 credit in turn up to the tax left after the credits before
 * Section B2: they "can reduce the tax below the TMT"
 * (ca-3541-inst-2025::sec::c-limitations::b01), so no TMT floor applies.
 */
export function filmCreditsUsed(
  read: ReadField,
  info: Info,
): FilmCodeUsed[] | Unsupported | undefined {
  const credits = filmCreditsAvailable(info);
  if (credits === undefined || !Array.isArray(credits)) return credits;
  if (credits.length === 0) return [];
  if (files(info, "schedule-p")) {
    const used = credits.map((credit) =>
      numberOrBlank(read(scheduleColumn(credit, "credit_used_col_b"))),
    );
    if (used.some((amount) => amount === undefined)) return undefined;
    return credits.map((credit, index) => ({ ...credit, used: used[index] as number }));
  }
  if (credits.some((credit) => credit.program.section === "A2")) return SECTION_A2_NEEDS_SCHEDULE_P;
  let balance = taxBeforeSectionB2(read, info);
  if (balance === undefined) return undefined;
  return credits.map((credit) => {
    const used = creditTaken(credit.available, balance as number);
    balance = (balance as number) - used;
    return { ...credit, used };
  });
}

/* The total taken: 0 with no FTB 3541; a gap; undefined while it waits. */
export function filmCreditsUsedTotal(
  read: ReadField,
  info: Info,
): number | Unsupported | undefined {
  const credits = filmCreditsUsed(read, info);
  if (credits === undefined || !Array.isArray(credits)) return credits;
  return sum(...credits.map((credit) => credit.used));
}

/*
 * Line 12a of the certificate at `index`: its share of its code's credit
 * taken, the oldest certificate first (lines.ts, shareUsed).
 */
export function certificateCreditClaimed(
  read: ReadField,
  info: Info,
  index: number,
): number | Unsupported | undefined {
  const used = filmCreditsUsed(read, info);
  if (used === undefined || !Array.isArray(used)) return used;
  const figures = allCertificateFigures(info) as CertificateFigures[];
  const code = figures[index]?.program.code;
  const codeUsed = used.find((credit) => credit.program.code === code)?.used ?? 0;
  const rows = certificatesOf(info);
  const sameCode = figures
    .map((each, position) => ({ each, position, year: rows[position].yearIssued ?? 0 }))
    .filter(({ each }) => each.program.code === code)
    .sort((left, right) => left.year - right.year || left.position - right.position);
  const shares = shareUsed(
    codeUsed,
    sameCode.map(({ each }) => each.partI.line11),
  );
  return shares[sameCode.findIndex(({ position }) => position === index)] ?? 0;
}

/*
 * The tax left for the program 4.0 credit: with Schedule P (540), its row's
 * column (b) plus column (c), the balance before the row; without it, the
 * tax before Section B2 less the film credits before it. Undefined while it
 * waits or with no program 4.0 credit above 0.
 */
export function taxBeforeProgram40(read: ReadField, info: Info): number | undefined {
  const credits = filmCreditsUsed(read, info);
  if (credits === undefined || !Array.isArray(credits)) return undefined;
  const position = credits.findIndex((credit) => credit.program.code === PROGRAM_4_0_CODE);
  if (position < 0) return undefined;
  if (files(info, "schedule-p")) {
    const balance = numberOrBlank(read(scheduleColumn(credits[position], "tax_balance_col_c")));
    return balance === undefined ? undefined : balance + credits[position].used;
  }
  const before = taxBeforeSectionB2(read, info);
  if (before === undefined) return undefined;
  const earlier = credits.slice(0, position).filter((credit) => credit.program.section === "B2");
  return before - sum(...earlier.map((credit) => credit.used));
}

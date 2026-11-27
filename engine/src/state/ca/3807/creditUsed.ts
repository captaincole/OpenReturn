/*
 * The LAMBRA credit the return takes: code 198, one line in Schedule P (540)
 * Section A2 ("Offset Tax in Section: A2", ca-540-sched-p-inst-2025::sec::credit-table::b06).
 * Schedule P (540), FTB 3807 lines 1a and 1b, Form 540 lines 43 to 45 and
 * Schedule S line 2 read it here. `read` takes a full field id.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { filmCreditsAvailable, SECTION_A2_FILM_LINES } from "../3541/creditUsed.js";
import type { Form3541FilingInfo } from "../3541/filingInfo.js";
import { files3807, lambraCreditOffered, type Info, type ReadField } from "./figures.js";

export { files3807 };

type CreditInfo = Info & Form3541FilingInfo;

const NO_SCHEDULE_P = unsupported(
  "The LAMBRA credit cannot reduce regular tax below tentative minimum tax, which Schedule P (540) Section A2 figures (ca-540-sched-p-inst-2025::sec::credit-table::b06, ::section-a-instructions::b01); the decision says Schedule P (540) does not file, though a Section A2 credit attaches it (::b-who-must-file::b01).",
);

const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/*
 * DECISION (2026-11-26, by the author): in Schedule P (540) Section A2 the
 * LAMBRA credit takes the line after FTB 3541's original and new motion
 * picture credits (lines 6 and 7 when both are claimed).
 * - Schedule P (540) Section A2: "Follow the Credit Table Instructions to find
 *   out in which section to claim your credit. Then complete column (a)
 *   through column (d) for each credit in each section before going to the
 *   next section" (ca-540-sched-p-inst-2025::sec::section-a2-instructions::b01):
 *   no order inside the section.
 * - Section B2's rule for an order: "Generally, it is to your advantage to
 *   apply credits with limited carryovers before credits with no limitation on
 *   carryover. However, you may apply credits with no limitation on carryover
 *   first, if that is to your advantage" (::section-b2-instructions::b01). The
 *   LAMBRA carryover is limited to 10 years
 *   (ca-3807-booklet-2025::sec::lambra-credits-carryover-period::b01) and the
 *   film credits to 9 (decision A75), so the rule does not pick one.
 * The engine keeps the film credits on their lines and puts the LAMBRA credit
 * on the next one, the same order on every return. It changes dollars only
 * when the tax over TMT cannot cover both.
 */
export function lambraScheduleLine(info: CreditInfo): number | Unsupported | undefined {
  const film = filmCreditsAvailable(info);
  if (film === undefined || isGap(film)) return film;
  const filmA2 = film.filter((credit) => credit.program.section === "A2").length;
  return SECTION_A2_FILM_LINES[0] + filmA2;
}

/*
 * The credit taken: Schedule P (540) column (b) of the LAMBRA line
 * (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01). 0 with no
 * FTB 3807 or no credit offered. A gap passes through, so Form 540 never drops
 * the credit in silence. Undefined while it waits.
 */
export function lambraCreditUsed(
  read: ReadField,
  info: CreditInfo,
): number | Unsupported | undefined {
  const offered = lambraCreditOffered(read, info);
  if (typeof offered !== "number") return offered;
  if (offered <= 0) return 0;
  if (info.mustFile?.["schedule-p"]?.value !== true) return NO_SCHEDULE_P;
  const line = lambraScheduleLine(info);
  if (typeof line !== "number") return line;
  return numberOrBlank(read(`schedule-p.2.part3.${line}_credit_used_col_b`));
}

/* The same for a reader typed with only the base filing info (Form 540, Schedule S). */
export const lambraCreditOnReturn = (
  read: ReadField,
  info: BaseFilingInfo,
): number | Unsupported | undefined => lambraCreditUsed(read, info as CreditInfo);

/*
 * Schedule P (540) Part III, Section B2 lines 16 to 18: FTB 3541's program
 * 3.0, soundstage filming and program 4.0 credits (codes 239, 245, 248), FTB
 * 3805Z's enterprise zone credit carryovers (code 176), FTB 3809's TTA credit
 * carryovers (code 210), then
 * the California passive credits that FTB 3801-CR allows, one code a line ("Do not enter the same
 * credit code or name on more than one line within a section",
 * ca-540-sched-p-inst-2025::sec::to-complete-part-iii::b01). The low-income
 * housing (172), research (183) and orphan drug (185) credits offset tax in
 * Section B2 (ca-540-sched-p-inst-2025::sec::credit-table::b02, ::b03, ::b06).
 * Columns (a) to (d) follow the column rules (3804-cr/lines.ts,
 * scheduleCreditRow). A line with no passive credit keeps its reason: the
 * other Section B2 credits have no facts.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { isGap } from "../../../federal/3800/cells.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { filmSectionB2Credits } from "../3541/creditUsed.js";
import type { Form3541FilingInfo } from "../3541/filingInfo.js";
import { PROGRAM_4_0_CODE } from "../3541/lines.js";
import { program40ElectedRefundable } from "../3541/partIV.js";
import {
  passiveCreditsAllowed,
  SECTION_B2_LINES,
  TOO_MANY_B2_CREDITS,
  type PassiveCreditTaken,
} from "../3801-cr/creditUsed.js";
import type { Form3801CRInfo } from "../3801-cr/filingInfo.js";
import { scheduleCreditRow, type CreditRow } from "../3804-cr/lines.js";
import { enterpriseZoneSectionB2Credits } from "../3805z/creditUsed.js";
import type { Info as Form3805ZInfo } from "../3805z/figures.js";
import { ttaSectionB2Credit } from "../3809/creditUsed.js";
import type { Form3809FilingInfo } from "../3809/filingInfo.js";
import type { SchedulePFilingInfo } from "./filingInfo.js";
import type { ScheduleP } from "./types.js";

type Info = SchedulePFilingInfo &
  Form3801CRInfo &
  Form3541FilingInfo &
  Form3805ZInfo &
  Form3809FilingInfo;
type Bindings = Partial<{ [K in keyof ScheduleP]: BindingFn<ScheduleP, Info, K> }>;
type Form = FormAccessor<ScheduleP>;
type SectionB2Line = (typeof SECTION_B2_LINES)[number];

/* The reason a line keeps when it has no passive credit: the one it had before. */
export const noCreditReason = (line: number) =>
  `Section B2 line ${line}, a credit with carryover provisions chosen from the Credit Table — no credit facts.`;

/* Section B1 lines 12 to 15, bottom up, then line 11: the balance before line 16. */
const BALANCES_BEFORE_B2: Array<keyof ScheduleP> = [
  "2.part3.15_renters_tax_balance_col_c",
  "2.part3.14_senior_hoh_tax_balance_col_c",
  "2.part3.13_dependent_parent_tax_balance_col_c",
  "2.part3.12_joint_custody_hoh_tax_balance_col_c",
  "2.part3.11_tax_balance_col_c",
];

function balanceBeforeB2(form: Form): number | undefined {
  for (const id of BALANCES_BEFORE_B2) {
    const balance = numberOrBlank(form[id]);
    if (balance !== undefined) return balance;
  }
  return undefined;
}

type SectionB2Credit = Pick<PassiveCreditTaken, "name" | "allowed"> & { code: string };

/*
 * The credits of lines 16 to 18 in order: FTB 3541's motion picture credits
 * first, then FTB 3805Z's enterprise zone credit, then FTB 3809's TTA credit,
 * then FTB 3801-CR's passive credits (3541/creditUsed.ts, decision A75;
 * 3805z/creditUsed.ts; 3809/creditUsed.ts).
 */
function sectionB2Credits(form: Form, info: Info): SectionB2Credit[] | Unsupported | undefined {
  const read = (fieldId: string) => form[fieldId];
  const passive = passiveCreditsAllowed(read, info);
  if (passive === undefined || isGap(passive)) return passive;
  const film = filmSectionB2Credits(info);
  if (film === undefined || isGap(film)) return film;
  const enterpriseZone = enterpriseZoneSectionB2Credits(read, info);
  if (enterpriseZone === undefined || isGap(enterpriseZone)) return enterpriseZone;
  const tta = ttaSectionB2Credit(read, info);
  if (tta === undefined || isGap(tta)) return tta;
  const ttaRows = tta === null ? [] : [tta];
  const count = film.length + enterpriseZone.length + ttaRows.length + passive.length;
  if (count > SECTION_B2_LINES.length) return TOO_MANY_B2_CREDITS;
  return [
    ...film.map(({ program, available }) => ({
      code: program.code,
      name: program.name,
      allowed: available,
    })),
    ...enterpriseZone.map(({ code, name, allowed }) => ({ code, name, allowed })),
    ...ttaRows,
    ...passive,
  ];
}

/* Each credit's row in order: column (b) of a row is the smaller of (a) and the previous (c). */
function sectionB2Rows(
  form: Form,
  info: Info,
): Array<{ credit: SectionB2Credit; row: CreditRow }> | Unsupported | undefined {
  const credits = sectionB2Credits(form, info);
  if (credits === undefined || isGap(credits)) return credits;
  let balance = balanceBeforeB2(form);
  if (balance === undefined) return credits.length === 0 ? [] : undefined;
  return credits.map((credit) => {
    const row = scheduleCreditRow(credit.allowed, balance as number);
    balance = row.balance;
    return { credit, row };
  });
}

/* One field of line `line`: the credit's value, else the line's reason. */
const column =
  (line: SectionB2Line, pick: (credit: SectionB2Credit, row: CreditRow) => unknown) =>
  (form: Form, info: Info) => {
    const index = SECTION_B2_LINES.indexOf(line);
    const allowed = sectionB2Credits(form, info);
    if (allowed === undefined || isGap(allowed)) return allowed;
    if (allowed.length <= index) return unsupported(noCreditReason(line));
    const rows = sectionB2Rows(form, info);
    if (rows === undefined || isGap(rows)) return rows;
    return pick(rows[index].credit, rows[index].row);
  };

/*
 * Column (d): column (a) less column (b). For the program 4.0 credit, also
 * less the part elected refundable on FTB 3541 Part IV, which is not carried
 * over (3541/partIV.ts).
 *
 * DECISION (2026-11-26, by the author): column (d) of the program 4.0 credit
 * leaves out the credit elected refundable on FTB 3541 Part IV.
 * - Schedule P (540) column (d): subtract "the amount in column (b) and any
 *   business credit amount elected to be refundable, in future years, on form
 *   FTB 3870, if applicable" (ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01).
 * - FTB 3541 line 13: "Do not include any amount you will be electing as a
 *   refundable credit on form FTB 3870 or amounts included in Part IV"
 *   (ca-3541-inst-2025::sec::part-ii-carryover-computation::b03).
 * The engine follows FTB 3541: the credit's own form says what carries over,
 * and column (d) then equals its line 13.
 */
const carryoverColumn = (line: SectionB2Line) => (form: Form, info: Info) => {
  const picked = column(line, (credit, row) => ({ credit, row }))(form, info);
  if (picked === undefined || isGap(picked)) return picked;
  const { credit, row } = picked as { credit: SectionB2Credit; row: CreditRow };
  if (credit.code !== PROGRAM_4_0_CODE) return row.carryover;
  const elected = program40ElectedRefundable((fieldId) => form[fieldId], info);
  return typeof elected === "number" ? row.carryover - elected : elected;
};

function lineBindings(line: SectionB2Line): Bindings {
  const key = (suffix: string) => `3.part3.${line}_${suffix}`;
  return {
    [key("credit_code")]: column(line, (credit) => credit.code),
    [key("credit_name")]: column(line, (credit) => credit.name),
    [key("credit_amount_col_a")]: column(line, (_, row) => row.available),
    [key("credit_used_col_b")]: column(line, (_, row) => row.used),
    [key("tax_balance_col_c")]: column(line, (_, row) => row.balance),
    [key("credit_carryover_col_d")]: carryoverColumn(line),
  } as Bindings;
}

export const sectionB2PassiveCreditRows: Bindings = Object.assign(
  {},
  ...SECTION_B2_LINES.map(lineBindings),
);

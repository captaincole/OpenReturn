import type { BaseFilingInfo } from "../../../filingInfo.js";

/* One Part I row: one electing entity. A field is undefined while its answer waits. */
export interface PteCreditRow {
  factKey: string;
  /* Column (a). */
  entityName?: string;
  /* Column (b). */
  entityId?: string;
  /* Column (c), as stated. */
  credit?: number;
  /* The credit came through a disregarded single member LLC (ca-3804cr-inst-2025::sec::e-limitations::b01). */
  throughDisregardedSmllc: boolean;
}

/*
 * FTB 3804-CR reads its rows and the carryover here, and Form 540, Schedule S
 * and Schedule P (540) through the form accessor. Form 540 lines 43 to 45 and
 * Schedule P (540) line 21 read the rows to see whether the credit has a gap.
 */
export interface Form3804CRFilingInfo extends BaseFilingInfo {
  /* One entry per electing entity, in the order the facts were recorded; empty when the form does not file. */
  pteCreditRows?: PteCreditRow[];
  /* Part II line 2: the carryover from 2024; undefined while it waits. */
  pteCreditCarryover?: number;
  /* The copy being evaluated: 0 is the first form, which holds Part II. */
  form3804CrCopyIndex?: number;
}

import type { BaseFilingInfo } from "../../../filingInfo.js";

/* One line 3 entity. A field is undefined while its answer waits. */
export interface PrisonLaborPassThroughRow {
  factKey: string;
  entityName?: string;
  entityId?: string;
  /* As stated, with cents. */
  credit?: number;
  /* The credit came through a disregarded single member LLC (ca-3507-form-2025::sec::c-limitations::b01). */
  throughDisregardedSmllc: boolean;
}

/*
 * FTB 3507 reads its inputs here, and Schedule P (540) through the form
 * accessor. Schedule P (540) line 4, Form 540 lines 43 to 45 and Schedule S
 * line 2 read the inputs to see whether the credit has a gap.
 */
export interface Form3507FilingInfo extends BaseFilingInfo {
  /* Line 1 as stated; undefined while it waits or when the form does not file. */
  prisonLaborWages?: number;
  /* The wages were paid through a disregarded single member LLC. */
  prisonLaborWagesThroughSmllc?: boolean;
  /* Line 3, one entry per entity with a credit above 0 or not stated yet; empty when the form does not file. */
  prisonLaborPassThroughRows?: PrisonLaborPassThroughRow[];
  /* Line 4: the carryover from 2024; undefined while it waits. */
  prisonLaborCarryover?: number;
  /* The FTB 3870 election; undefined when it is not stated (asked only when the $5,000,000 limit can bind). */
  businessCreditRefundableElection?: boolean;
}

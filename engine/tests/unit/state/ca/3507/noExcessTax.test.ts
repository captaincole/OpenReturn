/*
 * FTB 3507 when Schedule P (540) line 3 is 0 (the tax is at tentative minimum
 * tax). "You may not take the credit this year or in future years"
 * (ca-540-sched-p-inst-2025::sec::section-a-instructions::b01), so Schedule P
 * line 4 is blank and FTB 3507 line 6a is 0. Found by the blind fill (case 6).
 */

import { describe, expect, it } from "vitest";
import type { MustFileResolution } from "../../../../../src/filingInfo.js";
import {
  prisonLaborCreditClaimed,
  SCHEDULE_P_EXCESS_TAX,
  SCHEDULE_P_PRISON_LABOR_CREDIT_USED,
} from "../../../../../src/state/ca/3507/creditUsed.js";
import type { Form3507FilingInfo } from "../../../../../src/state/ca/3507/filingInfo.js";
import { prisonLaborCreditRow } from "../../../../../src/state/ca/schedule-p/prisonLaborRow.js";

const files = (decisionKey: string): MustFileResolution => ({
  decisionKey,
  value: true,
  derivation: undefined,
});

const info = {
  mustFile: {
    "form-3507": files("decisions.scope.must_file_3507"),
    "form-540": files("decisions.scope.must_file_ca_540"),
    "schedule-p": files("decisions.scope.must_file_schedule_p"),
  },
} as Form3507FilingInfo;

/* Schedule P line 4 with FTB 3507 line 5 at 5,000 and the given line 3. */
function scheduleP(excess: number | undefined) {
  const form = {
    "form-3507.0.line.5_total_available_credit": 5000,
    "1.part3.3_excess_tax_offset_by_credits_col_c": excess,
  } as never;
  const column = (id: keyof typeof prisonLaborCreditRow) => prisonLaborCreditRow[id]?.(form, info);
  return [
    column("1.part3.4_prison_inmate_labor_credit_col_a"),
    column("1.part3.4_prison_inmate_labor_credit_col_b"),
    column("1.part3.4_prison_inmate_labor_credit_col_c"),
  ];
}

describe("FTB 3507 with no excess tax", () => {
  it("leaves Schedule P (540) line 4 blank when line 3 is 0", () => {
    expect(scheduleP(0)).toEqual([undefined, undefined, undefined]);
  });

  it("still fills line 4 when line 3 is above 0", () => {
    expect(scheduleP(1200)).toEqual([5000, 1200, 0]);
  });

  it("claims 0 on line 6a when line 3 is 0", () => {
    const fields: Record<string, unknown> = { [SCHEDULE_P_EXCESS_TAX]: 0 };
    expect(prisonLaborCreditClaimed((id) => fields[id], info, 5000)).toBe(0);
  });

  it("waits on line 6a while line 3 waits, and reads column (b) when it is filled", () => {
    expect(prisonLaborCreditClaimed(() => undefined, info, 5000)).toBeUndefined();
    const fields: Record<string, unknown> = {
      [SCHEDULE_P_EXCESS_TAX]: 1200,
      [SCHEDULE_P_PRISON_LABOR_CREDIT_USED]: 1200,
    };
    expect(prisonLaborCreditClaimed((id) => fields[id], info, 5000)).toBe(1200);
  });
});

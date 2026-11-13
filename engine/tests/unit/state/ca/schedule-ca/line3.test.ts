/*
 * Source: 2025 Schedule CA (540) instructions, line 3 (a business of a worker
 * who is an employee for California) and FTB 3885A line 8a/8b.
 */

import { describe, expect, it } from "vitest";
import type { FormAccessor } from "../../../../../src/defineForm.js";
import { answerLines } from "../../../../../src/state/ca/schedule-ca/answerLines.js";
import type { ScheduleCaFilingInfo } from "../../../../../src/state/ca/schedule-ca/filingInfo.js";
import type { ScheduleCa } from "../../../../../src/state/ca/schedule-ca/types.js";
import { unsupported } from "../../../../../src/types.js";

const bindings = answerLines();
const line3 = (info: Partial<ScheduleCaFilingInfo>) => {
  const form = {} as FormAccessor<ScheduleCa>;
  const filingInfo = info as ScheduleCaFilingInfo;
  return {
    columnB: bindings["0.line.b3_subtractions"]?.(form, filingInfo),
    columnC: bindings["0.line.b3_additions"]?.(form, filingInfo),
  };
};

describe("Schedule CA line 3 columns B and C", () => {
  it("subtracts an employee's profit in column B", () => {
    expect(line3({ caEmployeeAmounts: { netProfit: 5000.4 } })).toEqual({
      columnB: 5000,
      columnC: undefined,
    });
  });

  it("adds an employee's loss and the FTB 3885A addition in column C", () => {
    const info = {
      caEmployeeAmounts: { netLoss: 1200 },
      businessDepreciationAdjustment: { subtraction: 0, addition: 300 },
    };
    expect(line3(info)).toEqual({ columnB: undefined, columnC: 1500 });
  });

  it("carries an FTB 3885A gap in both columns", () => {
    const gap = "A case the engine does not handle.";
    const info = {
      caEmployeeAmounts: { netProfit: 5000 },
      businessDepreciationAdjustment: { subtraction: 0, addition: 0, gap },
    };
    expect(line3(info)).toEqual({ columnB: unsupported(gap), columnC: unsupported(gap) });
  });
});

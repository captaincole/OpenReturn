/*
 * Schedule D (540) lines 12a and 12b with Form 4797: federal 1040 line 7a (line
 * 10) holds the section 1231 gain that goes to federal Schedule D line 11, and
 * line 1 holds California's, from Schedule D-1 line 7 or 9 (the text under
 * Schedule D-1 lines 7 and 9). The lines are a gap only while California's
 * gain is not figured.
 */

import { describe, expect, it } from "vitest";
import type { Form4797Lines } from "../../../../../src/federal/4797/lines.js";
import { form4797Gap } from "../../../../../src/state/ca/schedule-d-ca/bindings.js";
import type { ScheduleDCaFilingInfo } from "../../../../../src/state/ca/schedule-d-ca/filingInfo.js";
import {
  SECTION_1231_ROW,
  scheduleDCaFigures,
} from "../../../../../src/state/ca/schedule-d-ca/lines.js";

const lines = (overrides: Partial<Form4797Lines>): Form4797Lines => ({
  partIRows: [],
  partIIRows: [],
  partIIIColumns: [],
  partIV: {},
  waitsForLine8: false,
  ...overrides,
});

const infoWith = (
  form4797: Form4797Lines | undefined,
  files = true,
  californiaSection1231Gain?: ScheduleDCaFilingInfo["californiaSection1231Gain"],
): ScheduleDCaFilingInfo =>
  ({
    mustFile: { "form-4797": { value: files } },
    form4797,
    californiaSection1231Gain,
  }) as unknown as ScheduleDCaFilingInfo;

const SENT = lines({ line7: 94960, line9: 79960, scheduleDGain: 79960 });

describe("Schedule D (540) lines 12a and 12b with a Form 4797 gain", () => {
  it("California's gain figured by Schedule D-1: no gap", () => {
    const california = { gain: 79960, waits: false, differs: false };
    expect(form4797Gap(infoWith(SENT, true, california))).toBeUndefined();
  });

  it("a Schedule D-1 gap is a gap here too", () => {
    const california = { gap: "a K-1 item", waits: false, differs: true };
    expect(form4797Gap(infoWith(SENT, true, california))).toMatchObject({ unsupported: true });
  });

  it("no California figures (no Form 540): a gap", () => {
    expect(form4797Gap(infoWith(SENT))).toMatchObject({ unsupported: true });
  });

  it("no gain sent (line 7 a loss), or no Form 4797: no gap", () => {
    expect(form4797Gap(infoWith(lines({ line7: -500, line11: 500 })))).toBeUndefined();
    expect(form4797Gap(infoWith(undefined, false))).toBeUndefined();
  });
});

describe("Schedule D (540) line 1 with the Schedule D-1 gain", () => {
  const base = {
    sales: [],
    capitalGainDistributions: undefined,
    californiaCarryover: undefined,
    californiaCarryoverMissing: false,
    filingStatus: "single" as const,
  };

  it("adds one row with the gain in column (e); lines 4, 8 and 11 hold it", () => {
    const figures = scheduleDCaFigures({ ...base, section1231Gain: 25500 });
    expect(figures.line1).toEqual([
      {
        description: SECTION_1231_ROW,
        salesPrice: undefined,
        basis: undefined,
        loss: undefined,
        gain: 25500,
        gap: undefined,
      },
    ]);
    expect([figures.line4, figures.line8, figures.line11]).toEqual([25500, 25500, 25500]);
  });

  it("no gain, no row; a waiting gain holds the totals; a gap is the totals' gap", () => {
    expect(scheduleDCaFigures({ ...base, section1231Gain: undefined }).line1).toEqual([]);
    expect(
      scheduleDCaFigures({ ...base, section1231Gain: 100, section1231Waits: true }).line4,
    ).toBeUndefined();
    expect(scheduleDCaFigures({ ...base, section1231Gap: "Schedule D-1: gap" }).gap).toBe(
      "Schedule D-1: gap",
    );
  });
});

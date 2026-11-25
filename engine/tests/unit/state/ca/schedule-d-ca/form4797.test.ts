/*
 * Schedule D (540) lines 12a and 12b with Form 4797: federal 1040 line 7a (line
 * 10) holds the section 1231 gain that goes to federal Schedule D line 11, and
 * line 1 holds California's, from Schedule D-1 line 7 or 9 (the text under
 * Schedule D-1 lines 7 and 9). The lines are a gap only while California's
 * gain is not figured. An FTB 3805E capital asset gain is a row of line 1 too.
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
        waits: false,
      },
    ]);
    expect([figures.line4, figures.line8, figures.line11]).toEqual([25500, 25500, 25500]);
  });

  it("with an FTB 3805E gain too: a sale row, the FTB 3805E row, then the Schedule D-1 row", () => {
    const figures = scheduleDCaFigures({
      ...base,
      sales: [{ description: "100 sh Z CO", salesPrice: 9000, basis: 10200, adjusted: false }],
      installmentRows: [{ description: "Lot 7 (FTB 3805E)", gain: 14200, gap: undefined }],
      section1231Gain: 25500,
      capitalGainDistributions: 300,
    });
    expect(figures.line1.map((row) => [row.description, row.loss, row.gain])).toEqual([
      ["100 sh Z CO", 1200, undefined],
      ["Lot 7 (FTB 3805E)", undefined, 14200],
      [SECTION_1231_ROW, undefined, 25500],
    ]);
    // Line 4: 14,200 + 25,500 + 300 (line 3); line 5: 1,200; line 8 and line 11: 38,800.
    expect([figures.line3, figures.line4, figures.line5, figures.line7]).toEqual([
      300, 40000, 1200, 1200,
    ]);
    expect([figures.line8, figures.line9, figures.line11, figures.gap]).toEqual([
      38800,
      undefined,
      38800,
      undefined,
    ]);
  });

  it("a waiting FTB 3805E row holds the totals with a Schedule D-1 gain", () => {
    const figures = scheduleDCaFigures({
      ...base,
      installmentRows: [{ description: "Lot 7 (FTB 3805E)", gain: undefined, gap: undefined }],
      section1231Gain: 25500,
    });
    expect(figures.line1).toHaveLength(2);
    expect([figures.line4, figures.line8, figures.line11]).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
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

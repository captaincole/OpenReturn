/*
 * Schedule D (540) lines 12a and 12b with Form 4797: federal 1040 line 7a (line
 * 10) holds the section 1231 gain that goes to federal Schedule D line 11, and
 * line 11 holds only the capital asset sales. The lines are a gap then
 * (ca-540-sched-d1-inst-2025::sec::a-purpose::b01: no adjustment for a gain that
 * is the same on both returns, and no line here names California's gain).
 */

import { describe, expect, it } from "vitest";
import type { Form4797Lines } from "../../../../../src/federal/4797/lines.js";
import { form4797Gap } from "../../../../../src/state/ca/schedule-d-ca/bindings.js";
import type { ScheduleDCaFilingInfo } from "../../../../../src/state/ca/schedule-d-ca/filingInfo.js";

const lines = (overrides: Partial<Form4797Lines>): Form4797Lines => ({
  partIRows: [],
  partIIRows: [],
  partIIIColumns: [],
  partIV: {},
  waitsForLine8: false,
  ...overrides,
});

const infoWith = (form4797: Form4797Lines | undefined, files = true): ScheduleDCaFilingInfo =>
  ({
    mustFile: { "form-4797": { value: files } },
    form4797,
  }) as unknown as ScheduleDCaFilingInfo;

describe("Schedule D (540) lines 12a and 12b with a Form 4797 gain", () => {
  it("a line 9 gain of 79,960 on federal Schedule D line 11 makes the lines a gap", () => {
    expect(
      form4797Gap(infoWith(lines({ line7: 94960, line9: 79960, scheduleDGain: 79960 }))),
    ).toMatchObject({
      unsupported: true,
    });
  });

  it("a Form 4797 summary gap is a gap here too", () => {
    const info = { ...infoWith(lines({})), form4797SummaryGap: "a K-1 item" };
    expect(form4797Gap(info)).toMatchObject({ unsupported: true });
  });

  it("no gain sent (line 7 a loss), or no Form 4797: no gap", () => {
    expect(form4797Gap(infoWith(lines({ line7: -500, line11: 500 })))).toBeUndefined();
    expect(form4797Gap(infoWith(undefined, false))).toBeUndefined();
  });
});

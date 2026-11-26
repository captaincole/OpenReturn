/*
 * Source: ca-3514-inst-2025::sec::worksheet-3::b01. Line 18 is Schedule 1
 * line 3 plus line 6 (a farm's Schedule F line 34), less Schedule 1 line 15.
 */

import { describe, expect, it } from "vitest";
import type { Form3514FilingInfo } from "../../../../../src/state/ca/3514/filingInfo.js";
import { businessIncome, type Lines } from "../../../../../src/state/ca/3514/lines.js";

const lines = (values: Record<string, number>) => values as unknown as Lines;

describe("FTB 3514 line 18 with a farm", () => {
  it("adds the farm's Schedule 1 line 6 with no Schedule SE", () => {
    const info: Form3514FilingInfo = { caEitcHasFarm: true };
    expect(businessIncome(lines({ "schedule-1.0.line.6": 350 }), info)).toBe(350);
  });

  it("waits while the farm's Schedule 1 line 6 is blank", () => {
    expect(businessIncome(lines({}), { caEitcHasFarm: true })).toBeUndefined();
  });

  it("adds a business and a farm, less the deductible part of SE tax", () => {
    const info: Form3514FilingInfo = {
      caEitcHasBusiness: true,
      caEitcHasFarm: true,
      mustFile: {
        "schedule-se": {
          decisionKey: "decisions.scope.must_file_schedule_se",
          value: true,
          derivation: undefined,
        },
      },
    };
    const federal = lines({
      "schedule-1.0.line.3": 6000,
      "schedule-1.0.line.6": 4000,
      "schedule-1.1.line.15": 707,
    });
    expect(businessIncome(federal, info)).toBe(9293);
  });
});

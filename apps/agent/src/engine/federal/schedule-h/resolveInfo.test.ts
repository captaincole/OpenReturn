/*
 * Schedule H must-file ("Who Must File", 2025 Schedule H instructions)
 * and the $1,000-quarter answer it needs.
 */

import { describe, expect, it } from "vitest";
import {
  HOUSEHOLD_EMPLOYMENT_KEYS,
  makeHouseholdEmployeeFactKey,
  type HouseholdEmployeeFactValue,
} from "../../facts/index.js";
import { makeResolverInputs } from "../../resolverInputs.js";
import { resolveScheduleHInfo } from "./resolveInfo.js";

const PAID_KEY = HOUSEHOLD_EMPLOYMENT_KEYS.paid1000InAQuarter;

function resolve(w2: Partial<HouseholdEmployeeFactValue> | null, paid1000?: boolean) {
  const facts = [
    ...(w2
      ? [
          {
            key: makeHouseholdEmployeeFactKey("test-employee"),
            category: "household_employment",
            value: { employeeName: "Test Employee", employerEin: "00-0000000", ...w2 },
          },
        ]
      : []),
    ...(paid1000 === undefined
      ? []
      : [{ key: PAID_KEY, category: "household_employment", value: paid1000 }]),
  ];
  const info = resolveScheduleHInfo(makeResolverInputs({ facts, decisions: [] }));
  return {
    mustFile: info.mustFile?.["schedule-h"]?.value,
    missing: info.missingInputs?.["schedule-h"],
  };
}

describe("Schedule H must-file", () => {
  it.each([
    ["$2,800 in wages (line A)", { box3: 2800, box5: 2800 }, false, true],
    ["$2,000 with $150 withheld (line B)", { box2: 150, box3: 2000, box5: 2000 }, false, true],
    ["$2,000 and a $1,000 quarter (line C)", { box3: 2000, box5: 2000 }, true, true],
    ["$2,000, nothing withheld, no $1,000 quarter", { box3: 2000, box5: 2000 }, false, false],
  ] as const)("%s", (_, w2, paid1000, mustFile) => {
    expect(resolve(w2, paid1000).mustFile).toBe(mustFile);
  });

  it("asks for the $1,000-quarter answer when there is a household employee", () => {
    expect(resolve({ box3: 2000, box5: 2000 }).missing).toEqual([PAID_KEY]);
    expect(resolve({ box3: 2000, box5: 2000 }, false).missing).toEqual([]);
  });

  it("does not file or ask without a household employee", () => {
    expect(resolve(null)).toEqual({ mustFile: false, missing: [] });
  });
});

/*
 * Form 7206 lines that read other forms (federal/7206/results.ts): line 7's
 * Schedule 1 line 15, line 9's line 16, and line 12's Form 2555 line 45.
 */

import { describe, expect, it } from "vitest";
import type { Form2555Filer } from "../../../../src/federal/2555/person.js";
import type { SelfEmployedHealthPlan } from "../../../../src/federal/7206/filingInfo.js";
import {
  planLines,
  selfEmployedHealthDeduction,
  type Form7206ResultInfo,
} from "../../../../src/federal/7206/results.js";

const plan = (value: Partial<SelfEmployedHealthPlan> = {}): SelfEmployedHealthPlan => ({
  factKey: "se_health_plan.test",
  kind: "schedule_c",
  businessKey: "business.test",
  owner: "taxpayer",
  premiums: { line1: 9000, line2: 0 },
  line4: 50000,
  line9Source: "line16",
  line12Source: "none",
  ...value,
});

const form = { "schedule-1.1.line.15": 3532, "schedule-1.1.line.16": 6000 };

/* Schedule SE's must-file answer. */
const scheduleSE = (value: boolean) => ({
  "schedule-se": {
    decisionKey: "decisions.scope.must_file_schedule_se",
    value,
    derivation: {
      decidedBy: "engine" as const,
      rule: "test",
      triggeredByFactKeys: [],
      triggeredByDecisionKeys: [],
    },
  },
});

const info = (plans: SelfEmployedHealthPlan[], extra: Partial<Form7206ResultInfo> = {}) =>
  ({
    mustFile: scheduleSE(true),
    form7206Plans: plans,
    form7206Line5: 50000,
    ...extra,
  }) as Form7206ResultInfo;

/* A Form 2555 that excludes $20,000 of this business's income and has no related deductions. */
const filer = {
  key: "foreign_income.taxpayer",
  owner: "taxpayer",
  answers: {},
  exclusion: {
    line27: 20000,
    line43: 20000,
    relatedDeductions: 0,
    selfEmployment: "none",
    claimsHousing: false,
  },
  usBusinessIncome: [],
  days: 365,
} as unknown as Form2555Filer;

describe("Lines 7, 9 and 12 read the return", () => {
  it("line 7 is all of Schedule 1 line 15 for the only business; line 9 is all of line 16", () => {
    const lines = planLines(plan(), form, info([plan()]));
    expect(lines).toMatchObject({ line7: 3532, line9: 6000, line10: 50000 - 3532 - 6000 });
  });

  it("with no Schedule SE, line 7 is 0", () => {
    const noSE = info([plan()], { mustFile: scheduleSE(false) });
    expect(planLines(plan(), {}, noSE)).toMatchObject({ line7: 0, line9: 0 });
  });

  it("waits while Schedule SE's answer is open", () => {
    expect(planLines(plan(), form, info([plan()], { mustFile: {} }))).toBeUndefined();
  });

  it("line 12 is blank without Form 2555, 0 when none of it is this business's", () => {
    expect(planLines(plan(), form, info([plan()]))).toMatchObject({ line12: undefined });
    const zero = plan({ line12Source: "zero" });
    expect(planLines(zero, form, info([zero]))).toMatchObject({ line12: 0 });
  });

  it("line 12 takes Form 2555 line 45 when all of it is this business's", () => {
    const foreign = plan({ line12Source: "line45" });
    const lines = planLines(foreign, form, info([foreign], { form2555Filers: [filer] }));
    expect(lines).toMatchObject({
      line12: 20000,
      line13: 50000 - 3532 - 6000 - 20000,
      line14: 9000,
    });
  });

  it("a plan's gap reaches Schedule 1 line 17", () => {
    const gap = plan({ gap: "no rule" });
    expect(selfEmployedHealthDeduction(form, info([plan(), gap]))).toMatchObject({
      unsupported: true,
    });
  });

  it("Schedule 1 line 17 adds every plan's line 14", () => {
    const second = plan({ premiums: { line1: 1500, line2: 300 }, line9Source: 0 });
    expect(selfEmployedHealthDeduction(form, info([plan(), second]))).toBe(9000 + 1800);
  });
});

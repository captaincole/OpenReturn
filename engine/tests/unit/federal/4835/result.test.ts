/*
 * Form 4835 lines 32 and 34 (result.ts): each branch of the line 32 and line 34
 * instructions (irs-4835-inst-2025::sec::line-32::b01, b02; line-34::b01). No
 * published example has numbers for these lines.
 */

import { describe, expect, it } from "vitest";
import {
  EXCEPTION_NEEDS_ACTIVE_PARTICIPATION,
  farmRentalResult,
  NOT_AT_RISK,
  ON_FORM_8582,
  PRIOR_YEAR_LOSS,
  type ResultContext,
} from "../../../../src/federal/4835/result.js";

const passive: ResultContext = {
  priorYearUnallowedLoss: 0,
  activelyParticipated: true,
  allInvestmentAtRisk: true,
  realEstateProfessional: false,
  form8582: "open",
};
const professional: ResultContext = {
  ...passive,
  realEstateProfessional: true,
  materiallyParticipated: true,
};

describe("line 32: net income", () => {
  it("is line 7 less line 31 and goes to Schedule E line 40", () => {
    const result = farmRentalResult(10000, 4000, passive);
    expect(result).toMatchObject({ line32: 6000, scheduleELine40: 6000 });
    expect(result.line34c).toBeUndefined();
  });

  it("is 0 when line 7 equals line 31", () => {
    expect(farmRentalResult(4000, 4000, passive).line32).toBe(0);
  });

  it("is a gap while Form 8582 files for a passive farm rental (line-32::b02)", () => {
    expect(farmRentalResult(10000, 4000, { ...passive, form8582: "files" }).line32).toEqual({
      gap: ON_FORM_8582,
    });
  });

  it("stays when Form 8582 files and the farm rental is nonpassive", () => {
    expect(farmRentalResult(10000, 4000, { ...professional, form8582: "files" }).line32).toBe(6000);
  });

  it("waits on the passive answers while Form 8582 files", () => {
    const result = farmRentalResult(10000, 4000, {
      ...passive,
      realEstateProfessional: undefined,
      form8582: "files",
    });
    expect(result.line32).toBeUndefined();
    expect(result.waitsOn).toEqual(["real_estate_professional"]);
  });

  it("is a gap with a prior-year unallowed loss (the PAL bullet)", () => {
    const result = farmRentalResult(10000, 4000, { ...passive, priorYearUnallowedLoss: 2000 });
    expect(result.line32).toEqual({ gap: PRIOR_YEAR_LOSS });
    expect(result.scheduleELine40).toEqual({ gap: PRIOR_YEAR_LOSS });
  });

  it("is blank with no income and no expense", () => {
    expect(farmRentalResult(undefined, undefined, passive)).toEqual({ waitsOn: [] });
  });
});

describe("line 34: a loss", () => {
  it("leaves line 32 blank and waits on the at-risk answer", () => {
    const result = farmRentalResult(1000, 4000, { ...passive, allInvestmentAtRisk: undefined });
    expect(result.line32).toBeUndefined();
    expect(result.waitsOn).toEqual(["at_risk"]);
  });

  it("box 34b: Form 6198 comes first, a gap", () => {
    const result = farmRentalResult(1000, 4000, { ...professional, allInvestmentAtRisk: false });
    expect(result.line34b).toBe(true);
    expect(result.line34a).toBeUndefined();
    expect(result.line34c).toEqual({ gap: NOT_AT_RISK });
  });

  it("a real estate professional who materially participated deducts all of it", () => {
    const result = farmRentalResult(1000, 4000, professional);
    expect(result).toMatchObject({ line34a: true, line34c: -3000, scheduleELine40: -3000 });
    expect(result.line32).toBeUndefined();
  });

  it("the Schedule E exception with active participation deducts all of it", () => {
    expect(farmRentalResult(1000, 4000, { ...passive, form8582: "exception" }).line34c).toBe(-3000);
  });

  it("the exception without active participation is a gap", () => {
    const result = farmRentalResult(1000, 4000, {
      ...passive,
      activelyParticipated: false,
      form8582: "exception",
    });
    expect(result.line34c).toEqual({ gap: EXCEPTION_NEEDS_ACTIVE_PARTICIPATION });
  });

  it("a passive loss while Form 8582 files is a gap", () => {
    expect(farmRentalResult(1000, 4000, { ...passive, form8582: "files" }).line34c).toEqual({
      gap: ON_FORM_8582,
    });
  });

  it("a passive loss with Form 8582 undecided waits on the decision", () => {
    expect(farmRentalResult(1000, 4000, passive).waitsOn).toEqual(["form_8582"]);
  });

  it("a professional waits on material participation", () => {
    const result = farmRentalResult(1000, 4000, {
      ...professional,
      materiallyParticipated: undefined,
    });
    expect(result.waitsOn).toEqual(["material_participation"]);
  });

  it("the deductible loss is never more than line 31 less line 7", () => {
    const result = farmRentalResult(1000, 4000, professional);
    expect(-(result.line34c as number)).toBeLessThanOrEqual(4000 - 1000);
  });

  it("expenses with no income are a loss of the whole line 31", () => {
    expect(farmRentalResult(undefined, 2500, professional).line34c).toBe(-2500);
  });
});

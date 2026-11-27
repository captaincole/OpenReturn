/*
 * Form 8862's pure rules (src/federal/8862/lines.ts). The form has no dollar
 * arithmetic; its published examples are about days, dates and the
 * four-year AOTC count. Each test names its source.
 */

import { describe, expect, it } from "vitest";
import {
  livedWithTaxpayerOverHalfYear,
  type DependentFactValue,
} from "../../../../src/facts/index.js";
import {
  DAYS_IN_YEAR,
  enoughDaysInUs,
  HALF_YEAR_DAYS,
  line10Age,
  line14LivedWithYou,
  line19aEligible,
  line19bClaimedFourYears,
  line7Days,
  monthDayIn,
} from "../../../../src/federal/8862/lines.js";
import type { StudentPartIII } from "../../../../src/federal/8863/filingInfo.js";

const child = (value: Partial<DependentFactValue>): DependentFactValue => ({
  firstName: "Test",
  lastName: "Child",
  relationship: "Son",
  dob: "05/01/2015",
  monthsLivedWithYou: 12,
  livedInUs: true,
  ...value,
});

const student = (value: Partial<StudentPartIII>): StudentPartIII => ({
  factKey: "education.credit_student.test",
  name: "Test Student",
  institutions: [],
  line23: false,
  line24: true,
  line25: false,
  line26: false,
  credit: "american_opportunity",
  waits: false,
  ...value,
});

describe("line 7, days in the United States", () => {
  it("irs-8862-inst-2025::sec::line-7::b02: a child born during the year enters 365", () => {
    expect(line7Days(child({ dob: "03/12/2025", monthsLivedWithYou: 10 }), 2025)).toBe(365);
  });

  it("irs-8862-inst-2025::sec::line-7::b02: a child who died during the year enters 365", () => {
    const died = child({ dateOfDeath: "06/30/2025", monthsLivedWithYou: 6 });
    expect(line7Days(died, 2025)).toBe(DAYS_IN_YEAR);
  });

  it("a child in the home in the United States all 12 months enters 365", () => {
    expect(line7Days(child({}), 2025)).toBe(365);
  });

  it("otherwise the stated days, and nothing while they are missing", () => {
    expect(line7Days(child({ monthsLivedWithYou: 11, daysLivedWithYouInUs: 304 }), 2025)).toBe(304);
    expect(line7Days(child({ monthsLivedWithYou: 11 }), 2025)).toBeUndefined();
    // Twelve months abroad do not count: the stated days decide.
    expect(line7Days(child({ livedInUs: false, daysLivedWithYouInUs: 0 }), 2025)).toBe(0);
  });
});

describe("lines 7 and 9, the 183-day caution", () => {
  it("form face: fewer than 183 days stops the EIC; 183 is enough", () => {
    expect(HALF_YEAR_DAYS).toBe(183);
    expect(enoughDaysInUs(182)).toBe(false);
    expect(enoughDaysInUs(183)).toBe(true);
    expect(enoughDaysInUs(365)).toBe(true);
  });
});

describe("line 8, month and day", () => {
  it("prints MM and DD for a date in the year; nothing for another year", () => {
    expect(monthDayIn("3/7/2025", 2025)).toEqual({ month: "03", day: "07" });
    expect(monthDayIn("12/31/2025", 2025)).toEqual({ month: "12", day: "31" });
    expect(monthDayIn("12/31/2024", 2025)).toBeUndefined();
    expect(monthDayIn(undefined, 2025)).toBeUndefined();
    expect(monthDayIn("not a date", 2025)).toBeUndefined();
  });
});

describe("line 10, age at the end of the year", () => {
  it("is the year less the birth year", () => {
    expect(line10Age("07/21/1994", 2025)).toBe(31);
    expect(line10Age("12/31/2000", 2025)).toBe(25);
    expect(line10Age(undefined, 2025)).toBeUndefined();
  });
});

describe("line 14, lived with you or an exception", () => {
  it("irs-8862-inst-2025::sec::line-14::b01: the half-year test, or the divorced-parents exception", () => {
    expect(line14LivedWithYou(true, child({}))).toBe(true);
    expect(line14LivedWithYou(false, child({ form8332Release: true }))).toBe(true);
    expect(line14LivedWithYou(false, child({}))).toBe(false);
    expect(line14LivedWithYou(undefined, child({}))).toBeUndefined();
  });
});

describe("the half-year test with a death during the year", () => {
  it("1040 instructions: a child who died counts the months alive", () => {
    // Born in March, died in June: four months alive, three in the home is more than half.
    const short = child({ dob: "03/02/2025", dateOfDeath: "06/10/2025", monthsLivedWithYou: 3 });
    expect(livedWithTaxpayerOverHalfYear(short, 2025)).toBe(true);
    expect(livedWithTaxpayerOverHalfYear({ ...short, monthsLivedWithYou: 2 }, 2025)).toBe(false);
    // A death in an earlier year leaves the full year in scope.
    const earlier = child({ dateOfDeath: "06/10/2024", monthsLivedWithYou: 6 });
    expect(livedWithTaxpayerOverHalfYear(earlier, 2025)).toBe(false);
  });
});

describe("line 19, the eligible student", () => {
  it("irs-8863-inst-2025::sec::american-opportunity-credit::b02, b03 (Sharon): 4 earlier years: 19a No, 19b Yes", () => {
    const sharon = student({
      line23: true,
      line24: undefined,
      line25: undefined,
      line26: undefined,
    });
    expect(line19aEligible(sharon)).toBe(false);
    expect(line19bClaimedFourYears(sharon)).toBe(true);
  });

  it("irs-8863-inst-2025::sec::american-opportunity-credit::b03 (Wilbert): 3 earlier years: 19a Yes, 19b No", () => {
    const wilbert = student({});
    expect(line19aEligible(wilbert)).toBe(true);
    expect(line19bClaimedFourYears(wilbert)).toBe(false);
  });

  it("irs-8862-inst-2025::sec::line-19a::b01: each of the four requirements", () => {
    expect(line19aEligible(student({ line24: false, line25: undefined, line26: undefined }))).toBe(
      false,
    );
    expect(line19aEligible(student({ line25: true, line26: undefined }))).toBe(false);
    expect(line19aEligible(student({ line26: true }))).toBe(false);
  });
});

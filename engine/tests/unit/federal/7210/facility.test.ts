/*
 * One facility's Form 7210 (federal/7210/facility.ts): which facilities have a
 * 2025 credit, line 5, the waits, Part I and the election gaps. The rand
 * scenario's facility is the base.
 */

import { describe, expect, it } from "vitest";
import type { CleanHydrogenFacilityFactValue } from "../../../../src/facts/index.js";
import {
  creditPeriodEnd,
  electionGap,
  facilityCopy,
  increasedCredit,
  noCreditReason,
  partICells,
  sameFacility,
  waitsOnAnswer,
} from "../../../../src/federal/7210/facility.js";
import { FACILITY_KEY, facility } from "../../../scenarios/synthetic/rand/facts.js";

const withChanges = (
  changes: Partial<CleanHydrogenFacilityFactValue>,
): CleanHydrogenFacilityFactValue => ({ ...facility, ...changes });

const isGap = (value: unknown) =>
  (value as { unsupported?: boolean } | undefined)?.unsupported === true;

describe("which facilities have a 2025 credit", () => {
  it("the base facility has one", () => {
    expect(noCreditReason(facility)).toBeUndefined();
  });

  it("a section 48(a)(15) election or a section 45Q credit takes the credit away", () => {
    expect(noCreditReason(withChanges({ energyPropertyElection: true }))).toContain("48(a)(15)");
    expect(noCreditReason(withChanges({ carbonCaptureCredit: true }))).toContain("45Q");
  });

  it("construction must begin before 2028", () => {
    expect(noCreditReason(withChanges({ constructionBegan: "2027-12-31" }))).toBeUndefined();
    expect(noCreditReason(withChanges({ constructionBegan: "2028-01-01" }))).toContain(
      "after 2027",
    );
  });

  it("the 10-year credit period: a facility placed in service on January 1, 2015 has no 2025 day", () => {
    expect(creditPeriodEnd("2015-01-01")).toBe("2025-01-01");
    expect(noCreditReason(withChanges({ placedInService: "2015-01-01" }))).toContain("10-year");
    expect(noCreditReason(withChanges({ placedInService: "2015-01-02" }))).toBeUndefined();
  });

  it("a facility placed in service after 2025 has no 2025 production", () => {
    expect(noCreditReason(withChanges({ placedInService: "2025-12-31" }))).toBeUndefined();
    expect(noCreditReason(withChanges({ placedInService: "2026-01-01" }))).toContain("after 2025");
  });

  it("no process at 4.0 or less, or no kilograms: no credit", () => {
    const dirty = withChanges({ processes: [{ emissionsRate: 4.2, kilograms: 1_000 }] });
    expect(noCreditReason(dirty)).toContain("No process");
    const idle = withChanges({ processes: [{ emissionsRate: 0.3, kilograms: 0 }] });
    expect(noCreditReason(idle)).toContain("No process");
  });
});

describe("line 5, the increased credit amount", () => {
  it("construction before January 29, 2023: the prevailing wage answer alone", () => {
    const early = withChanges({ constructionBegan: "2023-01-28", apprenticeshipMet: undefined });
    expect(increasedCredit(early)).toBe(true);
    expect(waitsOnAnswer(early)).toBe(false);
  });

  it("construction from January 29, 2023: both requirements", () => {
    const late = { constructionBegan: "2023-01-29" };
    expect(increasedCredit(withChanges({ ...late, apprenticeshipMet: true }))).toBe(true);
    expect(increasedCredit(withChanges({ ...late, apprenticeshipMet: false }))).toBe(false);
    expect(increasedCredit(withChanges({ ...late, apprenticeshipMet: undefined }))).toBeUndefined();
  });

  it("the prevailing wage requirements not met: no increase, and no apprenticeship question", () => {
    const value = withChanges({ prevailingWageMet: false, apprenticeshipMet: undefined });
    expect(increasedCredit(value)).toBe(false);
    expect(waitsOnAnswer(value)).toBe(false);
  });

  it("a missing answer waits", () => {
    expect(waitsOnAnswer(withChanges({ prevailingWageMet: undefined }))).toBe(true);
    expect(waitsOnAnswer(withChanges({ carbonCaptureCredit: undefined }))).toBe(true);
    expect(waitsOnAnswer(withChanges({ energyPropertyElection: undefined }))).toBe(true);
  });
});

describe("Part I", () => {
  it("line 1 prints the registration number only with an election", () => {
    expect(partICells(facility)["0.line.1_irs_registration_number"]).toBe("H2R-0072105");
    const none = partICells(withChanges({ transfer: undefined }));
    expect(none["0.line.1_irs_registration_number"]).toBeUndefined();
  });

  it("one process prints its rate and DOE control number on line A", () => {
    const one = partICells(
      withChanges({
        processes: [{ emissionsRate: 0.62, doeControlNumber: "DOE-45V-1", kilograms: 10 }],
      }),
    );
    expect(one["0.header.a_i_emissions_value_rate"]).toBe("0.62");
    expect(one["0.header.a_ii_doe_control_number"]).toBe("DOE-45V-1");
  });

  it("more than one process: line A(i) is a gap, and A(ii) is blank with no control number", () => {
    const many = partICells(facility);
    expect(isGap(many["0.header.a_i_emissions_value_rate"])).toBe(true);
    expect(many["0.header.a_ii_doe_control_number"]).toBeUndefined();
  });

  it("line 2b fills the sign, degree and decimal boxes", () => {
    const cells = partICells(facility);
    expect(cells["0.line.2b_i_latitude_sign"]).toBe("+");
    expect(cells["0.line.2b_i_latitude_degrees"]).toBe("29");
    expect(cells["0.line.2b_ii_longitude_sign"]).toBe("-");
    expect(cells["0.line.2b_ii_longitude_degrees"]).toBe("095");
    expect(cells["0.line.2b_ii_longitude_decimal"]).toBe("151700");
  });
});

describe("the elections", () => {
  it("a sale of part of the credit up to line 10 stands", () => {
    expect(electionGap(facility, 40_610)).toBeUndefined();
  });

  it("a purchased credit, both elections, or more than line 10 is a gap", () => {
    const purchased = withChanges({ transfer: { ...facility.transfer!, direction: "purchased" } });
    expect(electionGap(purchased, 40_610)).toContain("transferee");
    const both = withChanges({
      electivePayment: { amount: 1_000, registrationNumber: "H2R-0072105" },
    });
    expect(electionGap(both, 40_610)).toContain("one election");
    expect(electionGap(facility, 14_999)).toContain("more than");
    const elective = withChanges({
      transfer: undefined,
      electivePayment: { amount: 40_610, registrationNumber: "H2R-0072105" },
    });
    expect(electionGap(elective, 40_610)).toBeUndefined();
  });

  it("an election gap stops the Form 3800 amount, not the printed lines", () => {
    const copy = facilityCopy(
      {
        key: FACILITY_KEY,
        value: withChanges({ transfer: { ...facility.transfer!, amount: 99_999 } }),
      },
      false,
    );
    expect(copy.cells["0.line.10_increased_credit_amount"]).toBe(40_610);
    expect(isGap(copy.line10)).toBe(true);
  });
});

describe("the same facility on Form 3468", () => {
  it("matches on the registration number, the address or the coordinates", () => {
    const base = { propertyType: "Clean hydrogen", constructionBegan: "", placedInService: "" };
    expect(sameFacility(facility, { ...base, registrationNumber: "h2r-0072105 " })).toBe(true);
    expect(sameFacility(facility, { ...base, address: facility.address.toUpperCase() })).toBe(true);
    const coordinates = { latitude: 29.73421, longitude: -95.15169 };
    expect(sameFacility(facility, { ...base, coordinates })).toBe(true);
    expect(sameFacility(facility, { ...base, address: "1 Other Road" })).toBe(false);
  });

  it("a facility claimed on Form 3468 is a gap on every amount line", () => {
    const copy = facilityCopy({ key: FACILITY_KEY, value: facility }, true);
    expect(isGap(copy.cells["0.line.7_credit_before_reduction"])).toBe(true);
    expect(isGap(copy.cells["0.line.10_increased_credit_amount"])).toBe(true);
    expect(isGap(copy.line10)).toBe(true);
    expect(copy.cells["0.line.6a_less_than_0_45_col_a"]).toBe(9_400);
  });
});

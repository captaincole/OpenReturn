/*
 * Form 8332's year rules and copies (src/federal/8332/lines.ts). The form has
 * no amounts; its published examples are about years. Each test names its
 * source.
 */

import { describe, expect, it } from "vitest";
import type {
  Form8332ReleaseFactValue,
  Form8332RevocationFactValue,
} from "../../../../src/facts/index.js";
import {
  ALL_FUTURE_YEARS_TEXT,
  firstEffectiveYear,
  noReleaseForYear,
  partIYearDigits,
  releaseCopy,
  releaseCovers,
  revocationCopy,
  revocationEffectiveFor,
  yearsInclude,
  yearsText,
} from "../../../../src/federal/8332/lines.js";
import { ssn } from "../../../../src/values.js";

const revocation = (
  revokedYears: Form8332RevocationFactValue["revokedYears"],
  givenYear: number,
): Form8332RevocationFactValue => ({
  noncustodialParentFirstName: "Pat",
  noncustodialParentLastName: "Example",
  noncustodialParentSsn: "400-00-0101",
  revokedYears,
  givenYear,
});

const release = (value: Partial<Form8332ReleaseFactValue> = {}): Form8332ReleaseFactValue => ({
  custodialParentSsn: "400-00-0102",
  ...value,
});

describe("Form 8332 instructions, Part III example (irs-8332-form-2025::sec::part-iii::b01)", () => {
  /*
   * "In 2022, you released a claim to exemption for your child on Form 8332 for
   * the years 2023 through 2027. In 2025, you decided to revoke ... and
   * provided a copy of the form to the noncustodial parent in 2025, the
   * revocation will be effective for 2026 and 2027."
   */
  const revoked = revocation([2025, 2026, 2027], 2025);

  it("a revocation given in 2025 is effective for 2026 and 2027, not 2025", () => {
    expect(revocationEffectiveFor(revoked, 2025)).toBe(false);
    expect(revocationEffectiveFor(revoked, 2026)).toBe(true);
    expect(revocationEffectiveFor(revoked, 2027)).toBe(true);
    expect(revocationEffectiveFor(revoked, 2028)).toBe(false);
  });

  it("the earliest effective year is the year after the copy was given", () => {
    expect(firstEffectiveYear(revoked)).toBe(2026);
  });

  it("the original release in Part II prints as the instructions write it", () => {
    expect(yearsText([2023, 2024, 2025, 2026, 2027])).toBe("2023 through 2027");
  });
});

describe("Form 8332 instructions, Revocation (irs-8332-form-2025::sec::part-i-release-of-claim-to-exemption-for-current-year::b03)", () => {
  it('"provided a copy of the form to the noncustodial parent in 2025, the earliest tax year the revocation can be effective is 2026"', () => {
    const allFuture = revocation("all_future_years", 2025);
    expect(revocationEffectiveFor(allFuture, 2025)).toBe(false);
    expect(revocationEffectiveFor(allFuture, 2026)).toBe(true);
  });
});

describe("Pub. 501, revocation (irs-pub-501-2025::sec::support-test-for-children-of::b08)", () => {
  it('"For the revocation to be effective for 2025, the custodial parent must have given ... written notice ... in 2024 or earlier"', () => {
    expect(revocationEffectiveFor(revocation("all_future_years", 2024), 2025)).toBe(true);
    expect(revocationEffectiveFor(revocation([2025, 2026], 2023), 2025)).toBe(true);
    expect(revocationEffectiveFor(revocation([2025, 2026], 2025), 2025)).toBe(false);
  });

  it("a revocation that does not name 2025 does not count for 2025", () => {
    expect(revocationEffectiveFor(revocation([2026, 2027], 2024), 2025)).toBe(false);
  });
});

describe("Pub. 501, the years a release covers (irs-pub-501-2025::sec::residency-test::b10)", () => {
  /* "The release can be for 1 year, for a number of specified years (for example, alternate years), or for all future years." */
  it("one year: Part I alone", () => {
    expect(releaseCovers(release({ currentYear: 2025 }), 2025)).toBe(true);
    expect(releaseCovers(release({ currentYear: 2024 }), 2025)).toBe(false);
  });

  it("alternate years in Part II", () => {
    const alternate = release({ currentYear: 2023, futureYears: [2025, 2027] });
    expect(releaseCovers(alternate, 2025)).toBe(true);
    expect(releaseCovers(alternate, 2026)).toBe(false);
    expect(yearsText([2025, 2027])).toBe("2025 and 2027");
  });

  it("all future years: every year after Part I's year", () => {
    const allFuture = release({ currentYear: 2023, futureYears: "all_future_years" });
    expect(releaseCovers(allFuture, 2025)).toBe(true);
    expect(yearsText("all_future_years")).toBe(ALL_FUTURE_YEARS_TEXT);
  });

  it("with no Part I year recorded, the release is for the return's year", () => {
    expect(releaseCovers(release(), 2025)).toBe(true);
  });
});

describe("the years as a part prints them", () => {
  it("one year, two years, a run, and runs with a gap", () => {
    expect(yearsText([2026])).toBe("2026");
    expect(yearsText([2027, 2026])).toBe("2026 and 2027");
    expect(yearsText([2026, 2027, 2028])).toBe("2026 through 2028");
    expect(yearsText([2026, 2028, 2030])).toBe("2026, 2028 and 2030");
    expect(yearsText([2026, 2027, 2028, 2030])).toBe("2026 through 2028 and 2030");
    expect(yearsText([2026, 2026])).toBe("2026");
    expect(yearsText([])).toBeUndefined();
  });

  it('"all future years" means the years after the year it was written', () => {
    expect(yearsInclude("all_future_years", 2025, 2024)).toBe(true);
    expect(yearsInclude("all_future_years", 2024, 2024)).toBe(false);
    expect(yearsInclude([2024, 2026], 2025, 2023)).toBe(false);
  });

  it('Part I prints the two digits after "20"', () => {
    expect(partIYearDigits(2025)).toBe("25");
    expect(partIYearDigits(2009)).toBe("09");
  });
});

describe("the copies", () => {
  const parent = { name: "Robin Example", ssn: ssn("400-00-0100") };
  const base = {
    dependentKey: "dependent.kit",
    factKey: "form8332.release.kit",
    childName: "Kit Example",
  };

  it("a noncustodial parent's copy names the filer in the header and the custodial parent in Parts I and II", () => {
    const copy = releaseCopy({
      ...base,
      noncustodialParent: parent,
      release: release({ currentYear: 2025, futureYears: [2026, 2027, 2028] }),
    });
    expect(copy.noncustodialParentName).toBe("Robin Example");
    expect(copy.noncustodialParentSsn).toBe("400000100");
    expect(copy.partI).toEqual({
      childName: "Kit Example",
      years: "25",
      custodialParentSsn: "400000102",
    });
    expect(copy.partII?.years).toBe("2026 through 2028");
    expect(copy.partIII).toBeUndefined();
    expect(copy.gap).toBeUndefined();
  });

  it("with no release fact yet, Part I's year shows and the custodial parent's SSN waits", () => {
    const copy = releaseCopy({ ...base, noncustodialParent: parent, release: undefined });
    expect(copy.partI).toEqual({
      childName: "Kit Example",
      years: "25",
      custodialParentSsn: undefined,
    });
    expect(copy.partII).toBeUndefined();
  });

  it("a copy of an earlier year's form keeps its Part I year and names 2025 in Part II", () => {
    const copy = releaseCopy({
      ...base,
      noncustodialParent: parent,
      release: release({ currentYear: 2023, futureYears: "all_future_years" }),
    });
    expect(copy.partI?.years).toBe("23");
    expect(copy.partII?.years).toBe("all future years");
  });

  it("a release that does not name 2025 is a gap, never a silent claim", () => {
    const copy = releaseCopy({
      ...base,
      noncustodialParent: parent,
      release: release({ currentYear: 2024 }),
    });
    expect(copy.gap).toBe(noReleaseForYear("Kit Example"));
  });

  it("a custodial parent's revocation copy names the other parent in the header and fills Part III only", () => {
    const copy = revocationCopy({
      ...base,
      factKey: "form8332.revocation.kit",
      custodialParent: parent,
      revocation: revocation("all_future_years", 2024),
    });
    expect(copy.noncustodialParentName).toBe("Pat Example");
    expect(copy.noncustodialParentSsn).toBe("400000101");
    expect(copy.partI).toBeUndefined();
    expect(copy.partII).toBeUndefined();
    expect(copy.partIII).toEqual({
      childName: "Kit Example",
      years: "all future years",
      custodialParentSsn: "400000100",
    });
  });
});

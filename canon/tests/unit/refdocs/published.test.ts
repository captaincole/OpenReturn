import { describe, expect, it } from "vitest";
import { formatPublished, htmlPublished, isPublishedDate } from "../../../src/refdocs/published.js";

describe("publication dates", () => {
  it("accepts YYYY-MM and YYYY-MM-DD only", () => {
    expect(isPublishedDate("2025-02-05")).toBe(true);
    expect(isPublishedDate("2015-01")).toBe(true);
    expect(isPublishedDate("02/2025")).toBe(false);
    expect(isPublishedDate(20250205)).toBe(false);
  });

  it("reads an FTB Revised line", () => {
    expect(htmlPublished("Revised: 01/2015")).toBe("2015-01");
    expect(htmlPublished("Equity-Based Compensation Guidelines")).toBeNull();
  });

  it("formats as month and year", () => {
    expect(formatPublished("2025-02-05")).toBe("Feb 2025");
    expect(formatPublished("2015-01")).toBe("Jan 2015");
  });
});

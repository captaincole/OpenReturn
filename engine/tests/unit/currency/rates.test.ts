/*
 * The exchange-rate tables (currency/rates.ts), against values typed by hand
 * from the published pages:
 * - H.10 history pages (https://www.federalreserve.gov/releases/h10/hist/),
 *   dat00_eu.htm, dat00_uk.htm, dat00_al.htm, dat00_nz.htm, dat00_ja.htm,
 *   dat00_sz.htm, dat00_no.htm;
 * - G.5A, release of January 5, 2026 (https://www.federalreserve.gov/releases/g5a/current/);
 * - the Treasury Reporting Rates of Exchange as of December 31, 2025.
 */

import { describe, expect, it } from "vitest";
import { H10_CURRENCIES } from "../../../src/currency/currencies.js";
import {
  dailyRate,
  isoDayOf,
  yearEndRate,
  yearlyAverageRate,
  type RateLookup,
} from "../../../src/currency/rates.js";
import { dollarsFromForeign } from "../../../src/money.js";

function found(lookup: RateLookup) {
  if (!lookup.ok) throw new Error(lookup.gap);
  return lookup;
}

const dollarsFor = (amount: number, lookup: RateLookup) =>
  dollarsFromForeign(amount, found(lookup).rate);

describe("the H.10 daily table", () => {
  it("holds the rate the history page prints for a day", () => {
    expect(found(dailyRate("EUR", "2025-12-31")).printed).toBe("1.1736");
    expect(found(dailyRate("NOK", "2025-05-22")).printed).toBe("10.2100");
    expect(found(dailyRate("JPY", "2025-06-13")).printed).toBe("144.0400");
    expect(found(dailyRate("GBP", "1971-01-04")).printed).toBe("2.3938");
  });

  it("turns the four asterisk currencies around: U.S. dollars for one unit", () => {
    // Printed 13 June 2025: AUD 0.6513, NZD 0.6035, GBP 1.3594, EUR 1.1557 dollars per unit.
    expect(dollarsFor(100, dailyRate("AUD", "2025-06-13"))).toBe(65.13);
    expect(dollarsFor(100, dailyRate("NZD", "2025-06-13"))).toBe(60.35);
    expect(dollarsFor(100, dailyRate("GBP", "2025-06-13"))).toBe(135.94);
    expect(dollarsFor(100, dailyRate("EUR", "2025-06-13"))).toBe(115.57);
  });

  it("divides the others: units of the currency for one dollar", () => {
    expect(dollarsFor(10000, dailyRate("JPY", "2025-06-13"))).toBe(69.43); // 10,000 / 144.04
    expect(dollarsFor(100, dailyRate("CHF", "2025-06-13"))).toBe(123.21); // 100 / 0.8116
  });

  it("takes the last earlier day with a rate on a weekend or a U.S. holiday", () => {
    const saturday = found(dailyRate("EUR", "2025-12-27"));
    expect(saturday.day).toBe("2025-12-26");
    expect(saturday.printed).toBe("1.1766");
    // 25 December prints ND; 4 July too.
    expect(found(dailyRate("EUR", "2025-12-25")).day).toBe("2025-12-24");
    expect(found(dailyRate("EUR", "2025-07-04")).printed).toBe("1.1758");
  });

  it("holds every currency of the release, and no other", () => {
    for (const { code } of H10_CURRENCIES) {
      expect(dailyRate(code, "2025-12-31").ok, code).toBe(true);
    }
    const outside = dailyRate("ARS", "2025-12-31");
    expect(outside.ok).toBe(false);
    expect(!outside.ok && outside.gap).toContain("H.10");
  });

  it("refuses a day before the series or after the table", () => {
    expect(dailyRate("EUR", "1998-12-31").ok).toBe(false);
    expect(dailyRate("EUR", "2099-01-04").ok).toBe(false);
    // Venezuela's series is read only from its 2021 redenomination.
    expect(dailyRate("VES", "2021-10-01").ok).toBe(false);
  });
});

describe("the G.5A yearly averages", () => {
  it("holds the 2025 averages, turned around for an asterisk currency", () => {
    expect(found(yearlyAverageRate("EUR", 2025)).printed).toBe("1.1306");
    expect(dollarsFor(100, yearlyAverageRate("EUR", 2025))).toBe(113.06);
    expect(found(yearlyAverageRate("NOK", 2025)).printed).toBe("10.3852");
    expect(dollarsFor(1000, yearlyAverageRate("NOK", 2025))).toBe(96.29);
    expect(found(yearlyAverageRate("CHF", 2025)).printed).toBe("0.8305");
    expect(found(yearlyAverageRate("GBP", 2025)).printed).toBe("1.3192");
  });

  it("refuses a currency outside the list", () => {
    expect(yearlyAverageRate("ARS", 2025).ok).toBe(false);
  });
});

describe("the Treasury year-end rates", () => {
  it("holds the rates of 31 December 2025 as printed", () => {
    expect(found(yearEndRate("EUR", 2025)).printed).toBe("0.851");
    expect(found(yearEndRate("CHF", 2025)).printed).toBe("0.792");
    expect(dollarsFor(851, yearEndRate("EUR", 2025))).toBe(1000);
  });

  it("refuses a currency outside the list and a year it lacks", () => {
    expect(yearEndRate("ARS", 2025).ok).toBe(false);
    expect(yearEndRate("EUR", 2024).ok).toBe(false);
  });
});

describe("a fact's date", () => {
  it("reads MM/DD/YYYY, and nothing else", () => {
    expect(isoDayOf("05/22/2025")).toBe("2025-05-22");
    expect(isoDayOf("02/30/2025")).toBeUndefined();
    expect(isoDayOf("5/22/2025")).toBeUndefined();
    expect(isoDayOf("VARIOUS")).toBeUndefined();
    expect(isoDayOf(undefined)).toBeUndefined();
  });
});

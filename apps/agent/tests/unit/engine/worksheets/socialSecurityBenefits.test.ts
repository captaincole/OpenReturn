import { describe, expect, it } from "vitest";
import { bornBeforeJan2_1961 } from "../../../../src/engine/filingInfoResolvers.js";
import { socialSecurityTaxable } from "../../../../src/engine/worksheets/socialSecurityBenefits.js";

const base = { taxExemptInterest: 0, adjustments: 0 };

describe("socialSecurityTaxable (1040 lines 6a/6b worksheet)", () => {
  it("is 0 when line 7 is not over the base amount", () => {
    // carter: MFS lived apart, $1,000 benefits, $17,800 other income.
    const r = socialSecurityTaxable({
      ...base,
      benefits: 1000,
      otherIncome: 17800,
      filingStatus: "married_filing_separately",
      livedApartAllYear: true,
    });
    expect(r).toMatchObject({ line2: 500, line5: 18300, line7: 18300, line8: 25000, taxable: 0 });
  });

  it("taxes up to 50% of the excess over the base, then 85% over the adjusted base", () => {
    const r = socialSecurityTaxable({
      ...base,
      benefits: 20000,
      otherIncome: 30000,
      filingStatus: "single",
    });
    expect(r.taxable).toBe(9600); // line 14 4,500 + line 15 5,100
  });

  it("uses $32,000 / $12,000 for married filing jointly", () => {
    const r = socialSecurityTaxable({
      ...base,
      benefits: 30000,
      otherIncome: 40000,
      filingStatus: "married_filing_jointly",
    });
    expect(r.taxable).toBe(15350); // line 14 6,000 + line 15 9,350
  });

  it("skips lines 8–15 for MFS who lived with the spouse: 85% of line 7", () => {
    const r = socialSecurityTaxable({
      ...base,
      benefits: 10000,
      otherIncome: 5000,
      filingStatus: "married_filing_separately",
      livedApartAllYear: false,
    });
    expect(r.line8).toBeUndefined();
    expect(r).toMatchObject({ line16: 8500, taxable: 8500 });
  });

  it("caps the taxable amount at 85% of benefits (line 17)", () => {
    const r = socialSecurityTaxable({
      ...base,
      benefits: 10000,
      otherIncome: 100000,
      filingStatus: "single",
    });
    expect(r.taxable).toBe(8500);
  });

  it("is 0 when the adjustments are not less than line 5", () => {
    const r = socialSecurityTaxable({
      benefits: 10000,
      otherIncome: 40000,
      taxExemptInterest: 0,
      adjustments: 45000,
      filingStatus: "single",
    });
    expect(r.taxable).toBe(0);
  });
});

describe("bornBeforeJan2_1961 (1040 line 12d, 540 line 9)", () => {
  it("reads MM/DD/YYYY and YYYY-MM-DD around the January 2, 1961 cutoff", () => {
    expect(bornBeforeJan2_1961("10/29/1953")).toBe(true);
    expect(bornBeforeJan2_1961("01/01/1961")).toBe(true);
    expect(bornBeforeJan2_1961("1961-01-02")).toBe(false);
    expect(bornBeforeJan2_1961("01/01/2002")).toBe(false);
    expect(bornBeforeJan2_1961(undefined)).toBeUndefined();
    expect(bornBeforeJan2_1961("sometime")).toBeUndefined();
  });
});

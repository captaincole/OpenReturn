import { describe, expect, it } from "vitest";
import { blockAnchor, lawHref, officialTextUrl, sectionInUrl } from "./law";

describe("lawHref", () => {
  it("turns a law block id into the section page and its anchor", () => {
    expect(lawHref("usc-26-2025::sec::s469::g-1")).toBe("/library/law/469#g-1");
    expect(lawHref("usc-26-2025::sec::s199a::b-2")).toBe("/library/law/199A#b-2");
    expect(lawHref("usc-26-2025::sec::s1400z-2::a-1")).toBe("/library/law/1400Z-2#a-1");
    expect(lawHref("usc-26-2025::sec::s170::b-1-F-iii-p2")).toBe("/library/law/170#b-1-F-iii-p2");
    expect(lawHref("usc-26-2025::sec::s469")).toBe("/library/law/469");
  });

  it("turns a citation into the section page and its anchor", () => {
    expect(lawHref("469(g)(1)(A)")).toBe("/library/law/469#g-1-A");
    expect(lawHref("469")).toBe("/library/law/469");
    expect(lawHref("26 U.S.C. § 469(g)(1)")).toBe("/library/law/469#g-1");
    expect(lawHref("IRC § 199A(b)(2)")).toBe("/library/law/199A#b-2");
    expect(lawHref("section 1400Z–2(a)")).toBe("/library/law/1400Z-2#a");
    expect(lawHref(" 469 (g) (1) ")).toBe("/library/law/469#g-1");
  });

  it("turns a regulation citation or block id into its page: the dot tells it from a Code section", () => {
    expect(lawHref("1.469-5T")).toBe("/library/law/1.469-5T");
    expect(lawHref("1.469-5T(a)(1)")).toBe("/library/law/1.469-5T#a-1");
    expect(lawHref("26 CFR § 1.469-5T(a)(1)(ii)")).toBe("/library/law/1.469-5T#a-1-ii");
    expect(lawHref("Treas. Reg. § 1.1031(a)-1(b)")).toBe("/library/law/1.1031(a)-1#b");
    expect(lawHref("26 CFR § 1.408A-4, Q&A-1(b)")).toBe("/library/law/1.408A-4#qa1-b");
    expect(lawHref("cfr-26-2025::sec::s1.469-5t::a-1-ii")).toBe("/library/law/1.469-5T#a-1-ii");
    expect(lawHref("cfr-26-2025::sec::s1.1031(a)-1::b")).toBe("/library/law/1.1031(a)-1#b");
    expect(lawHref("cfr-26-2025::sec::s301.6103(p)(2)(b)-1")).toBe(
      "/library/law/301.6103(p)(2)(b)-1",
    );
    expect(lawHref("1031")).toBe("/library/law/1031");
  });

  it("turns a California citation or block id into its page, which names the code", () => {
    expect(lawHref("CA 17041(a)(1)")).toBe("/library/law/CA-17041#a-1");
    expect(lawHref("Cal. Rev. & Tax. Code § 17024.5(a)(1)")).toBe("/library/law/CA-17024.5#a-1");
    expect(lawHref("R&TC 19136")).toBe("/library/law/CA-19136");
    expect(lawHref("ca-rtc-2025::sec::s17014::d-2")).toBe("/library/law/CA-17014#d-2");
    expect(lawHref("ca-rtc-2025::sec::s17058-v2::a-1")).toBe("/library/law/CA-17058#v2-a-1");
    expect(lawHref("ca-rtc-2025::sec::s17058-v2")).toBe("/library/law/CA-17058#v2");
    expect(lawHref("CA passive")).toBeNull();
    expect(lawHref("17024.5")).toBe("/library/law/17024.5");
  });

  it("answers null for anything else", () => {
    expect(lawHref("passive activity")).toBeNull();
    expect(lawHref("469(g")).toBeNull();
    expect(lawHref("469(g) and more")).toBeNull();
    expect(lawHref("irs-1040-inst-2025::sec::single::b01")).toBeNull();
    expect(lawHref("")).toBeNull();
    expect(lawHref("1.")).toBeNull();
    expect(lawHref("1.469-5T(a")).toBeNull();
  });
});

describe("the section helpers", () => {
  it("print the section number as a URL holds it", () => {
    expect(sectionInUrl("1400Z–2")).toBe("1400Z-2");
    expect(sectionInUrl("469")).toBe("469");
  });

  it("take the element id from the end of a block id", () => {
    expect(blockAnchor("usc-26-2025::sec::s469::g-1")).toBe("g-1");
    expect(blockAnchor("usc-26-2025::sec::s1202::b-4-dup2")).toBe("b-4-dup2");
    expect(blockAnchor("ca-rtc-2025::sec::s17058::a-1")).toBe("a-1");
    expect(blockAnchor("ca-rtc-2025::sec::s17058-v2::a-1")).toBe("v2-a-1");
  });

  it("link the official text of one section", () => {
    expect(officialTextUrl("469")).toBe("https://uscode.house.gov/us/usc/t26/s469/");
    expect(officialTextUrl("1400Z–2")).toBe("https://uscode.house.gov/us/usc/t26/s1400Z-2/");
    expect(officialTextUrl("1.469-5T")).toBe(
      "https://www.ecfr.gov/current/title-26/section-1.469-5T",
    );
    expect(officialTextUrl("17024.5", "california")).toBe(
      "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=17024.5.",
    );
  });
});

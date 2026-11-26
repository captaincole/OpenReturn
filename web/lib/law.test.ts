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

  it("answers null for anything else", () => {
    expect(lawHref("passive activity")).toBeNull();
    expect(lawHref("469(g")).toBeNull();
    expect(lawHref("469(g) and more")).toBeNull();
    expect(lawHref("irs-1040-inst-2025::sec::single::b01")).toBeNull();
    expect(lawHref("")).toBeNull();
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
  });

  it("link the official text of one section", () => {
    expect(officialTextUrl("469")).toBe("https://uscode.house.gov/us/usc/t26/s469/");
    expect(officialTextUrl("1400Z–2")).toBe("https://uscode.house.gov/us/usc/t26/s1400Z-2/");
  });
});

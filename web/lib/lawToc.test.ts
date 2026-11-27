import { describe, expect, it } from "vitest";
import { isLawSource, lawCrumbs, lawTocHref } from "./lawToc";

describe("lawTocHref", () => {
  it("links a library's top level, and one level by its node", () => {
    expect(lawTocHref("statute")).toBe("/library/law/toc/statute");
    expect(lawTocHref("statute", "sta-ch1-sche")).toBe("/library/law/toc/statute/sta-ch1-sche");
    expect(lawTocHref("regulations", "pt1-sgecfr504ddca54174c57")).toBe(
      "/library/law/toc/regulations/pt1-sgecfr504ddca54174c57",
    );
  });
});

describe("isLawSource", () => {
  it("accepts only the three libraries", () => {
    expect(isLawSource("statute")).toBe(true);
    expect(isLawSource("regulations")).toBe(true);
    expect(isLawSource("california")).toBe(true);
    expect(isLawSource("cases")).toBe(false);
    expect(isLawSource("")).toBe(false);
  });
});

describe("lawCrumbs", () => {
  it("starts at the library's top level, then links each level above", () => {
    expect(
      lawCrumbs("statute", [
        { node: "sta", heading: "Subtitle A—Income Taxes" },
        { node: "sta-ch1", heading: "CHAPTER 1—NORMAL TAXES AND SURTAXES" },
      ]),
    ).toEqual([
      { href: "/library/law/toc/statute", label: "Internal Revenue Code" },
      { href: "/library/law/toc/statute/sta", label: "Subtitle A—Income Taxes" },
      { href: "/library/law/toc/statute/sta-ch1", label: "CHAPTER 1—NORMAL TAXES AND SURTAXES" },
    ]);
    expect(lawCrumbs("regulations", [])).toEqual([
      { href: "/library/law/toc/regulations", label: "Treasury Regulations" },
    ]);
    expect(lawCrumbs("california", [{ node: "div2", heading: "DIVISION 2. OTHER TAXES" }])).toEqual(
      [
        { href: "/library/law/toc/california", label: "California Revenue and Taxation Code" },
        { href: "/library/law/toc/california/div2", label: "DIVISION 2. OTHER TAXES" },
      ],
    );
  });
});

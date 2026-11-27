import { describe, expect, it } from "vitest";
import { versionOfSectionId } from "../../../src/law/caCitation.js";
import { CA_SCHEME, isCaDesignatorToken, nextLetters } from "../../../src/law/caDesignators.js";
import { citationIn, parseLawTarget, sectionIdIn } from "../../../src/law/citation.js";

describe("parseLawTarget: California", () => {
  it.each([
    ["CA 17041", "17041", []],
    ["CA 17041(a)(1)", "17041", ["a", "1"]],
    ["ca-17024.5", "17024.5", []],
    ["CA17014(a)", "17014", ["a"]],
    ["R&TC 17041(i)", "17041", ["i"]],
    ["RTC § 19136(a)", "19136", ["a"]],
    ["Cal. Rev. & Tax. Code § 17024.5(a)(1)", "17024.5", ["a", "1"]],
    ["Revenue and Taxation Code section 17053.98.1", "17053.98.1", []],
    ["CA 17041.", "17041", []],
  ])("reads %s", (input, section, path) => {
    expect(parseLawTarget(input)).toEqual({ kind: "california", section, path });
  });

  it("keeps a number that names no code the Code's or a regulation's", () => {
    expect(parseLawTarget("17041")).toEqual({ kind: "citation", section: "17041", path: [] });
    expect(parseLawTarget("17024.5")?.kind).toBe("regulation");
    expect(parseLawTarget("cfr 1.469-5T")?.kind).toBe("regulation");
  });

  it.each(["CA", "CA passive", "CA 17041(a", "CA 17041(a)x", "cabbage 17041"])(
    "refuses %j",
    (input) => {
      expect(parseLawTarget(input)).toBeNull();
    },
  );

  it("spells the row id and the citation of a California section", () => {
    expect(sectionIdIn("ca-rtc-2025", "california", "17024.5")).toBe("ca-rtc-2025::sec::s17024.5");
    expect(sectionIdIn("usc-26-2025", "statute", "1400Z-2")).toBe("usc-26-2025::sec::s1400z-2");
    expect(citationIn("california", "17041", ["a", "1"])).toBe(
      "Cal. Rev. & Tax. Code § 17041(a)(1)",
    );
    expect(citationIn("regulations", "1.469-5T", ["a"])).toBe("26 CFR § 1.469-5T(a)");
  });

  it("reads the version from a section id", () => {
    expect(versionOfSectionId("ca-rtc-2025::sec::s17058")).toBe(1);
    expect(versionOfSectionId("ca-rtc-2025::sec::s17058-v2")).toBe(2);
    expect(versionOfSectionId("usc-26-2025::sec::s1400z-2")).toBe(1);
  });
});

describe("California paragraph numbers", () => {
  it("count letters past Z as a spreadsheet's columns do", () => {
    expect(nextLetters("a")).toBe("b");
    expect(nextLetters("Z")).toBe("AA");
    expect(nextLetters("AA")).toBe("AB");
    expect(nextLetters("AZ")).toBe("BA");
  });

  it("let one number fit two levels, and the item level", () => {
    const kinds = (token: string) => CA_SCHEME.kindsOf({ token, italic: false });
    expect(kinds("i")).toEqual(["lowerLetter", "lowerRoman"]);
    expect(kinds("I")).toEqual(["upperLetter", "upperRoman"]);
    expect(kinds("ia")).toEqual(["lowerLetter", "item"]);
    expect(kinds("iv")).toEqual(["lowerLetter", "lowerRoman"]);
    expect(kinds("AB")).toEqual(["upperLetter"]);
    expect(CA_SCHEME.follows("item", "ia", "ib")).toBe(true);
    expect(CA_SCHEME.follows("upperRoman", "III", "IV")).toBe(true);
    expect(CA_SCHEME.follows("upperLetter", "Z", "AA")).toBe(true);
  });

  it("refuse words and long numbers", () => {
    expect(isCaDesignatorToken("Notwithstanding")).toBe(false);
    expect(isCaDesignatorToken("1234")).toBe(false);
    expect(isCaDesignatorToken("aB")).toBe(false);
  });
});

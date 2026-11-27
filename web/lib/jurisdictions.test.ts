import { describe, expect, it } from "vitest";
import {
  ALL_JURISDICTIONS,
  canTurnOff,
  publishersOf,
  searchedNote,
  toggleJurisdiction,
} from "./jurisdictions";

describe("the jurisdiction switches", () => {
  it("start with every switch on", () => {
    expect(ALL_JURISDICTIONS).toEqual(["federal", "CA"]);
  });

  it("turn one off to narrow, and on again in table order", () => {
    expect(toggleJurisdiction(["federal", "CA"], "federal")).toEqual(["CA"]);
    expect(toggleJurisdiction(["CA"], "federal")).toEqual(["federal", "CA"]);
  });

  it("keep the last switch on", () => {
    expect(canTurnOff(["CA"], "CA")).toBe(false);
    expect(canTurnOff(["CA"], "federal")).toBe(true);
    expect(toggleJurisdiction(["CA"], "CA")).toEqual(["CA"]);
  });
});

describe("what an answer says it searched", () => {
  it("says nothing when every library was searched", () => {
    expect(searchedNote(["federal", "CA"])).toBeNull();
    expect(searchedNote(undefined)).toBeNull();
  });

  it("names the libraries when some were off", () => {
    expect(searchedNote(["CA"])).toBe("Searched: California only");
    expect(searchedNote(["federal"])).toBe("Searched: Federal only");
  });

  it("names the publishers searched", () => {
    expect(publishersOf(["federal", "CA"])).toBe("IRS and FTB");
    expect(publishersOf(["CA"])).toBe("FTB");
    expect(publishersOf(undefined)).toBe("IRS and FTB");
  });
});

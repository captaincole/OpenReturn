import { describe, expect, it } from "vitest";
import {
  ALL_JURISDICTIONS,
  includesFederal,
  jurisdictionOfPublisher,
  parseJurisdictions,
  publisherFilter,
  resolveJurisdictions,
  searchedLine,
} from "../../src/jurisdiction.js";
import { walkLaw } from "../../src/law/lawSidecar.js";
import { walkCorpus } from "../../src/refdocs/walkCorpus.js";

describe("parseJurisdictions", () => {
  it("turns every jurisdiction on when the caller names none", () => {
    expect(parseJurisdictions(undefined)).toEqual(["federal", "CA"]);
    expect(resolveJurisdictions()).toEqual([...ALL_JURISDICTIONS]);
  });

  it("keeps each named jurisdiction once, federal first", () => {
    expect(parseJurisdictions(["CA"])).toEqual(["CA"]);
    expect(parseJurisdictions(["federal"])).toEqual(["federal"]);
    expect(parseJurisdictions(["CA", "federal", "CA"])).toEqual(["federal", "CA"]);
  });

  it("refuses an empty list", () => {
    expect(() => parseJurisdictions([])).toThrow(/Name at least one jurisdiction/);
  });

  it("refuses an unknown value and names it", () => {
    expect(() => parseJurisdictions(["NY"])).toThrow(/Unknown jurisdiction "NY"/);
    expect(() => parseJurisdictions(["ca"])).toThrow(/Unknown jurisdiction "ca"/);
    expect(() => parseJurisdictions(["both"])).toThrow(/Use one of: "federal", "CA"/);
  });

  it("refuses a bare string", () => {
    expect(() => parseJurisdictions("CA")).toThrow(/expected array/);
  });
});

describe("the publisher table", () => {
  it("maps each publisher to its jurisdiction", () => {
    expect(jurisdictionOfPublisher("IRS")).toBe("federal");
    expect(jurisdictionOfPublisher("FTB")).toBe("CA");
  });

  it("fails loudly for a publisher it does not know", () => {
    expect(() => jurisdictionOfPublisher("NYSDTF")).toThrow(/has no jurisdiction/);
  });

  // A new publisher in sources/ must get a row: its documents could not be searched by jurisdiction.
  it("knows the publisher of every sidecar under sources/", async () => {
    const corpus = await walkCorpus();
    const law = await walkLaw();
    const publishers = new Set([
      ...corpus.entries.map((entry) => entry.sidecar.publisher),
      ...law.map((entry) => entry.sidecar.publisher),
    ]);
    expect(corpus.entries.length).toBeGreaterThan(100);
    expect([...publishers].sort()).toEqual(expect.arrayContaining(["FTB", "IRS"]));
    for (const publisher of publishers)
      expect(() => jurisdictionOfPublisher(publisher)).not.toThrow();
  });
});

describe("what a search keeps", () => {
  it("filters by publisher only when some jurisdiction is off", () => {
    expect(publisherFilter(undefined)).toBeNull();
    expect(publisherFilter(["federal", "CA"])).toBeNull();
    expect(publisherFilter(["CA"])).toEqual(["FTB", "Legislative Counsel of California"]);
    expect(publisherFilter(["federal"])).toContain("IRS");
    expect(publisherFilter(["federal"])).not.toContain("FTB");
  });

  it("searches the federal statute only when federal is on", () => {
    expect(includesFederal(["federal", "CA"])).toBe(true);
    expect(includesFederal(["CA"])).toBe(false);
  });

  it("writes a prompt line only when some jurisdiction is off", () => {
    expect(searchedLine(["federal", "CA"])).toBeNull();
    expect(searchedLine(["CA"])).toBe("Libraries searched: California only.");
    expect(searchedLine(["federal"])).toBe("Libraries searched: federal only.");
  });
});

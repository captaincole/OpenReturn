import { describe, expect, it } from "vitest";
import {
  ALL_JURISDICTIONS,
  jurisdictionOfLawSource,
  jurisdictionOfPublisher,
  lawSourcesOf,
  parseJurisdictions,
  publisherFilter,
  resolveJurisdictions,
  searchedLine,
  statutesOf,
} from "../../src/jurisdiction.js";
import { LAW_DOC_PREFIXES, lawSourceOfId } from "../../src/law/lawIds.js";
import { formatOfSource } from "../../src/law/lawRead.js";
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

  it("writes a prompt line only when some jurisdiction is off", () => {
    expect(searchedLine(["federal", "CA"])).toBeNull();
    expect(searchedLine(["CA"])).toBe("Libraries searched: California only.");
    expect(searchedLine(["federal"])).toBe("Libraries searched: federal only.");
  });
});

describe("the law sources of each jurisdiction", () => {
  it("searches the federal law for federal and California's code for CA, in a fixed order", () => {
    expect(lawSourcesOf(["federal"])).toEqual(["statute", "regulations"]);
    expect(lawSourcesOf(["CA"])).toEqual(["california"]);
    expect(lawSourcesOf(["CA", "federal"])).toEqual(["statute", "regulations", "california"]);
  });

  it("gives the statute round each jurisdiction's statute, never the regulations", () => {
    expect(statutesOf(["federal"])).toEqual(["statute"]);
    expect(statutesOf(["CA"])).toEqual(["california"]);
    expect(statutesOf(["CA", "federal"])).toEqual(["statute", "california"]);
  });

  it("puts each law source in one jurisdiction, and fails loudly for an unknown one", () => {
    expect(jurisdictionOfLawSource("statute")).toBe("federal");
    expect(jurisdictionOfLawSource("regulations")).toBe("federal");
    expect(jurisdictionOfLawSource("california")).toBe("CA");
    expect(() => jurisdictionOfLawSource("new-york")).toThrow(/has no jurisdiction/);
  });

  // A new law document must get a source in a jurisdiction: else no list could search it.
  it("knows the source and jurisdiction of every law sidecar under sources/", async () => {
    const law = await walkLaw();
    expect(law.length).toBeGreaterThanOrEqual(3);
    for (const { sidecar } of law) {
      const source = lawSourceOfId(sidecar.docId);
      expect(source, sidecar.docId).not.toBeNull();
      expect(formatOfSource(source!), sidecar.docId).toBe(sidecar.format);
      expect(jurisdictionOfLawSource(source!), sidecar.docId).toBe(
        jurisdictionOfPublisher(sidecar.publisher),
      );
    }
    const sources = new Set(law.map(({ sidecar }) => lawSourceOfId(sidecar.docId)));
    expect([...sources].sort()).toEqual(Object.keys(LAW_DOC_PREFIXES).sort());
  });

  // isLawBlockId reads the id's start: no instruction document may share it.
  it("finds no law source in any corpus document id", async () => {
    const corpus = await walkCorpus();
    for (const { sidecar } of corpus.entries)
      expect(lawSourceOfId(sidecar.docId), sidecar.docId).toBeNull();
  });
});

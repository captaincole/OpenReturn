import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_JURISDICTIONS,
  isLawBlock,
  jurisdictionOfBlock,
  jurisdictionOfEngineForm,
  readRequestedJurisdictions,
  storedJurisdictions,
  textName,
} from "../../../../src/mastra/canon/jurisdictions";

/*
 * Canon's table, read as text: Cade never imports Canon's code (boundary.test.ts).
 * Each row of JURISDICTION_TABLE starts with its key, `  CA: {`, on one line or several.
 */
const CANON_FILE = resolve(__dirname, "../../../../../canon/src/jurisdiction.ts");

/* A row starts at the table's own indent, `  CA: {`; its fields are indented deeper. */
const isRowStart = (line: string): boolean =>
  line.startsWith("  ") && !line.startsWith("   ") && line.includes(": {");

function canonJurisdictions(): string[] {
  const lines = readFileSync(CANON_FILE, "utf8").split("\n");
  const start = lines.findIndex((line) => line.startsWith("const JURISDICTION_TABLE = {"));
  const end = lines.findIndex((line, i) => i > start && line.startsWith("} as const;"));
  return lines
    .slice(start + 1, end)
    .filter(isRowStart)
    .map((line) => line.split(":")[0].trim());
}

describe("Cade's jurisdictions", () => {
  it("are the ones Canon accepts, in Canon's order", () => {
    expect(canonJurisdictions()).toEqual([...ALL_JURISDICTIONS]);
  });

  it("read a request's list in table order, each once", () => {
    expect(readRequestedJurisdictions(["CA", "federal", "CA"])).toEqual({
      ok: true,
      jurisdictions: ["federal", "CA"],
    });
    expect(readRequestedJurisdictions(["CA"])).toEqual({ ok: true, jurisdictions: ["CA"] });
    expect(readRequestedJurisdictions(undefined)).toEqual({ ok: true, jurisdictions: undefined });
  });

  it("refuse an empty list, an unknown value and a value that is not a list", () => {
    expect(readRequestedJurisdictions([])).toMatchObject({
      ok: false,
      error: 'Name at least one jurisdiction ("federal", "CA"), or leave the list out.',
    });
    expect(readRequestedJurisdictions(["federal", "both"])).toMatchObject({
      ok: false,
      error: 'Unknown jurisdiction "both". Use one of: "federal", "CA".',
    });
    expect(readRequestedJurisdictions("CA")).toMatchObject({ ok: false });
  });

  it("read a stored list, and every jurisdiction for a row from before the list", () => {
    expect(storedJurisdictions(["CA"])).toEqual(["CA"]);
    expect(storedJurisdictions(undefined)).toEqual(["federal", "CA"]);
    expect(storedJurisdictions([])).toEqual(["federal", "CA"]);
  });

  it("name the jurisdiction of an engine form and of a library block", () => {
    expect(jurisdictionOfEngineForm("state-ca")).toBe("CA");
    expect(jurisdictionOfEngineForm("federal")).toBe("federal");
    expect(jurisdictionOfEngineForm("state-ny")).toBeUndefined();
    expect(jurisdictionOfBlock("ca-540-inst-2025::sec::line-11::b01")).toBe("CA");
    expect(jurisdictionOfBlock("ca-rtc-2025::sec::s17041::a")).toBe("CA");
    expect(jurisdictionOfBlock("irs-1040-inst-2025::sec::single::b01")).toBe("federal");
    expect(jurisdictionOfBlock("usc-26-2025::sec::s469::g-1")).toBe("federal");
    expect(jurisdictionOfBlock("ny-it201-inst-2025::sec::x::b01")).toBeUndefined();
    expect(isLawBlock("ca-rtc-2025::sec::s17041::a")).toBe(true);
    expect(isLawBlock("cfr-26-2025::sec::s1-469-5T::a-1")).toBe(true);
    expect(isLawBlock("ca-540-inst-2025::sec::line-11::b01")).toBe(false);
    expect(textName("CA", "law")).toBe("California's code");
    expect(textName(undefined, "instructions")).toBe("the instructions");
  });
});

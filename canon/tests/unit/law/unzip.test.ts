import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readZip } from "../../../src/law/unzip.js";

// tiny.zip was made once with the zip CLI: one deflated file, one stored file, one folder.
const tiny = new Uint8Array(readFileSync(join(__dirname, "fixtures", "tiny.zip")));
const text = (data: Uint8Array) => new TextDecoder().decode(data);

describe("readZip", () => {
  it("reads a deflated file and a stored file, and skips folders", () => {
    const entries = readZip(tiny);
    expect(entries.map((entry) => entry.name)).toEqual(["deflated.txt", "stored.txt"]);
    expect(text(entries[0].data)).toBe("The statute text repeats. ".repeat(40));
    expect(text(entries[1].data)).toBe("Stored as is.");
  });

  it("reads an archive that is a view into a larger buffer", () => {
    const padded = new Uint8Array(tiny.length + 8);
    padded.set(tiny, 8);
    expect(readZip(padded.subarray(8)).map((entry) => entry.name)).toEqual([
      "deflated.txt",
      "stored.txt",
    ]);
  });

  it("refuses a file that is not a zip", () => {
    expect(() => readZip(new TextEncoder().encode("<uscDoc/>"))).toThrow(/not a zip file/);
  });
});

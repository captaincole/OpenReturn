import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readZip } from "../../../src/law/unzip.js";
import { writeZip } from "../../../src/law/zipWrite.js";

const bytes = (text: string) => new TextEncoder().encode(text);
const PARTS = [
  { name: "part-1.xml", data: bytes('<DIV5 N="1">income taxes</DIV5>'.repeat(50)) },
  { name: "part-301.xml", data: bytes('<DIV5 N="301">procedure</DIV5>') },
];

describe("writeZip", () => {
  it("writes a zip that readZip reads back, in order", () => {
    const entries = readZip(writeZip(PARTS));
    expect(entries.map((entry) => entry.name)).toEqual(["part-1.xml", "part-301.xml"]);
    expect(entries.map((entry) => new TextDecoder().decode(entry.data))).toEqual(
      PARTS.map((part) => new TextDecoder().decode(part.data)),
    );
  });

  it("makes the same bytes from the same files", () => {
    expect(writeZip(PARTS)).toEqual(writeZip(PARTS));
  });

  it("writes an archive the system unzip accepts", () => {
    const dir = mkdtempSync(join(tmpdir(), "canon-zip-test-"));
    try {
      const path = join(dir, "law.zip");
      writeFileSync(path, writeZip(PARTS));
      expect(execFileSync("unzip", ["-t", path], { encoding: "utf8" })).toContain("No errors");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

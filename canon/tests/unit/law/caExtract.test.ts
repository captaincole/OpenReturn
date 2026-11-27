import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { type CaScope, extractCalifornia } from "../../../src/law/caExtract.js";
import {
  SECTION_COLUMNS,
  SECTION_TABLE,
  tableLines,
  withField,
} from "../../../src/law/caTables.js";
import { readZip, type ZipEntry } from "../../../src/law/unzip.js";
import { openZipFile } from "../../../src/law/zipFile.js";
import { writeZip } from "../../../src/law/zipWrite.js";
import { caFixtureFiles } from "./caFixture.js";

/*
 * A small stand-in for the Legislature's session archive: the fixture rows
 * with their XML files under archive names (LAW_SECTION_TBL_<n>.lob), a
 * row of another code, and a ZIP64 end record, as the real archive has
 * (it holds more than 65,535 files).
 */

const dir = mkdtempSync(path.join(tmpdir(), "canon-ca-extract-test-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const text = (data: Uint8Array) => new TextDecoder().decode(data);
const bytes = (value: string) => new TextEncoder().encode(value);

/** The section table with each row's file renamed as the archive names it, and the files to match. */
function archiveEntries(): ZipEntry[] {
  const files = caFixtureFiles();
  const sections = files.find((file) => file.name === SECTION_TABLE)!;
  const lines = tableLines(text(sections.data));
  const lobs: ZipEntry[] = [];
  const renamed = lines.map((line, index) => {
    const name = `LAW_SECTION_TBL_${index + 1}.lob`;
    const rowId = line.split("\t")[0].slice(1, -1);
    lobs.push({ name, data: files.find((file) => file.name === `lob/${rowId}.xml`)!.data });
    return withField(line, SECTION_COLUMNS, "content_xml", name);
  });
  const otherCode = withField(lines[0], SECTION_COLUMNS, "law_code", "`PEN`");
  const table = [...renamed, otherCode].map((line) => `${line}\n`).join("");
  const tables = files.filter((file) => file.name.endsWith(".dat") && file.name !== SECTION_TABLE);
  return [{ name: SECTION_TABLE, data: bytes(table) }, ...tables, ...lobs];
}

/** The zip with its end record rewritten the ZIP64 way: the count in the ZIP64 record only. */
function asZip64(zip: Uint8Array): Uint8Array {
  const end = new DataView(zip.buffer, zip.byteOffset + zip.length - 22, 22);
  const count = end.getUint16(10, true);
  const size = end.getUint32(12, true);
  const offset = end.getUint32(16, true);
  const head = zip.subarray(0, zip.length - 22);
  const record = new DataView(new ArrayBuffer(56));
  record.setUint32(0, 0x06064b50, true);
  record.setBigUint64(4, 44n, true);
  record.setBigUint64(24, BigInt(count), true);
  record.setBigUint64(32, BigInt(count), true);
  record.setBigUint64(40, BigInt(size), true);
  record.setBigUint64(48, BigInt(offset), true);
  const locator = new DataView(new ArrayBuffer(20));
  locator.setUint32(0, 0x07064b50, true);
  locator.setBigUint64(8, BigInt(head.length), true);
  locator.setUint32(16, 1, true);
  const tail = new DataView(new ArrayBuffer(22));
  tail.setUint32(0, 0x06054b50, true);
  tail.setUint16(8, 0xffff, true);
  tail.setUint16(10, 0xffff, true);
  tail.setUint32(12, size, true);
  tail.setUint32(16, 0xffffffff, true);
  const parts = [head, record, locator, tail].map((part) =>
    part instanceof Uint8Array ? part : new Uint8Array(part.buffer),
  );
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  parts.reduce((at, part) => (out.set(part, at), at + part.length), 0);
  return out;
}

function writeArchive(name: string): string {
  const file = path.join(dir, name);
  writeFileSync(file, asZip64(writeZip(archiveEntries())));
  return file;
}

describe("openZipFile", () => {
  it("reads a ZIP64 archive's files by name, without loading the whole file", () => {
    const archive = openZipFile(writeArchive("names.zip"));
    expect(archive.names()).toContain("LAW_TOC_TBL.dat");
    expect(text(archive.read("CODES_TBL.dat"))).toContain("`RTC`");
    expect(archive.dateOf("CODES_TBL.dat")).toBe("1980-01-01");
    expect(() => archive.read("missing.dat")).toThrow(/has no missing\.dat/);
    archive.close();
  });
});

// The fixtures hold Part 10 only.
const PART_10: CaScope = { code: "RTC", division: "2.", parts: ["10."] };

describe("extractCalifornia", () => {
  const extractOf = (name: string) => {
    const archive = openZipFile(writeArchive(name));
    try {
      return extractCalifornia(archive, PART_10);
    } finally {
      archive.close();
    }
  };

  it("keeps the code's rows, names each XML file by its row, and drops other codes", () => {
    const extract = extractOf("one.zip");
    const files = readZip(extract.zip);
    expect(files.slice(0, 4).map((file) => file.name)).toEqual([
      "CODES_TBL.dat",
      "LAW_TOC_TBL.dat",
      "LAW_TOC_SECTIONS_TBL.dat",
      "LAW_SECTION_TBL.dat",
    ]);
    expect(files.map((file) => file.name)).toContain("lob/RTC17014.199412434.xml");
    const sections = text(files.find((file) => file.name === SECTION_TABLE)!.data);
    expect(sections).not.toContain("`PEN`");
    expect(sections).toContain("\tlob/RTC17014.199412434.xml\t");
    expect(extract.stats).toMatchObject({ sections: 7, files: 11 });
  });

  it("names the part it cannot find", () => {
    const archive = openZipFile(writeArchive("missing-part.zip"));
    const scope = { ...PART_10, parts: ["10.2."] };
    expect(() => extractCalifornia(archive, scope)).toThrow(/no part 10\.2\./);
    archive.close();
  });

  it("makes the same bytes from the same rows", () => {
    expect(extractOf("a.zip").zip).toEqual(extractOf("b.zip").zip);
  });
});

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { LawEntry } from "../../../src/law/lawSidecar.js";
import { parseCaExtract } from "../../../src/law/parseCaml.js";
import type { ZipEntry } from "../../../src/law/unzip.js";

/*
 * A small California extract for the parser, tool and route tests: the law
 * tables' rows and the XML files of seven real sections (17001, 17014,
 * 17041, 17054, 17275.4 and both versions of 17552.3), cut from the
 * Legislature's 2025 session archive (pubinfo_2025.zip of 2026-11-22) the
 * way `law extract-ca` cuts it. Chapter 2.6 is a level with no section.
 */

const FIXTURES = path.join(__dirname, "fixtures", "caml");

export const caFixtureFiles = (): ZipEntry[] => {
  const read = (name: string) => ({
    name,
    data: new Uint8Array(readFileSync(path.join(FIXTURES, name))),
  });
  const tables = readdirSync(FIXTURES).filter((name) => name.endsWith(".dat"));
  const lobs = readdirSync(path.join(FIXTURES, "lob")).map((name) => `lob/${name}`);
  return [...tables, ...lobs].sort().map(read);
};

export const CA_ENTRY: LawEntry = {
  sidecar: {
    docId: "ca-rtc-2025",
    title: "California Revenue and Taxation Code, Division 2, Parts 10 and 10.2",
    publisher: "Legislative Counsel of California",
    taxYear: 2025,
    sourceUrl: null,
    sha256: "0",
    format: "caml",
    releasePoint: "2026-11-22",
    published: "2026-11-22",
    files: [],
  },
  sidecarPath: "law.meta.json",
  zipPath: "law.zip",
  zipRelPath: "law.zip",
};

export const parsedCalifornia = () => parseCaExtract(caFixtureFiles(), CA_ENTRY.sidecar.docId);

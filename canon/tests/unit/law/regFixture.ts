import { readFileSync } from "node:fs";
import path from "node:path";
import type { LawEntry } from "../../../src/law/lawSidecar.js";
import { parseEcfrParts } from "../../../src/law/parseEcfr.js";

/* A small regulations document for the tool and route tests: two real sections, in one part. */

const FIXTURES = path.join(__dirname, "fixtures", "ecfr");
const fixture = (name: string) => readFileSync(path.join(FIXTURES, name), "utf8");

export const REG_ENTRY: LawEntry = {
  sidecar: {
    docId: "cfr-26-2025",
    title: "Treasury Regulations (26 CFR Parts 1 and 301), as of 2025-12-31",
    publisher: "OFR",
    taxYear: 2025,
    sourceUrl: null,
    sha256: "0",
    format: "ecfr",
    releasePoint: "2025-12-31",
    published: null,
    files: [],
  },
  sidecarPath: "law.meta.json",
  zipPath: "law.zip",
  zipRelPath: "law.zip",
};

export const parsedRegulations = () =>
  parseEcfrParts(
    [
      fixture("part.xml").replace(
        "{{SECTIONS}}",
        ["s1.469-5T.xml", "s1.408A-4-qa.xml"].map(fixture).join("\n"),
      ),
    ],
    REG_ENTRY.sidecar.docId,
  );

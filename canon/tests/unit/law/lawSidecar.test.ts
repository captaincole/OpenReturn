import { describe, expect, it } from "vitest";
import { coerceLawSidecar, partsSha256, walkLaw } from "../../../src/law/lawSidecar.js";
import { walkCorpus } from "../../../src/refdocs/walkCorpus.js";

// These read the committed sources/ folder: the pinned releases must stay valid and out of the corpus.
describe("the law sidecars", () => {
  it("pins Title 26 at release point 119-73", async () => {
    const entries = await walkLaw();
    expect(entries.map((item) => item.sidecar.docId)).toEqual(["cfr-26-2025", "usc-26-2025"]);
    const entry = entries[1];
    expect(entry.sidecar).toMatchObject({
      docId: "usc-26-2025",
      publisher: "OLRC",
      taxYear: 2025,
      format: "uslm",
      releasePoint: "119-73",
      published: "2026-01-12",
    });
    expect(entry.zipRelPath).toBe("2025/law/federal/usc-26/law.zip");
  });

  it("pins 26 CFR Parts 1 and 301 as of 2025-12-31, one sha256 per part", async () => {
    const [entry] = await walkLaw();
    expect(entry.sidecar).toMatchObject({
      docId: "cfr-26-2025",
      publisher: "OFR",
      taxYear: 2025,
      format: "ecfr",
      releasePoint: "2025-12-31",
      published: null,
    });
    expect(entry.sidecar.files.map((file) => file.file)).toEqual(["part-1.xml", "part-301.xml"]);
    expect(entry.sidecar.files.every((file) => file.sourceUrl.includes("/2025-12-31/"))).toBe(true);
    expect(entry.sidecar.sha256).toBe(partsSha256(entry.sidecar.files));
  });

  it("is not a corpus document, and the corpus walk does not flag its folder", async () => {
    const walk = await walkCorpus();
    const docIds = walk.entries.map((entry) => entry.sidecar.docId);
    expect(docIds).not.toContain("usc-26-2025");
    expect(docIds).not.toContain("cfr-26-2025");
    expect(walk.unconfigured.filter((item) => item.sourceRelPath.includes("/law/"))).toEqual([]);
  });

  it("refuses a sidecar with another format or no release point", () => {
    const good = { docId: "d", title: "t", publisher: "OLRC", sha256: "s", releasePoint: "119-73" };
    expect(coerceLawSidecar({ ...good, format: "uslm" })).not.toBeNull();
    expect(coerceLawSidecar({ ...good, format: "pdf" })).toBeNull();
    expect(coerceLawSidecar({ ...good, format: "uslm", releasePoint: undefined })).toBeNull();
    expect(coerceLawSidecar({ ...good, format: "uslm", published: "Jan 2026" })).toBeNull();
  });

  it("needs each part of an ecfr sidecar pinned, and hashes the parts in order", () => {
    const part = { file: "part-1.xml", sourceUrl: "https://example.test/1", sha256: "a" };
    const other = { file: "part-301.xml", sourceUrl: "https://example.test/301", sha256: "b" };
    const good = { docId: "d", title: "t", publisher: "OFR", releasePoint: "2025-12-31" };
    expect(coerceLawSidecar({ ...good, format: "ecfr", files: [part, other] })?.files).toHaveLength(
      2,
    );
    expect(coerceLawSidecar({ ...good, format: "ecfr", files: [] })).toBeNull();
    expect(
      coerceLawSidecar({ ...good, format: "ecfr", files: [{ ...part, sha256: "" }] }),
    ).toBeNull();
    expect(partsSha256([part, other])).not.toBe(partsSha256([other, part]));
    expect(partsSha256([part, other])).not.toBe(partsSha256([part, { ...other, sha256: "c" }]));
  });
});

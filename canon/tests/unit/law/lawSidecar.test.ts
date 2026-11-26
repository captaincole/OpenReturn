import { describe, expect, it } from "vitest";
import { coerceLawSidecar, walkLaw } from "../../../src/law/lawSidecar.js";
import { walkCorpus } from "../../../src/refdocs/walkCorpus.js";

// These read the committed sources/ folder: the pinned release must stay valid and out of the corpus.
describe("the law sidecar", () => {
  it("pins Title 26 at release point 119-73", async () => {
    const [entry, ...others] = await walkLaw();
    expect(others).toEqual([]);
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

  it("is not a corpus document, and the corpus walk does not flag its folder", async () => {
    const walk = await walkCorpus();
    expect(walk.entries.map((entry) => entry.sidecar.docId)).not.toContain("usc-26-2025");
    expect(walk.unconfigured.filter((item) => item.sourceRelPath.includes("/law/"))).toEqual([]);
  });

  it("refuses a sidecar with another format or no release point", () => {
    const good = { docId: "d", title: "t", publisher: "OLRC", sha256: "s", releasePoint: "119-73" };
    expect(coerceLawSidecar({ ...good, format: "uslm" })).not.toBeNull();
    expect(coerceLawSidecar({ ...good, format: "pdf" })).toBeNull();
    expect(coerceLawSidecar({ ...good, format: "uslm", releasePoint: undefined })).toBeNull();
    expect(coerceLawSidecar({ ...good, format: "uslm", published: "Jan 2026" })).toBeNull();
  });
});

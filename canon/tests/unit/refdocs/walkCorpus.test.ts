import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { walkCorpus } from "../../../src/refdocs/walkCorpus.js";

const sidecar = (docId: string) =>
  JSON.stringify({ docId, title: docId, publisher: "IRS", taxYear: 2025, sha256: "abc" });

describe("walkCorpus and the form face", () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "walk-corpus-"));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("reads a blank.pdf as a document only when blank.meta.json names it", async () => {
    const withFace = join(root, "2025/forms/federal/8824");
    const engineOnly = join(root, "2025/forms/federal/8949");
    await mkdir(withFace, { recursive: true });
    await mkdir(engineOnly, { recursive: true });
    await writeFile(join(withFace, "blank.pdf"), "pdf");
    await writeFile(join(withFace, "blank.meta.json"), sidecar("irs-8824-face-2025"));
    await writeFile(join(withFace, "instructions.meta.json"), sidecar("irs-8824-inst-2025"));
    await writeFile(join(engineOnly, "blank.pdf"), "pdf");

    const walk = await walkCorpus(root);
    const face = walk.entries.find((entry) => entry.sidecar.docId === "irs-8824-face-2025");
    expect(face?.sourceRelPath).toBe(join("2025/forms/federal/8824", "blank.pdf"));
    expect(face?.sourceOnDisk).toBe(true);
    expect(walk.entries.map((entry) => entry.sidecar.docId).sort()).toEqual([
      "irs-8824-face-2025",
      "irs-8824-inst-2025",
    ]);
    expect(walk.unconfigured).toEqual([]);
  });
});

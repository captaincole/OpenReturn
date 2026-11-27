import { createClient } from "@libsql/client";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

/*
 * `law fetch` with the manifest of one file per jurisdiction: the committed
 * manifest's shape, one jurisdiction or all, and the sha256 check.
 */

const dir = mkdtempSync(path.join(tmpdir(), "canon-law-fetch-test-"));
process.env.LAW_DB_DIR = path.join(dir, "law");
process.env.LAW_SEED_DIR = path.join(dir, "no-seed");

const { libraryDbPath } = await import("../../../src/db/libsql.js");
const { ALL_JURISDICTIONS } = await import("../../../src/jurisdiction.js");
const { fetchLaw, lawFilesToInstall, parseLawManifest, readLawManifest } =
  await import("../../../scripts/corpus/lawFetch.js");

afterAll(() => rmSync(dir, { recursive: true, force: true }));
afterEach(() => vi.unstubAllGlobals());

/*
 * A real (tiny) library file: the install opens it to read its embedding
 * stamp, and adds the tables it lacks, so the test reads the stamp back
 * instead of comparing bytes.
 */
async function libraryBytes(name: string): Promise<Buffer> {
  const file = path.join(mkdtempSync(path.join(dir, "release-")), name);
  const db = createClient({ url: `file:${file}` });
  await db.execute("CREATE TABLE ref_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  await db.execute("INSERT INTO ref_meta VALUES ('embedding_model', 'ollama/embeddinggemma-2')");
  db.close();
  return readFileSync(file);
}

const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const url = (file: string) => `https://example.test/law-v9/${file}`;

async function release() {
  const federal = await libraryBytes("law-federal.db");
  const ca = await libraryBytes("law-ca.db");
  const bytesOf: Record<string, Buffer> = {
    [url("law-federal.db")]: federal,
    [url("law-ca.db")]: ca,
  };
  const entry = (jurisdiction: string, file: string, bytes: Buffer) => ({
    jurisdiction,
    file,
    sha256: sha(bytes),
    sizeBytes: bytes.length,
    url: url(file),
  });
  const manifest = parseLawManifest({
    version: "law-v9",
    files: [entry("federal", "law-federal.db", federal), entry("CA", "law-ca.db", ca)],
  });
  const download = vi.fn(async (target: string) => new Response(new Uint8Array(bytesOf[target])));
  vi.stubGlobal("fetch", download);
  return { manifest, download };
}

async function stampOf(file: string): Promise<unknown> {
  const db = createClient({ url: `file:${file}` });
  const res = await db.execute("SELECT value FROM ref_meta WHERE key = 'embedding_model'");
  db.close();
  return res.rows[0]?.value;
}

describe("the law manifest", () => {
  it("lists one file for each jurisdiction of the table", () => {
    const manifest = readLawManifest();
    expect(manifest.files.map((entry) => entry.jurisdiction)).toEqual([...ALL_JURISDICTIONS]);
    expect(manifest.files.map((entry) => entry.file)).toEqual(["law-federal.db", "law-ca.db"]);
    expect(lawFilesToInstall(manifest, "CA").map((entry) => entry.file)).toEqual(["law-ca.db"]);
  });

  it("refuses a jurisdiction listed twice or an unknown one", () => {
    const one = { jurisdiction: "CA", file: "a.db", sha256: "", sizeBytes: 0, url: "" };
    expect(() => parseLawManifest({ version: "v", files: [one, one] })).toThrow(/listed twice/);
    const unknown = { ...one, jurisdiction: "NY" };
    expect(() => parseLawManifest({ version: "v", files: [unknown] })).toThrow(/NY/);
  });
});

describe("law fetch", () => {
  it("installs one jurisdiction's file, then the rest, each sha-checked", async () => {
    const { manifest, download } = await release();
    await fetchLaw(manifest, { force: false, jurisdiction: "CA" });
    expect(await stampOf(libraryDbPath("law:CA"))).toBe("ollama/embeddinggemma-2");
    expect(existsSync(libraryDbPath("law:federal"))).toBe(false);
    expect(download).toHaveBeenCalledTimes(1);

    await fetchLaw(manifest, { force: false });
    expect(existsSync(libraryDbPath("law:federal"))).toBe(true);
    // ca.db was there already: only the federal file was downloaded.
    expect(download).toHaveBeenCalledTimes(2);
  });

  it("does not install a file whose sha256 differs", async () => {
    const { manifest } = await release();
    const [federal] = manifest.files;
    const wrong = { ...manifest, files: [{ ...federal, sha256: "0".repeat(64) }] };
    await expect(fetchLaw(wrong, { force: true })).rejects.toThrow(/sha256 mismatch/);
  });

  it("downloads nothing for a file that is not published yet", async () => {
    const { manifest, download } = await release();
    const [, ca] = manifest.files;
    const unpublished = { ...manifest, files: [{ ...ca, sha256: "PLACEHOLDER" }] };
    await expect(fetchLaw(unpublished, { force: true })).rejects.toThrow(/not published yet/);
    expect(download).not.toHaveBeenCalled();
  });
});

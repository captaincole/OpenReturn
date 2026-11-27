import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { extractCalifornia } from "../../src/law/caExtract";
import { CA_LIBRARY_SCOPE, type CaScope } from "../../src/law/caScope";
import { walkLaw } from "../../src/law/lawSidecar";
import { openZipFile } from "../../src/law/zipFile";
import { sha256 } from "../../src/refdocs/fetchSource";
import type { Command } from "../lib/cli";

/*
 * `corpus law extract-ca <zip>`: cuts the parts and chapters of California's
 * tax code that CA_LIBRARY_SCOPE names out of the Legislature's session
 * archive (pubinfo_<year>.zip, about 1.3 GB) into law.zip next to the
 * California sidecar, the file `law sync` reads. The archive is a rolling file: when the extract is not the one the
 * sidecar pins, this prints the sha256 and date to pin instead.
 */

async function fileSha256(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

async function caEntry() {
  const entries = (await walkLaw()).filter((entry) => entry.sidecar.format === "caml");
  if (entries.length !== 1)
    throw new Error(`expected one California law sidecar (format "caml"), found ${entries.length}`);
  return entries[0];
}

// npm runs the CLI from canon/: a relative path is the caller's, which npm keeps in INIT_CWD.
const callerPath = (path: string) => resolve(process.env.INIT_CWD ?? process.cwd(), path);

/** "RTC division 2.: part 10., part 10.2., part 11. chapters 17.". */
const scopeLine = (scope: CaScope) =>
  `${scope.code} division ${scope.division}: ${scope.parts
    .map(({ part, chapters }) =>
      chapters?.length ? `part ${part} chapters ${chapters.join(", ")}` : `part ${part}`,
    )
    .join("; ")}`;

async function run(argv: string[]): Promise<void> {
  const archivePath = argv[0] ? callerPath(argv[0]) : "";
  if (!archivePath)
    throw new Error("required: the path of the session archive (pubinfo_<year>.zip)");
  const entry = await caEntry();
  const archive = openZipFile(archivePath);
  const extract = (() => {
    try {
      return extractCalifornia(archive, CA_LIBRARY_SCOPE);
    } finally {
      archive.close();
    }
  })();
  await mkdir(dirname(entry.zipPath), { recursive: true });
  await writeFile(entry.zipPath, extract.zip);
  const got = sha256(extract.zip);
  const { stats } = extract;
  console.log(`[law extract-ca] wrote ${entry.zipRelPath}`);
  console.log(`  scope: ${scopeLine(CA_LIBRARY_SCOPE)}`);
  console.log(
    `  ${stats.sections} sections, ${stats.tocRows} contents rows, ${stats.files} files, ${stats.bytes} bytes`,
  );
  console.log(`  archive date (releasePoint): ${extract.archiveDate}`);
  console.log(`  archive sha256: ${await fileSha256(archivePath)}`);
  console.log(`  extract sha256: ${got}`);
  if (got === entry.sidecar.sha256) {
    console.log("  matches the sidecar: run `npm run corpus -- law sync`");
    return;
  }
  console.log(
    `  the sidecar pins ${entry.sidecar.sha256.slice(0, 12)}… (${entry.sidecar.releasePoint}): this archive holds newer text, or the scope (caScope.ts) changed.\n` +
      `  To move to it, set "sha256" and "releasePoint" in ${entry.sidecarPath} to the values above, then run law sync.\n` +
      `  To keep the pinned text, delete ${entry.zipRelPath}: law sync then reads law.db's copy.`,
  );
}

export const lawExtractCaCommand: Command = {
  name: "extract-ca",
  summary:
    "Cut California's tax code (the parts and chapters in its scope) out of the session archive into law.zip",
  usage: "<pubinfo_<year>.zip>",
  run,
};

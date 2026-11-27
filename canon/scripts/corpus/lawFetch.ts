import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { lawFileName, lawLibrary } from "../../src/db/libsql";
import { jurisdictionSchema, type Jurisdiction } from "../../src/jurisdiction";
import { installLibrary, manifestPath, SEED_DIR, type ReleaseFile } from "./fetch";

/*
 * `law fetch`: the prebuilt law files, one per jurisdiction, from
 * seed/law.manifest.json. Each file installs on its own, so a state can be
 * published again without the federal file.
 */

const HEX = "0123456789abcdef";
const isSha256 = (value: string): boolean =>
  value.length === 64 && [...value].every((char) => HEX.includes(char));

const lawFileSchema = z.object({
  jurisdiction: jurisdictionSchema,
  file: z.string().min(1),
  sha256: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  url: z.string(),
});

const lawManifestSchema = z.object({
  version: z.string().min(1),
  files: z.array(lawFileSchema).min(1),
});

export type LawManifest = z.infer<typeof lawManifestSchema>;
export type LawReleaseFile = LawManifest["files"][number];

/** Validates the manifest's shape: each jurisdiction once. */
export function parseLawManifest(json: unknown): LawManifest {
  const manifest = lawManifestSchema.parse(json);
  const seen = manifest.files.map((entry) => entry.jurisdiction);
  const twice = seen.find((jurisdiction, i) => seen.indexOf(jurisdiction) !== i);
  if (twice) throw new Error(`law manifest: ${twice} is listed twice`);
  return manifest;
}

export const readLawManifest = (): LawManifest =>
  parseLawManifest(JSON.parse(readFileSync(manifestPath("law"), "utf8")));

/** Every file, or the one of a jurisdiction; a jurisdiction the manifest lacks is an error. */
export function lawFilesToInstall(
  manifest: LawManifest,
  jurisdiction?: Jurisdiction,
): LawReleaseFile[] {
  if (!jurisdiction) return manifest.files;
  const entry = manifest.files.find((one) => one.jurisdiction === jurisdiction);
  if (!entry) throw new Error(`law manifest ${manifest.version} has no file for ${jurisdiction}`);
  return [entry];
}

// A sha256 not filled in yet means the file is not published: no download is tried.
const published = (entry: ReleaseFile): ReleaseFile =>
  isSha256(entry.sha256) && entry.url ? entry : { ...entry, url: "" };

const seedPathOf = (file: string): string => {
  const fromEnv = process.env.LAW_SEED_DIR;
  return resolve(fromEnv ? resolve(fromEnv) : SEED_DIR, file);
};

export async function fetchLaw(
  manifest: LawManifest,
  opts: { force: boolean; jurisdiction?: Jurisdiction },
): Promise<void> {
  for (const entry of lawFilesToInstall(manifest, opts.jurisdiction)) {
    await installLibrary(
      {
        library: lawLibrary(entry.jurisdiction),
        tag: `[law fetch ${lawFileName(entry.jurisdiction)}]`,
        version: manifest.version,
        release: published(entry),
        seedPath: seedPathOf(entry.file),
        reembed: `npm run corpus -- law reembed --jurisdiction ${entry.jurisdiction} --all`,
        unavailable: (target) =>
          `${target} is missing, and law release ${manifest.version} is not published yet: build it with \`npm run corpus -- law sync\`.`,
      },
      opts.force,
    );
  }
}

export async function lawFetchCli(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: { force: { type: "boolean", default: false }, jurisdiction: { type: "string" } },
  });
  const jurisdiction = values.jurisdiction
    ? jurisdictionSchema.parse(values.jurisdiction)
    : undefined;
  await fetchLaw(readLawManifest(), { force: values.force ?? false, jurisdiction });
}

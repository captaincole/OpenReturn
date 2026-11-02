import { engineSrcDir } from "@openreturn/engine/paths";
import { SOURCES_ROOT } from "@openreturn/sources";
import { resolve } from "node:path";

export interface FormTarget {
  /** "federal/8959" or "state/ca/540": the folder under engine/src and sources/<year>/forms. */
  subpath: string;
  formId: string;
  jurisdiction: string;
  taxYear: number;
  pdfPath: string;
  engineDir: string;
  catalogPath: string;
  /** Gitignored work files for the form skills: widgets.json, labels.json, page tiles. */
  workDir: string;
}

export const REPO_ROOT = resolve(engineSrcDir, "../..");
export const DEFAULT_TAX_YEAR = 2025;

/* "8959" → "form-8959"; schedules keep their name ("schedule-d", "schedule-ca"). */
const formIdFor = (short: string) => (short.startsWith("schedule-") ? short : `form-${short}`);

export function parseFormTarget(arg: string | undefined, taxYear = DEFAULT_TAX_YEAR): FormTarget {
  const parts = (arg ?? "").split("/").filter(Boolean);
  const isFederal = parts.length === 2 && parts[0] === "federal";
  const isState = parts.length === 3 && parts[0] === "state";
  if (!isFederal && !isState) {
    throw new Error(`form: expected federal/<short> or state/<st>/<short>, got "${arg ?? ""}"`);
  }
  const subpath = parts.join("/");
  const short = parts[parts.length - 1];
  const engineDir = resolve(engineSrcDir, subpath);
  return {
    subpath,
    formId: formIdFor(short),
    jurisdiction: isFederal ? "federal" : `state-${parts[1]}`,
    taxYear,
    pdfPath: resolve(SOURCES_ROOT, `${taxYear}/forms`, subpath, "blank.pdf"),
    engineDir,
    catalogPath: resolve(engineDir, "catalog.json"),
    workDir: resolve(REPO_ROOT, ".scratch/forms", String(taxYear), subpath),
  };
}

/* The first positional argument is the form; --tax-year=<year> is optional. */
export function formTargetFromArgv(argv: string[]): FormTarget {
  const yearArg = argv.find((arg) => arg.startsWith("--tax-year="));
  const taxYear = yearArg ? parseInt(yearArg.slice("--tax-year=".length), 10) : DEFAULT_TAX_YEAR;
  return parseFormTarget(
    argv.find((arg) => !arg.startsWith("--")),
    taxYear,
  );
}

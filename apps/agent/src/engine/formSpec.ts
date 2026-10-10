/*
 * FormSpec — the shape of one registry entry. The per-jurisdiction
 * registries (federal/index.ts, state/<st>/index.ts) share it, and
 * registry.ts composes the entries into the global FORMS list. It lives
 * in its own module so jurisdiction registries can import it without a
 * circular dependency on registry.ts.
 */

import { resolve } from "node:path";

/*
 * Offline paths anchor at cwd. Tests, scripts, and refdocs tooling all
 * run with cwd at apps/agent/. Same convention as src/paths.ts, inlined
 * here so the engine imports no code from outside src/engine/.
 */
const projectRoot = process.cwd();

export interface FormSpec {
  /** Long-form id used by the engine and bindings (for example "form-1040", "schedule-d"). */
  formId: string;
  /**
   * Short id used in filenames, storage slugs, and metadata tags (for
   * example "1040", "schedule-d", "schedule-ca"). It strips the "form-"
   * prefix on federal forms and equals formId on schedules.
   */
  shortId: string;
  /** Human-readable name used in filenames and UI ("Form 1040", "Schedule CA (540)"). */
  displayName: string;
  /**
   * Per-form subpath under both `forms/` (offline) and
   * `src/mastra/public/forms/` (runtime). Examples: "federal/1040",
   * "state/ca/schedule-ca". The engine renderer uses it to build
   * cwd-relative paths to blank.pdf. This works in dev
   * (cwd = src/mastra/public/), in prod (cwd = /var/task, where Mastra's
   * copyPublic step puts the same forms/ tree), and in tests/scripts
   * (cwd = apps/agent/, offline source of truth at forms/).
   */
  relativeDir: string;
  /**
   * Absolute path to the OFFLINE catalog.json under apps/agent/forms/.
   * Tests and one-off scripts load catalog files from disk via
   * `loadFromFixtures([...])`. Production code uses the bundled `catalog`
   * export from registry.ts, sourced from the promoted copy in
   * public/forms/.
   */
  catalogPath: string;
  /**
   * Absolute path to the OFFLINE blank.pdf under apps/agent/forms/. Used
   * by tests and one-off scripts. Production rendering reads
   * `forms/<relativeDir>/blank.pdf` relative to cwd; see index.ts
   * renderForm.
   */
  blankPdfPath: string;
  /**
   * Side-effecting registration of this form's typed bindings into the
   * engine's registry. Idempotent: a second call overwrites in place. We
   * use an explicit function call, not a side-effect import, so bundler
   * tree-shaking cannot drop the bindings.
   *
   * Optional: a form may be registered for catalog-fill regression
   * coverage before bindings exist. With no register fn, the form's
   * fields evaluate to undefined and the renderer produces a blank PDF.
   * That is harmless as long as no scenario asks to file the form.
   */
  register?: () => void;
}

export function makeFormSpec(args: {
  formId: string;
  shortId: string;
  displayName: string;
  relativeDir: string;
  register?: () => void;
}): FormSpec {
  return {
    ...args,
    catalogPath: resolve(projectRoot, "forms", args.relativeDir, "catalog.json"),
    blankPdfPath: resolve(projectRoot, "forms", args.relativeDir, "blank.pdf"),
  };
}

/*
 * FormSpec — the shape of one registry entry. The per-jurisdiction
 * registries (federal/index.ts, state/<st>/index.ts) share it, and
 * registry.ts composes the entries into the global FORMS list. It lives
 * in its own module so jurisdiction registries can import it without a
 * circular dependency on registry.ts.
 */

import type { FilingInfo } from "./filingInfo.js";

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
   * The form's folder, for example "federal/1040" or
   * "state/ca/schedule-ca". The engine keeps catalog.json and bindings.ts
   * there, and the source-document trees (blank.pdf, instructions) use
   * the same subpath. renderForm passes it to the caller's BlankPdfLoader.
   */
  relativeDir: string;
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
  /**
   * Forms filed as several copies (Form 8949: one box per page). The
   * engine evaluates copy 0; render/renderCopies.ts evaluates the others
   * with `select(info, n)` and merges them into one PDF.
   */
  copies?: FormCopies;
}

export interface FormCopies {
  /** How many copies to file (at least 1). */
  count: (info: FilingInfo | undefined) => number;
  /** FilingInfo that makes the bindings fill copy `index`. */
  select: (info: FilingInfo | undefined, index: number) => FilingInfo | undefined;
}

export function makeFormSpec(args: {
  formId: string;
  shortId: string;
  displayName: string;
  relativeDir: string;
  register?: () => void;
  copies?: FormCopies;
}): FormSpec {
  return args;
}

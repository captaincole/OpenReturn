/*
 * California form registry: everything CA-specific the engine
 * evaluates. ../index.ts composes it into STATE_FORMS. Self-contained
 * by design: CA's forms, filingInfo projections, and (as they
 * accumulate) data tables all live under state/ca/. A CA-focused
 * contributor never needs to touch federal/ or another state's
 * directory.
 *
 * Order is upstreams-first within the state: Schedule CA adjustments
 * feed the 540. Cross-form reads of federal results (540 line 13 ←
 * 1040 AGI) resolve on a later fixpoint pass — see ../../registry.ts.
 */

import { fixtureFileSchema } from "../../catalog.js";
import { makeFormSpec, type FormSpec } from "../../formSpec.js";
import { register as registerForm540 } from "./540/bindings.js";
import { register as registerForm5805 } from "./5805/bindings.js";
import { register as registerScheduleCa } from "./schedule-ca/bindings.js";

/* Each form's catalog.json sits next to its bindings. */
import form540CatalogJson from "./540/catalog.json";
import form5805CatalogJson from "./5805/catalog.json";
import scheduleCaCatalogJson from "./schedule-ca/catalog.json";

export const CA_CATALOGS = [
  fixtureFileSchema.parse(scheduleCaCatalogJson),
  fixtureFileSchema.parse(form540CatalogJson),
  fixtureFileSchema.parse(form5805CatalogJson),
];

export const CA_FORMS: FormSpec[] = [
  /*
   * Catalog-only entries with no bindings yet (catalog-fill regression
   * only). Schedule D (540) and FTB 5805 instructions are published as
   * HTML, not PDF, so neither folder has an instructions.pdf yet.
   */
  makeFormSpec({
    formId: "schedule-d-ca",
    shortId: "schedule-d-ca",
    displayName: "Schedule D (540)",
    relativeDir: "state/ca/schedule-d-ca",
  }),
  makeFormSpec({
    formId: "schedule-ca",
    shortId: "schedule-ca",
    displayName: "Schedule CA (540)",
    relativeDir: "state/ca/schedule-ca",
    register: registerScheduleCa,
  }),
  makeFormSpec({
    formId: "form-540",
    shortId: "540",
    displayName: "Form 540",
    relativeDir: "state/ca/540",
    register: registerForm540,
  }),
  makeFormSpec({
    formId: "form-5805",
    shortId: "5805",
    displayName: "FTB 5805",
    relativeDir: "state/ca/5805",
    register: registerForm5805,
  }),
];

/*
 * Order is upstreams-first: Schedule CA feeds the 540. Cross-form reads of
 * federal results (540 line 13 ← 1040 AGI) resolve on a later fixpoint pass.
 */

import { fixtureFileSchema } from "../../catalog.js";
import { makeFormSpec, type FormSpec } from "../../formSpec.js";
import { register as registerForm540 } from "./540/bindings.js";
import { register as registerForm5805 } from "./5805/bindings.js";
import { register as registerScheduleCa } from "./schedule-ca/bindings.js";

import form540CatalogJson from "./540/catalog.json";
import form5805CatalogJson from "./5805/catalog.json";
import scheduleCaCatalogJson from "./schedule-ca/catalog.json";

export const CA_CATALOGS = [
  fixtureFileSchema.parse(scheduleCaCatalogJson),
  fixtureFileSchema.parse(form540CatalogJson),
  fixtureFileSchema.parse(form5805CatalogJson),
];

export const CA_FORMS: FormSpec[] = [
  /* Catalog-only: no bindings yet. */
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

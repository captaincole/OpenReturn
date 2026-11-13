/*
 * Order is upstreams-first: Schedule CA feeds the 540. Cross-form reads of
 * federal results (540 line 13 ← 1040 AGI) resolve on a later fixpoint pass.
 */

import { fixtureFileSchema } from "../../catalog.js";
import { makeFormSpec, type FormSpec } from "../../formSpec.js";
import { register as registerForm3514 } from "./3514/bindings.js";
import { register as registerForm3526 } from "./3526/bindings.js";
import { register as registerForm3532 } from "./3532/bindings.js";
import { register as registerForm3805p } from "./3805p/bindings.js";
import { register as registerForm3885A } from "./3885a/bindings.js";
import { register as registerForm540 } from "./540/bindings.js";
import { register as registerForm5805 } from "./5805/bindings.js";
import { register as registerScheduleCa } from "./schedule-ca/bindings.js";
import { register as registerScheduleP } from "./schedule-p/bindings.js";

import form3514CatalogJson from "./3514/catalog.json";
import form3526CatalogJson from "./3526/catalog.json";
import form3532CatalogJson from "./3532/catalog.json";
import form3805pCatalogJson from "./3805p/catalog.json";
import form3885aCatalogJson from "./3885a/catalog.json";
import form540CatalogJson from "./540/catalog.json";
import form5805CatalogJson from "./5805/catalog.json";
import scheduleCaCatalogJson from "./schedule-ca/catalog.json";
import schedulePCatalogJson from "./schedule-p/catalog.json";

export const CA_CATALOGS = [
  fixtureFileSchema.parse(scheduleCaCatalogJson),
  fixtureFileSchema.parse(form540CatalogJson),
  fixtureFileSchema.parse(form5805CatalogJson),
  fixtureFileSchema.parse(form3526CatalogJson),
  fixtureFileSchema.parse(form3805pCatalogJson),
  fixtureFileSchema.parse(schedulePCatalogJson),
  fixtureFileSchema.parse(form3885aCatalogJson),
];

export const CA_FORMS: FormSpec[] = [
  /* Catalog-only: no bindings yet. */
  makeFormSpec({
    formId: "schedule-d-ca",
    shortId: "schedule-d-ca",
    displayName: "Schedule D (540)",
    relativeDir: "state/ca/schedule-d-ca",
  }),
  /* FTB 3885A (one per activity) feeds Schedule CA lines 3 and 5. */
  makeFormSpec({
    formId: "form-3885a",
    shortId: "3885a",
    displayName: "FTB 3885A",
    relativeDir: "state/ca/3885a",
    register: registerForm3885A,
    copies: {
      count: (info) => info?.form3885aActivities?.length ?? 1,
      select: (info, index) => info && { ...info, form3885aCopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "schedule-ca",
    shortId: "schedule-ca",
    displayName: "Schedule CA (540)",
    relativeDir: "state/ca/schedule-ca",
    register: registerScheduleCa,
  }),
  /* FTB 3526 and 3805P feed the 540 (line 63 and Schedule CA line 9); Schedule P reads the 540 and feeds line 61. */
  makeFormSpec({
    formId: "form-3526",
    shortId: "3526",
    displayName: "FTB 3526",
    relativeDir: "state/ca/3526",
    register: registerForm3526,
  }),
  makeFormSpec({
    formId: "form-3805p",
    shortId: "3805p",
    displayName: "FTB 3805P",
    relativeDir: "state/ca/3805p",
    register: registerForm3805p,
  }),
  /* FTB 3514 feeds the 540's lines 75-77. */
  makeFormSpec({
    formId: "form-3514",
    shortId: "3514",
    displayName: "FTB 3514",
    relativeDir: "state/ca/3514",
    register: registerForm3514,
  }),
  makeFormSpec({
    formId: "form-540",
    shortId: "540",
    displayName: "Form 540",
    relativeDir: "state/ca/540",
    register: registerForm540,
  }),
  makeFormSpec({
    formId: "schedule-p",
    shortId: "schedule-p",
    displayName: "Schedule P (540)",
    relativeDir: "state/ca/schedule-p",
    register: registerScheduleP,
  }),
  makeFormSpec({
    formId: "form-5805",
    shortId: "5805",
    displayName: "FTB 5805",
    relativeDir: "state/ca/5805",
    register: registerForm5805,
  }),
  makeFormSpec({
    formId: "form-3532",
    shortId: "3532",
    displayName: "FTB 3532",
    relativeDir: "state/ca/3532",
    register: registerForm3532,
  }),
];

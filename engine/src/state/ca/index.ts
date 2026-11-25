/*
 * Order is upstreams-first: Schedule CA feeds the 540. Cross-form reads of
 * federal results (540 line 13 ← 1040 AGI) resolve on a later fixpoint pass.
 */

import { fixtureFileSchema } from "../../catalog.js";
import { makeFormSpec, type FormSpec } from "../../formSpec.js";
import { register as registerForm3461 } from "./3461/bindings.js";
import { register as registerForm3506 } from "./3506/bindings.js";
import { register as registerForm3507 } from "./3507/bindings.js";
import { register as registerForm3510 } from "./3510/bindings.js";
import { register as registerForm3514 } from "./3514/bindings.js";
import { register as registerForm3526 } from "./3526/bindings.js";
import { register as registerForm3532 } from "./3532/bindings.js";
import { register as registerForm3541 } from "./3541/bindings.js";
import { register as registerForm3800Ca } from "./3800-ca/bindings.js";
import { register as registerForm3801CR } from "./3801-cr/bindings.js";
import { register as registerForm3801 } from "./3801/bindings.js";
import { register as registerForm3803 } from "./3803/bindings.js";
import { register as registerForm3804CR } from "./3804-cr/bindings.js";
import { rowsByForm } from "./3804-cr/lines.js";
import { register as registerForm3805E } from "./3805e/bindings.js";
import { register as registerForm3805p } from "./3805p/bindings.js";
import { register as registerForm3805V } from "./3805v/bindings.js";
import { register as registerForm3805Z } from "./3805z/bindings.js";
import { register as registerForm3807 } from "./3807/bindings.js";
import { register as registerForm3809 } from "./3809/bindings.js";
import { register as registerForm3840 } from "./3840/bindings.js";
import { register as registerForm3853 } from "./3853/bindings.js";
import { register as registerForm3885A } from "./3885a/bindings.js";
import { register as registerForm3913 } from "./3913/bindings.js";
import { register as registerForm540 } from "./540/bindings.js";
import { register as registerForm540NR } from "./540nr/bindings.js";
import { register as registerForm5805 } from "./5805/bindings.js";
import { register as registerForm5805F } from "./5805f/bindings.js";
import { register as registerForm5870A } from "./5870a/bindings.js";
import { register as registerScheduleCa540NR } from "./schedule-ca-540nr/bindings.js";
import { register as registerScheduleCa } from "./schedule-ca/bindings.js";
import { register as registerScheduleD1 } from "./schedule-d-1/bindings.js";
import { scheduleD1CopyCount } from "./schedule-d-1/copies.js";
import { register as registerScheduleD540NR } from "./schedule-d-540nr/bindings.js";
import { register as registerScheduleDCa } from "./schedule-d-ca/bindings.js";
import { register as registerScheduleG1 } from "./schedule-g-1/bindings.js";
import { register as registerScheduleP540NR } from "./schedule-p-540nr/bindings.js";
import { register as registerScheduleP } from "./schedule-p/bindings.js";
import { register as registerScheduleS } from "./schedule-s/bindings.js";
import { register as registerScheduleX } from "./schedule-x/bindings.js";

import form3461CatalogJson from "./3461/catalog.json";
import form3506CatalogJson from "./3506/catalog.json";
import form3507CatalogJson from "./3507/catalog.json";
import form3510CatalogJson from "./3510/catalog.json";
import form3514CatalogJson from "./3514/catalog.json";
import form3526CatalogJson from "./3526/catalog.json";
import form3532CatalogJson from "./3532/catalog.json";
import form3541CatalogJson from "./3541/catalog.json";
import form3800CaCatalogJson from "./3800-ca/catalog.json";
import form3801CRCatalogJson from "./3801-cr/catalog.json";
import form3801CatalogJson from "./3801/catalog.json";
import form3803CatalogJson from "./3803/catalog.json";
import form3804CRCatalogJson from "./3804-cr/catalog.json";
import form3805ECatalogJson from "./3805e/catalog.json";
import form3805pCatalogJson from "./3805p/catalog.json";
import form3805VCatalogJson from "./3805v/catalog.json";
import form3805ZCatalogJson from "./3805z/catalog.json";
import form3807CatalogJson from "./3807/catalog.json";
import form3809CatalogJson from "./3809/catalog.json";
import form3840CatalogJson from "./3840/catalog.json";
import form3853CatalogJson from "./3853/catalog.json";
import form3885aCatalogJson from "./3885a/catalog.json";
import form3913CatalogJson from "./3913/catalog.json";
import form540CatalogJson from "./540/catalog.json";
import form540NRCatalogJson from "./540nr/catalog.json";
import form5805CatalogJson from "./5805/catalog.json";
import form5805FCatalogJson from "./5805f/catalog.json";
import form5870ACatalogJson from "./5870a/catalog.json";
import scheduleCa540NRCatalogJson from "./schedule-ca-540nr/catalog.json";
import scheduleCaCatalogJson from "./schedule-ca/catalog.json";
import scheduleD1CatalogJson from "./schedule-d-1/catalog.json";
import scheduleD540NRCatalogJson from "./schedule-d-540nr/catalog.json";
import scheduleDCaCatalogJson from "./schedule-d-ca/catalog.json";
import scheduleG1CatalogJson from "./schedule-g-1/catalog.json";
import scheduleP540NRCatalogJson from "./schedule-p-540nr/catalog.json";
import schedulePCatalogJson from "./schedule-p/catalog.json";
import scheduleSCatalogJson from "./schedule-s/catalog.json";
import scheduleXCatalogJson from "./schedule-x/catalog.json";

export const CA_CATALOGS = [
  fixtureFileSchema.parse(scheduleDCaCatalogJson),
  fixtureFileSchema.parse(scheduleCaCatalogJson),
  fixtureFileSchema.parse(form540CatalogJson),
  fixtureFileSchema.parse(form5805CatalogJson),
  fixtureFileSchema.parse(form3526CatalogJson),
  fixtureFileSchema.parse(form3805pCatalogJson),
  fixtureFileSchema.parse(schedulePCatalogJson),
  fixtureFileSchema.parse(form3885aCatalogJson),
  fixtureFileSchema.parse(form3532CatalogJson),
  fixtureFileSchema.parse(form3514CatalogJson),
  fixtureFileSchema.parse(form540NRCatalogJson),
  fixtureFileSchema.parse(scheduleCa540NRCatalogJson),
  fixtureFileSchema.parse(scheduleSCatalogJson),
  fixtureFileSchema.parse(form3801CatalogJson),
  fixtureFileSchema.parse(form3510CatalogJson),
  fixtureFileSchema.parse(form3803CatalogJson),
  fixtureFileSchema.parse(scheduleG1CatalogJson),
  fixtureFileSchema.parse(scheduleXCatalogJson),
  fixtureFileSchema.parse(form3461CatalogJson),
  fixtureFileSchema.parse(form3506CatalogJson),
  fixtureFileSchema.parse(form3507CatalogJson),
  fixtureFileSchema.parse(form3541CatalogJson),
  fixtureFileSchema.parse(form3800CaCatalogJson),
  fixtureFileSchema.parse(form3804CRCatalogJson),
  fixtureFileSchema.parse(form3805VCatalogJson),
  fixtureFileSchema.parse(form3805ZCatalogJson),
  fixtureFileSchema.parse(form3807CatalogJson),
  fixtureFileSchema.parse(form3809CatalogJson),
  fixtureFileSchema.parse(form3853CatalogJson),
  fixtureFileSchema.parse(form3913CatalogJson),
  fixtureFileSchema.parse(form5805FCatalogJson),
  fixtureFileSchema.parse(form5870ACatalogJson),
  fixtureFileSchema.parse(form3801CRCatalogJson),
  fixtureFileSchema.parse(form3805ECatalogJson),
  fixtureFileSchema.parse(form3840CatalogJson),
  fixtureFileSchema.parse(scheduleD1CatalogJson),
  fixtureFileSchema.parse(scheduleD540NRCatalogJson),
  fixtureFileSchema.parse(scheduleP540NRCatalogJson),
];

export const CA_FORMS: FormSpec[] = [
  /* Schedule D (540) feeds Schedule CA line 7a columns B and C. */
  makeFormSpec({
    formId: "schedule-d-ca",
    shortId: "schedule-d-ca",
    displayName: "Schedule D (540)",
    relativeDir: "state/ca/schedule-d-ca",
    register: registerScheduleDCa,
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
  /* Wired with no rules yet: every field is blank, and only a must-file decision turns the form on. */
  makeFormSpec({
    formId: "form-540nr",
    shortId: "540nr",
    displayName: "Form 540NR",
    relativeDir: "state/ca/540nr",
    register: registerForm540NR,
  }),
  makeFormSpec({
    formId: "schedule-ca-540nr",
    shortId: "schedule-ca-540nr",
    displayName: "Schedule CA (540NR)",
    relativeDir: "state/ca/schedule-ca-540nr",
    register: registerScheduleCa540NR,
  }),
  makeFormSpec({
    formId: "schedule-s",
    shortId: "schedule-s",
    displayName: "Schedule S",
    relativeDir: "state/ca/schedule-s",
    register: registerScheduleS,
    /* "A separate Schedule S for each state" (ca-540-sched-s-inst-2025::sec::specific-line-instructions::b01). */
    copies: {
      count: (info) => info?.otherStateCredits?.length ?? 1,
      select: (info, index) => info && { ...info, scheduleSCopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "form-3801",
    shortId: "3801",
    displayName: "FTB 3801",
    relativeDir: "state/ca/3801",
    register: registerForm3801,
  }),
  makeFormSpec({
    formId: "form-3510",
    shortId: "3510",
    displayName: "FTB 3510",
    relativeDir: "state/ca/3510",
    register: registerForm3510,
  }),
  makeFormSpec({
    formId: "form-3803",
    shortId: "3803",
    displayName: "FTB 3803",
    relativeDir: "state/ca/3803",
    register: registerForm3803,
    /* One form per child (ca-3803-inst-2025::sec::c-how-to-make-the-election::b01). */
    copies: {
      count: (info) => info?.form3803Children?.length ?? 1,
      select: (info, index) => info && { ...info, form3803CopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "schedule-g-1",
    shortId: "schedule-g-1",
    displayName: "Schedule G-1",
    relativeDir: "state/ca/schedule-g-1",
    register: registerScheduleG1,
  }),
  makeFormSpec({
    formId: "schedule-x",
    shortId: "schedule-x",
    displayName: "Schedule X",
    relativeDir: "state/ca/schedule-x",
    register: registerScheduleX,
  }),
  makeFormSpec({
    formId: "form-3461",
    shortId: "3461",
    displayName: "FTB 3461",
    relativeDir: "state/ca/3461",
    register: registerForm3461,
  }),
  makeFormSpec({
    formId: "form-3506",
    shortId: "3506",
    displayName: "FTB 3506",
    relativeDir: "state/ca/3506",
    register: registerForm3506,
  }),
  makeFormSpec({
    formId: "form-3507",
    shortId: "3507",
    displayName: "FTB 3507",
    relativeDir: "state/ca/3507",
    register: registerForm3507,
  }),
  makeFormSpec({
    formId: "form-3541",
    shortId: "3541",
    displayName: "FTB 3541",
    relativeDir: "state/ca/3541",
    register: registerForm3541,
  }),
  makeFormSpec({
    formId: "form-3800-ca",
    shortId: "3800-ca",
    displayName: "FTB 3800",
    relativeDir: "state/ca/3800-ca",
    register: registerForm3800Ca,
  }),
  makeFormSpec({
    formId: "form-3804-cr",
    shortId: "3804-cr",
    displayName: "FTB 3804-CR",
    relativeDir: "state/ca/3804-cr",
    register: registerForm3804CR,
    /* Ten entities per form; "use additional forms FTB 3804-CR" (ca-3804cr-inst-2025::sec::line-1-column-c-pte-elective-tax-credit-s::b01). */
    copies: {
      count: (info) => rowsByForm(info?.pteCreditRows ?? []).length,
      select: (info, index) => info && { ...info, form3804CrCopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "form-3805v",
    shortId: "3805v",
    displayName: "FTB 3805V",
    relativeDir: "state/ca/3805v",
    register: registerForm3805V,
  }),
  makeFormSpec({
    formId: "form-3805z",
    shortId: "3805z",
    displayName: "FTB 3805Z",
    relativeDir: "state/ca/3805z",
    register: registerForm3805Z,
  }),
  makeFormSpec({
    formId: "form-3807",
    shortId: "3807",
    displayName: "FTB 3807",
    relativeDir: "state/ca/3807",
    register: registerForm3807,
  }),
  makeFormSpec({
    formId: "form-3809",
    shortId: "3809",
    displayName: "FTB 3809",
    relativeDir: "state/ca/3809",
    register: registerForm3809,
  }),
  makeFormSpec({
    formId: "form-3853",
    shortId: "3853",
    displayName: "FTB 3853",
    relativeDir: "state/ca/3853",
    register: registerForm3853,
  }),
  makeFormSpec({
    formId: "form-3913",
    shortId: "3913",
    displayName: "FTB 3913",
    relativeDir: "state/ca/3913",
    register: registerForm3913,
  }),
  makeFormSpec({
    formId: "form-5805f",
    shortId: "5805f",
    displayName: "FTB 5805F",
    relativeDir: "state/ca/5805f",
    register: registerForm5805F,
  }),
  makeFormSpec({
    formId: "form-5870a",
    shortId: "5870a",
    displayName: "FTB 5870A",
    relativeDir: "state/ca/5870a",
    register: registerForm5870A,
  }),
  makeFormSpec({
    formId: "form-3801-cr",
    shortId: "3801-cr",
    displayName: "FTB 3801-CR",
    relativeDir: "state/ca/3801-cr",
    register: registerForm3801CR,
  }),
  makeFormSpec({
    formId: "form-3805e",
    shortId: "3805e",
    displayName: "FTB 3805E",
    relativeDir: "state/ca/3805e",
    register: registerForm3805E,
  }),
  makeFormSpec({
    formId: "form-3840",
    shortId: "3840",
    displayName: "FTB 3840",
    relativeDir: "state/ca/3840",
    register: registerForm3840,
  }),
  makeFormSpec({
    formId: "schedule-d-1",
    shortId: "schedule-d-1",
    displayName: "Schedule D-1",
    relativeDir: "state/ca/schedule-d-1",
    register: registerScheduleD1,
    // More properties than a part holds: "use additional forms" (schedule-d-1/copies.ts).
    copies: {
      count: (info) => scheduleD1CopyCount(info?.scheduleD1),
      select: (info, index) => info && { ...info, scheduleD1CopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "schedule-d-540nr",
    shortId: "schedule-d-540nr",
    displayName: "Schedule D (540NR)",
    relativeDir: "state/ca/schedule-d-540nr",
    register: registerScheduleD540NR,
  }),
  makeFormSpec({
    formId: "schedule-p-540nr",
    shortId: "schedule-p-540nr",
    displayName: "Schedule P (540NR)",
    relativeDir: "state/ca/schedule-p-540nr",
    register: registerScheduleP540NR,
  }),
];

/*
 * Order is upstreams-first (8949 → Schedule D → 1040) only to keep the
 * fixpoint pass count low; any order converges. To add a form, follow
 * the checklist in engine/README.md.
 */

import { fixtureFileSchema } from "../catalog.js";
import { makeFormSpec, type FormSpec } from "../formSpec.js";
import { register as registerForm1040 } from "./1040/bindings.js";
import { register as registerForm4684 } from "./4684/bindings.js";
import { register as registerForm4952 } from "./4952/bindings.js";
import { register as registerForm5695 } from "./5695/bindings.js";
import { register as registerForm6251 } from "./6251/bindings.js";
import { register as registerForm8606 } from "./8606/bindings.js";
import { register as registerForm8889 } from "./8889/bindings.js";
import { register as registerForm8949 } from "./8949/bindings.js";
import { register as registerForm8959 } from "./8959/bindings.js";
import { register as registerForm8960 } from "./8960/bindings.js";
import { register as registerForm8995A } from "./8995-a/bindings.js";
import { register as registerForm8995 } from "./8995/bindings.js";
import { register as registerSchedule1A } from "./schedule-1-a/bindings.js";
import { register as registerSchedule1 } from "./schedule-1/bindings.js";
import { register as registerSchedule2 } from "./schedule-2/bindings.js";
import { register as registerSchedule3 } from "./schedule-3/bindings.js";
import { register as registerSchedule8812 } from "./schedule-8812/bindings.js";
import { register as registerScheduleA } from "./schedule-a/bindings.js";
import { register as registerScheduleB } from "./schedule-b/bindings.js";
import { register as registerScheduleC } from "./schedule-c/bindings.js";
import { register as registerScheduleD } from "./schedule-d/bindings.js";
import { register as registerScheduleEIC } from "./schedule-eic/bindings.js";
import { register as registerScheduleH } from "./schedule-h/bindings.js";
import { register as registerScheduleSE } from "./schedule-se/bindings.js";

/* Rollup inlines the JSON at build time; the process does not read it from disk. */
import form1040CatalogJson from "./1040/catalog.json";
import form4684CatalogJson from "./4684/catalog.json";
import form4952CatalogJson from "./4952/catalog.json";
import form5695CatalogJson from "./5695/catalog.json";
import form6251CatalogJson from "./6251/catalog.json";
import form8606CatalogJson from "./8606/catalog.json";
import form8889CatalogJson from "./8889/catalog.json";
import form8949CatalogJson from "./8949/catalog.json";
import form8959CatalogJson from "./8959/catalog.json";
import form8960CatalogJson from "./8960/catalog.json";
import form8995ACatalogJson from "./8995-a/catalog.json";
import form8995CatalogJson from "./8995/catalog.json";
import schedule1ACatalogJson from "./schedule-1-a/catalog.json";
import schedule1CatalogJson from "./schedule-1/catalog.json";
import schedule2CatalogJson from "./schedule-2/catalog.json";
import schedule3CatalogJson from "./schedule-3/catalog.json";
import schedule8812CatalogJson from "./schedule-8812/catalog.json";
import scheduleACatalogJson from "./schedule-a/catalog.json";
import scheduleBCatalogJson from "./schedule-b/catalog.json";
import scheduleCCatalogJson from "./schedule-c/catalog.json";
import scheduleDCatalogJson from "./schedule-d/catalog.json";
import scheduleEICCatalogJson from "./schedule-eic/catalog.json";
import scheduleHCatalogJson from "./schedule-h/catalog.json";
import scheduleSECatalogJson from "./schedule-se/catalog.json";

/* parse() narrows the widened JSON types and fails at boot when a catalog drifts. */
export const FEDERAL_CATALOGS = [
  fixtureFileSchema.parse(form8949CatalogJson),
  fixtureFileSchema.parse(scheduleDCatalogJson),
  fixtureFileSchema.parse(scheduleACatalogJson),
  fixtureFileSchema.parse(scheduleBCatalogJson),
  fixtureFileSchema.parse(scheduleCCatalogJson),
  fixtureFileSchema.parse(scheduleSECatalogJson),
  fixtureFileSchema.parse(form8606CatalogJson),
  fixtureFileSchema.parse(form8889CatalogJson),
  fixtureFileSchema.parse(form8959CatalogJson),
  fixtureFileSchema.parse(form4952CatalogJson),
  fixtureFileSchema.parse(schedule8812CatalogJson),
  fixtureFileSchema.parse(form8960CatalogJson),
  fixtureFileSchema.parse(form8995ACatalogJson),
  fixtureFileSchema.parse(form8995CatalogJson),
  fixtureFileSchema.parse(schedule1CatalogJson),
  fixtureFileSchema.parse(schedule1ACatalogJson),
  fixtureFileSchema.parse(schedule2CatalogJson),
  fixtureFileSchema.parse(scheduleHCatalogJson),
  fixtureFileSchema.parse(form5695CatalogJson),
  fixtureFileSchema.parse(form6251CatalogJson),
  fixtureFileSchema.parse(schedule3CatalogJson),
  fixtureFileSchema.parse(form4684CatalogJson),
  fixtureFileSchema.parse(scheduleEICCatalogJson),
  fixtureFileSchema.parse(form1040CatalogJson),
];

export const FEDERAL_FORMS: FormSpec[] = [
  makeFormSpec({
    formId: "form-8949",
    shortId: "8949",
    displayName: "Form 8949",
    relativeDir: "federal/8949",
    register: registerForm8949,
    copies: {
      count: (info) => info?.form8949Copies?.length ?? 1,
      select: (info, index) => info && { ...info, form8949CopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "schedule-d",
    shortId: "schedule-d",
    displayName: "Schedule D",
    relativeDir: "federal/schedule-d",
    register: registerScheduleD,
  }),
  makeFormSpec({
    formId: "form-1040",
    shortId: "1040",
    displayName: "Form 1040",
    relativeDir: "federal/1040",
    register: registerForm1040,
  }),
  makeFormSpec({
    formId: "schedule-a",
    shortId: "schedule-a",
    displayName: "Schedule A",
    relativeDir: "federal/schedule-a",
    register: registerScheduleA,
  }),
  makeFormSpec({
    formId: "schedule-b",
    shortId: "schedule-b",
    displayName: "Schedule B",
    relativeDir: "federal/schedule-b",
    register: registerScheduleB,
  }),
  makeFormSpec({
    formId: "schedule-c",
    shortId: "schedule-c",
    displayName: "Schedule C",
    relativeDir: "federal/schedule-c",
    register: registerScheduleC,
    copies: {
      count: (info) => info?.businesses?.length ?? 1,
      select: (info, index) => info && { ...info, scheduleCCopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "schedule-se",
    shortId: "schedule-se",
    displayName: "Schedule SE",
    relativeDir: "federal/schedule-se",
    register: registerScheduleSE,
  }),
  makeFormSpec({
    formId: "schedule-1",
    shortId: "schedule-1",
    displayName: "Schedule 1",
    relativeDir: "federal/schedule-1",
    register: registerSchedule1,
  }),
  makeFormSpec({
    formId: "schedule-1-a",
    shortId: "schedule-1-a",
    displayName: "Schedule 1-A",
    relativeDir: "federal/schedule-1-a",
    register: registerSchedule1A,
  }),
  // Schedules 1–3 have no instructions sidecar: the IRS prints them in the 1040 booklet.
  makeFormSpec({
    formId: "schedule-2",
    shortId: "schedule-2",
    displayName: "Schedule 2",
    relativeDir: "federal/schedule-2",
    register: registerSchedule2,
  }),
  makeFormSpec({
    formId: "schedule-3",
    shortId: "schedule-3",
    displayName: "Schedule 3",
    relativeDir: "federal/schedule-3",
    register: registerSchedule3,
  }),
  makeFormSpec({
    formId: "schedule-h",
    shortId: "schedule-h",
    displayName: "Schedule H",
    relativeDir: "federal/schedule-h",
    register: registerScheduleH,
  }),
  makeFormSpec({
    formId: "form-5695",
    shortId: "5695",
    displayName: "Form 5695",
    relativeDir: "federal/5695",
    register: registerForm5695,
  }),
  makeFormSpec({
    formId: "form-8606",
    shortId: "8606",
    displayName: "Form 8606",
    relativeDir: "federal/8606",
    register: registerForm8606,
    copies: {
      count: (info) => info?.form8606Filers?.length ?? 1,
      select: (info, index) => info && { ...info, form8606CopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "form-8889",
    shortId: "8889",
    displayName: "Form 8889",
    relativeDir: "federal/8889",
    register: registerForm8889,
  }),
  makeFormSpec({
    formId: "form-4952",
    shortId: "4952",
    displayName: "Form 4952",
    relativeDir: "federal/4952",
    register: registerForm4952,
  }),
  makeFormSpec({
    formId: "schedule-8812",
    shortId: "schedule-8812",
    displayName: "Schedule 8812",
    relativeDir: "federal/schedule-8812",
    register: registerSchedule8812,
  }),
  makeFormSpec({
    formId: "form-8959",
    shortId: "8959",
    displayName: "Form 8959",
    relativeDir: "federal/8959",
    register: registerForm8959,
  }),
  makeFormSpec({
    formId: "form-8960",
    shortId: "8960",
    displayName: "Form 8960",
    relativeDir: "federal/8960",
    register: registerForm8960,
  }),
  makeFormSpec({
    formId: "form-8995-a",
    shortId: "8995-a",
    displayName: "Form 8995-A",
    relativeDir: "federal/8995-a",
    register: registerForm8995A,
  }),
  makeFormSpec({
    formId: "form-8995",
    shortId: "8995",
    displayName: "Form 8995",
    relativeDir: "federal/8995",
    register: registerForm8995,
  }),
  makeFormSpec({
    formId: "form-6251",
    shortId: "6251",
    displayName: "Form 6251",
    relativeDir: "federal/6251",
    register: registerForm6251,
  }),
  makeFormSpec({
    formId: "form-4684",
    shortId: "4684",
    displayName: "Form 4684",
    relativeDir: "federal/4684",
    register: registerForm4684,
    copies: {
      count: (info) => info?.casualtyEvents?.length ?? 1,
      select: (info, index) => info && { ...info, form4684CopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "schedule-eic",
    shortId: "schedule-eic",
    displayName: "Schedule EIC",
    relativeDir: "federal/schedule-eic",
    register: registerScheduleEIC,
  }),
];

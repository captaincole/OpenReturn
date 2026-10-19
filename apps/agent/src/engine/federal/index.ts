/*
 * Federal form registry. It lists every federal form the engine knows,
 * plus the bundled runtime catalogs for the forms with bindings.
 * ../registry.ts composes it into the global FORMS list.
 *
 * Order is upstreams-first: 8949 totals feed Schedule D, which feeds
 * 1040. The fixpoint evaluator converges in any order. Upstreams-first
 * only keeps the pass count low.
 *
 * To add a federal form:
 *   1. Put blank.pdf in apps/agent/forms/federal/<short>/. Generate
 *      catalog.json into ./<short>/ (form-engine generate-catalog).
 *   2. Write types.ts + filingInfo.ts + bindings.ts under ./<short>/.
 *   3. Add a makeFormSpec entry below. Add its catalog import if it has
 *      bindings.
 */

import { fixtureFileSchema } from "../catalog.js";
import { makeFormSpec, type FormSpec } from "../formSpec.js";
import { register as registerForm1040 } from "./1040/bindings.js";
import { register as registerForm5695 } from "./5695/bindings.js";
import { register as registerForm8889 } from "./8889/bindings.js";
import { register as registerForm8949 } from "./8949/bindings.js";
import { register as registerForm8959 } from "./8959/bindings.js";
import { register as registerForm8960 } from "./8960/bindings.js";
import { register as registerForm8995A } from "./8995-a/bindings.js";
import { register as registerSchedule1 } from "./schedule-1/bindings.js";
import { register as registerSchedule2 } from "./schedule-2/bindings.js";
import { register as registerSchedule3 } from "./schedule-3/bindings.js";
import { register as registerScheduleA } from "./schedule-a/bindings.js";
import { register as registerScheduleB } from "./schedule-b/bindings.js";
import { register as registerScheduleD } from "./schedule-d/bindings.js";
import { register as registerScheduleH } from "./schedule-h/bindings.js";

/*
 * Each form's catalog.json sits next to its bindings. Rollup inlines the
 * JSON at build time; the running process does not read it from disk.
 */
import form1040CatalogJson from "./1040/catalog.json";
import form5695CatalogJson from "./5695/catalog.json";
import form8889CatalogJson from "./8889/catalog.json";
import form8949CatalogJson from "./8949/catalog.json";
import form8959CatalogJson from "./8959/catalog.json";
import form8960CatalogJson from "./8960/catalog.json";
import form8995ACatalogJson from "./8995-a/catalog.json";
import schedule1CatalogJson from "./schedule-1/catalog.json";
import schedule2CatalogJson from "./schedule-2/catalog.json";
import schedule3CatalogJson from "./schedule-3/catalog.json";
import scheduleACatalogJson from "./schedule-a/catalog.json";
import scheduleBCatalogJson from "./schedule-b/catalog.json";
import scheduleDCatalogJson from "./schedule-d/catalog.json";
import scheduleHCatalogJson from "./schedule-h/catalog.json";

/*
 * fixtureFileSchema.parse() narrows TypeScript's widened JSON types
 * (e.g. `category: string` → `category: Category`). It also fails loud
 * at boot when a catalog drifts from FixtureFile.
 */
export const FEDERAL_CATALOGS = [
  fixtureFileSchema.parse(form8949CatalogJson),
  fixtureFileSchema.parse(scheduleDCatalogJson),
  fixtureFileSchema.parse(scheduleACatalogJson),
  fixtureFileSchema.parse(scheduleBCatalogJson),
  fixtureFileSchema.parse(form8889CatalogJson),
  fixtureFileSchema.parse(form8959CatalogJson),
  fixtureFileSchema.parse(form8960CatalogJson),
  fixtureFileSchema.parse(form8995ACatalogJson),
  fixtureFileSchema.parse(schedule1CatalogJson),
  fixtureFileSchema.parse(schedule2CatalogJson),
  fixtureFileSchema.parse(scheduleHCatalogJson),
  fixtureFileSchema.parse(form5695CatalogJson),
  fixtureFileSchema.parse(schedule3CatalogJson),
  fixtureFileSchema.parse(form1040CatalogJson),
];

export const FEDERAL_FORMS: FormSpec[] = [
  makeFormSpec({
    formId: "form-8949",
    shortId: "8949",
    displayName: "Form 8949",
    relativeDir: "federal/8949",
    register: registerForm8949,
    // One box per page: the copy plan decides how many copies to file.
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
  /*
   * Catalog-only entries with no bindings yet. They exist so the
   * catalog-fill regression test (tests/golden/runAll.ts) checks them against
   * their blank PDFs. Bindings and downstream wiring come later.
   */
  makeFormSpec({
    formId: "schedule-b",
    shortId: "schedule-b",
    displayName: "Schedule B",
    relativeDir: "federal/schedule-b",
    register: registerScheduleB,
  }),
  makeFormSpec({
    formId: "schedule-1",
    shortId: "schedule-1",
    displayName: "Schedule 1",
    relativeDir: "federal/schedule-1",
    register: registerSchedule1,
  }),
  /*
   * schedule-1/ and schedule-2/ have no instructions.pdf by design. The
   * IRS publishes their instructions only inside the 1040 instructions
   * booklet, which is already in the corpus as irs-1040-inst-2025.
   */
  makeFormSpec({
    formId: "schedule-2",
    shortId: "schedule-2",
    displayName: "Schedule 2",
    relativeDir: "federal/schedule-2",
    register: registerSchedule2,
  }),
  /*
   * Schedule 3 has no instructions.pdf for the same reason: its
   * instructions are in the 1040 booklet.
   */
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
    formId: "form-8889",
    shortId: "8889",
    displayName: "Form 8889",
    relativeDir: "federal/8889",
    register: registerForm8889,
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
];

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
 *   1. Put catalog.json + blank.pdf in apps/agent/forms/federal/<short>/.
 *      Promote the runtime copy to src/mastra/public/forms/federal/<short>/.
 *   2. Write types.ts + filingInfo.ts + bindings.ts under ./<short>/.
 *   3. Add a makeFormSpec entry below. Add its catalog import if it has
 *      bindings.
 */

import { fixtureFileSchema } from "../catalog.js";
import { makeFormSpec, type FormSpec } from "../formSpec.js";
import { register as registerForm1040 } from "./1040/bindings.js";
import { register as registerForm8949 } from "./8949/bindings.js";
import { register as registerForm8959 } from "./8959/bindings.js";
import { register as registerScheduleA } from "./schedule-a/bindings.js";
import { register as registerScheduleD } from "./schedule-d/bindings.js";

/*
 * Static JSON imports from the PROMOTED runtime copies under
 * src/mastra/public/forms/, not from the source of truth at
 * apps/agent/forms/. This split is a promotion gate: catalog ingest
 * updates apps/agent/forms/ and tests run against it. The runtime picks
 * up the change only after `form-engine promote` copies it. Rollup
 * inlines the JSON at build time; the running process does not read it
 * from disk.
 */
import form1040CatalogJson from "../../mastra/public/forms/federal/1040/catalog.json";
import form8949CatalogJson from "../../mastra/public/forms/federal/8949/catalog.json";
import form8959CatalogJson from "../../mastra/public/forms/federal/8959/catalog.json";
import scheduleACatalogJson from "../../mastra/public/forms/federal/schedule-a/catalog.json";
import scheduleDCatalogJson from "../../mastra/public/forms/federal/schedule-d/catalog.json";

/*
 * fixtureFileSchema.parse() narrows TypeScript's widened JSON types
 * (e.g. `category: string` → `category: Category`). It also fails loud
 * at boot when a catalog drifts from FixtureFile.
 */
export const FEDERAL_CATALOGS = [
  fixtureFileSchema.parse(form8949CatalogJson),
  fixtureFileSchema.parse(scheduleDCatalogJson),
  fixtureFileSchema.parse(scheduleACatalogJson),
  fixtureFileSchema.parse(form8959CatalogJson),
  fixtureFileSchema.parse(form1040CatalogJson),
];

export const FEDERAL_FORMS: FormSpec[] = [
  makeFormSpec({
    formId: "form-8949",
    shortId: "8949",
    displayName: "Form 8949",
    relativeDir: "federal/8949",
    register: registerForm8949,
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
   * catalog-fill regression test (tests/runAll.ts) checks them against
   * their blank PDFs. Bindings and downstream wiring come later.
   */
  makeFormSpec({
    formId: "schedule-b",
    shortId: "schedule-b",
    displayName: "Schedule B",
    relativeDir: "federal/schedule-b",
  }),
  /*
   * schedule-2/ has no instructions.pdf by design. The IRS publishes
   * Schedule 2 instructions only inside the 1040 instructions booklet,
   * which is already in the corpus as irs-1040-inst-2025.
   */
  makeFormSpec({
    formId: "schedule-2",
    shortId: "schedule-2",
    displayName: "Schedule 2",
    relativeDir: "federal/schedule-2",
  }),
  makeFormSpec({
    formId: "form-8889",
    shortId: "8889",
    displayName: "Form 8889",
    relativeDir: "federal/8889",
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
  }),
];

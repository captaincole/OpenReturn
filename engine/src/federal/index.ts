/*
 * Order is upstreams-first (8949 → Schedule D → 1040) only to keep the
 * fixpoint pass count low; any order converges. To add a form, follow
 * the checklist in engine/README.md.
 */

import { fixtureFileSchema } from "../catalog.js";
import { makeFormSpec, type FormSpec } from "../formSpec.js";
import { register as registerForm1040 } from "./1040/bindings.js";
import { register as registerForm1116 } from "./1116/bindings.js";
import { register as registerForm2106 } from "./2106/bindings.js";
import { register as registerForm2210 } from "./2210/bindings.js";
import { register as registerForm2441 } from "./2441/bindings.js";
import { register as registerForm2555 } from "./2555/bindings.js";
import { register as registerForm3800 } from "./3800/bindings.js";
import { register as registerForm3903 } from "./3903/bindings.js";
import { register as registerForm4136 } from "./4136/bindings.js";
import { register as registerForm4137 } from "./4137/bindings.js";
import { register as registerForm4255 } from "./4255/bindings.js";
import { register as registerForm4562 } from "./4562/bindings.js";
import { register as registerForm4563 } from "./4563/bindings.js";
import { register as registerForm461 } from "./461/bindings.js";
import { register as registerForm4684 } from "./4684/bindings.js";
import { register as registerForm4797 } from "./4797/bindings.js";
import { register as registerForm4835 } from "./4835/bindings.js";
import { register as registerForm4952 } from "./4952/bindings.js";
import { register as registerForm4970 } from "./4970/bindings.js";
import { register as registerForm4972 } from "./4972/bindings.js";
import { register as registerForm5329 } from "./5329/bindings.js";
import { register as registerForm5471 } from "./5471/bindings.js";
import { register as registerForm5695 } from "./5695/bindings.js";
import { register as registerForm6198 } from "./6198/bindings.js";
import { register as registerForm6251 } from "./6251/bindings.js";
import { register as registerForm6252 } from "./6252/bindings.js";
import { register as registerForm6781 } from "./6781/bindings.js";
import { register as registerForm7203 } from "./7203/bindings.js";
import { register as registerForm8283 } from "./8283/bindings.js";
import { register as registerForm8396 } from "./8396/bindings.js";
import { register as registerForm8582CR } from "./8582-cr/bindings.js";
import { register as registerForm8582 } from "./8582/bindings.js";
import { register as registerForm8606 } from "./8606/bindings.js";
import { register as registerForm8611 } from "./8611/bindings.js";
import { register as registerForm8615 } from "./8615/bindings.js";
import { register as registerForm8621 } from "./8621/bindings.js";
import { register as registerForm8697 } from "./8697/bindings.js";
import { register as registerForm8801 } from "./8801/bindings.js";
import { register as registerForm8814 } from "./8814/bindings.js";
import { register as registerForm8815 } from "./8815/bindings.js";
import { register as registerForm8824 } from "./8824/bindings.js";
import { register as registerForm8828 } from "./8828/bindings.js";
import { register as registerForm8829 } from "./8829/bindings.js";
import { register as registerForm8834 } from "./8834/bindings.js";
import { register as registerForm8839 } from "./8839/bindings.js";
import { register as registerForm8853 } from "./8853/bindings.js";
import { register as registerForm8859 } from "./8859/bindings.js";
import { register as registerForm8863 } from "./8863/bindings.js";
import { register as registerForm8880 } from "./8880/bindings.js";
import { register as registerForm8888 } from "./8888/bindings.js";
import { register as registerForm8889 } from "./8889/bindings.js";
import { register as registerForm8911 } from "./8911/bindings.js";
import { register as registerForm8912 } from "./8912/bindings.js";
import { register as registerForm8915F } from "./8915-f/bindings.js";
import { register as registerForm8919 } from "./8919/bindings.js";
import { register as registerForm8933 } from "./8933/bindings.js";
import { register as registerForm8936 } from "./8936/bindings.js";
import { register as registerForm8938 } from "./8938/bindings.js";
import { register as registerForm8949 } from "./8949/bindings.js";
import { register as registerForm8959 } from "./8959/bindings.js";
import { register as registerForm8960 } from "./8960/bindings.js";
import { register as registerForm8962 } from "./8962/bindings.js";
import { register as registerForm8978 } from "./8978/bindings.js";
import { register as registerForm8992 } from "./8992/bindings.js";
import { register as registerForm8995AScheduleC } from "./8995-a-schedule-c/bindings.js";
import { register as registerForm8995A } from "./8995-a/bindings.js";
import { register as registerForm8995 } from "./8995/bindings.js";
import { register as registerForm965A } from "./965-a/bindings.js";
import { register as registerSchedule1A } from "./schedule-1-a/bindings.js";
import { register as registerSchedule1 } from "./schedule-1/bindings.js";
import { register as registerSchedule2 } from "./schedule-2/bindings.js";
import { register as registerSchedule3 } from "./schedule-3/bindings.js";
import { register as registerSchedule8812 } from "./schedule-8812/bindings.js";
import { register as registerScheduleA } from "./schedule-a/bindings.js";
import { register as registerScheduleB } from "./schedule-b/bindings.js";
import { register as registerScheduleC } from "./schedule-c/bindings.js";
import { register as registerScheduleD } from "./schedule-d/bindings.js";
import { register as registerScheduleE } from "./schedule-e/bindings.js";
import { register as registerScheduleEIC } from "./schedule-eic/bindings.js";
import { register as registerScheduleF } from "./schedule-f/bindings.js";
import { register as registerScheduleH } from "./schedule-h/bindings.js";
import { register as registerScheduleR } from "./schedule-r/bindings.js";
import { register as registerScheduleSE } from "./schedule-se/bindings.js";

/* Rollup inlines the JSON at build time; the process does not read it from disk. */
import form1040CatalogJson from "./1040/catalog.json";
import form1116CatalogJson from "./1116/catalog.json";
import form2106CatalogJson from "./2106/catalog.json";
import form2210CatalogJson from "./2210/catalog.json";
import form2441CatalogJson from "./2441/catalog.json";
import form2555CatalogJson from "./2555/catalog.json";
import form3800CatalogJson from "./3800/catalog.json";
import form3903CatalogJson from "./3903/catalog.json";
import form4136CatalogJson from "./4136/catalog.json";
import form4137CatalogJson from "./4137/catalog.json";
import form4255CatalogJson from "./4255/catalog.json";
import form4562CatalogJson from "./4562/catalog.json";
import form4563CatalogJson from "./4563/catalog.json";
import form461CatalogJson from "./461/catalog.json";
import form4684CatalogJson from "./4684/catalog.json";
import form4797CatalogJson from "./4797/catalog.json";
import form4835CatalogJson from "./4835/catalog.json";
import form4952CatalogJson from "./4952/catalog.json";
import form4970CatalogJson from "./4970/catalog.json";
import form4972CatalogJson from "./4972/catalog.json";
import form5329CatalogJson from "./5329/catalog.json";
import form5471CatalogJson from "./5471/catalog.json";
import form5695CatalogJson from "./5695/catalog.json";
import form6198CatalogJson from "./6198/catalog.json";
import form6251CatalogJson from "./6251/catalog.json";
import form6252CatalogJson from "./6252/catalog.json";
import form6781CatalogJson from "./6781/catalog.json";
import form7203CatalogJson from "./7203/catalog.json";
import form8283CatalogJson from "./8283/catalog.json";
import form8396CatalogJson from "./8396/catalog.json";
import form8582CRCatalogJson from "./8582-cr/catalog.json";
import form8582CatalogJson from "./8582/catalog.json";
import form8606CatalogJson from "./8606/catalog.json";
import form8611CatalogJson from "./8611/catalog.json";
import form8615CatalogJson from "./8615/catalog.json";
import form8621CatalogJson from "./8621/catalog.json";
import form8697CatalogJson from "./8697/catalog.json";
import form8801CatalogJson from "./8801/catalog.json";
import form8814CatalogJson from "./8814/catalog.json";
import form8815CatalogJson from "./8815/catalog.json";
import form8824CatalogJson from "./8824/catalog.json";
import form8828CatalogJson from "./8828/catalog.json";
import form8829CatalogJson from "./8829/catalog.json";
import form8834CatalogJson from "./8834/catalog.json";
import form8839CatalogJson from "./8839/catalog.json";
import form8853CatalogJson from "./8853/catalog.json";
import form8859CatalogJson from "./8859/catalog.json";
import form8863CatalogJson from "./8863/catalog.json";
import form8880CatalogJson from "./8880/catalog.json";
import form8888CatalogJson from "./8888/catalog.json";
import form8889CatalogJson from "./8889/catalog.json";
import form8911CatalogJson from "./8911/catalog.json";
import form8912CatalogJson from "./8912/catalog.json";
import form8915FCatalogJson from "./8915-f/catalog.json";
import form8919CatalogJson from "./8919/catalog.json";
import form8933CatalogJson from "./8933/catalog.json";
import form8936CatalogJson from "./8936/catalog.json";
import form8938CatalogJson from "./8938/catalog.json";
import form8949CatalogJson from "./8949/catalog.json";
import form8959CatalogJson from "./8959/catalog.json";
import form8960CatalogJson from "./8960/catalog.json";
import form8962CatalogJson from "./8962/catalog.json";
import form8978CatalogJson from "./8978/catalog.json";
import form8992CatalogJson from "./8992/catalog.json";
import form8995AScheduleCCatalogJson from "./8995-a-schedule-c/catalog.json";
import form8995ACatalogJson from "./8995-a/catalog.json";
import form8995CatalogJson from "./8995/catalog.json";
import form965ACatalogJson from "./965-a/catalog.json";
import schedule1ACatalogJson from "./schedule-1-a/catalog.json";
import schedule1CatalogJson from "./schedule-1/catalog.json";
import schedule2CatalogJson from "./schedule-2/catalog.json";
import schedule3CatalogJson from "./schedule-3/catalog.json";
import schedule8812CatalogJson from "./schedule-8812/catalog.json";
import scheduleACatalogJson from "./schedule-a/catalog.json";
import scheduleBCatalogJson from "./schedule-b/catalog.json";
import scheduleCCatalogJson from "./schedule-c/catalog.json";
import scheduleDCatalogJson from "./schedule-d/catalog.json";
import scheduleECatalogJson from "./schedule-e/catalog.json";
import scheduleEICCatalogJson from "./schedule-eic/catalog.json";
import scheduleFCatalogJson from "./schedule-f/catalog.json";
import scheduleHCatalogJson from "./schedule-h/catalog.json";
import scheduleRCatalogJson from "./schedule-r/catalog.json";
import scheduleSECatalogJson from "./schedule-se/catalog.json";

/* parse() narrows the widened JSON types and fails at boot when a catalog drifts. */
export const FEDERAL_CATALOGS = [
  fixtureFileSchema.parse(form8949CatalogJson),
  fixtureFileSchema.parse(scheduleDCatalogJson),
  fixtureFileSchema.parse(scheduleACatalogJson),
  fixtureFileSchema.parse(scheduleBCatalogJson),
  fixtureFileSchema.parse(scheduleCCatalogJson),
  fixtureFileSchema.parse(scheduleSECatalogJson),
  fixtureFileSchema.parse(form8582CatalogJson),
  fixtureFileSchema.parse(scheduleECatalogJson),
  fixtureFileSchema.parse(form8606CatalogJson),
  fixtureFileSchema.parse(form4562CatalogJson),
  fixtureFileSchema.parse(form8829CatalogJson),
  fixtureFileSchema.parse(form8889CatalogJson),
  fixtureFileSchema.parse(form8959CatalogJson),
  fixtureFileSchema.parse(form4952CatalogJson),
  fixtureFileSchema.parse(schedule8812CatalogJson),
  fixtureFileSchema.parse(form8960CatalogJson),
  fixtureFileSchema.parse(form8995ACatalogJson),
  fixtureFileSchema.parse(form8995CatalogJson),
  fixtureFileSchema.parse(form8995AScheduleCCatalogJson),
  fixtureFileSchema.parse(form8962CatalogJson),
  fixtureFileSchema.parse(schedule1CatalogJson),
  fixtureFileSchema.parse(schedule1ACatalogJson),
  fixtureFileSchema.parse(schedule2CatalogJson),
  fixtureFileSchema.parse(scheduleHCatalogJson),
  fixtureFileSchema.parse(form5695CatalogJson),
  fixtureFileSchema.parse(form6251CatalogJson),
  fixtureFileSchema.parse(form2441CatalogJson),
  fixtureFileSchema.parse(scheduleRCatalogJson),
  fixtureFileSchema.parse(schedule3CatalogJson),
  fixtureFileSchema.parse(form4684CatalogJson),
  fixtureFileSchema.parse(scheduleEICCatalogJson),
  fixtureFileSchema.parse(form1040CatalogJson),
  fixtureFileSchema.parse(form1116CatalogJson),
  fixtureFileSchema.parse(form2210CatalogJson),
  fixtureFileSchema.parse(form8283CatalogJson),
  fixtureFileSchema.parse(form8801CatalogJson),
  fixtureFileSchema.parse(form8814CatalogJson),
  fixtureFileSchema.parse(scheduleFCatalogJson),
  fixtureFileSchema.parse(form461CatalogJson),
  fixtureFileSchema.parse(form965ACatalogJson),
  fixtureFileSchema.parse(form2106CatalogJson),
  fixtureFileSchema.parse(form2555CatalogJson),
  fixtureFileSchema.parse(form3800CatalogJson),
  fixtureFileSchema.parse(form3903CatalogJson),
  fixtureFileSchema.parse(form4136CatalogJson),
  fixtureFileSchema.parse(form4137CatalogJson),
  fixtureFileSchema.parse(form4255CatalogJson),
  fixtureFileSchema.parse(form4563CatalogJson),
  fixtureFileSchema.parse(form4797CatalogJson),
  fixtureFileSchema.parse(form4835CatalogJson),
  fixtureFileSchema.parse(form4970CatalogJson),
  fixtureFileSchema.parse(form4972CatalogJson),
  fixtureFileSchema.parse(form5329CatalogJson),
  fixtureFileSchema.parse(form5471CatalogJson),
  fixtureFileSchema.parse(form6198CatalogJson),
  fixtureFileSchema.parse(form6252CatalogJson),
  fixtureFileSchema.parse(form8396CatalogJson),
  fixtureFileSchema.parse(form8611CatalogJson),
  fixtureFileSchema.parse(form8615CatalogJson),
  fixtureFileSchema.parse(form8621CatalogJson),
  fixtureFileSchema.parse(form8697CatalogJson),
  fixtureFileSchema.parse(form8815CatalogJson),
  fixtureFileSchema.parse(form8828CatalogJson),
  fixtureFileSchema.parse(form8834CatalogJson),
  fixtureFileSchema.parse(form8839CatalogJson),
  fixtureFileSchema.parse(form8853CatalogJson),
  fixtureFileSchema.parse(form8859CatalogJson),
  fixtureFileSchema.parse(form8863CatalogJson),
  fixtureFileSchema.parse(form8880CatalogJson),
  fixtureFileSchema.parse(form8888CatalogJson),
  fixtureFileSchema.parse(form8911CatalogJson),
  fixtureFileSchema.parse(form8912CatalogJson),
  fixtureFileSchema.parse(form8915FCatalogJson),
  fixtureFileSchema.parse(form8919CatalogJson),
  fixtureFileSchema.parse(form8933CatalogJson),
  fixtureFileSchema.parse(form8936CatalogJson),
  fixtureFileSchema.parse(form8938CatalogJson),
  fixtureFileSchema.parse(form8978CatalogJson),
  fixtureFileSchema.parse(form8992CatalogJson),
  fixtureFileSchema.parse(form6781CatalogJson),
  fixtureFileSchema.parse(form7203CatalogJson),
  fixtureFileSchema.parse(form8582CRCatalogJson),
  fixtureFileSchema.parse(form8824CatalogJson),
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
  /* Form 4562 (one per activity) and Form 8829 (one per home office) feed Schedules C and E. */
  makeFormSpec({
    formId: "form-4562",
    shortId: "4562",
    displayName: "Form 4562",
    relativeDir: "federal/4562",
    register: registerForm4562,
    copies: {
      count: (info) => info?.form4562Activities?.length ?? 1,
      select: (info, index) => info && { ...info, form4562CopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "form-8829",
    shortId: "8829",
    displayName: "Form 8829",
    relativeDir: "federal/8829",
    register: registerForm8829,
    copies: {
      count: (info) => info?.form8829Businesses?.length ?? 1,
      select: (info, index) => info && { ...info, form8829CopyIndex: index },
    },
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
    formId: "form-8582",
    shortId: "8582",
    displayName: "Form 8582",
    relativeDir: "federal/8582",
    register: registerForm8582,
  }),
  makeFormSpec({
    formId: "schedule-e",
    shortId: "schedule-e",
    displayName: "Schedule E",
    relativeDir: "federal/schedule-e",
    register: registerScheduleE,
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
    formId: "form-2441",
    shortId: "2441",
    displayName: "Form 2441",
    relativeDir: "federal/2441",
    register: registerForm2441,
  }),
  makeFormSpec({
    formId: "schedule-r",
    shortId: "schedule-r",
    displayName: "Schedule R",
    relativeDir: "federal/schedule-r",
    register: registerScheduleR,
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
    formId: "form-8995-a-schedule-c",
    shortId: "8995-a-schedule-c",
    displayName: "Schedule C (Form 8995-A)",
    relativeDir: "federal/8995-a-schedule-c",
    register: registerForm8995AScheduleC,
  }),
  makeFormSpec({
    formId: "form-8962",
    shortId: "8962",
    displayName: "Form 8962",
    relativeDir: "federal/8962",
    register: registerForm8962,
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
  makeFormSpec({
    formId: "form-8283",
    shortId: "8283",
    displayName: "Form 8283",
    relativeDir: "federal/8283",
    register: registerForm8283,
    /* Four Section A rows to a form (federal/8283/lines.ts form8283Plan). */
    copies: {
      count: (info) => info?.form8283Copies?.length ?? 1,
      select: (info, index) => info && { ...info, form8283CopyIndex: index },
    },
  }),
  /* Wired with no rules yet: every field is blank, and only a must-file decision turns the form on. */
  makeFormSpec({
    formId: "form-1116",
    shortId: "1116",
    displayName: "Form 1116",
    relativeDir: "federal/1116",
    register: registerForm1116,
  }),
  makeFormSpec({
    formId: "form-2210",
    shortId: "2210",
    displayName: "Form 2210",
    relativeDir: "federal/2210",
    register: registerForm2210,
  }),
  makeFormSpec({
    formId: "form-8801",
    shortId: "8801",
    displayName: "Form 8801",
    relativeDir: "federal/8801",
    register: registerForm8801,
  }),
  makeFormSpec({
    formId: "form-8814",
    shortId: "8814",
    displayName: "Form 8814",
    relativeDir: "federal/8814",
    register: registerForm8814,
  }),
  makeFormSpec({
    formId: "schedule-f",
    shortId: "schedule-f",
    displayName: "Schedule F",
    relativeDir: "federal/schedule-f",
    register: registerScheduleF,
  }),
  makeFormSpec({
    formId: "form-461",
    shortId: "461",
    displayName: "Form 461",
    relativeDir: "federal/461",
    register: registerForm461,
  }),
  makeFormSpec({
    formId: "form-965-a",
    shortId: "965-a",
    displayName: "Form 965-A",
    relativeDir: "federal/965-a",
    register: registerForm965A,
  }),
  makeFormSpec({
    formId: "form-2106",
    shortId: "2106",
    displayName: "Form 2106",
    relativeDir: "federal/2106",
    register: registerForm2106,
  }),
  makeFormSpec({
    formId: "form-2555",
    shortId: "2555",
    displayName: "Form 2555",
    relativeDir: "federal/2555",
    register: registerForm2555,
  }),
  makeFormSpec({
    formId: "form-3800",
    shortId: "3800",
    displayName: "Form 3800",
    relativeDir: "federal/3800",
    register: registerForm3800,
  }),
  makeFormSpec({
    formId: "form-3903",
    shortId: "3903",
    displayName: "Form 3903",
    relativeDir: "federal/3903",
    register: registerForm3903,
  }),
  makeFormSpec({
    formId: "form-4136",
    shortId: "4136",
    displayName: "Form 4136",
    relativeDir: "federal/4136",
    register: registerForm4136,
  }),
  makeFormSpec({
    formId: "form-4137",
    shortId: "4137",
    displayName: "Form 4137",
    relativeDir: "federal/4137",
    register: registerForm4137,
  }),
  makeFormSpec({
    formId: "form-4255",
    shortId: "4255",
    displayName: "Form 4255",
    relativeDir: "federal/4255",
    register: registerForm4255,
  }),
  makeFormSpec({
    formId: "form-4563",
    shortId: "4563",
    displayName: "Form 4563",
    relativeDir: "federal/4563",
    register: registerForm4563,
  }),
  makeFormSpec({
    formId: "form-4797",
    shortId: "4797",
    displayName: "Form 4797",
    relativeDir: "federal/4797",
    register: registerForm4797,
  }),
  makeFormSpec({
    formId: "form-4835",
    shortId: "4835",
    displayName: "Form 4835",
    relativeDir: "federal/4835",
    register: registerForm4835,
  }),
  makeFormSpec({
    formId: "form-4970",
    shortId: "4970",
    displayName: "Form 4970",
    relativeDir: "federal/4970",
    register: registerForm4970,
  }),
  makeFormSpec({
    formId: "form-4972",
    shortId: "4972",
    displayName: "Form 4972",
    relativeDir: "federal/4972",
    register: registerForm4972,
  }),
  makeFormSpec({
    formId: "form-5329",
    shortId: "5329",
    displayName: "Form 5329",
    relativeDir: "federal/5329",
    register: registerForm5329,
    copies: {
      count: (info) => info?.form5329Filers?.length ?? 1,
      select: (info, index) => info && { ...info, form5329CopyIndex: index },
    },
  }),
  makeFormSpec({
    formId: "form-5471",
    shortId: "5471",
    displayName: "Form 5471",
    relativeDir: "federal/5471",
    register: registerForm5471,
  }),
  makeFormSpec({
    formId: "form-6198",
    shortId: "6198",
    displayName: "Form 6198",
    relativeDir: "federal/6198",
    register: registerForm6198,
  }),
  makeFormSpec({
    formId: "form-6252",
    shortId: "6252",
    displayName: "Form 6252",
    relativeDir: "federal/6252",
    register: registerForm6252,
  }),
  makeFormSpec({
    formId: "form-8396",
    shortId: "8396",
    displayName: "Form 8396",
    relativeDir: "federal/8396",
    register: registerForm8396,
  }),
  makeFormSpec({
    formId: "form-8611",
    shortId: "8611",
    displayName: "Form 8611",
    relativeDir: "federal/8611",
    register: registerForm8611,
  }),
  makeFormSpec({
    formId: "form-8615",
    shortId: "8615",
    displayName: "Form 8615",
    relativeDir: "federal/8615",
    register: registerForm8615,
  }),
  makeFormSpec({
    formId: "form-8621",
    shortId: "8621",
    displayName: "Form 8621",
    relativeDir: "federal/8621",
    register: registerForm8621,
  }),
  makeFormSpec({
    formId: "form-8697",
    shortId: "8697",
    displayName: "Form 8697",
    relativeDir: "federal/8697",
    register: registerForm8697,
  }),
  makeFormSpec({
    formId: "form-8815",
    shortId: "8815",
    displayName: "Form 8815",
    relativeDir: "federal/8815",
    register: registerForm8815,
  }),
  makeFormSpec({
    formId: "form-8828",
    shortId: "8828",
    displayName: "Form 8828",
    relativeDir: "federal/8828",
    register: registerForm8828,
  }),
  makeFormSpec({
    formId: "form-8834",
    shortId: "8834",
    displayName: "Form 8834",
    relativeDir: "federal/8834",
    register: registerForm8834,
  }),
  makeFormSpec({
    formId: "form-8839",
    shortId: "8839",
    displayName: "Form 8839",
    relativeDir: "federal/8839",
    register: registerForm8839,
  }),
  makeFormSpec({
    formId: "form-8853",
    shortId: "8853",
    displayName: "Form 8853",
    relativeDir: "federal/8853",
    register: registerForm8853,
  }),
  makeFormSpec({
    formId: "form-8859",
    shortId: "8859",
    displayName: "Form 8859",
    relativeDir: "federal/8859",
    register: registerForm8859,
  }),
  makeFormSpec({
    formId: "form-8863",
    shortId: "8863",
    displayName: "Form 8863",
    relativeDir: "federal/8863",
    register: registerForm8863,
  }),
  makeFormSpec({
    formId: "form-8880",
    shortId: "8880",
    displayName: "Form 8880",
    relativeDir: "federal/8880",
    register: registerForm8880,
  }),
  makeFormSpec({
    formId: "form-8888",
    shortId: "8888",
    displayName: "Form 8888",
    relativeDir: "federal/8888",
    register: registerForm8888,
  }),
  makeFormSpec({
    formId: "form-8911",
    shortId: "8911",
    displayName: "Form 8911",
    relativeDir: "federal/8911",
    register: registerForm8911,
  }),
  makeFormSpec({
    formId: "form-8912",
    shortId: "8912",
    displayName: "Form 8912",
    relativeDir: "federal/8912",
    register: registerForm8912,
  }),
  makeFormSpec({
    formId: "form-8915-f",
    shortId: "8915-f",
    displayName: "Form 8915-F",
    relativeDir: "federal/8915-f",
    register: registerForm8915F,
  }),
  makeFormSpec({
    formId: "form-8919",
    shortId: "8919",
    displayName: "Form 8919",
    relativeDir: "federal/8919",
    register: registerForm8919,
  }),
  makeFormSpec({
    formId: "form-8933",
    shortId: "8933",
    displayName: "Form 8933",
    relativeDir: "federal/8933",
    register: registerForm8933,
  }),
  makeFormSpec({
    formId: "form-8936",
    shortId: "8936",
    displayName: "Form 8936",
    relativeDir: "federal/8936",
    register: registerForm8936,
  }),
  makeFormSpec({
    formId: "form-8938",
    shortId: "8938",
    displayName: "Form 8938",
    relativeDir: "federal/8938",
    register: registerForm8938,
  }),
  makeFormSpec({
    formId: "form-8978",
    shortId: "8978",
    displayName: "Form 8978",
    relativeDir: "federal/8978",
    register: registerForm8978,
  }),
  makeFormSpec({
    formId: "form-8992",
    shortId: "8992",
    displayName: "Form 8992",
    relativeDir: "federal/8992",
    register: registerForm8992,
  }),
  makeFormSpec({
    formId: "form-6781",
    shortId: "6781",
    displayName: "Form 6781",
    relativeDir: "federal/6781",
    register: registerForm6781,
  }),
  makeFormSpec({
    formId: "form-7203",
    shortId: "7203",
    displayName: "Form 7203",
    relativeDir: "federal/7203",
    register: registerForm7203,
  }),
  makeFormSpec({
    formId: "form-8582-cr",
    shortId: "8582-cr",
    displayName: "Form 8582-CR",
    relativeDir: "federal/8582-cr",
    register: registerForm8582CR,
  }),
  makeFormSpec({
    formId: "form-8824",
    shortId: "8824",
    displayName: "Form 8824",
    relativeDir: "federal/8824",
    register: registerForm8824,
  }),
];

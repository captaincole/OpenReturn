/*
 * The part of the return that each form belongs to. The form graph draws the main
 * form (Form 1040, Form 540) at the top and one lane for each section below it.
 *
 * The lists are kept by hand, from the order of the main form's lines. The order
 * in a list is the order in the lane: the schedule that collects the others comes
 * first. A form on no list goes to "other".
 */

export const SECTIONS = [
  "main",
  "income",
  "deductions",
  "tax",
  "credits",
  "payments",
  "other",
] as const;

export type Section = (typeof SECTIONS)[number];

const FORM_SECTIONS: Record<Exclude<Section, "other">, string[]> = {
  main: ["form-1040", "form-540"],
  /* Income and the adjustments to income. */
  income: [
    "schedule-1",
    "schedule-b",
    "schedule-d",
    "form-8949",
    "schedule-c",
    "form-4562",
    "form-8829",
    "schedule-e",
    "form-8582",
    "form-8606",
    "form-8889",
    "schedule-ca",
    "schedule-d-ca",
    "form-3885a",
  ],
  deductions: [
    "schedule-a",
    "form-4684",
    "form-4952",
    "schedule-1-a",
    "form-8995",
    "form-8995-a",
    "form-8995-a-schedule-c",
    "form-3526",
  ],
  /* The tax and the other taxes. */
  tax: [
    "schedule-2",
    "form-6251",
    "schedule-se",
    "form-8959",
    "form-8960",
    "schedule-h",
    "schedule-p",
    "form-3805p",
  ],
  credits: [
    "schedule-3",
    "schedule-8812",
    "schedule-eic",
    "form-2441",
    "form-5695",
    "schedule-r",
    "form-8962",
    "form-3514",
  ],
  /* Payments and penalties. */
  payments: ["form-5805"],
};

export interface SectionPlace {
  section: Section;
  /* The place in the section's lane, from 0 at the top. */
  rank: number;
}

export function sectionOf(formId: string): SectionPlace {
  const found = SECTIONS.flatMap((section) => {
    const rank = section === "other" ? -1 : FORM_SECTIONS[section].indexOf(formId);
    return rank === -1 ? [] : [{ section, rank }];
  });
  return found[0] ?? { section: "other", rank: 0 };
}

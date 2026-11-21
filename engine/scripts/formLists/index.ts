/*
 * The IRS and FTB lists of the forms that an individual return can hold, one file
 * for each jurisdiction and tax year. The names, titles and maximums are the
 * publisher's. `short` (the form's folder in the engine) and `tier1` (a form that
 * our target user needs) are ours, kept by hand.
 */

import californiaForms from "./california-2025.json";
import federalForms from "./federal-2025.json";

export interface ListedForm {
  name: string;
  title?: string;
  /* The most copies of the form on one return, as the publisher writes it. */
  maxPerReturn?: string;
  short?: string;
  tier1?: boolean;
}

export interface FormList {
  list: string;
  publisher: string;
  taxYear: number;
  sourceUrl: string;
  /* The date on the publisher's list. */
  sourceDate: string;
  /* The folder under engine/src: "federal" or "state/ca". */
  jurisdiction: string;
  forms: ListedForm[];
}

export const FORM_LISTS: FormList[] = [federalForms, californiaForms];

const NAME_CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";

const FIRST_WORDS = ["Form 1040 Schedule ", "Form ", "FTB "];

/* The IRS writes "Form 1040 Schedule J"; a form line says "Schedule J". */
function withoutFirstWord(name: string): string {
  if (name.startsWith(FIRST_WORDS[0])) return `Schedule ${name.slice(FIRST_WORDS[0].length)}`;
  const first = FIRST_WORDS.find((word) => name.startsWith(word));
  return first ? name.slice(first.length) : name;
}

/* "Form 8582CR", "Form 8582-CR" and "FTB 3801-CR" compare by their letters and digits. */
export const formNameKey = (name: string): string =>
  [...withoutFirstWord(name).toLowerCase()]
    .filter((character) => NAME_CHARACTERS.includes(character))
    .join("");

/* The tier 1 forms the engine has, each as its folder: "federal/8949". */
export const tier1Folders = (lists: FormList[]): string[] =>
  lists.flatMap((list) =>
    list.forms.flatMap((form) =>
      form.tier1 && form.short ? [`${list.jurisdiction}/${form.short}`] : [],
    ),
  );

/* The tier 1 forms the engine lacks, by jurisdiction folder. */
export const tier1Lacking = (lists: FormList[], jurisdiction: string): ListedForm[] =>
  lists
    .filter((list) => list.jurisdiction === jurisdiction)
    .flatMap((list) => list.forms.filter((form) => form.tier1 && !form.short));

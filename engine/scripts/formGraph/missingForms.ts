/*
 * The forms an individual attaches that the engine lacks and that the form graph
 * draws: a tier 1 form, or a form that a blank field names. A blank field names the
 * form it waits for in its label or its reason ("Education credits from Form 8863"),
 * and the form graph makes a node for each name on this list.
 *
 * The list is kept by hand. `about` is a short description, not the form's official
 * title. A name that a field uses and that no list here has shows in the report under
 * "Names not classified": add it to one of the two lists.
 */

import type { Section } from "./sections.js";

export interface MissingForm {
  name: string;
  /* The part of the return that the form belongs to: its lane in the drawn graph. */
  section: Section;
  about: string;
  jurisdiction: "federal" | "state/ca";
  /* Other ways that a field names the form. */
  aliases?: string[];
}

const federal = (name: string, section: Section, about: string): MissingForm => ({
  name,
  section,
  about,
  jurisdiction: "federal",
});

/* The engine has every tier 1 form (scripts/formLists), and no blank field names a California form that it lacks. */
export const MISSING_FORMS: MissingForm[] = [
  /* Named by a field of a form that has no rules yet. Most are the sources of the general business credit (Form 3800). */
  federal(
    "Form 5884-A",
    "credits",
    "Employee retention credit for employers affected by qualified disasters",
  ),
  federal("Form 5884-B", "credits", "New hire retention credit"),
  federal("Form 7205", "credits", "Energy efficient commercial buildings deduction"),
  federal("Form 8830", "credits", "Enhanced oil recovery credit"),
  federal("Form 8845", "credits", "Indian employment credit"),
  federal(
    "Form 8847",
    "credits",
    "Credit for contributions to selected community development corporations",
  ),
  federal("Form 8861", "credits", "Welfare-to-work credit"),
  federal("Form 8874", "credits", "New markets credit"),
  federal("Form 8884", "credits", "New York Liberty Zone business employee credit"),
  federal("Form 8896", "credits", "Low sulfur diesel fuel production credit"),
  federal("Form 8900", "credits", "Qualified railroad track maintenance credit"),
  federal("Form 8904", "credits", "Credit for oil and gas production from marginal wells"),
  federal("Form 8906", "credits", "Distilled spirits credit"),
  federal("Form 8907", "credits", "Nonconventional source fuel credit"),
  federal("Form 8908", "credits", "Energy efficient home credit"),
  federal("Form 8909", "credits", "Energy efficient appliance credit"),
  federal("Form 8910", "credits", "Alternative motor vehicle credit"),
  federal("Form 8923", "credits", "Mine rescue team training credit"),
  federal("Form 8931", "credits", "Agricultural chemicals security credit"),
  federal("Form 8932", "credits", "Credit for employer differential wage payments"),
  federal("Form 8941", "credits", "Credit for small employer health insurance premiums"),
  federal("Form 8942", "credits", "Qualifying therapeutic discovery project credit"),
  federal("Form 8994", "credits", "Employer credit for paid family and medical leave"),
];

/*
 * Names that a field uses and that never become a node: a document the taxpayer
 * receives, the return of another filer, or a form filed apart from the return.
 */
export const NOT_RETURN_FORMS: string[] = [
  "Schedule K-1",
  "Schedule G",
  "Schedule Q",
  "Form W-2",
  "Form W-2G",
  "Form 1098-T",
  "Form 1099-B",
  "Form 1099-DA",
  "Form 1099-DIV",
  "Form 1099-K",
  "Form 1099-NEC",
  "Form 1099-QA",
  "Form 1099-S",
  "Form 2439",
  "Form 592-B",
  "Form 593",
  "Form 1040-NR",
  "Form 1041",
  "Form 1065",
  "Form 1066",
  "Form 1120-S",
  "Form 541",
  "Form 540-ES",
  "Form 100",
  "Form 100S",
  "Form 100W",
  "Form 100X",
  "Form 109",
  "FTB 3544",
  "Schedule Z",
  /* The FTB label text for a form the engine has: "Form 540N R" and "Form 3805V". */
  "Form 540N",
  "Form 3805V",
  "Form 114",
  "Form 4029",
  "Form 4361",
  "Form 1065-B",
  "Form 1098",
  "Form 1098-C",
  "Form 1099-R",
  "Form 2555-EZ",
  "Form 8609",
  "Form 8827",
  "Form 8915-E",
  "Schedule I",
];

const FORM_WORDS = ["Form", "Schedule", "FTB"];
const DIGITS = "0123456789";
const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const WORD_BREAKS = ["(", ")", ",", ".", ";", ":", "/", "—", "?", '"'];

const endsAName = (next: string | undefined): boolean =>
  next === undefined || !(LETTERS.includes(next) || DIGITS.includes(next) || next === "-");

/* "Form 8995" is not in "Form 8995-A": the name must end where a word ends. */
export function namesForm(text: string, name: string): boolean {
  let from = text.indexOf(name);
  while (from !== -1) {
    if (endsAName(text[from + name.length])) return true;
    from = text.indexOf(name, from + 1);
  }
  return false;
}

export const namesOf = (form: MissingForm): string[] => [form.name, ...(form.aliases ?? [])];

export function missingFormsIn(text: string, forms: MissingForm[]): MissingForm[] {
  return forms.filter((form) => namesOf(form).some((name) => namesForm(text, name)));
}

/* A form number starts with a digit ("8863", "540NR"); a schedule is capitals ("F", "K-1"); "W-2". */
function isFormNumber(word: string): boolean {
  if (word.length === 0 || word.length > 8) return false;
  if (DIGITS.includes(word[0])) return true;
  return word === word.toUpperCase() && LETTERS.includes(word[0]) && word !== "FTB";
}

/* Every "Form 8863", "Schedule F" or "FTB 3801" in the text, known or not. */
export function formNamesIn(text: string): string[] {
  const spaced = WORD_BREAKS.reduce((rest, mark) => rest.split(mark).join(" "), text);
  const words = spaced.split(" ").filter((word) => word.length > 0);
  const names = words.flatMap((word, index) => {
    const next = words[index + 1] ?? "";
    return FORM_WORDS.includes(word) && isFormNumber(next) ? [`${word} ${next}`] : [];
  });
  return [...new Set(names)];
}

/* "Form 1116" is "form-1116". */
export const missingFormId = (form: MissingForm): string =>
  form.name.toLowerCase().split(" ").join("-");

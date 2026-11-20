/*
 * The forms an individual attaches that the engine lacks. A blank field names the
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

export const MISSING_FORMS: MissingForm[] = [
  federal("Schedule F", "income", "Profit or loss from farming"),
  federal("Form 461", "income", "Limit on business losses"),
  federal("Form 965-A", "tax", "Net tax on deferred foreign income, paid in installments"),
  federal("Form 2106", "income", "Employee business expenses"),
  federal("Form 2555", "income", "Foreign earned income exclusion"),
  federal("Form 3800", "credits", "General business credit"),
  federal("Form 3903", "income", "Moving expenses"),
  federal("Form 4136", "credits", "Credit for federal tax paid on fuels"),
  federal("Form 4137", "tax", "Social security and Medicare tax on tips not reported"),
  federal("Form 4255", "tax", "Recapture of credits"),
  federal("Form 4563", "income", "Exclusion of income for residents of American Samoa"),
  federal("Form 4797", "income", "Sales of business property"),
  federal("Form 4835", "income", "Farm rental income and expenses"),
  federal("Form 4970", "tax", "Tax on an accumulation distribution of a trust"),
  federal("Form 4972", "tax", "Tax on lump-sum distributions"),
  federal("Form 5329", "tax", "Additional taxes on retirement plans and other accounts"),
  federal("Form 5471", "income", "Information return for certain foreign corporations"),
  federal("Form 6198", "income", "At-risk limits"),
  federal("Form 6252", "income", "Installment sale income"),
  federal("Form 8396", "credits", "Mortgage interest credit"),
  federal("Form 8611", "tax", "Recapture of the low-income housing credit"),
  federal("Form 8621", "tax", "Passive foreign investment company shareholder"),
  federal("Form 8697", "tax", "Interest under the look-back method"),
  federal("Form 8815", "income", "Exclusion of interest from savings bonds"),
  federal("Form 8828", "tax", "Recapture of the federal mortgage subsidy"),
  federal("Form 8834", "credits", "Qualified electric vehicle credit"),
  federal("Form 8839", "credits", "Adoption credit and employer adoption benefits"),
  federal("Form 8853", "income", "Archer MSAs and long-term care insurance contracts"),
  federal("Form 8859", "credits", "District of Columbia first-time homebuyer credit carryforward"),
  federal("Form 8863", "credits", "Education credits"),
  federal("Form 8880", "credits", "Credit for retirement savings contributions"),
  federal("Form 8888", "payments", "Split of the refund between accounts"),
  federal("Form 8911", "credits", "Alternative fuel vehicle refueling property credit"),
  federal("Form 8912", "credits", "Credit to holders of tax credit bonds"),
  federal("Form 8915-F", "income", "Qualified disaster retirement plan distributions"),
  federal("Form 8919", "tax", "Social security and Medicare tax on wages with no withholding"),
  federal("Form 8933", "credits", "Carbon oxide sequestration credit"),
  federal("Form 8936", "credits", "Clean vehicle credits"),
  federal("Form 8978", "tax", "Partner's additional reporting year tax"),
  federal("Form 8992", "income", "Global intangible low-taxed income"),
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
  "Form 2439",
  "Form 592-B",
  "Form 593",
  "Form 1040-NR",
  "Form 1041",
  "Form 1065",
  "Form 1066",
  "Form 1120-S",
  "Form 541",
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
];

const FORM_WORDS = ["Form", "Schedule", "FTB"];
const DIGITS = "0123456789";
const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const WORD_BREAKS = ["(", ")", ",", ".", ";", ":", "/", "—"];

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

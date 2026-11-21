/*
 * Pure: the IRS and FTB lists of the forms that an individual return can hold, and
 * the engine's forms, in; the README table and docs/individual-forms.md out.
 *
 * The lists are in scripts/formLists. The names, titles and maximums are the
 * publisher's. `short` (the form's folder in the engine) and `tier1` (a form that
 * our target user needs) are ours, kept by hand.
 */

import { jurisdictionOf, table, type FormInput } from "./report.js";

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

export type FormState = "rules" | "no_rules" | "not_in_engine";

export interface FormListCounts {
  total: number;
  inEngine: number;
  withRules: number;
}

export interface FormListSummary {
  name: string;
  list: FormList;
  states: FormState[];
  all: FormListCounts;
  tier1: FormListCounts;
}

function stateOf(form: ListedForm, jurisdiction: string, engineForms: FormInput[]): FormState {
  const inEngine = engineForms.find(
    (engineForm) => engineForm.relativeDir === `${jurisdiction}/${form.short}`,
  );
  if (!inEngine) return "not_in_engine";
  return inEngine.fields.covered > 0 ? "rules" : "no_rules";
}

const countStates = (states: FormState[]): FormListCounts => ({
  total: states.length,
  inEngine: states.filter((state) => state !== "not_in_engine").length,
  withRules: states.filter((state) => state === "rules").length,
});

export function summarizeFormList(list: FormList, engineForms: FormInput[]): FormListSummary {
  const states = list.forms.map((form) => stateOf(form, list.jurisdiction, engineForms));
  return {
    name: jurisdictionOf(`${list.jurisdiction}/form`, list.taxYear).name,
    list,
    states,
    all: countStates(states),
    tier1: countStates(states.filter((_, index) => list.forms[index].tier1 === true)),
  };
}

/* Each engine form that no list has, as "federal/8949": the lists must cover the engine. */
export function formsOnNoList(lists: FormList[], engineForms: FormInput[]): string[] {
  const listed = lists.flatMap((list) =>
    list.forms.flatMap((form) => (form.short ? [`${list.jurisdiction}/${form.short}`] : [])),
  );
  return engineForms
    .map((engineForm) => engineForm.relativeDir)
    .filter((relativeDir) => !listed.includes(relativeDir));
}

type CountOf = (summary: FormListSummary) => number;

const README_ROWS: Array<[string, CountOf]> = [
  ["Forms an individual return can hold", (summary) => summary.all.total],
  ["In the engine", (summary) => summary.all.inEngine],
  ["With rules", (summary) => summary.all.withRules],
  ["Tier 1 forms", (summary) => summary.tier1.total],
  ["Tier 1 in the engine", (summary) => summary.tier1.inEngine],
  ["Tier 1 with rules", (summary) => summary.tier1.withRules],
];

export function renderReadmeFormLists(summaries: FormListSummary[]): string {
  return table(
    ["Forms", ...summaries.map((summary) => summary.name)],
    README_ROWS.map(([label, countOf]) => [label, ...summaries.map(countOf)]),
  );
}

const STATE_TEXT: Record<FormState, string> = {
  rules: "Rules",
  no_rules: "No rules yet",
  not_in_engine: "Not in the engine",
};

const PAGE_INTRO = `This page lists each form that an individual income tax return can hold, and what the engine has for it. The lists are the publishers' own: the IRS and the FTB each publish the forms that they accept with an e-filed individual return. A list also has the documents that a taxpayer receives (Form W-2, Form 1099-R), other returns and extension requests.

- **Rules:** the engine has the form and computes one or more of its fields. [Engine coverage](coverage.md) has the share for each form.
- **No rules yet:** the engine has the form's field list and can fill the form, and computes no field.
- **Not in the engine:** the engine does not have the form.
- **Tier 1:** a form that our target user needs. This is our own estimate, kept by hand in \`engine/scripts/formLists\`. The target user has high wages, stock compensation, K-1s, rental property, and income from other states or countries.
- **Copies:** the most copies of the form on one return, as the publisher writes it.`;

function listSection(summary: FormListSummary): string {
  const { list, all, tier1 } = summary;
  return [
    `## ${summary.name}`,
    `Source: [${list.list}](${list.sourceUrl}), ${list.publisher}, dated ${list.sourceDate}.`,
    `The engine has ${all.inEngine} of ${all.total} forms, and ${all.withRules} have rules. Of the ${tier1.total} tier 1 forms, the engine has ${tier1.inEngine}, and ${tier1.withRules} have rules.`,
    table(
      ["Form", "Title", "Tier 1", "Engine", "Copies"],
      list.forms.map((form, index) => [
        form.name,
        form.title ?? "",
        form.tier1 ? "Yes" : "",
        STATE_TEXT[summary.states[index]],
        form.maxPerReturn ?? "",
      ]),
    ),
  ].join("\n\n");
}

export function renderFormListPage(summaries: FormListSummary[], date: string): string {
  return [
    "# Forms for an individual return",
    `Generated by \`npm run coverage\` on ${date}. Do not edit by hand.`,
    PAGE_INTRO,
    ...summaries.map(listSection),
    "",
  ].join("\n\n");
}

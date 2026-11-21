/*
 * Pure: the IRS and FTB lists of the forms that an individual return can hold, and
 * the engine's forms, in; the README table and docs/individual-forms.md out.
 *
 * The lists are in scripts/formLists.
 */

import type { FormList, InputDocument, ListedForm } from "../formLists/index.js";
import { jurisdictionOf, table, type FormInput } from "./report.js";

export type FormState =
  | "rules"
  | "no_rules"
  | "not_in_engine"
  /* Not a form to compute: a document the taxpayer receives, or another return or a request. */
  | "document"
  | "other";

const NOT_FORMS: FormState[] = ["document", "other"];

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
  if (form.kind === "document") return "document";
  if (form.kind === "other") return "other";
  const inEngine = engineForms.find(
    (engineForm) => engineForm.relativeDir === `${jurisdiction}/${form.short}`,
  );
  if (!inEngine) return "not_in_engine";
  return inEngine.fields.covered > 0 ? "rules" : "no_rules";
}

/* Counts the forms to compute only. */
const countStates = (states: FormState[]): FormListCounts => ({
  total: states.filter((state) => !NOT_FORMS.includes(state)).length,
  inEngine: states.filter((state) => state === "rules" || state === "no_rules").length,
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
  ["Forms and schedules for an individual return", (summary) => summary.all.total],
  ["In the engine", (summary) => summary.all.inEngine],
  ["With rules", (summary) => summary.all.withRules],
  ["Tier 1 forms", (summary) => summary.tier1.total],
  ["Tier 1 in the engine", (summary) => summary.tier1.inEngine],
  ["Tier 1 with rules", (summary) => summary.tier1.withRules],
];

export function renderReadmeFormLists(
  summaries: FormListSummary[],
  documents: InputDocument[],
): string {
  const counts = table(
    ["Forms", ...summaries.map((summary) => summary.name)],
    README_ROWS.map(([label, countOf]) => [label, ...summaries.map(countOf)]),
  );
  return `${counts}\n\nCade reads ${documents.length} kinds of input document, such as Form W-2 and Form 1099-B.`;
}

const STATE_TEXT: Record<FormState, string> = {
  rules: "Rules",
  no_rules: "No rules yet",
  not_in_engine: "Not in the engine",
  document: "Not a form: a document",
  other: "Not a form: another return or a request",
};

const PAGE_INTRO = `This page lists each form that an individual income tax return can hold, and what the engine has for it. The lists are the publishers' own: the IRS and the FTB each publish the forms that they accept with an e-filed individual return. A list also has rows that are not forms to compute: the documents that a taxpayer receives and attaches (Form W-2, Form 1099-R), other returns and extension requests. The counts leave those rows out.

- **Rules:** the engine has the form and computes one or more of its fields. [Engine coverage](coverage.md) has the share for each form.
- **No rules yet:** the engine has the form's field list and can fill the form, and computes no field.
- **Not in the engine:** the engine does not have the form.
- **Not a form:** our own mark, kept by hand. The last section lists the documents that Cade reads; most of them are not on a publisher's list, because a return attaches only a few documents.
- **Tier 1:** a form that our target user needs. This is our own estimate, kept by hand in \`engine/scripts/formLists\`. The target user has high wages, stock compensation, K-1s, rental property, and income from other states or countries.
- **Copies:** the most copies of the form on one return, as the publisher writes it.`;

function listSection(summary: FormListSummary): string {
  const { list, all, tier1 } = summary;
  return [
    `## ${summary.name}`,
    `Source: [${list.list}](${list.sourceUrl}), ${list.publisher}, dated ${list.sourceDate}.`,
    `The list has ${list.forms.length} rows, and ${all.total} are forms and schedules to compute. The engine has ${all.inEngine} of them, and ${all.withRules} have rules. Of the ${tier1.total} tier 1 forms, the engine has ${tier1.inEngine}, and ${tier1.withRules} have rules.`,
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

function documentSection(documents: InputDocument[]): string {
  return [
    "## Input documents",
    `Cade reads ${documents.length} kinds of input document. This list is our own, kept by hand in \`engine/scripts/formLists\`. No publisher lists every document that a taxpayer can bring.`,
    table(
      ["Document", "Title"],
      documents.map((document) => [document.name, document.title]),
    ),
  ].join("\n\n");
}

export function renderFormListPage(
  summaries: FormListSummary[],
  documents: InputDocument[],
  date: string,
): string {
  return [
    "# Forms for an individual return",
    `Generated by \`npm run coverage\` on ${date}. Do not edit by hand.`,
    PAGE_INTRO,
    ...summaries.map(listSection),
    documentSection(documents),
    "",
  ].join("\n\n");
}

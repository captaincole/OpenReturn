/*
 * The form graph: which form reads which form, and the state of each field.
 * `npm run form-graph` writes data/form-graph.json (engine/scripts/formGraph);
 * the types here mirror its shape by hand. lib/formGraphLayout.ts places the forms.
 */

export type FieldState = "verified" | "locked" | "not_run" | "unsupported";

export const FIELD_STATES: FieldState[] = ["verified", "locked", "not_run", "unsupported"];

export const STATE_LABELS: Record<FieldState, string> = {
  verified: "Verified",
  locked: "Locked",
  not_run: "Not run",
  unsupported: "Unsupported",
};

export const STATE_MEANINGS: Record<FieldState, string> = {
  verified: "A scenario with an answer key gives the field a value.",
  locked: "Only a scenario with no answer key gives the field a value.",
  not_run: "The field has a rule, and no scenario gives it a value.",
  unsupported: "The engine leaves the field blank.",
};

export type StateCounts = Record<FieldState, number>;

export interface FormNode {
  formId: string;
  displayName: string;
  jurisdiction: string;
  /* The part of the return that the form belongs to, and its place in that part. */
  section: string;
  rank: number;
  scenarios: string[];
  fieldCount: number;
  states: StateCounts;
  reads: string[];
  feeds: string[];
}

export interface FormEdge {
  reader: string;
  source: string;
  fields: Array<{ fieldId: string; readBy: string[]; inCode: boolean }>;
}

export interface FieldNode {
  fieldId: string;
  formId: string;
  label: string;
  state: FieldState;
  scenarios: number;
  reason?: string;
  reads: string[];
  feeds: number;
  feedsForms: string[];
  /* The forms the engine lacks that this blank field names. */
  needsForms?: string[];
}

/* A form that the engine lacks, with the blank fields that name it. */
export interface MissingFormNode {
  formId: string;
  displayName: string;
  about: string;
  jurisdiction: string;
  section: string;
  waiting: Array<{ formId: string; fieldIds: string[] }>;
  waitingCount: number;
  feeds: number;
}

export interface FormGraph {
  scenarios: number;
  forms: FormNode[];
  edges: FormEdge[];
  fields: FieldNode[];
  missing: MissingFormNode[];
  unclassified: Array<{ name: string; fields: number }>;
  loops: string[][];
}

/* An edge of the drawing: values go from the source form to the reader form. */
export interface Link {
  source: string;
  reader: string;
}

/* The part of the id after the form: "form-1040.line.11b" is "line.11b". */
export const shortFieldId = (field: Pick<FieldNode, "fieldId" | "formId">): string =>
  field.fieldId.slice(field.formId.length + 1);

export const addStates = (left: StateCounts, right: StateCounts): StateCounts => ({
  verified: left.verified + right.verified,
  locked: left.locked + right.locked,
  not_run: left.not_run + right.not_run,
  unsupported: left.unsupported + right.unsupported,
});

/* The one box that stands for the forms of the other returns: federal forms in a state's graph, state forms in the federal graph. */
export const OUTSIDE_ID = "other-return";

export interface OutsideForms {
  formId: typeof OUTSIDE_ID;
  displayName: string;
  /* The jurisdiction whose graph the box opens. */
  jurisdiction: string;
  formCount: number;
}

/* One jurisdiction's part of the graph. */
export interface JurisdictionGraph {
  jurisdiction: string;
  forms: FormNode[];
  links: Link[];
  /* Given when a form here reads, or feeds, a form of another return. */
  outside?: OutsideForms;
  /* The forms of this jurisdiction that the engine lacks and that a form here waits for. */
  missing: MissingFormNode[];
}

export const isFederal = (jurisdiction: string): boolean => jurisdiction.startsWith("Federal");

/* "California 2025" is "california-2025": the id of the jurisdiction's section on the page. */
export const jurisdictionId = (jurisdiction: string): string =>
  jurisdiction.toLowerCase().split(" ").join("-");

const sameLink = (one: Link, two: Link): boolean =>
  one.source === two.source && one.reader === two.reader;

const distinct = (links: Link[]): Link[] =>
  links.filter((link, index) => links.findIndex((other) => sameLink(other, link)) === index);

/*
 * The federal graph has one "State return" box for every state form, because the
 * state is not always the same one. A state's graph has one "Federal return" box.
 * A read between two states is in neither graph.
 */
function jurisdictionGraph(
  graph: Pick<FormGraph, "forms" | "edges" | "missing">,
  jurisdiction: string,
): JurisdictionGraph {
  const of = new Map(graph.forms.map((form) => [form.formId, form.jurisdiction]));
  const inside = (formId: string): boolean => of.get(formId) === jurisdiction;
  const outside = (formId: string): boolean => {
    const other = of.get(formId);
    return other !== undefined && !inside(formId) && isFederal(other) !== isFederal(jurisdiction);
  };
  const end = (formId: string): string => (inside(formId) ? formId : OUTSIDE_ID);
  const links = distinct(
    graph.edges
      .filter(
        (edge) =>
          (inside(edge.source) && (inside(edge.reader) || outside(edge.reader))) ||
          (inside(edge.reader) && outside(edge.source)),
      )
      .map((edge) => ({ source: end(edge.source), reader: end(edge.reader) })),
  );
  const others = graph.forms.filter((form) => outside(form.formId));
  const linked = links.some((link) => link.source === OUTSIDE_ID || link.reader === OUTSIDE_ID);
  return {
    jurisdiction,
    forms: graph.forms.filter((form) => inside(form.formId)),
    links,
    outside: linked
      ? {
          formId: OUTSIDE_ID,
          displayName: isFederal(jurisdiction) ? "State return" : "Federal return",
          jurisdiction: others[0].jurisdiction,
          formCount: others.length,
        }
      : undefined,
    missing: graph.missing.filter(
      (form) =>
        form.jurisdiction === jurisdiction && form.waiting.some((group) => inside(group.formId)),
    ),
  };
}

/* One graph for each jurisdiction, the federal one first. */
export function splitByJurisdiction(
  graph: Pick<FormGraph, "forms" | "edges" | "missing">,
): JurisdictionGraph[] {
  const names = [...new Set(graph.forms.map((form) => form.jurisdiction))];
  return [...names.filter(isFederal), ...names.filter((name) => !isFederal(name))].map((name) =>
    jurisdictionGraph(graph, name),
  );
}

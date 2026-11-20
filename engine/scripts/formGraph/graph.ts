/*
 * Pure: the forms' field lists, what each scenario run computed and read, and the
 * reads found in the form code in; the form graph out. A node is a form and an
 * edge is "this form reads that form". The web app draws the graph from the JSON.
 */

export type FieldState =
  /* A scenario with an answer key gives the field a value. */
  | "verified"
  /* Only scenarios with no answer key give the field a value. */
  | "locked"
  /* The field has a rule, and no scenario gives it a value. */
  | "not_run"
  /* The engine leaves the field blank. */
  | "unsupported";

export interface FormInput {
  formId: string;
  displayName: string;
  /* For example "Federal 2025". */
  jurisdiction: string;
  fields: Array<{
    fieldId: string;
    label: string;
    kind: "binding" | "unsupported" | undefined;
  }>;
}

export interface ScenarioRun {
  name: string;
  hasAnswerKey: boolean;
  formIds: string[];
  fields: Array<{
    fieldId: string;
    hasValue: boolean;
    reads: string[];
    unsupportedReason?: string;
  }>;
}

/* A field id of another form that the code in a form's folder names. */
export interface CodeRead {
  readerFormId: string;
  fieldId: string;
}

export interface GraphInput {
  forms: FormInput[];
  runs: ScenarioRun[];
  codeReads: CodeRead[];
}

export type StateCounts = Record<FieldState, number>;

export interface FormNode {
  formId: string;
  displayName: string;
  jurisdiction: string;
  scenarios: string[];
  fieldCount: number;
  states: StateCounts;
  reads: string[];
  feeds: string[];
}

export interface EdgeField {
  /* The field that is read. */
  fieldId: string;
  /* The reader's fields that read it in a scenario run. Empty: seen in the code only. */
  readBy: string[];
  inCode: boolean;
}

export interface FormEdge {
  reader: string;
  source: string;
  fields: EdgeField[];
}

export interface FieldNode {
  fieldId: string;
  formId: string;
  label: string;
  state: FieldState;
  scenarios: number;
  reason?: string;
  /* The fields that it read in a scenario run. */
  reads: string[];
  /* The count of fields that read it in a scenario run, directly or through other fields. */
  feeds: number;
  /* The other forms that read it, in a run or in the code. */
  feedsForms: string[];
}

export interface FormGraph {
  scenarios: number;
  forms: FormNode[];
  edges: FormEdge[];
  fields: FieldNode[];
  /* Fields that read themselves through other fields in one scenario run. Each entry is one loop. */
  loops: string[][];
}

const NO_CODE_REASON = "The form has a field list and no code yet.";

export const formIdOf = (fieldId: string): string => fieldId.split(".")[0];

const sorted = (values: Iterable<string>): string[] => [...new Set(values)].sort();

function addTo(map: Map<string, Set<string>>, key: string, value: string): void {
  const values = map.get(key) ?? new Set<string>();
  values.add(value);
  map.set(key, values);
}

interface RunFacts {
  /* field id → the scenarios that give it a value */
  valuedIn: Map<string, Set<string>>;
  /* field id → the fields it read */
  reads: Map<string, Set<string>>;
  /* field id → the fields that read it */
  readers: Map<string, Set<string>>;
  reasons: Map<string, string>;
  withAnswerKey: Set<string>;
}

function collectRunFacts(runs: ScenarioRun[]): RunFacts {
  const facts: RunFacts = {
    valuedIn: new Map(),
    reads: new Map(),
    readers: new Map(),
    reasons: new Map(),
    withAnswerKey: new Set(runs.filter((run) => run.hasAnswerKey).map((run) => run.name)),
  };
  for (const run of runs) {
    for (const field of run.fields) {
      if (field.hasValue) addTo(facts.valuedIn, field.fieldId, run.name);
      if (field.unsupportedReason) facts.reasons.set(field.fieldId, field.unsupportedReason);
      for (const read of field.reads) {
        if (read === field.fieldId) continue;
        addTo(facts.reads, field.fieldId, read);
        addTo(facts.readers, read, field.fieldId);
      }
    }
  }
  return facts;
}

function stateOf(kind: FormInput["fields"][number]["kind"], scenarios: string[], facts: RunFacts) {
  if (kind !== "binding") return "unsupported" as const;
  if (scenarios.length === 0) return "not_run" as const;
  return scenarios.some((name) => facts.withAnswerKey.has(name))
    ? ("verified" as const)
    : ("locked" as const);
}

/* Every field that reads the start field, directly or through other fields. */
function downstreamOf(start: string, readers: Map<string, Set<string>>): Set<string> {
  const seen = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.pop() as string;
    for (const reader of readers.get(current) ?? []) {
      if (reader === start || seen.has(reader)) continue;
      seen.add(reader);
      queue.push(reader);
    }
  }
  return seen;
}

function buildEdges(facts: RunFacts, codeReads: CodeRead[]): FormEdge[] {
  /* "reader|source" → read field id → the reader's fields */
  const pairs = new Map<string, Map<string, Set<string>>>();
  const inCode = new Set<string>();
  const fieldsOf = (reader: string, source: string): Map<string, Set<string>> => {
    const key = `${reader}|${source}`;
    const fields = pairs.get(key) ?? new Map<string, Set<string>>();
    pairs.set(key, fields);
    return fields;
  };
  for (const [readerField, reads] of facts.reads) {
    for (const read of reads) {
      const [reader, source] = [formIdOf(readerField), formIdOf(read)];
      if (reader !== source) addTo(fieldsOf(reader, source), read, readerField);
    }
  }
  for (const { readerFormId, fieldId } of codeReads) {
    const source = formIdOf(fieldId);
    if (readerFormId === source) continue;
    const fields = fieldsOf(readerFormId, source);
    if (!fields.has(fieldId)) fields.set(fieldId, new Set());
    inCode.add(`${readerFormId}|${fieldId}`);
  }
  return sorted(pairs.keys()).map((key) => {
    const [reader, source] = key.split("|");
    const fields = pairs.get(key) as Map<string, Set<string>>;
    return {
      reader,
      source,
      fields: sorted(fields.keys()).map((fieldId) => ({
        fieldId,
        readBy: sorted(fields.get(fieldId) ?? []),
        inCode: inCode.has(`${reader}|${fieldId}`),
      })),
    };
  });
}

function buildFields(forms: FormInput[], facts: RunFacts, edges: FormEdge[]): FieldNode[] {
  const feedsForms = new Map<string, Set<string>>();
  for (const edge of edges) {
    for (const field of edge.fields) addTo(feedsForms, field.fieldId, edge.reader);
  }
  return forms.flatMap((form) =>
    form.fields.map((field) => {
      const scenarios = sorted(facts.valuedIn.get(field.fieldId) ?? []);
      const state = stateOf(field.kind, scenarios, facts);
      const reason = field.kind === undefined ? NO_CODE_REASON : facts.reasons.get(field.fieldId);
      return {
        fieldId: field.fieldId,
        formId: form.formId,
        label: field.label,
        state,
        scenarios: scenarios.length,
        ...(state === "unsupported" && reason ? { reason } : {}),
        reads: sorted(facts.reads.get(field.fieldId) ?? []),
        feeds: downstreamOf(field.fieldId, facts.readers).size,
        feedsForms: sorted(feedsForms.get(field.fieldId) ?? []),
      };
    }),
  );
}

function countStates(fields: FieldNode[]): StateCounts {
  const counts: StateCounts = { verified: 0, locked: 0, not_run: 0, unsupported: 0 };
  for (const field of fields) counts[field.state] += 1;
  return counts;
}

function buildForms(input: GraphInput, fields: FieldNode[], edges: FormEdge[]): FormNode[] {
  return input.forms.map((form) => {
    const own = fields.filter((field) => field.formId === form.formId);
    return {
      formId: form.formId,
      displayName: form.displayName,
      jurisdiction: form.jurisdiction,
      scenarios: input.runs
        .filter((run) => run.formIds.includes(form.formId))
        .map((run) => run.name)
        .sort(),
      fieldCount: own.length,
      states: countStates(own),
      reads: edges.filter((edge) => edge.reader === form.formId).map((edge) => edge.source),
      feeds: edges.filter((edge) => edge.source === form.formId).map((edge) => edge.reader),
    };
  });
}

/* A field in a loop reads itself through its own readers. Each loop is listed once. */
function findLoops(facts: RunFacts): string[][] {
  const loops = new Map<string, string[]>();
  for (const fieldId of facts.readers.keys()) {
    const downstream = downstreamOf(fieldId, facts.readers);
    const members = [...(facts.reads.get(fieldId) ?? [])].filter((read) => downstream.has(read));
    if (members.length === 0) continue;
    const loop = sorted(
      [...downstream].filter((other) => downstreamOf(other, facts.readers).has(fieldId)),
    );
    const all = sorted([fieldId, ...loop]);
    loops.set(all.join("|"), all);
  }
  return sorted(loops.keys()).map((key) => loops.get(key) as string[]);
}

/* One run at a time: two scenarios that take different paths do not make a loop together. */
function loopsOf(runs: ScenarioRun[]): string[][] {
  const loops = new Map<string, string[]>();
  for (const run of runs) {
    for (const loop of findLoops(collectRunFacts([run]))) loops.set(loop.join("|"), loop);
  }
  return sorted(loops.keys()).map((key) => loops.get(key) as string[]);
}

export function buildFormGraph(input: GraphInput): FormGraph {
  const facts = collectRunFacts(input.runs);
  const edges = buildEdges(facts, input.codeReads);
  const fields = buildFields(input.forms, facts, edges);
  return {
    scenarios: input.runs.length,
    forms: buildForms(input, fields, edges),
    edges,
    fields,
    loops: loopsOf(input.runs),
  };
}

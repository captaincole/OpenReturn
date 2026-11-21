import {
  STATE_LABELS,
  graphHref,
  shortFieldId,
  type FieldNode,
  type FormGraph,
  type FormNode,
  type MissingFormNode,
} from "@/lib/formGraph";
import Link from "next/link";
import { Section } from "../../../components/Section";
import { StateBar, StateCountsLine, StateDot } from "./StateBar";

/* The engine's forms and the forms it lacks, by id. */
function formNames(graph: FormGraph): Map<string, string> {
  return new Map([...graph.forms, ...graph.missing].map((form) => [form.formId, form.displayName]));
}

interface FormChip {
  formId: string;
  /* The count of fields behind the link. */
  fields: number;
}

function FormChips(props: {
  graph: FormGraph;
  title: string;
  chips: FormChip[];
  dashed?: boolean;
  tier1: boolean;
}) {
  const names = formNames(props.graph);
  return (
    <div>
      <h3 className="text-[12px] text-ink-muted">{props.title}</h3>
      {props.chips.length === 0 ? (
        <p className="mt-1.5 text-[13px] text-ink-secondary">None</p>
      ) : (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {props.chips.map((chip) => (
            <li key={chip.formId}>
              <Link
                href={graphHref({ form: chip.formId, tier1: props.tier1 })}
                scroll={false}
                className={`inline-flex items-baseline gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] text-ink-primary transition-colors hover:border-border-strong ${
                  props.dashed ? "border-dashed border-border" : "border-border-subtle"
                }`}
              >
                {names.get(chip.formId) ?? chip.formId}
                <span className="text-[11px] text-ink-muted tabular-nums">{chip.fields}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FieldRows(props: {
  fields: FieldNode[];
  withReason: boolean;
  /* Given when the rows are of more than one form: each row names its form. */
  formNames?: Map<string, string>;
  tier1: boolean;
}) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead className="text-[11px] text-ink-muted">
          <tr className="border-b border-border-subtle">
            <th className="px-4 py-2.5 font-medium">Field</th>
            <th className="px-4 py-2.5 font-medium">State</th>
            <th className="px-4 py-2.5 text-right font-medium">Feeds</th>
            {props.withReason && <th className="px-4 py-2.5 font-medium">Why it is blank</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {props.fields.map((field) => (
            <tr key={field.fieldId} className="align-top">
              <td className="px-4 py-2.5">
                <div className="text-ink-primary">{field.label}</div>
                <div className="mt-0.5 text-[11px] text-ink-muted">
                  {props.formNames && (
                    <Link
                      href={graphHref({ form: field.formId, tier1: props.tier1 })}
                      scroll={false}
                      className="hover:underline"
                    >
                      {props.formNames.get(field.formId)}
                    </Link>
                  )}
                  {props.formNames && " · "}
                  <span className="font-mono">{shortFieldId(field)}</span>
                </div>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-ink-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <StateDot state={field.state} />
                  {STATE_LABELS[field.state]}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right text-ink-primary tabular-nums">
                {field.feeds}
              </td>
              {props.withReason && (
                <td className="max-w-xs px-4 py-2.5 text-ink-secondary">{field.reason ?? ""}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const byFeeds = (left: FieldNode, right: FieldNode): number => right.feeds - left.feeds;

/* The forms the engine lacks that this form's blank fields name. */
function waitsFor(graph: FormGraph, formId: string): FormChip[] {
  return graph.missing.flatMap((missing) =>
    missing.waiting
      .filter((group) => group.formId === formId)
      .map((group) => ({ formId: missing.formId, fields: group.fieldIds.length })),
  );
}

/* The mark on a form that our target user needs. */
function Tier1Mark() {
  return (
    <span className="rounded-md border border-border-subtle px-1.5 py-0.5 text-[11px] text-ink-secondary">
      Tier 1
    </span>
  );
}

export function FormDetail(props: { graph: FormGraph; form: FormNode; tier1: boolean }) {
  const { graph, form, tier1 } = props;
  const fields = graph.fields.filter((field) => field.formId === form.formId);
  const open = fields.filter((field) => field.state !== "verified").sort(byFeeds);
  const verified = fields.filter((field) => field.state === "verified").sort(byFeeds);
  const scenarios = form.scenarios.length;
  const reads = graph.edges
    .filter((edge) => edge.reader === form.formId)
    .map((edge) => ({ formId: edge.source, fields: edge.fields.length }));
  const feeds = graph.edges
    .filter((edge) => edge.source === form.formId)
    .map((edge) => ({ formId: edge.reader, fields: edge.fields.length }));

  return (
    <div id="form-detail" className="scroll-mt-6 space-y-8">
      <div className="card space-y-5 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2.5 font-serif text-2xl text-ink-primary">
            {form.displayName}
            {form.tier1 && <Tier1Mark />}
          </h2>
          <span className="text-[12px] text-ink-muted">
            {form.jurisdiction} · {form.fieldCount} fields · {scenarios}{" "}
            {scenarios === 1 ? "scenario" : "scenarios"}
          </span>
        </div>
        <div className="space-y-2.5">
          <StateBar states={form.states} />
          <StateCountsLine states={form.states} />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <FormChips graph={graph} title="Reads (fields read)" chips={reads} tier1={tier1} />
          <FormChips graph={graph} title="Feeds (fields read)" chips={feeds} tier1={tier1} />
          <FormChips
            graph={graph}
            title="Waits for (blank fields)"
            chips={waitsFor(graph, form.formId)}
            dashed
            tier1={tier1}
          />
        </div>
      </div>

      <Section
        title="Fields not verified"
        right={
          <span className="text-[12px] text-ink-muted">
            {open.length} fields, the most fed first
          </span>
        }
      >
        {open.length === 0 ? (
          <p className="text-[14px] text-ink-secondary">Every field of this form is verified.</p>
        ) : (
          <FieldRows fields={open} withReason tier1={tier1} />
        )}
      </Section>

      {verified.length > 0 && (
        <details>
          <summary className="cursor-pointer text-[13px] text-ink-secondary hover:text-ink-primary">
            Show the {verified.length} verified fields
          </summary>
          <div className="mt-4">
            <FieldRows fields={verified} withReason={false} tier1={tier1} />
          </div>
        </details>
      )}
    </div>
  );
}

export function MissingFormDetail(props: {
  graph: FormGraph;
  form: MissingFormNode;
  tier1: boolean;
}) {
  const { graph, form, tier1 } = props;
  const waiting = graph.fields
    .filter((field) => field.needsForms?.includes(form.formId))
    .sort(byFeeds);

  return (
    <div id="form-detail" className="scroll-mt-6 space-y-8">
      <div className="card space-y-4 border-dashed p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2.5 font-serif text-2xl text-ink-primary">
            {form.displayName}
            {form.tier1 && <Tier1Mark />}
          </h2>
          <span className="text-[12px] text-ink-muted">
            {form.jurisdiction} · the engine lacks this form
          </span>
        </div>
        <p className="text-[14px] text-ink-secondary">{form.about}</p>
        <p className="text-[13px] text-ink-secondary">
          <span className="text-ink-primary tabular-nums">{form.waitingCount}</span> blank{" "}
          {form.waitingCount === 1 ? "field names" : "fields name"} this form. They feed{" "}
          <span className="text-ink-primary tabular-nums">{form.feeds}</span> other fields.
        </p>
        <FormChips
          graph={graph}
          title="Forms that wait (blank fields)"
          chips={form.waiting.map((group) => ({
            formId: group.formId,
            fields: group.fieldIds.length,
          }))}
          tier1={tier1}
        />
      </div>

      <Section
        title="Fields that wait for it"
        right={<span className="text-[12px] text-ink-muted">the most fed first</span>}
      >
        <FieldRows fields={waiting} withReason formNames={formNames(graph)} tier1={tier1} />
      </Section>
    </div>
  );
}

/* With the tier 1 filter on, the table has only the tier 1 forms. */
export function MissingFormsTable({ graph, tier1 }: { graph: FormGraph; tier1: boolean }) {
  const names = formNames(graph);
  const missing = graph.missing.filter((form) => !tier1 || form.tier1);
  return (
    <Section
      title="Forms the engine lacks"
      right={
        <span className="text-[12px] text-ink-muted">
          {missing.length} {tier1 ? "tier 1 forms" : "forms"}, by the fields they would open
        </span>
      }
    >
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="text-[11px] text-ink-muted">
            <tr className="border-b border-border-subtle">
              <th className="px-4 py-2.5 font-medium">Form</th>
              <th className="px-4 py-2.5 text-right font-medium">Fields that wait</th>
              <th className="px-4 py-2.5 text-right font-medium">Fields they feed</th>
              <th className="px-4 py-2.5 font-medium">Forms that wait</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {missing.map((form) => (
              <tr key={form.formId} className="align-top">
                <td className="px-4 py-2.5">
                  <Link
                    href={`${graphHref({ form: form.formId, tier1 })}#form-detail`}
                    className="text-ink-primary hover:text-accent"
                  >
                    {form.displayName}
                  </Link>
                  <div className="mt-0.5 text-[12px] text-ink-muted">{form.about}</div>
                </td>
                <td className="px-4 py-2.5 text-right text-ink-primary tabular-nums">
                  {form.waitingCount}
                </td>
                <td className="px-4 py-2.5 text-right text-ink-primary tabular-nums">
                  {form.feeds}
                </td>
                <td className="px-4 py-2.5 text-ink-secondary">
                  {form.waiting.map((group) => names.get(group.formId)).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

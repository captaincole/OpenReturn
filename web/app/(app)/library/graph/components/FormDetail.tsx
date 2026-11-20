import {
  STATE_LABELS,
  shortFieldId,
  type FieldNode,
  type FormEdge,
  type FormGraph,
  type FormNode,
} from "@/lib/formGraph";
import Link from "next/link";
import { Section } from "../../../components/Section";
import { StateBar, StateCountsLine, StateDot } from "./StateBar";

const formHref = (formId: string): string => `/library/graph?form=${encodeURIComponent(formId)}`;

function FormLinks(props: {
  graph: FormGraph;
  title: string;
  edges: FormEdge[];
  other: (edge: FormEdge) => string;
}) {
  const nameOf = (formId: string): string =>
    props.graph.forms.find((form) => form.formId === formId)?.displayName ?? formId;
  return (
    <div>
      <h3 className="text-[12px] text-ink-muted">{props.title}</h3>
      {props.edges.length === 0 ? (
        <p className="mt-1.5 text-[13px] text-ink-secondary">None</p>
      ) : (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {props.edges.map((edge) => (
            <li key={props.other(edge)}>
              <Link
                href={formHref(props.other(edge))}
                scroll={false}
                className="inline-flex items-baseline gap-1.5 rounded-lg border border-border-subtle px-2.5 py-1 text-[13px] text-ink-primary transition-colors hover:border-border-strong"
              >
                {nameOf(props.other(edge))}
                <span className="text-[11px] text-ink-muted tabular-nums">
                  {edge.fields.length}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FieldRows({ fields, withReason }: { fields: FieldNode[]; withReason: boolean }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead className="text-[11px] text-ink-muted">
          <tr className="border-b border-border-subtle">
            <th className="px-4 py-2.5 font-medium">Field</th>
            <th className="px-4 py-2.5 font-medium">State</th>
            <th className="px-4 py-2.5 text-right font-medium">Feeds</th>
            {withReason && <th className="px-4 py-2.5 font-medium">Why it is blank</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {fields.map((field) => (
            <tr key={field.fieldId} className="align-top">
              <td className="px-4 py-2.5">
                <div className="text-ink-primary">{field.label}</div>
                <div className="mt-0.5 font-mono text-[11px] text-ink-muted">
                  {shortFieldId(field)}
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
              {withReason && (
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

export function FormDetail({ graph, form }: { graph: FormGraph; form: FormNode }) {
  const fields = graph.fields.filter((field) => field.formId === form.formId);
  const open = fields.filter((field) => field.state !== "verified").sort(byFeeds);
  const verified = fields.filter((field) => field.state === "verified").sort(byFeeds);
  const scenarios = form.scenarios.length;

  return (
    <div className="space-y-8">
      <div className="card space-y-5 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl text-ink-primary">{form.displayName}</h2>
          <span className="text-[12px] text-ink-muted">
            {form.jurisdiction} · {form.fieldCount} fields · {scenarios}{" "}
            {scenarios === 1 ? "scenario" : "scenarios"}
          </span>
        </div>
        <div className="space-y-2.5">
          <StateBar states={form.states} />
          <StateCountsLine states={form.states} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormLinks
            graph={graph}
            title="Reads (fields read)"
            edges={graph.edges.filter((edge) => edge.reader === form.formId)}
            other={(edge) => edge.source}
          />
          <FormLinks
            graph={graph}
            title="Feeds (fields read)"
            edges={graph.edges.filter((edge) => edge.source === form.formId)}
            other={(edge) => edge.reader}
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
          <FieldRows fields={open} withReason />
        )}
      </Section>

      {verified.length > 0 && (
        <details>
          <summary className="cursor-pointer text-[13px] text-ink-secondary hover:text-ink-primary">
            Show the {verified.length} verified fields
          </summary>
          <div className="mt-4">
            <FieldRows fields={verified} withReason={false} />
          </div>
        </details>
      )}
    </div>
  );
}

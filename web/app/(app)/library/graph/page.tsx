import graphData from "@/data/form-graph.json";
import { cn } from "@/lib/cn";
import {
  FIELD_STATES,
  STATE_LABELS,
  STATE_MEANINGS,
  addStates,
  jurisdictionId,
  splitByJurisdiction,
  type FormGraph,
  type JurisdictionGraph,
  type MissingFormNode,
} from "@/lib/formGraph";
import { deriveProfile } from "@/lib/profile";
import { getUserSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HomeTopBar } from "../../HomeTopBar";
import { LibraryTabs } from "../components/LibraryTabs";
import { FormDetail, MissingFormDetail, MissingFormsTable } from "./components/FormDetail";
import { FormGraphView, Legend } from "./components/FormGraphView";
import { StateBar, StateDot } from "./components/StateBar";

/* `npm run form-graph` writes the file; lib/formGraph.ts mirrors its shape. */
const graph = graphData as unknown as FormGraph;

/* Each graph draws the most waited-for of the forms the engine lacks; the table lists all. */
const MISSING_IN_GRAPH = 10;

/* A selected form the engine lacks is always drawn, in place of the last of the ten. */
function drawnMissing(part: JurisdictionGraph, selected: string | undefined): MissingFormNode[] {
  const top = part.missing.slice(0, MISSING_IN_GRAPH);
  const chosen = part.missing.find((form) => form.formId === selected);
  return chosen && !top.includes(chosen) ? [...top.slice(0, MISSING_IN_GRAPH - 1), chosen] : top;
}

const viewHref = (jurisdiction: string): string =>
  `/library/graph?view=${jurisdictionId(jurisdiction)}`;

/* The switch between the graphs: federal, or a state. */
function JurisdictionToggle({ parts, shown }: { parts: JurisdictionGraph[]; shown: string }) {
  return (
    <nav
      aria-label="The forms to draw"
      className="inline-flex rounded-lg border border-border-subtle p-0.5"
    >
      {parts.map((part) => (
        <Link
          key={part.jurisdiction}
          href={viewHref(part.jurisdiction)}
          scroll={false}
          aria-current={part.jurisdiction === shown ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1 text-[13px] transition-colors",
            part.jurisdiction === shown
              ? "bg-bg-panel text-ink-primary"
              : "text-ink-secondary hover:text-ink-primary",
          )}
        >
          {part.jurisdiction}
        </Link>
      ))}
    </nav>
  );
}

/*
 * The graph to draw: the one that has the selected form, then the one that the
 * address names, then the federal one.
 */
function shownPart(
  parts: JurisdictionGraph[],
  selectedJurisdiction: string | undefined,
  view: string | undefined,
): JurisdictionGraph {
  return (
    parts.find((part) => part.jurisdiction === selectedJurisdiction) ??
    parts.find((part) => jurisdictionId(part.jurisdiction) === view) ??
    parts[0]
  );
}

/* One jurisdiction's forms, with the switch to the other graphs. */
function JurisdictionSection(props: {
  parts: JurisdictionGraph[];
  part: JurisdictionGraph;
  selected?: string;
}) {
  const { part, selected } = props;
  const missing = drawnMissing(part, selected);
  const lacks =
    part.missing.length > 0 ? ` · ${missing.length} of ${part.missing.length} missing drawn` : "";
  return (
    <div id="form-graph" className="scroll-mt-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <JurisdictionToggle parts={props.parts} shown={part.jurisdiction} />
        <span className="text-[12px] text-ink-muted">
          {part.forms.length} forms{lacks}
        </span>
      </div>
      <div>
        <FormGraphView
          forms={part.forms.map((form) => ({
            formId: form.formId,
            displayName: form.displayName,
            fieldCount: form.fieldCount,
            states: form.states,
            reads: form.reads.length,
            feeds: form.feeds.length,
          }))}
          links={part.links}
          missing={missing.map((form) => ({
            formId: form.formId,
            displayName: form.displayName,
            about: form.about,
            waitingCount: form.waitingCount,
            feeds: form.feeds,
            waitingForms: form.waiting.map((group) => group.formId),
          }))}
          outside={
            part.outside && {
              ...part.outside,
              href: viewHref(part.outside.jurisdiction),
            }
          }
          selected={selected}
        />
      </div>
    </div>
  );
}

function Totals() {
  const totals = graph.forms.map((form) => form.states).reduce(addStates);
  return (
    <div className="card space-y-4 p-5">
      <StateBar states={totals} />
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FIELD_STATES.map((state) => (
          <div key={state}>
            <dt className="flex items-center gap-1.5 text-[12px] text-ink-secondary">
              <StateDot state={state} />
              {STATE_LABELS[state]}
            </dt>
            <dd className="mt-1 font-serif text-3xl text-ink-primary">
              {totals[state].toLocaleString()}
            </dd>
            <dd className="mt-1 text-[12px] text-ink-muted">{STATE_MEANINGS[state]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function FormGraphPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string | string[]; view?: string | string[] }>;
}) {
  const session = await getUserSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);
  const { form: formParam, view } = await searchParams;
  const selected = graph.forms.find((form) => form.formId === formParam);
  const selectedMissing = graph.missing.find((form) => form.formId === formParam);
  const parts = splitByJurisdiction(graph);
  const part = shownPart(
    parts,
    (selected ?? selectedMissing)?.jurisdiction,
    typeof view === "string" ? view : undefined,
  );
  const selectedId = selected?.formId ?? selectedMissing?.formId;

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} title="Reference Library" />
      <main className="flex-1 px-6 py-10 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-[1400px] space-y-10">
          <header className="space-y-6">
            <div>
              <h1 className="font-serif text-4xl text-ink-primary">Reference Library</h1>
              <p className="mt-2.5 max-w-2xl text-[15px] text-ink-secondary">
                Which form reads which form, and how many fields of each form a test return has
                checked. The engine has {graph.forms.length} forms, and its blank fields name{" "}
                {graph.missing.length} forms that it lacks. {graph.scenarios} test returns ran.
              </p>
            </div>
            <LibraryTabs active="graph" />
          </header>
          <Totals />
          <Legend />
          <JurisdictionSection parts={parts} part={part} selected={selectedId} />
          {selected && <FormDetail graph={graph} form={selected} />}
          {selectedMissing && <MissingFormDetail graph={graph} form={selectedMissing} />}
          <MissingFormsTable graph={graph} />
        </div>
      </main>
    </div>
  );
}

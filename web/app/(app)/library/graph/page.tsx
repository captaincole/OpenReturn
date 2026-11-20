import graphData from "@/data/form-graph.json";
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
import { redirect } from "next/navigation";
import { HomeTopBar } from "../../HomeTopBar";
import { Section } from "../../components/Section";
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

/* One jurisdiction's forms: federal, or a state. */
function JurisdictionSection({ part, selected }: { part: JurisdictionGraph; selected?: string }) {
  const missing = drawnMissing(part, selected);
  const lacks =
    part.missing.length > 0 ? ` · ${missing.length} of ${part.missing.length} missing drawn` : "";
  return (
    <div id={jurisdictionId(part.jurisdiction)} className="scroll-mt-6">
      <Section
        title={part.jurisdiction}
        right={
          <span className="text-[12px] text-ink-muted">
            {part.forms.length} forms{lacks}
          </span>
        }
      >
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
              href: `/library/graph#${jurisdictionId(part.outside.jurisdiction)}`,
            }
          }
          selected={selected}
        />
      </Section>
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
  searchParams: Promise<{ form?: string | string[] }>;
}) {
  const session = await getUserSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);
  const { form: formParam } = await searchParams;
  const selected = graph.forms.find((form) => form.formId === formParam);
  const selectedMissing = graph.missing.find((form) => form.formId === formParam);
  const parts = splitByJurisdiction(graph);
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
          {parts.map((part) => (
            <JurisdictionSection key={part.jurisdiction} part={part} selected={selectedId} />
          ))}
          {selected && <FormDetail graph={graph} form={selected} />}
          {selectedMissing && <MissingFormDetail graph={graph} form={selectedMissing} />}
          <MissingFormsTable graph={graph} />
        </div>
      </main>
    </div>
  );
}

import graphData from "@/data/form-graph.json";
import {
  FIELD_STATES,
  STATE_LABELS,
  STATE_MEANINGS,
  addStates,
  type FormGraph,
} from "@/lib/formGraph";
import { deriveProfile } from "@/lib/profile";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { HomeTopBar } from "../../HomeTopBar";
import { LibraryTabs } from "../components/LibraryTabs";
import { FormDetail } from "./components/FormDetail";
import { FormGraphView } from "./components/FormGraphView";
import { StateBar, StateDot } from "./components/StateBar";

/* `npm run form-graph` writes the file; lib/formGraph.ts mirrors its shape. */
const graph = graphData as unknown as FormGraph;

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

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} title="Reference Library" />
      <main className="flex-1 px-6 py-10 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-[1260px] space-y-10">
          <header className="space-y-6">
            <div>
              <h1 className="font-serif text-4xl text-ink-primary">Reference Library</h1>
              <p className="mt-2.5 max-w-2xl text-[15px] text-ink-secondary">
                Which form reads which form, and how many fields of each form a test return has
                checked. The {graph.forms.length} forms are the ones the engine has;{" "}
                {graph.scenarios} test returns ran.
              </p>
            </div>
            <LibraryTabs active="graph" />
          </header>
          <Totals />
          <FormGraphView
            forms={graph.forms.map((form) => ({
              formId: form.formId,
              displayName: form.displayName,
              fieldCount: form.fieldCount,
              states: form.states,
              reads: form.reads.length,
              feeds: form.feeds.length,
            }))}
            links={graph.edges.map((edge) => ({ source: edge.source, reader: edge.reader }))}
            selected={selected?.formId}
          />
          {selected && <FormDetail graph={graph} form={selected} />}
        </div>
      </main>
    </div>
  );
}

"use client";

/*
 * The Deductions tab: the conversation is the chat pane (AppShell picks it from
 * this route), and this page is its summary. On a phone the tab bar switches
 * between the two.
 */

import { useAppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { stepLabel } from "@/lib/deductions";
import {
  ComparisonCard,
  ItemsCard,
  LifeAnswersCard,
  NamedExpensesCard,
  RecordsCard,
} from "./components/SummaryCards";

export default function DeductionsWorkspace() {
  const { state } = useAppShell();
  const view = state?.deductions;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 pt-4 pb-10 lg:px-10 lg:pt-6">
      <header>
        <h1 className="font-serif text-2xl text-ink-primary">Deductions</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {view ? stepLabel(view.next) : "Loading…"}
        </p>
      </header>
      {view && (
        <>
          {view.summary && (
            <section className="card px-5 py-4 text-sm leading-relaxed text-ink-primary">
              <Markdown>{view.summary}</Markdown>
            </section>
          )}
          <ComparisonCard view={view} />
          <ItemsCard items={view.items} />
          <NamedExpensesCard expenses={view.namedExpenses} />
          <RecordsCard records={view.records} />
          <LifeAnswersCard questions={view.lifeQuestions} />
        </>
      )}
    </div>
  );
}

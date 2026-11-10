"use client";

import { useAppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { DEDUCTIONS_SEGMENT } from "@/lib/chatSession";
import { stepLabel } from "@/lib/deductions";
import Link from "next/link";

/*
 * What the deductions conversation sends back to the return page: where it
 * stands, then Cade's one closing paragraph. The conversation itself stays in
 * its own tab.
 */
export function DeductionsCard() {
  const { state, activeReturn, setMobilePane } = useAppShell();
  const view = state?.deductions;
  if (!view) return null;
  const closed = view.next.step === "closed";
  const started = view.lifeQuestions.some((question) => question.status !== "unasked");
  const progress = closed ? "Done" : started ? "In progress" : "Not started";

  return (
    <section className="card">
      <div className="card-header">
        <span>Deductions</span>
        <span className="tracking-normal text-ink-muted normal-case">{progress}</span>
      </div>
      <div className="flex items-end gap-4 px-5 pt-1 pb-5">
        <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink-secondary">
          {view.summary ? <Markdown>{view.summary}</Markdown> : stepLabel(view.next)}
        </div>
        <Link
          href={`/r/${activeReturn.id}/${DEDUCTIONS_SEGMENT}`}
          /* On a phone, the deductions route opens on the conversation, not the summary. */
          onClick={() => setMobilePane("chat")}
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {closed ? "Open Deductions" : started ? "Continue in Deductions" : "Start Deductions"}
        </Link>
      </div>
    </section>
  );
}

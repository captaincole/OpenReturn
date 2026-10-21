"use client";

/*
 * One question and its answer. The answer text carries `[n]` markers;
 * each one links to the numbered reference card below it. The cards show
 * the top few by default; a marker for a hidden card reveals the rest.
 */

import type { AskCitation, AskStage, AskTurn } from "@/lib/ask";
import Link from "next/link";
import { Fragment, useState } from "react";
import { ReferenceCard, refAnchorId } from "./ReferenceCard";

const VISIBLE_REFERENCES = 3;
const HIGHLIGHT_MS = 1500;

const STAGE_LABELS: Record<AskStage, string> = {
  formulating: "Reading your question…",
  retrieving: "Searching IRS and FTB publications…",
  answering: "Writing the answer…",
};

export function TurnView({ turn }: { turn: AskTurn }) {
  return (
    <article className="space-y-6">
      <h1 className="font-serif text-3xl leading-tight text-ink-primary">{turn.question}</h1>
      {turn.status === "running" && <RunningAnswer stage={turn.stage} />}
      {turn.status === "failed" && (
        <div className="card border-red-400/30 px-5 py-4 text-[14px] text-red-300">
          {turn.error ?? "Something went wrong. Ask again."}
        </div>
      )}
      {turn.status === "completed" && <CompletedAnswer turn={turn} />}
    </article>
  );
}

function RunningAnswer({ stage }: { stage: AskStage | null }) {
  return (
    <div className="space-y-3" aria-live="polite">
      <p className="text-[13px] text-ink-muted">{STAGE_LABELS[stage ?? "formulating"]}</p>
      <div className="h-3 w-11/12 animate-pulse rounded bg-bg-elevated" />
      <div className="h-3 w-10/12 animate-pulse rounded bg-bg-elevated" />
      <div className="h-3 w-7/12 animate-pulse rounded bg-bg-elevated" />
    </div>
  );
}

function CompletedAnswer({ turn }: { turn: AskTurn }) {
  const [showAll, setShowAll] = useState(false);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const hiddenCount = Math.max(0, turn.citations.length - VISIBLE_REFERENCES);
  const visible = showAll ? turn.citations : turn.citations.slice(0, VISIBLE_REFERENCES);

  // Reveal the card if it is hidden, then scroll to it after the render.
  function jumpTo(n: number) {
    if (n > VISIBLE_REFERENCES) setShowAll(true);
    setHighlighted(n);
    setTimeout(() => {
      document
        .getElementById(refAnchorId(turn.id, n))
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
    setTimeout(() => setHighlighted((h) => (h === n ? null : h)), HIGHLIGHT_MS);
  }

  return (
    <>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink-secondary">
        {(turn.answer ?? "").split(/\n{2,}/).map((para, i) => (
          <p key={i}>
            <AnswerText text={para} citations={turn.citations} onMarker={jumpTo} />
          </p>
        ))}
      </div>
      <CoverageNote turn={turn} />
      {turn.citations.length > 0 && (
        <section aria-label="References" className="space-y-3">
          <h2 className="text-[11px] tracking-[0.22em] text-ink-muted uppercase">
            References · {turn.citations.length}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((c) => (
              <ReferenceCard
                key={c.n}
                turnId={turn.id}
                citation={c}
                highlighted={highlighted === c.n}
              />
            ))}
          </div>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-[12px] text-ink-secondary hover:text-ink-primary"
            >
              {showAll ? "Show fewer" : `Show ${hiddenCount} more`}
            </button>
          )}
        </section>
      )}
    </>
  );
}

/* Partial or missing coverage: say so, and name the documents that would cover it. */
function CoverageNote({ turn }: { turn: AskTurn }) {
  if (turn.coverage !== "partial" && turn.coverage !== "not_covered") return null;
  const docs = turn.missingDocuments;
  return (
    <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-[13px] text-ink-secondary">
      <span className="font-medium text-amber-300">
        {turn.coverage === "partial" ? "Partly covered." : "Not in our library yet."}
      </span>{" "}
      {docs.length > 0 ? `Documents that would cover this: ${docs.join(", ")}. ` : ""}
      <Link href="/library" className="text-accent hover:text-accent-hover">
        See what we search →
      </Link>
    </div>
  );
}

/* Splits on [n] markers; a marker with a matching citation becomes a button. */
function AnswerText({
  text,
  citations,
  onMarker,
}: {
  text: string;
  citations: AskCitation[];
  onMarker: (n: number) => void;
}) {
  const known = new Set(citations.map((c) => c.n));
  return text.split(/(\[\d+\])/).map((part, i) => {
    const n = Number(/^\[(\d+)\]$/.exec(part)?.[1]);
    if (!known.has(n)) return <Fragment key={i}>{part}</Fragment>;
    return (
      <button
        key={i}
        type="button"
        onClick={() => onMarker(n)}
        aria-label={`Reference ${n}`}
        className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-accent/15 px-1 align-text-top text-[11px] font-medium text-accent hover:bg-accent/25"
      >
        {n}
      </button>
    );
  });
}

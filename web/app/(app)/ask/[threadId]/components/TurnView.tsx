"use client";

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
    // data-turn-status: the e2e run waits on it (e2e/ask.ts).
    <article className="space-y-6" data-turn-status={turn.status}>
      <h1 className="font-serif text-3xl leading-tight text-ink-primary">{turn.question}</h1>
      {turn.status === "running" && <RunningAnswer stage={turn.stage} />}
      {turn.status === "failed" && (
        <div className="card border-danger/30 px-5 py-4 text-[14px] text-danger">
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

  function jumpTo(citationNum: number) {
    if (citationNum > VISIBLE_REFERENCES) setShowAll(true);
    setHighlighted(citationNum);
    setTimeout(() => {
      document
        .getElementById(refAnchorId(turn.id, citationNum))
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
    setTimeout(() => setHighlighted((prev) => (prev === citationNum ? null : prev)), HIGHLIGHT_MS);
  }

  return (
    <>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink-secondary" data-answer>
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
            {visible.map((citation) => (
              <ReferenceCard
                key={citation.n}
                turnId={turn.id}
                citation={citation}
                highlighted={highlighted === citation.n}
              />
            ))}
          </div>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
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

function CoverageNote({ turn }: { turn: AskTurn }) {
  if (turn.coverage !== "partial" && turn.coverage !== "not_covered") return null;
  const docs = turn.missingDocuments;
  return (
    <div className="rounded-xl border border-warn/25 bg-warn/5 px-4 py-3 text-[13px] text-ink-secondary">
      <span className="font-medium text-warn">
        {turn.coverage === "partial" ? "Partly covered." : "Not in our library yet."}
      </span>{" "}
      {docs.length > 0 ? `Documents that would cover this: ${docs.join(", ")}. ` : ""}
      <Link href="/library" className="text-accent hover:text-accent-hover">
        See what we search →
      </Link>
    </div>
  );
}

function AnswerText({
  text,
  citations,
  onMarker,
}: {
  text: string;
  citations: AskCitation[];
  onMarker: (n: number) => void;
}) {
  const known = new Set(citations.map((citation) => citation.n));
  return text.split(/(\[\d+\])/).map((part, i) => {
    const citationNum = Number(/^\[(\d+)\]$/.exec(part)?.[1]);
    if (!known.has(citationNum)) return <Fragment key={i}>{part}</Fragment>;
    return (
      <button
        key={i}
        type="button"
        onClick={() => onMarker(citationNum)}
        aria-label={`Reference ${citationNum}`}
        className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-accent/15 px-1 align-text-top text-[11px] font-medium text-accent hover:bg-accent/25"
      >
        {citationNum}
      </button>
    );
  });
}

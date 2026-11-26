"use client";

import { citationUrl, type AskCitation, type AskConflict, type ConflictSide } from "@/lib/ask";
import { citedPassage, sideLabel, statuteHref } from "@/lib/statuteCitations";

/*
 * Texts the answer found in disagreement, each quoted with its link. The
 * page names no winner: a person decides which text to follow.
 */
export function ConflictNote({
  conflicts,
  citations,
}: {
  conflicts: AskConflict[];
  citations: AskCitation[];
}) {
  if (conflicts.length === 0) return null;
  return (
    <section
      aria-label="Texts that disagree"
      className="space-y-3 rounded-xl border border-warn/25 bg-warn/5 px-4 py-3 text-[13px] text-ink-secondary"
    >
      {conflicts.map((conflict, i) => (
        <div key={i} className="space-y-2">
          <p>
            <span className="font-medium text-warn">These two texts disagree.</span> {conflict.note}
          </p>
          <Side side={conflict.a} citations={citations} />
          <Side side={conflict.b} citations={citations} />
        </div>
      ))}
    </section>
  );
}

function Side({ side, citations }: { side: ConflictSide; citations: AskCitation[] }) {
  const cited = citedPassage(side, citations);
  const href = statuteHref(side.blockId) ?? (cited ? citationUrl(cited) : null);
  const label = sideLabel(side, citations);
  return (
    <blockquote className="border-l-2 border-border-strong pl-2.5 leading-relaxed">
      “{side.quote}”
      <div className="mt-1 text-[11px]">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover"
          >
            {label} ↗
          </a>
        ) : (
          <span className="text-ink-muted">{label}</span>
        )}
      </div>
    </blockquote>
  );
}

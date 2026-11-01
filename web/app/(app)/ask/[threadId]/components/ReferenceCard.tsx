"use client";

import { citationUrl, type AskCitation } from "@/lib/ask";
import { cn } from "@/lib/cn";
import { useState } from "react";

export function refAnchorId(turnId: string, citationNum: number): string {
  return `ref-${turnId}-${citationNum}`;
}

export function ReferenceCard({
  turnId,
  citation,
  highlighted,
}: {
  turnId: string;
  citation: AskCitation;
  highlighted: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const section =
    citation.sectionHeading && citation.sectionHeading !== "(Preamble)"
      ? citation.sectionHeading
      : null;
  const html = citation.format === "html";
  const where = [section && `§ ${section}`, !html && `p. ${citation.pageNum}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      id={refAnchorId(turnId, citation.n)}
      className={cn(
        "card flex scroll-mt-20 flex-col px-4 py-3 transition-colors",
        highlighted && "border-accent/60",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-5 min-w-5 items-center justify-center rounded bg-accent/15 px-1 text-[11px] font-medium text-accent">
          {citation.n}
        </span>
        <div className="min-w-0 flex-1">
          <div
            title={citation.documentTitle}
            className="line-clamp-2 text-[13px] leading-snug font-medium text-ink-primary"
          >
            {citation.documentTitle}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-ink-muted">{where}</div>
        </div>
      </div>
      <blockquote
        onClick={() => setExpanded((prev) => !prev)}
        title={expanded ? "Show less" : "Show more"}
        className={cn(
          "mt-2.5 cursor-pointer border-l-2 border-border-strong pl-2.5 text-[12px] leading-relaxed text-ink-secondary",
          !expanded && "line-clamp-3",
        )}
      >
        {citation.quote.trim()}
      </blockquote>
      <a
        href={citationUrl(citation)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 self-start text-[11px] text-accent hover:text-accent-hover"
      >
        {html ? "Read this section ↗" : `Open PDF, p. ${citation.pageNum} ↗`}
      </a>
    </div>
  );
}

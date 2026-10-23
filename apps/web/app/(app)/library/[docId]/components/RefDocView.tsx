"use client";

/*
 * Renders a stored HTML reference document. The HTML is the corpus
 * cleaner's output (apps/agent/src/refdocs/html/cleanFtb.ts): allowlisted
 * semantic tags only, no scripts, styles or event attributes, so it is
 * rendered as-is and styled by `.ref-doc` in globals.css (theme tokens).
 * The page loads after navigation, so the browser cannot jump to a
 * #section on its own, and `:target` is not reliable for headings that
 * arrive late: once the document is in, we scroll to the section and
 * mark it with data-cited (re-marked when the hash changes).
 */

import { fetchLibraryDocument, type LibraryHtmlDocument, type LibrarySection } from "@/lib/ask";
import { cn } from "@/lib/cn";
import { formatPublished } from "@/lib/format";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* With fewer top-level sections than this, the contents also list the second level. */
const SHALLOW_DOC = 6;

export function RefDocView({ docId }: { docId: string }) {
  const [doc, setDoc] = useState<LibraryHtmlDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLibraryDocument(docId)
      .then(setDoc)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, [docId]);

  useEffect(() => {
    if (!doc) return;
    const mark = (scroll: boolean) => {
      document.querySelectorAll("[data-cited]").forEach((el) => el.removeAttribute("data-cited"));
      const anchor = decodeURIComponent(window.location.hash.slice(1));
      const el = anchor ? document.getElementById(anchor) : null;
      el?.setAttribute("data-cited", "");
      if (scroll) el?.scrollIntoView();
    };
    const onHashChange = () => mark(false);
    mark(true);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [doc]);

  if (error) return <p className="mx-auto max-w-3xl text-[14px] text-danger">{error}</p>;
  if (!doc) return <p className="mx-auto max-w-3xl text-[14px] text-ink-muted">Loading…</p>;

  return (
    <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
      <Contents sections={doc.sections} />
      <div className="min-w-0">
        <DocHeader doc={doc} />
        <article className="ref-doc" dangerouslySetInnerHTML={{ __html: doc.html }} />
      </div>
    </div>
  );
}

function DocHeader({ doc }: { doc: LibraryHtmlDocument }) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-muted">
      <Link href="/library" className="hover:text-ink-primary">
        ← Reference Library
      </Link>
      <span>
        {doc.publisher}
        {doc.taxYear ? ` · Tax year ${doc.taxYear}` : ""}
        {doc.published ? ` · Published ${formatPublished(doc.published)}` : ""}
      </span>
      {doc.sourceUrl && (
        <a
          href={doc.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-hover"
        >
          View on {new URL(doc.sourceUrl).hostname.replace(/^www\./, "")} ↗
        </a>
      )}
    </div>
  );
}

function contentsEntries(sections: LibrarySection[]): { s: LibrarySection; nested: boolean }[] {
  const top = sections.filter((s) => s.parent === null);
  const topIds = new Set(top.map((s) => s.anchor));
  return sections
    .filter((s) => s.parent === null || (top.length < SHALLOW_DOC && topIds.has(s.parent)))
    .map((s) => ({ s, nested: s.parent !== null }));
}

/* The section whose heading is the last one scrolled past. */
function useActiveAnchor(anchors: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const onScroll = () => {
      const passed = anchors.filter(
        (a) => (document.getElementById(a)?.getBoundingClientRect().top ?? Infinity) < 120,
      );
      setActive(passed.at(-1) ?? null);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [anchors]);
  return active;
}

function Contents({ sections }: { sections: LibrarySection[] }) {
  const entries = useMemo(() => contentsEntries(sections), [sections]);
  const anchors = useMemo(() => entries.map((e) => e.s.anchor), [entries]);
  const active = useActiveAnchor(anchors);
  if (entries.length === 0) return <div className="hidden lg:block" />;

  return (
    <nav
      aria-label="Contents"
      className="sticky top-20 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto lg:block"
    >
      <p className="mb-3 text-[11px] tracking-[0.2em] text-ink-muted uppercase">Contents</p>
      <ul className="border-l border-border-subtle text-[13px]">
        {entries.map(({ s, nested }) => (
          <li key={s.anchor}>
            <a
              href={`#${s.anchor}`}
              className={cn(
                "-ml-px block border-l-2 border-transparent py-1 leading-snug text-ink-secondary hover:text-ink-primary",
                nested ? "pl-6 text-[12px]" : "pl-3",
                active === s.anchor && "border-accent text-ink-primary",
              )}
            >
              {s.heading}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

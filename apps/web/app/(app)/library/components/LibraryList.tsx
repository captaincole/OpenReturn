"use client";

import { fetchLibrary, refDocPageUrl, refDocPdfUrl, type LibraryDocument } from "@/lib/ask";
import { formatPublished } from "@/lib/format";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Section } from "../../components/Section";

const PUBLISHER_LABELS: Record<string, string> = {
  IRS: "Federal — IRS",
  FTB: "California — Franchise Tax Board",
};

function groupByPublisher(docs: LibraryDocument[]): [string, LibraryDocument[]][] {
  const groups = new Map<string, LibraryDocument[]>();
  for (const d of docs) groups.set(d.publisher, [...(groups.get(d.publisher) ?? []), d]);
  return [...groups.entries()];
}

export function LibraryList() {
  const [docs, setDocs] = useState<LibraryDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLibrary()
      .then(setDocs)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (error) return <p className="text-[14px] text-danger">{error}</p>;
  if (!docs) return <p className="text-[14px] text-ink-muted">Loading…</p>;
  if (docs.length === 0) {
    return (
      <p className="text-[14px] text-ink-secondary">
        The library is empty. Run <code>npm run corpus -- sync</code> to build it.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {groupByPublisher(docs).map(([publisher, group]) => (
        <Section
          key={publisher}
          title={PUBLISHER_LABELS[publisher] ?? publisher}
          right={<span className="text-[12px] text-ink-muted">{group.length} documents</span>}
        >
          <ul className="card divide-y divide-border-subtle">
            {group.map((d) => (
              <LibraryRow key={d.docId} doc={d} />
            ))}
          </ul>
        </Section>
      ))}
    </div>
  );
}

function LibraryRow({ doc }: { doc: LibraryDocument }) {
  return (
    <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-[14px] font-medium text-ink-primary">{doc.title}</div>
        <div className="mt-0.5 text-[12px] text-ink-muted">
          {doc.taxYear ? `Tax year ${doc.taxYear} · ` : ""}
          {doc.published ? `Published ${formatPublished(doc.published)} · ` : ""}
          {doc.format === "html" ? "Web page" : `${doc.totalPages} pages`} · {doc.blockCount}{" "}
          passages
        </div>
      </div>
      <div className="flex shrink-0 gap-4 text-[12px]">
        {doc.format === "html" ? (
          <Link href={refDocPageUrl(doc.docId)} className="text-accent hover:text-accent-hover">
            Read
          </Link>
        ) : (
          <a
            href={refDocPdfUrl(doc.docId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover"
          >
            Open PDF ↗
          </a>
        )}
        {doc.sourceUrl && (
          <a
            href={doc.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-secondary hover:text-ink-primary"
          >
            Source ↗
          </a>
        )}
      </div>
    </li>
  );
}

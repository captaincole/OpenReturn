import { formatPublished } from "@/lib/format";
import { officialTextUrl, type LawSection } from "@/lib/law";
import Link from "next/link";

export function LawSectionHeader({ page }: { page: LawSection }) {
  const { section, release } = page;
  return (
    <header className="mb-10 space-y-4">
      <Link href="/library/law" className="text-[12px] text-ink-muted hover:text-ink-primary">
        ← Statute
      </Link>
      {section.breadcrumbs.length > 0 && (
        <p className="text-[12px] text-ink-muted">{section.breadcrumbs.join(" › ")}</p>
      )}
      <div>
        <h1 className="font-serif text-3xl text-ink-primary">{section.citation}</h1>
        <p className="mt-2 font-serif text-xl text-ink-secondary">{section.heading}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-muted">
        <span>
          Text as of {release.title}
          {release.published ? `, published ${formatPublished(release.published)}` : ""}
        </span>
        <a
          href={officialTextUrl(section.number)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-hover"
        >
          Official text ↗
        </a>
      </div>
    </header>
  );
}

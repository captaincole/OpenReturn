import { formatPublished } from "@/lib/format";
import { officialTextUrl, type LawSection } from "@/lib/law";
import Link from "next/link";
import { LawCrumbs } from "../../components/LawCrumbs";

// eCFR's page is the current text; the library's copy is dated, so the two can differ.
const CURRENT_TEXT_NOTE =
  "The official page shows the current text, which can be newer than this dated copy.";

export function LawSectionHeader({ page }: { page: LawSection }) {
  const { section, release } = page;
  return (
    <header className="mb-10 space-y-4">
      <Link href="/library/law" className="text-[12px] text-ink-muted hover:text-ink-primary">
        ← Law
      </Link>
      <LawCrumbs source={page.source} ancestors={section.breadcrumbs} />
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
      {page.source === "regulations" && (
        <p className="text-[12px] text-ink-muted">{CURRENT_TEXT_NOTE}</p>
      )}
    </header>
  );
}

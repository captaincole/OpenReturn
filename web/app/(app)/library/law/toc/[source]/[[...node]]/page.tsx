import { fetchLawToc } from "@/lib/canonServer";
import { formatPublished } from "@/lib/format";
import { lawSectionHref, sectionPageOf, versionAnchor } from "@/lib/law";
import { isLawSource, LAW_SOURCE_TITLE, lawTocHref, type LawToc } from "@/lib/lawToc";
import { deriveProfile } from "@/lib/profile";
import { getUserSession } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HomeTopBar } from "../../../../../HomeTopBar";
import { LawCrumbs } from "../../../components/LawCrumbs";
import { LawNotInstalled } from "../../../components/LawNotInstalled";

/*
 * One level of the law's table of contents: /library/law/toc/statute is the
 * Code's top level, /library/law/toc/statute/sta-ch1 one chapter. Canon sends
 * only this level, on the server, when the page opens: never the whole tree.
 */

function TocHeader({ toc }: { toc: LawToc }) {
  return (
    <header className="mb-8 space-y-4">
      <Link href="/library/law" className="text-[12px] text-ink-muted hover:text-ink-primary">
        ← Law
      </Link>
      {toc.node && <LawCrumbs source={toc.source} ancestors={toc.ancestors} />}
      <div>
        <h1 className="font-serif text-3xl text-ink-primary">
          {toc.node?.heading ?? LAW_SOURCE_TITLE[toc.source]}
        </h1>
        <p className="mt-2 text-[12px] text-ink-muted">
          Text as of {toc.release.title}
          {toc.release.published ? `, published ${formatPublished(toc.release.published)}` : ""}
        </p>
      </div>
    </header>
  );
}

const ROW = "block py-2.5 text-[14px] hover:text-accent";

// A later version of a California number opens its section's page at that version.
const sectionHref = (toc: LawToc, number: string, version = 1) =>
  lawSectionHref(
    sectionPageOf(toc.source, number),
    version > 1 ? versionAnchor(version) : undefined,
  );

function TocChildren({ toc }: { toc: LawToc }) {
  if (toc.children.length === 0)
    return <p className="text-[14px] text-ink-muted">This level has no entries.</p>;
  return (
    <ul className="card divide-y divide-border-subtle px-5">
      {toc.children.map((child, index) =>
        child.kind === "group" ? (
          <li key={child.node}>
            <Link href={lawTocHref(toc.source, child.node)} className={`${ROW} text-ink-primary`}>
              {child.heading}
            </Link>
          </li>
        ) : (
          <li key={`${child.number}-${index}`}>
            <Link
              href={sectionHref(toc, child.number, child.version)}
              className={`${ROW} text-ink-secondary`}
            >
              <span className="font-medium text-ink-primary">§ {child.number}</span> {child.heading}
            </Link>
          </li>
        ),
      )}
    </ul>
  );
}

async function TocBody({ source, node }: { source: string; node: string[] | undefined }) {
  if (!isLawSource(source) || (node && node.length > 1)) notFound();
  const result = await fetchLawToc(source, node?.[0]);
  if (result.kind === "not_found") notFound();
  if (result.kind === "error") return <p className="text-[14px] text-danger">{result.message}</p>;
  if (!result.data.installed) return <LawNotInstalled />;
  return (
    <>
      <TocHeader toc={result.data} />
      <TocChildren toc={result.data} />
    </>
  );
}

export default async function LawTocPage({
  params,
}: {
  params: Promise<{ source: string; node?: string[] }>;
}) {
  const { source, node } = await params;
  const session = await getUserSession();
  if (!session) redirect("/login");
  const profile = deriveProfile(session);

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base text-ink-primary">
      <HomeTopBar initials={profile.initials} title="Reference Library" />
      <main className="flex-1 px-4 py-8 lg:px-10 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <TocBody source={source} node={node} />
        </div>
      </main>
    </div>
  );
}
